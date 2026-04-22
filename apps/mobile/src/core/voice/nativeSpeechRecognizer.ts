import Voice from '@react-native-voice/voice';
import type {
  RecognitionErrorCallback,
  RecognitionResultCallback,
  SpeechRecognizer,
} from './SpeechRecognizer';

interface SpeechResultsEvent {
  value?: string[];
}

interface SpeechErrorEvent {
  error?: { message?: string; code?: string };
}

export class NativeSpeechRecognizer implements SpeechRecognizer {
  private _resultCbs: RecognitionResultCallback[] = [];
  private _errorCbs: RecognitionErrorCallback[] = [];
  private _wired = false;

  private _wire(): void {
    if (this._wired) return;
    this._wired = true;
    Voice.onSpeechResults = (e: SpeechResultsEvent) => {
      const transcript = e?.value?.[0] ?? '';
      if (transcript) {
        for (const cb of this._resultCbs) cb(transcript);
      }
    };
    Voice.onSpeechError = (e: SpeechErrorEvent) => {
      const msg = e?.error?.message || 'Error de reconocimiento de voz.';
      this._emitError(new Error(msg));
    };
  }

  start(): void {
    this._wire();
    Voice.start('es-ES').catch((e: unknown) => {
      this._emitError(e instanceof Error ? e : new Error(String(e)));
    });
  }

  stop(): void {
    Voice.stop().catch(() => {
      // noop
    });
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
