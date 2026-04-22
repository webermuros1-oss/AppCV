import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { InterviewTurn, SessionConfig } from '@app/shared';

const { startSessionMock, sendTurnMock, endSessionMock } = vi.hoisted(() => ({
  startSessionMock: vi.fn(),
  sendTurnMock: vi.fn(),
  endSessionMock: vi.fn(),
}));

vi.mock('../core/api/client', () => ({
  apiClient: {
    startSession: startSessionMock,
    sendTurn: sendTurnMock,
    endSession: endSessionMock,
  },
  createApiClient: () => ({
    startSession: startSessionMock,
    sendTurn: sendTurnMock,
    endSession: endSessionMock,
  }),
  API_BASE_URL: 'http://test.local',
}));

import { useSessionStore } from './sessionStore';

const CONFIG: SessionConfig = {
  jobRole: 'Diseñador UX',
  industry: 'Salud',
  toughness: 3,
  durationMin: 15,
};

const FIRST_TURN: InterviewTurn = {
  role: 'interviewer',
  text: 'Hola, soy Elena. ¿Cuéntame sobre ti?',
  timestamp: 1_000,
};

const INTERVIEWER_TURN: InterviewTurn = {
  role: 'interviewer',
  text: 'Interesante, ¿por qué?',
  timestamp: 2_000,
};

function resetStore() {
  useSessionStore.setState({
    status: 'idle',
    sessionId: null,
    config: null,
    turns: [],
    report: null,
    error: null,
  });
}

describe('useSessionStore — startSession', () => {
  beforeEach(() => {
    startSessionMock.mockReset();
    sendTurnMock.mockReset();
    endSessionMock.mockReset();
    resetStore();
  });

  it('llama a apiClient.startSession y pasa a status live con firstTurn', async () => {
    startSessionMock.mockResolvedValueOnce({
      sessionId: 'sess_abc',
      firstTurn: FIRST_TURN,
    });

    await useSessionStore.getState().startSession(CONFIG);

    expect(startSessionMock).toHaveBeenCalledTimes(1);
    expect(startSessionMock).toHaveBeenCalledWith({ config: CONFIG });
    const s = useSessionStore.getState();
    expect(s.status).toBe('live');
    expect(s.sessionId).toBe('sess_abc');
    expect(s.turns).toEqual([FIRST_TURN]);
    expect(s.config).toEqual(CONFIG);
    expect(s.error).toBeNull();
  });

  it('error de red en startSession deja status error con mensaje', async () => {
    startSessionMock.mockRejectedValueOnce(new Error('fetch falló'));

    await useSessionStore.getState().startSession(CONFIG);

    const s = useSessionStore.getState();
    expect(s.status).toBe('error');
    expect(s.error).toContain('fetch falló');
  });

  it('error no-Error en startSession deja mensaje por defecto', async () => {
    startSessionMock.mockRejectedValueOnce('oops');

    await useSessionStore.getState().startSession(CONFIG);

    const s = useSessionStore.getState();
    expect(s.status).toBe('error');
    expect(typeof s.error).toBe('string');
    expect((s.error ?? '').length).toBeGreaterThan(0);
  });
});

