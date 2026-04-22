import type { SpeechRecognizer } from './SpeechRecognizer';
import type { VoiceEngine } from './VoiceEngine';
import { ExpoSpeechEngine } from './expoSpeechEngine';
import { createSpeechRecognizer as platformCreateSpeechRecognizer } from './recognizerFactory';

export type { VoiceEngine, SpeakingEndCallback } from './VoiceEngine';
export type {
  SpeechRecognizer,
  RecognitionResultCallback,
  RecognitionErrorCallback,
} from './SpeechRecognizer';
export { ExpoSpeechEngine } from './expoSpeechEngine';

export function createVoiceEngine(): VoiceEngine {
  return new ExpoSpeechEngine();
}

export function createSpeechRecognizer(): SpeechRecognizer {
  return platformCreateSpeechRecognizer();
}
