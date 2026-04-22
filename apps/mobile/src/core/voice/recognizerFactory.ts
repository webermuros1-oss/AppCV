import type { SpeechRecognizer } from './SpeechRecognizer';

export function createSpeechRecognizer(): SpeechRecognizer {
  throw new Error(
    'recognizerFactory: plataforma no soportada (debería resolverse a .web o .native).',
  );
}
