/**
 * Reconocedor de voz (STT). Abstracción para poder tener dos implementaciones
 * (Web Speech API y @react-native-voice/voice) tras la misma interfaz.
 */

export type RecognitionResultCallback = (text: string) => void;
export type RecognitionErrorCallback = (error: Error) => void;

export interface SpeechRecognizer {
  /** Empieza a escuchar. */
  start(): void;

  /** Para de escuchar. */
  stop(): void;

  /**
   * Registra callback para resultados de transcripción.
   * El siguiente agente definirá si se emiten parciales o solo finales.
   */
  onResult(cb: RecognitionResultCallback): void;

  /** Registra callback de error. */
  onError(cb: RecognitionErrorCallback): void;
}
