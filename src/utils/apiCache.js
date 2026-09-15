/**
 * In-Memory API Response Cache Store with TTL & Stale-While-Revalidate support
 * Drastically reduces redundant network calls across components.
 */

class ApiCacheStore {
  constructor() {
    this.cache = new Map();
    this.pendingPromises = new Map();
  }

  /**
   * Get cached data if available and fresh.
   * @param {string} key 
   * @returns {any|null}
   */
  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;
    const isExpired = Date.now() - entry.timestamp > entry.ttl;
    if (isExpired) {
      return null;
    }
    return entry.data;
  }

  /**
   * Store data in cache with TTL (default 5 minutes).
   * @param {string} key 
   * @param {any} data 
   * @param {number} ttlMs 
   */
  set(key, data, ttlMs = 5 * 60 * 1000) {
    if (data === undefined || data === null) return;
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs,
    });
  }

  /**
   * Execute fetchFn with caching and deduplication of concurrently inflight requests.
   * @param {string} key 
   * @param {Function} fetchFn 
   * @param {number} ttlMs 
   * @returns {Promise<any>}
   */
  async fetchWithCache(key, fetchFn, ttlMs = 5 * 60 * 1000) {
    // 1. Return fresh cached data if present
    const cached = this.get(key);
    if (cached !== null) {
      return cached;
    }

    // 2. Deduplicate inflight requests for the same key
    if (this.pendingPromises.has(key)) {
      return await this.pendingPromises.get(key);
    }

    // 3. Initiate fetch and cache result
    const promise = (async () => {
      try {
        const result = await fetchFn();
        if (result !== undefined && result !== null) {
          this.set(key, result, ttlMs);
        }
        return result;
      } finally {
        this.pendingPromises.delete(key);
      }
    })();

    this.pendingPromises.set(key, promise);
    return await promise;
  }

  /** Invalidate specific key or keys matching pattern */
  invalidate(pattern) {
    if (!pattern) {
      this.cache.clear();
      return;
    }
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }
}

export const apiCache = new ApiCacheStore();
