import * as Speech from 'expo-speech';
import type { SpeakingEndCallback, VoiceEngine } from './VoiceEngine';

export class ExpoSpeechEngine implements VoiceEngine {
  private _endCallbacks: SpeakingEndCallback[] = [];

  speak(text: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const fire = () => {
        for (const cb of this._endCallbacks) {
          try {
            cb();
          } catch {
            // noop
          }
        }
      };
      try {
        Speech.speak(text, {
          language: 'es-ES',
          onDone: () => {
            fire();
            resolve();
          },
          onStopped: () => {
            fire();
            resolve();
          },
          onError: (err: unknown) => {
            fire();
            reject(err instanceof Error ? err : new Error(String(err)));
          },
        });
      } catch (e) {
        reject(e instanceof Error ? e : new Error(String(e)));
      }
    });
  }

  stop(): void {
    try {
      Speech.stop();
    } catch {
      // noop
    }
  }

  onSpeakingEnd(cb: SpeakingEndCallback): void {
    this._endCallbacks.push(cb);
  }
}