describe('useSessionStore — pushUserAnswer', () => {
  beforeEach(() => {
    startSessionMock.mockReset();
    sendTurnMock.mockReset();
    endSessionMock.mockReset();
    resetStore();
  });

  async function enterLive() {
    startSessionMock.mockResolvedValueOnce({
      sessionId: 'sess_live',
      firstTurn: FIRST_TURN,
    });
    await useSessionStore.getState().startSession(CONFIG);
  }

  it('añade turno de candidato inmediatamente y luego el del entrevistador', async () => {
    await enterLive();
    sendTurnMock.mockResolvedValueOnce({
      interviewerTurn: INTERVIEWER_TURN,
      shouldEnd: false,
    });

    await useSessionStore.getState().pushUserAnswer('Tengo 5 años de experiencia.');

    const s = useSessionStore.getState();
    expect(s.turns).toHaveLength(3);
    expect(s.turns[0]).toEqual(FIRST_TURN);
    expect(s.turns[1]?.role).toBe('candidate');
    expect(s.turns[1]?.text).toBe('Tengo 5 años de experiencia.');
    expect(s.turns[2]).toEqual(INTERVIEWER_TURN);

    expect(sendTurnMock).toHaveBeenCalledWith({
      sessionId: 'sess_live',
      candidateText: 'Tengo 5 años de experiencia.',
    });
  });

  it('string vacío es noop', async () => {
    await enterLive();
    await useSessionStore.getState().pushUserAnswer('');
    expect(sendTurnMock).not.toHaveBeenCalled();
    expect(useSessionStore.getState().turns).toHaveLength(1);
  });

  it('string solo whitespace es noop', async () => {
    await enterLive();
    await useSessionStore.getState().pushUserAnswer('   \n  \t ');
    expect(sendTurnMock).not.toHaveBeenCalled();
    expect(useSessionStore.getState().turns).toHaveLength(1);
  });

  it('trimea antes de enviar', async () => {
    await enterLive();
    sendTurnMock.mockResolvedValueOnce({
      interviewerTurn: INTERVIEWER_TURN,
      shouldEnd: false,
    });
    await useSessionStore.getState().pushUserAnswer('  hola mundo  ');
    expect(sendTurnMock).toHaveBeenCalledWith({
      sessionId: 'sess_live',
      candidateText: 'hola mundo',
    });
  });

  it('error en sendTurn pasa a status error conservando los turnos ya añadidos', async () => {
    await enterLive();
    sendTurnMock.mockRejectedValueOnce(new Error('timeout'));

    await useSessionStore.getState().pushUserAnswer('hola');

    const s = useSessionStore.getState();
    expect(s.status).toBe('error');
    expect(s.error).toContain('timeout');
    expect(s.turns).toHaveLength(2);
    expect(s.turns[1]?.role).toBe('candidate');
  });

  it('sin sesión activa pasa a error', async () => {
    await useSessionStore.getState().pushUserAnswer('hola');
    const s = useSessionStore.getState();
    expect(s.status).toBe('error');
    expect(sendTurnMock).not.toHaveBeenCalled();
  });
});

describe('useSessionStore — endSession', () => {
  beforeEach(() => {
    startSessionMock.mockReset();
    sendTurnMock.mockReset();
    endSessionMock.mockReset();
    resetStore();
  });

  async function enterLive() {
    startSessionMock.mockResolvedValueOnce({
      sessionId: 'sess_live',
      firstTurn: FIRST_TURN,
    });
    await useSessionStore.getState().startSession(CONFIG);
  }

  it('llama API y pasa a reported con el report guardado', async () => {
    await enterLive();
    const report = {
      clarity: 70,
      confidence: 60,
      fillerWords: 4,
      suggestions: ['a', 'b', 'c'],
    };
    endSessionMock.mockResolvedValueOnce({
      report,
      transcript: [FIRST_TURN, INTERVIEWER_TURN],
    });

    await useSessionStore.getState().endSession();

    expect(endSessionMock).toHaveBeenCalledWith({ sessionId: 'sess_live' });
    const s = useSessionStore.getState();
    expect(s.status).toBe('reported');
    expect(s.report).toEqual(report);
    expect(s.turns).toEqual([FIRST_TURN, INTERVIEWER_TURN]);
  });

  it('mantiene los turnos locales si el transcript devuelto viene vacío', async () => {
    await enterLive();
    endSessionMock.mockResolvedValueOnce({
      report: { clarity: 0, confidence: 0, fillerWords: 0, suggestions: [] },
      transcript: [],
    });

    await useSessionStore.getState().endSession();

    const s = useSessionStore.getState();
    expect(s.status).toBe('reported');
    expect(s.turns).toEqual([FIRST_TURN]);
  });

  it('error pasa a status error', async () => {
    await enterLive();
    endSessionMock.mockRejectedValueOnce(new Error('upstream'));

    await useSessionStore.getState().endSession();

    const s = useSessionStore.getState();
    expect(s.status).toBe('error');
    expect(s.error).toContain('upstream');
  });

  it('sin sessionId pasa a error sin llamar API', async () => {
    await useSessionStore.getState().endSession();
    expect(endSessionMock).not.toHaveBeenCalled();
    expect(useSessionStore.getState().status).toBe('error');
  });
});

describe('useSessionStore — reset', () => {
  beforeEach(() => {
    startSessionMock.mockReset();
    sendTurnMock.mockReset();
    endSessionMock.mockReset();
    resetStore();
  });

  it('vuelve a estado idle limpio', async () => {
    startSessionMock.mockResolvedValueOnce({
      sessionId: 'sess_xyz',
      firstTurn: FIRST_TURN,
    });
    await useSessionStore.getState().startSession(CONFIG);

    useSessionStore.getState().reset();

    const s = useSessionStore.getState();
    expect(s.status).toBe('idle');
    expect(s.sessionId).toBeNull();
    expect(s.config).toBeNull();
    expect(s.turns).toEqual([]);
    expect(s.report).toBeNull();
    expect(s.error).toBeNull();
  });
});
