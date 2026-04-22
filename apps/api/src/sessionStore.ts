import type { InterviewTurn, SessionConfig } from '@app/shared';
import type { GeneratedPersona } from './personas.js';

export interface SessionState {
  sessionId: string;
  config: SessionConfig;
  persona: GeneratedPersona;
  history: InterviewTurn[];
  createdAt: number;
}

const TTL_MS = 60 * 60 * 1000;
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

const _sessions = new Map<string, SessionState>();

function randomId(): string {
  return (
    'sess_' +
    Math.random().toString(36).slice(2, 10) +
    Math.random().toString(36).slice(2, 10)
  );
}

export function createSession(
  config: SessionConfig,
  persona: GeneratedPersona,
): SessionState {
  const state: SessionState = {
    sessionId: randomId(),
    config,
    persona,
    history: [],
    createdAt: Date.now(),
  };
  _sessions.set(state.sessionId, state);
  return state;
}

export function getSession(sessionId: string): SessionState | null {
  const state = _sessions.get(sessionId);
  if (!state) return null;
  if (Date.now() - state.createdAt > TTL_MS) {
    _sessions.delete(sessionId);
    return null;
  }
  return state;
}

export function appendTurn(sessionId: string, turn: InterviewTurn): void {
  const state = _sessions.get(sessionId);
  if (!state) return;
  state.history.push(turn);
}

export function deleteSession(sessionId: string): void {
  _sessions.delete(sessionId);
}

function cleanup(): void {
  const now = Date.now();
  for (const [id, state] of _sessions.entries()) {
    if (now - state.createdAt > TTL_MS) {
      _sessions.delete(id);
    }
  }
}

let _cleanupTimer: ReturnType<typeof setInterval> | null = null;
if (_cleanupTimer === null) {
  _cleanupTimer = setInterval(cleanup, CLEANUP_INTERVAL_MS);
  if (typeof _cleanupTimer === 'object' && _cleanupTimer !== null && 'unref' in _cleanupTimer) {
    (_cleanupTimer as { unref: () => void }).unref();
  }
}
