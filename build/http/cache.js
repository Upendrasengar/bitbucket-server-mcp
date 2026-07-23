import { LRUCache } from "lru-cache";
export class ApiCache {
    cache;
    defaultTtlMs;
    constructor(options = {}) {
        this.defaultTtlMs = options.defaultTtlMs ?? 5 * 60 * 1000;
        this.cache = new LRUCache({
            max: options.maxEntries ?? 500,
            ttl: this.defaultTtlMs,
        });
    }
    get(key) {
        return this.cache.get(key);
    }
    set(key, value, ttlMs) {
        this.cache.set(key, value, { ttl: ttlMs ?? this.defaultTtlMs });
    }
    invalidate(key) {
        this.cache.delete(key);
    }
    invalidateByPrefix(prefix) {
        for (const key of this.cache.keys()) {
            if (key.startsWith(prefix)) {
                this.cache.delete(key);
            }
        }
    }
    clear() {
        this.cache.clear();
    }
}
//# sourceMappingURL=cache.js.map