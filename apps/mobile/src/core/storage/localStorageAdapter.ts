import type { Storage } from './Storage';

export class LocalStorageAdapter implements Storage {
  private get _ls(): globalThis.Storage | null {
    if (typeof window === 'undefined') return null;
    try {
      return window.localStorage ?? null;
    } catch {
      return null;
    }
  }

  async getItem(key: string): Promise<string | null> {
    return this._ls?.getItem(key) ?? null;
  }
  async setItem(key: string, value: string): Promise<void> {
    this._ls?.setItem(key, value);
  }
  async removeItem(key: string): Promise<void> {
    this._ls?.removeItem(key);
  }
  async clear(): Promise<void> {
    this._ls?.clear();
  }
}
