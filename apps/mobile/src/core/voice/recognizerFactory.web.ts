import type { SpeechRecognizer } from './SpeechRecognizer';
import { WebSpeechRecognizer } from './webSpeechRecognizer';

export function createSpeechRecognizer(): SpeechRecognizer {
  return new WebSpeechRecognizer();
}
