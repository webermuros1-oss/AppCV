/**
 * Abstracción de almacenamiento persistente clave-valor.
 * Implementaciones: AsyncStorage (nativo) y localStorage (web).
 * TODO(logica-negocio): añadir implementaciones reales y un factory que
 * elija según Platform.OS.
 */

export interface Storage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  clear(): Promise<void>;
}
