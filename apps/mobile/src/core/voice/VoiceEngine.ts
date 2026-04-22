/**
 * Motor de voz (TTS). Abstracción para poder cambiar de expo-speech a
 * ElevenLabs u otro proveedor sin tocar la capa de lógica.
 */

export type SpeakingEndCallback = () => void;

export interface VoiceEngine {
  /** Habla el texto dado. Resuelve cuando termina de hablar. */
  speak(text: string): Promise<void>;

  /** Interrumpe cualquier locución en curso. */
  stop(): void;

  /** Registra un callback para cuando el motor termine de hablar. */
  onSpeakingEnd(cb: SpeakingEndCallback): void;
}
