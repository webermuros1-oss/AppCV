import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { InterviewTurn, SessionConfig } from '@app/shared';
import type { GeneratedPersona } from './personas.js';

type StoreModule = typeof import('./sessionStore.js');

const BASE_CONFIG: SessionConfig = {
  jobRole: 'Backend engineer',
  industry: 'Fintech',
  toughness: 3,
  durationMin: 15,
};

const BASE_PERSONA: GeneratedPersona = {
  name: 'Elena',
  systemPrompt: 'prompt',
};

function makeTurn(text: string, role: InterviewTurn['role'] = 'candidate'): InterviewTurn {
  return { role, text, timestamp: Date.now() };
}

async function loadFreshStore(): Promise<StoreModule> {
  vi.resetModules();
  return (await import('./sessionStore.js')) as StoreModule;
}

describe('sessionStore', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('createSession + getSession devuelve lo creado', async () => {
    const store = await loadFreshStore();
    const session = store.createSession(BASE_CONFIG, BASE_PERSONA);
    const fetched = store.getSession(session.sessionId);
    expect(fetched).not.toBeNull();
    expect(fetched?.sessionId).toBe(session.sessionId);
    expect(fetched?.config).toEqual(BASE_CONFIG);
    expect(fetched?.persona).toEqual(BASE_PERSONA);
    expect(fetched?.history).toEqual([]);
  });

  it('createSession genera ids únicos', async () => {
    const store = await loadFreshStore();
    const a = store.createSession(BASE_CONFIG, BASE_PERSONA);
    const b = store.createSession(BASE_CONFIG, BASE_PERSONA);
    expect(a.sessionId).not.toEqual(b.sessionId);
  });

  it('appendTurn añade al history en orden', async () => {
    const store = await loadFreshStore();
    const session = store.createSession(BASE_CONFIG, BASE_PERSONA);
    store.appendTurn(session.sessionId, makeTurn('hola', 'interviewer'));
    store.appendTurn(session.sessionId, makeTurn('hola de vuelta', 'candidate'));

    const fetched = store.getSession(session.sessionId);
    expect(fetched?.history).toHaveLength(2);
    expect(fetched?.history[0]?.text).toBe('hola');
    expect(fetched?.history[0]?.role).toBe('interviewer');
    expect(fetched?.history[1]?.text).toBe('hola de vuelta');
    expect(fetched?.history[1]?.role).toBe('candidate');
  });

  it('appendTurn sobre id inexistente no tira error', async () => {
    const store = await loadFreshStore();
    expect(() => store.appendTurn('sess_inexistente', makeTurn('noop'))).not.toThrow();
  });

  it('getSession con id inexistente devuelve null', async () => {
    const store = await loadFreshStore();
    expect(store.getSession('sess_no_existe')).toBeNull();
  });

  it('deleteSession elimina correctamente', async () => {
    const store = await loadFreshStore();
    const session = store.createSession(BASE_CONFIG, BASE_PERSONA);
    expect(store.getSession(session.sessionId)).not.toBeNull();
    store.deleteSession(session.sessionId);
    expect(store.getSession(session.sessionId)).toBeNull();
  });

  it('deleteSession sobre id inexistente no tira error', async () => {
    const store = await loadFreshStore();
    expect(() => store.deleteSession('sess_phantom')).not.toThrow();
  });

  it('sesión expirada por TTL se limpia tras el intervalo de cleanup', async () => {
    const store = await loadFreshStore();
    const session = store.createSession(BASE_CONFIG, BASE_PERSONA);
    expect(store.getSession(session.sessionId)).not.toBeNull();

    // TTL es 1h, cleanup corre cada 5min.
    // Avanzamos 61 minutos: ya expiró y se ha disparado el cleanup varias veces.
    vi.advanceTimersByTime(61 * 60 * 1000);

    expect(store.getSession(session.sessionId)).toBeNull();
  });

  it('sesión no expirada sobrevive al tick de cleanup', async () => {
    const store = await loadFreshStore();
    const session = store.createSession(BASE_CONFIG, BASE_PERSONA);

    // Avanzamos 10 minutos: cleanup se dispara (cada 5min) pero no ha pasado TTL (1h).
    vi.advanceTimersByTime(10 * 60 * 1000);

    const fetched = store.getSession(session.sessionId);
    expect(fetched).not.toBeNull();
    expect(fetched?.sessionId).toBe(session.sessionId);
  });
});
