import type { SpeechRecognizer } from './SpeechRecognizer';
import { NativeSpeechRecognizer } from './nativeSpeechRecognizer';

export function createSpeechRecognizer(): SpeechRecognizer {
  return new NativeSpeechRecognizer();
}
