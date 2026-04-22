import type {
  RecognitionErrorCallback,
  RecognitionResultCallback,
  SpeechRecognizer,
} from './SpeechRecognizer';

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  onresult: ((ev: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((ev: { error?: string; message?: string }) => void) | null;
  onend: (() => void) | null;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

export class WebSpeechRecognizer implements SpeechRecognizer {
  private _resultCbs: RecognitionResultCallback[] = [];
  private _errorCbs: RecognitionErrorCallback[] = [];
  private _instance: SpeechRecognitionLike | null = null;

  start(): void {
    const w = typeof window !== 'undefined' ? (window as unknown as Record<string, unknown>) : null;
    if (!w) {
      this._emitError(new Error('window no disponible para Web Speech API.'));
      return;
    }
    const Ctor =
      (w['SpeechRecognition'] as SpeechRecognitionCtor | undefined) ||
      (w['webkitSpeechRecognition'] as SpeechRecognitionCtor | undefined);
    if (!Ctor) {
      this._emitError(
        new Error(
          'Web Speech API no soportada en este navegador. Prueba Chrome o Edge.',
        ),
      );
      return;
    }

    try {
      const rec = new Ctor();
      rec.lang = 'es-ES';
      rec.continuous = false;
      rec.interimResults = false;
      rec.onresult = (ev) => {
        const first = ev.results?.[0]?.[0];
        const transcript = first?.transcript ?? '';
        if (transcript) {
          for (const cb of this._resultCbs) cb(transcript);
        }
      };
      rec.onerror = (ev) => {
        const msg = ev.error || ev.message || 'Error de reconocimiento de voz.';
        this._emitError(new Error(msg));
      };
      rec.onend = () => {
        this._instance = null;
      };
      this._instance = rec;
      rec.start();
    } catch (e) {
      this._emitError(e instanceof Error ? e : new Error(String(e)));
    }
  }

  stop(): void {
    try {
      this._instance?.stop();
    } catch {
      // noop
    }
    this._instance = null;
  }

  onResult(cb: RecognitionResultCallback): void {
    this._resultCbs.push(cb);
  }

  onError(cb: RecognitionErrorCallback): void {
    this._errorCbs.push(cb);
  }

  private _emitError(err: Error): void {
    for (const cb of this._errorCbs) {
      try {
        cb(err);
      } catch {
        // noop
      }
    }
  }
}
