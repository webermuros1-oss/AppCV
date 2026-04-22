import type { SessionConfig } from '@app/shared';

export interface GeneratedPersona {
  name: string;
  systemPrompt: string;
}

interface BuildPersonaArgs {
  jobRole: string;
  industry: string;
  toughness: 1 | 2 | 3 | 4 | 5;
}

const TOUGHNESS_INSTRUCTIONS: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: `Eres amable y alentador. Si el candidato se atasca, le das pistas suaves para que avance. Tu tono es cálido y tranquilo, como alguien que quiere que le vaya bien.`,
  2: `Eres cordial y relajado. Escuchas con atención y repreguntas solo para aclarar. Das algún apoyo si el candidato titubea, pero sin resolverle la respuesta.`,
  3: `Eres neutral y profesional. Haces repreguntas suaves cuando una respuesta es vaga. Ni premias ni castigas: evalúas.`,
  4: `Eres exigente. Cuestionas contradicciones, no aceptas respuestas vagas y pides ejemplos concretos. Si una respuesta es floja, la señalas con educación pero sin suavizarla.`,
  5: `Eres hostil pero controlado. Presionas al candidato, simulas silencios incómodos usando "(...)" antes de seguir, y haces repreguntas duras del tipo "¿en serio? eso no responde mi pregunta" o "eso es muy genérico, concreta". No eres grosero ni ofensivo, pero sí incómodo a propósito: quieres ver cómo reacciona bajo presión.`,
};

function pickName(jobRole: string, industry: string, toughness: number): string {
  const seed = `${jobRole}-${industry}-${toughness}`.length;
  const names = [
    'Elena',
    'Marcos',
    'Lucía',
    'Javier',
    'Andrea',
    'Sergio',
    'Clara',
    'Diego',
    'Paula',
    'Raúl',
  ];
  return names[seed % names.length]!;
}

export function buildPersona(args: BuildPersonaArgs): GeneratedPersona {
  const { jobRole, industry, toughness } = args;
  const name = pickName(jobRole, industry, toughness);
  const behavior = TOUGHNESS_INSTRUCTIONS[toughness];

  const systemPrompt = `Eres ${name}, entrevistador/a de selección para el puesto de "${jobRole}" en el sector "${industry}".

Reglas de comportamiento:
${behavior}

Formato de tus respuestas:
- Hablas siempre en español.
- Haces UNA SOLA pregunta por turno. Nada de párrafos largos: tu voz se reproduce por TTS y los párrafos largos cansan.
- Máximo 2-3 frases por intervención. Conversacional, no formal.
- NO des feedback ni valoraciones en tiempo real. Eso va al final, en el reporte. Limítate a entrevistar.
- NO digas "buena pregunta" ni "interesante respuesta". Solo pregunta y repregunta.
- Si el candidato da una respuesta vaga, repregunta de acuerdo a tu nivel de dureza.
- Empieza la entrevista con una pregunta de apertura adecuada al puesto y sector. No te presentes con biografía larga, solo saluda brevemente con tu nombre y lanza la primera pregunta.
- Después de 6-8 turnos del candidato, puedes cerrar la entrevista agradeciendo su tiempo.`;

  return { name, systemPrompt };
}

export function configToPersonaArgs(config: SessionConfig): BuildPersonaArgs {
  return {
    jobRole: config.jobRole,
    industry: config.industry,
    toughness: config.toughness,
  };
}
