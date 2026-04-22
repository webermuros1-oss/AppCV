import { Platform } from 'react-native';
import type { Storage } from './Storage';
import { AsyncStorageAdapter } from './asyncStorageAdapter';
import { LocalStorageAdapter } from './localStorageAdapter';

export type { Storage } from './Storage';
export { AsyncStorageAdapter } from './asyncStorageAdapter';
export { LocalStorageAdapter } from './localStorageAdapter';

export function createStorage(): Storage {
  if (Platform.OS === 'web') {
    return new LocalStorageAdapter();
  }
  return new AsyncStorageAdapter();
}
