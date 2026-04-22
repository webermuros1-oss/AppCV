import { create } from 'zustand';
import type {
  InterviewTurn,
  SessionConfig,
  SessionId,
  SessionReport,
} from '@app/shared';
import { apiClient } from '../core/api/client';

export type SessionStatus =
  | 'idle'
  | 'starting'
  | 'live'
  | 'ending'
  | 'reported'
  | 'error';

export interface SessionStoreState {
  status: SessionStatus;
  sessionId: SessionId | null;
  config: SessionConfig | null;
  turns: InterviewTurn[];
  report: SessionReport | null;
  error: string | null;

  startSession: (config: SessionConfig) => Promise<void>;
  pushUserAnswer: (text: string) => Promise<void>;
  endSession: () => Promise<void>;
  reset: () => void;
}

export const useSessionStore = create<SessionStoreState>((set, get) => ({
  status: 'idle',
  sessionId: null,
  config: null,
  turns: [],
  report: null,
  error: null,

  async startSession(config) {
    set({
      status: 'starting',
      config,
      turns: [],
      report: null,
      error: null,
      sessionId: null,
    });
    try {
      const res = await apiClient.startSession({ config });
      set({
        status: 'live',
        sessionId: res.sessionId,
        turns: [res.firstTurn],
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error al iniciar la sesión.';
      set({ status: 'error', error: msg });
    }
  },

  async pushUserAnswer(text) {
    const { sessionId, status } = get();
    if (!sessionId || status !== 'live') {
      set({ status: 'error', error: 'No hay sesión activa.' });
      return;
    }
    const trimmed = text.trim();
    if (!trimmed) return;

    const candidateTurn: InterviewTurn = {
      role: 'candidate',
      text: trimmed,
      timestamp: Date.now(),
    };
    set({ turns: [...get().turns, candidateTurn] });

    try {
      const res = await apiClient.sendTurn({
        sessionId,
        candidateText: trimmed,
      });
      set({ turns: [...get().turns, res.interviewerTurn] });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error al enviar turno.';
      set({ status: 'error', error: msg });
    }
  },

  async endSession() {
    const { sessionId } = get();
    if (!sessionId) {
      set({ status: 'error', error: 'No hay sesión activa.' });
      return;
    }
    set({ status: 'ending' });
    try {
      const res = await apiClient.endSession({ sessionId });
      set({
        status: 'reported',
        report: res.report,
        turns: res.transcript.length > 0 ? res.transcript : get().turns,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error al generar el reporte.';
      set({ status: 'error', error: msg });
    }
  },

  reset() {
    set({
      status: 'idle',
      sessionId: null,
      config: null,
      turns: [],
      report: null,
      error: null,
    });
  },
}));
