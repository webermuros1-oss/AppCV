/**
 * Tipos de dominio compartidos entre mobile y api.
 * Mantener puros: sin lógica, sin imports de runtime.
 */

/** Estilo de entrevistador. Se usa para modular tono del prompt del sistema. */
export type InterviewerStyle =
  | 'friendly'
  | 'neutral'
  | 'skeptical'
  | 'aggressive'
  | 'chaotic';

/**
 * Persona (personaje) de entrevistador. El `systemPromptSeed` es una plantilla
 * base que la capa de lógica combinará con `SessionConfig` para generar el
 * prompt final enviado a Claude.
 */
export interface InterviewerPersona {
  id: string;
  name: string;
  /** Nivel de dureza del entrevistador, 1 (amable) a 5 (muy incómodo). */
  toughness: 1 | 2 | 3 | 4 | 5;
  style: InterviewerStyle;
  /** Semilla de instrucción de sistema; la lógica la extenderá. */
  systemPromptSeed: string;
}

/** Configuración inicial de una sesión de entrevista. */
export interface SessionConfig {
  jobRole: string;
  industry: string;
  /** Dureza deseada por el usuario, independiente de la persona elegida. */
  toughness: 1 | 2 | 3 | 4 | 5;
  /** Duración objetivo de la sesión en minutos. */
  durationMin: number;
  /** Persona id opcional; si no se pasa, la lógica elige una por defecto. */
  personaId?: string;
  /** Idioma de la entrevista (BCP-47). */
  locale?: string;
}

/** Un turno de conversación dentro de la entrevista. */
export interface InterviewTurn {
  role: 'interviewer' | 'candidate';
  text: string;
  /** Epoch ms. */
  timestamp: number;
}

/** Reporte final post-sesión. */
export interface SessionReport {
  /** 0..100 */
  clarity: number;
  /** 0..100 */
  confidence: number;
  /** Cantidad de muletillas detectadas. */
  fillerWords: number;
  /** Sugerencias accionables en texto libre. */
  suggestions: string[];
}

/** Id opaco de sesión generado por el backend. */
export type SessionId = string;
