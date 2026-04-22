/**
 * Contrato HTTP entre mobile y api. Mantener sincronizado con apps/api/src.
 */

import type {
  InterviewTurn,
  SessionConfig,
  SessionId,
  SessionReport,
} from './types';

// ---------- POST /api/session/start ----------
export interface StartSessionRequest {
  config: SessionConfig;
}

export interface StartSessionResponse {
  sessionId: SessionId;
  /** Primer turno del entrevistador (texto que la app debe hablar). */
  firstTurn: InterviewTurn;
}

// ---------- POST /api/session/turn ----------
export interface SendTurnRequest {
  sessionId: SessionId;
  /** Transcripción de lo que dijo el candidato. */
  candidateText: string;
}

export interface SendTurnResponse {
  /** Respuesta del entrevistador a hablar por TTS. */
  interviewerTurn: InterviewTurn;
  /** True si el backend estima que la sesión debería cerrarse. */
  shouldEnd: boolean;
}

// ---------- POST /api/session/end ----------
export interface EndSessionRequest {
  sessionId: SessionId;
}

export interface EndSessionResponse {
  report: SessionReport;
  transcript: InterviewTurn[];
}

// ---------- Errores uniformes ----------
export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
  };
}

/** Rutas como string literal para cliente tipado. */
export const API_ROUTES = {
  startSession: '/api/session/start',
  sendTurn: '/api/session/turn',
  endSession: '/api/session/end',
} as const;
