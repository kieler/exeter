import type { PersistenceStorage } from "@kieler/klighd-core";

export class InMemoryPersistenceStorage implements PersistenceStorage {
  private onClearCallbacks: Array<() => void> = [];
  private storage: Record<string, unknown>;

  constructor(initialData: Record<string, unknown> = {}) {
    this.storage = { ...initialData, render: initialData.render ?? {} };
  }

  setItem<T>(key: string, setter: (previous?: T) => T): void {
    this.storage[key] = setter(this.storage[key] as T | undefined);
  }

  async getItem<T>(key: string): Promise<T | undefined> {
    return this.storage[key] as T | undefined;
  }

  removeItem(key: string): void {
    delete this.storage[key];
  }

  clear(): void {
    this.storage = {};
    this.onClearCallbacks.forEach((callback) => callback());
  }

  onClear(callback: () => void): void {
    this.onClearCallbacks.push(callback);
  }

  getAllData(): Record<string, unknown> {
    return this.storage;
  }
}

export class LocalPersistenceStorage implements PersistenceStorage {
  private static readonly key = "exeter:klighd";
  private onClearCallbacks: Array<() => void> = [];
  private cache: Record<string, unknown>;

  constructor() {
    this.cache = JSON.parse(window.localStorage.getItem(LocalPersistenceStorage.key) ?? "{}");
    this.cache.render ??= {};
  }

  setItem<T>(key: string, setter: (previous?: T) => T): void {
    this.cache[key] = setter(this.cache[key] as T | undefined);
    this.persist();
  }

  async getItem<T>(key: string): Promise<T | undefined> {
    return this.cache[key] as T | undefined;
  }

  removeItem(key: string): void {
    delete this.cache[key];
    this.persist();
  }

  clear(): void {
    this.cache = {};
    window.localStorage.removeItem(LocalPersistenceStorage.key);
    this.onClearCallbacks.forEach((callback) => callback());
  }

  onClear(callback: () => void): void {
    this.onClearCallbacks.push(callback);
  }

  getAllData(): Record<string, unknown> {
    return this.cache;
  }

  private persist(): void {
    window.localStorage.setItem(LocalPersistenceStorage.key, JSON.stringify(this.cache));
  }
}
