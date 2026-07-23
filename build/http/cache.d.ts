interface CacheOptions {
  maxEntries?: number;
  defaultTtlMs?: number;
}
export declare class ApiCache {
  private cache;
  private defaultTtlMs;
  constructor(options?: CacheOptions);
  get<T>(key: string): T | undefined;
  set(key: string, value: NonNullable<unknown>, ttlMs?: number): void;
  invalidate(key: string): void;
  invalidateByPrefix(prefix: string): void;
  clear(): void;
}
export {};
