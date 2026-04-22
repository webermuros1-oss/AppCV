import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { API_ROUTES } from '@app/shared';
import type {
  StartSessionRequest,
  StartSessionResponse,
  SendTurnRequest,
  SendTurnResponse,
  EndSessionRequest,
  EndSessionResponse,
  ApiErrorBody,
} from '@app/shared';
import type { InterviewTurn } from '@app/shared';
import { chat, type ChatMessage } from './anthropic.js';
import { buildPersona, configToPersonaArgs } from './personas.js';
import {
  appendTurn,
  createSession,
  deleteSession,
  getSession,
} from './sessionStore.js';
import {
  buildReportSystemPrompt,
  buildReportUserMessage,
  parseReport,
} from './reportPrompt.js';

export const app = new Hono();

app.use('*', cors());

app.get('/', (c) => c.json({ name: 'AppEntrevistasCV API', ok: true }));
app.get('/health', (c) => c.json({ ok: true }));

function errorBody(code: string, message: string): ApiErrorBody {
  return { error: { code, message } };
}

function historyToMessages(history: InterviewTurn[]): ChatMessage[] {
  return history.map((turn) => ({
    role: turn.role === 'interviewer' ? 'assistant' : 'user',
    content: turn.text,
  }));
}

const CLOSING_HINTS = [
  'muchas gracias por tu tiempo',
  'gracias por tu tiempo',
  'hemos terminado',
  'damos por finalizada',
  'cerramos la entrevista',
];

function detectClosing(text: string): boolean {
  const lower = text.toLowerCase();
  return CLOSING_HINTS.some((h) => lower.includes(h));
}

app.post(API_ROUTES.startSession, async (c) => {
  let body: StartSessionRequest;
  try {
    body = (await c.req.json()) as StartSessionRequest;
  } catch {
    return c.json(errorBody('BAD_REQUEST', 'JSON inválido.'), 400);
  }

  const config = body?.config;
  if (
    !config ||
    typeof config.jobRole !== 'string' ||
    typeof config.industry !== 'string' ||
    typeof config.toughness !== 'number'
  ) {
    return c.json(errorBody('BAD_REQUEST', 'config incompleto.'), 400);
  }

  const persona = buildPersona(configToPersonaArgs(config));
  const session = createSession(config, persona);

  let firstText: string;
  try {
    firstText = await chat({
      system: persona.systemPrompt,
      messages: [
        {
          role: 'user',
          content:
            'Arranca la entrevista. Saluda muy brevemente con tu nombre y haz la primera pregunta.',
        },
      ],
    });
  } catch (e) {
    deleteSession(session.sessionId);
    const msg = e instanceof Error ? e.message : 'Error al llamar a Claude.';
    return c.json(errorBody('UPSTREAM_ERROR', msg), 500);
  }

  const firstTurn: InterviewTurn = {
    role: 'interviewer',
    text: firstText,
    timestamp: Date.now(),
  };
  appendTurn(session.sessionId, firstTurn);

  const res: StartSessionResponse = {
    sessionId: session.sessionId,
    firstTurn,
  };
  return c.json(res, 200);
});

app.post(API_ROUTES.sendTurn, async (c) => {
  let body: SendTurnRequest;
  try {
    body = (await c.req.json()) as SendTurnRequest;
  } catch {
    return c.json(errorBody('BAD_REQUEST', 'JSON inválido.'), 400);
  }

  const { sessionId, candidateText } = body ?? {};
  if (typeof sessionId !== 'string' || typeof candidateText !== 'string') {
    return c.json(errorBody('BAD_REQUEST', 'Campos requeridos faltantes.'), 400);
  }

  const session = getSession(sessionId);
  if (!session) {
    return c.json(errorBody('NOT_FOUND', 'Sesión no encontrada.'), 404);
  }

  const candidateTurn: InterviewTurn = {
    role: 'candidate',
    text: candidateText,
    timestamp: Date.now(),
  };
  appendTurn(sessionId, candidateTurn);

  let replyText: string;
  try {
    replyText = await chat({
      system: session.persona.systemPrompt,
      messages: historyToMessages(session.history),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error al llamar a Claude.';
    return c.json(errorBody('UPSTREAM_ERROR', msg), 500);
  }

  const interviewerTurn: InterviewTurn = {
    role: 'interviewer',
    text: replyText,
    timestamp: Date.now(),
  };
  appendTurn(sessionId, interviewerTurn);

  const res: SendTurnResponse = {
    interviewerTurn,
    shouldEnd: detectClosing(replyText),
  };
  return c.json(res, 200);
});

app.post(API_ROUTES.endSession, async (c) => {
  let body: EndSessionRequest;
  try {
    body = (await c.req.json()) as EndSessionRequest;
  } catch {
    return c.json(errorBody('BAD_REQUEST', 'JSON inválido.'), 400);
  }

  const { sessionId } = body ?? {};
  if (typeof sessionId !== 'string') {
    return c.json(errorBody('BAD_REQUEST', 'sessionId requerido.'), 400);
  }

  const session = getSession(sessionId);
  if (!session) {
    return c.json(errorBody('NOT_FOUND', 'Sesión no encontrada.'), 404);
  }

  if (session.history.length === 0) {
    deleteSession(sessionId);
    const empty: EndSessionResponse = {
      report: {
        clarity: 0,
        confidence: 0,
        fillerWords: 0,
        suggestions: ['No hubo conversación suficiente para evaluar.'],
      },
      transcript: [],
    };
    return c.json(empty, 200);
  }

  let raw: string;
  try {
    raw = await chat({
      system: buildReportSystemPrompt(),
      messages: [{ role: 'user', content: buildReportUserMessage(session.history) }],
      maxTokens: 1024,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error al llamar a Claude.';
    return c.json(errorBody('UPSTREAM_ERROR', msg), 500);
  }

  let report;
  try {
    report = parseReport(raw);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'No se pudo parsear el reporte.';
    return c.json(errorBody('REPORT_PARSE_ERROR', msg), 500);
  }

  const transcript = [...session.history];
  deleteSession(sessionId);

  const res: EndSessionResponse = { report, transcript };
  return c.json(res, 200);
});

export default app;
