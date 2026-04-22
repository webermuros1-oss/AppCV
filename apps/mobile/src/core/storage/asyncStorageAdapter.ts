import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Storage } from './Storage';

export class AsyncStorageAdapter implements Storage {
  getItem(key: string): Promise<string | null> {
    return AsyncStorage.getItem(key);
  }
  setItem(key: string, value: string): Promise<void> {
    return AsyncStorage.setItem(key, value);
  }
  removeItem(key: string): Promise<void> {
    return AsyncStorage.removeItem(key);
  }
  clear(): Promise<void> {
    return AsyncStorage.clear();
  }
}
