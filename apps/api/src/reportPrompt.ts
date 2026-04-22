import type { InterviewTurn, SessionReport } from '@app/shared';

export function buildReportSystemPrompt(): string {
  return `Eres un evaluador de entrevistas. Vas a recibir la transcripción completa de una entrevista de trabajo y debes producir un reporte de feedback constructivo para el candidato.

Devuelves EXCLUSIVAMENTE un objeto JSON válido, sin prosa antes ni después, sin bloques de código markdown, sin comentarios. El JSON debe tener exactamente esta forma:

{
  "clarity": number,        // 0 a 100, qué tan claras y estructuradas fueron las respuestas
  "confidence": number,     // 0 a 100, qué tan segura sonó la persona
  "fillerWords": number,    // cantidad total de muletillas detectadas (eh, ehm, o sea, tipo, como que, básicamente, la verdad, ...)
  "suggestions": string[]   // exactamente 3 sugerencias concretas y accionables en español
}

Reglas:
- Sé honesto, no infles las puntuaciones. Una entrevista mediocre debe reflejar eso.
- Las sugerencias deben ser específicas al contenido de la entrevista, no consejos genéricos.
- No incluyas ningún texto fuera del JSON.`;
}

export function buildReportUserMessage(history: InterviewTurn[]): string {
  const lines = history.map((t) => {
    const role = t.role === 'interviewer' ? 'ENTREVISTADOR' : 'CANDIDATO';
    return `${role}: ${t.text}`;
  });
  return `Transcripción de la entrevista:\n\n${lines.join('\n\n')}\n\nGenera el JSON de reporte ahora.`;
}

export function parseReport(raw: string): SessionReport {
  const cleaned = stripCodeFences(raw).trim();
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
      throw new Error('La respuesta del modelo no contiene JSON válido.');
    }
    parsed = JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('Reporte inválido: no es un objeto.');
  }
  const obj = parsed as Record<string, unknown>;

  const clarity = clampScore(obj['clarity']);
  const confidence = clampScore(obj['confidence']);
  const fillerWords =
    typeof obj['fillerWords'] === 'number' && Number.isFinite(obj['fillerWords'])
      ? Math.max(0, Math.floor(obj['fillerWords'] as number))
      : 0;
  const suggestionsRaw = obj['suggestions'];
  const suggestions = Array.isArray(suggestionsRaw)
    ? suggestionsRaw.filter((s): s is string => typeof s === 'string').slice(0, 5)
    : [];

  return {
    clarity,
    confidence,
    fillerWords,
    suggestions,
  };
}

function clampScore(v: unknown): number {
  if (typeof v !== 'number' || !Number.isFinite(v)) return 0;
  if (v < 0) return 0;
  if (v > 100) return 100;
  return Math.round(v);
}

function stripCodeFences(s: string): string {
  const fenceMatch = s.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  return fenceMatch ? fenceMatch[1]! : s;
}
