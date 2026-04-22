import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const messagesCreateMock = vi.fn();

vi.mock('@anthropic-ai/sdk', () => {
  class MockAnthropic {
    messages = { create: messagesCreateMock };
    constructor(_opts: unknown) {
      // noop
    }
  }
  return { default: MockAnthropic };
});

type AppModule = typeof import('./index.js');

async function loadApp(): Promise<AppModule> {
  vi.resetModules();
  return (await import('./index.js')) as AppModule;
}

function textResponse(text: string) {
  return {
    content: [{ type: 'text', text }],
  };
}

const CONFIG = {
  jobRole: 'Product manager',
  industry: 'Retail',
  toughness: 3 as const,
  durationMin: 15,
};

describe('Hono app — /api/session/start', () => {
  beforeEach(() => {
    process.env.ANTHROPIC_API_KEY = 'test-key';
    messagesCreateMock.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('devuelve sessionId y firstTurn en 200', async () => {
    messagesCreateMock.mockResolvedValueOnce(textResponse('Hola, soy Elena. ¿Cuéntame sobre ti?'));

    const { app } = await loadApp();
    const res = await app.request('/api/session/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ config: CONFIG }),
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      sessionId: string;
      firstTurn: { role: string; text: string };
    };
    expect(typeof body.sessionId).toBe('string');
    expect(body.sessionId.length).toBeGreaterThan(0);
    expect(body.firstTurn.role).toBe('interviewer');
    expect(body.firstTurn.text).toBe('Hola, soy Elena. ¿Cuéntame sobre ti?');
  });

  it('llama al SDK con modelo claude-sonnet-4-6 y el system prompt del persona', async () => {
    messagesCreateMock.mockResolvedValueOnce(textResponse('Primera pregunta.'));

    const { app } = await loadApp();
    await app.request('/api/session/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ config: CONFIG }),
    });

    expect(messagesCreateMock).toHaveBeenCalledTimes(1);
    const args = messagesCreateMock.mock.calls[0]?.[0];
    expect(args.model).toBe('claude-sonnet-4-6');
    expect(typeof args.system).toBe('string');
    expect(args.system).toContain(CONFIG.jobRole);
    expect(args.system).toContain(CONFIG.industry);
    expect(Array.isArray(args.messages)).toBe(true);
    expect(args.messages[0]?.role).toBe('user');
  });

  it('devuelve 400 si falta el config', async () => {
    const { app } = await loadApp();
    const res = await app.request('/api/session/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
  });

  it('devuelve 400 si el body no es JSON', async () => {
    const { app } = await loadApp();
    const res = await app.request('/api/session/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not-json',
    });
    expect(res.status).toBe(400);
  });

  it('devuelve 500 si el SDK tira error y no deja la sesión colgada', async () => {
    messagesCreateMock.mockRejectedValueOnce(new Error('boom'));

    const { app } = await loadApp();
    const res = await app.request('/api/session/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ config: CONFIG }),
    });
    expect(res.status).toBe(500);
    const body = (await res.json()) as { error: { code: string; message: string } };
    expect(body.error.code).toBe('UPSTREAM_ERROR');
  });
});

describe('Hono app — /api/session/turn', () => {
  beforeEach(() => {
    process.env.ANTHROPIC_API_KEY = 'test-key';
    messagesCreateMock.mockReset();
  });

  it('con sessionId válido responde con interviewerTurn', async () => {
    messagesCreateMock
      .mockResolvedValueOnce(textResponse('Soy Elena. ¿Primer pregunta?'))
      .mockResolvedValueOnce(textResponse('Gracias. Siguiente pregunta: ¿por qué?'));

    const { app } = await loadApp();
    const start = await app.request('/api/session/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ config: CONFIG }),
    });
    const startBody = (await start.json()) as { sessionId: string };

    const turn = await app.request('/api/session/turn', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: startBody.sessionId,
        candidateText: 'Soy fuerte en análisis de datos.',
      }),
    });

    expect(turn.status).toBe(200);
    const body = (await turn.json()) as {
      interviewerTurn: { role: string; text: string };
      shouldEnd: boolean;
    };
    expect(body.interviewerTurn.role).toBe('interviewer');
    expect(body.interviewerTurn.text).toContain('Siguiente pregunta');
    expect(typeof body.shouldEnd).toBe('boolean');
  });

  it('con sessionId inexistente devuelve 404', async () => {
    const { app } = await loadApp();
    const res = await app.request('/api/session/turn', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: 'sess_phantom', candidateText: 'hola' }),
    });
    expect(res.status).toBe(404);
  });

  it('detecta cierre cuando el entrevistador agradece el tiempo', async () => {
    messagesCreateMock
      .mockResolvedValueOnce(textResponse('Hola, primera pregunta.'))
      .mockResolvedValueOnce(textResponse('Muchas gracias por tu tiempo, hemos terminado.'));

    const { app } = await loadApp();
    const start = await app.request('/api/session/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ config: CONFIG }),
    });
    const { sessionId } = (await start.json()) as { sessionId: string };

    const turn = await app.request('/api/session/turn', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, candidateText: 'ok' }),
    });
    const body = (await turn.json()) as { shouldEnd: boolean };
    expect(body.shouldEnd).toBe(true);
  });
});

describe('Hono app — /api/session/end', () => {
  beforeEach(() => {
    process.env.ANTHROPIC_API_KEY = 'test-key';
    messagesCreateMock.mockReset();
  });

  it('con sessionId válido devuelve SessionReport parseado y borra la sesión', async () => {
    const reportJson = JSON.stringify({
      clarity: 72,
      confidence: 68,
      fillerWords: 3,
      suggestions: ['uno', 'dos', 'tres'],
    });
    messagesCreateMock
      .mockResolvedValueOnce(textResponse('Primera pregunta.'))
      .mockResolvedValueOnce(textResponse(reportJson));

    const { app } = await loadApp();
    const start = await app.request('/api/session/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ config: CONFIG }),
    });
    const { sessionId } = (await start.json()) as { sessionId: string };

    const end = await app.request('/api/session/end', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    });

    expect(end.status).toBe(200);
    const body = (await end.json()) as {
      report: { clarity: number; confidence: number; fillerWords: number; suggestions: string[] };
      transcript: unknown[];
    };
    expect(body.report.clarity).toBe(72);
    expect(body.report.confidence).toBe(68);
    expect(body.report.fillerWords).toBe(3);
    expect(body.report.suggestions).toEqual(['uno', 'dos', 'tres']);
    expect(body.transcript.length).toBeGreaterThan(0);

    // Segunda llamada a /end con el mismo sessionId → 404
    const endAgain = await app.request('/api/session/end', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    });
    expect(endAgain.status).toBe(404);
  });

  it('con sessionId inexistente devuelve 404', async () => {
    const { app } = await loadApp();
    const res = await app.request('/api/session/end', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: 'sess_nope' }),
    });
    expect(res.status).toBe(404);
  });

  it('devuelve 500 REPORT_PARSE_ERROR si el modelo responde con JSON irreparable', async () => {
    messagesCreateMock
      .mockResolvedValueOnce(textResponse('Primera pregunta.'))
      .mockResolvedValueOnce(textResponse('esto no es un JSON ni tiene llaves'));

    const { app } = await loadApp();
    const start = await app.request('/api/session/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ config: CONFIG }),
    });
    const { sessionId } = (await start.json()) as { sessionId: string };

    const end = await app.request('/api/session/end', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    });
    expect(end.status).toBe(500);
    const body = (await end.json()) as { error: { code: string } };
    expect(body.error.code).toBe('REPORT_PARSE_ERROR');
  });
});
