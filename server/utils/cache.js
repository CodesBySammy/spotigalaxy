/**
 * @file cache.js
 * @description Production-grade bounded LRU cache with TTL expiration.
 * Backed by ES6 Map (guaranteed insertion order) providing true O(1) eviction
 * without throwing ECACHEFULL exceptions under high concurrency.
 */

export class BoundedLRUCache {
  /**
   * @param {number} maxSize - Maximum number of items before oldest entries are evicted.
   * @param {number} defaultTtlMs - Default time-to-live in milliseconds.
   */
  constructor(maxSize = 25000, defaultTtlMs = 24 * 60 * 60 * 1000) {
    this.maxSize = maxSize;
    this.defaultTtlMs = defaultTtlMs;
    this.cache = new Map();
  }

  get(key) {
    if (!this.cache.has(key)) return undefined;

    const entry = this.cache.get(key);
    if (!entry) return undefined;

    // Check expiration
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }

    // Refresh LRU recency: delete and re-insert to move to end of Map
    this.cache.delete(key);
    this.cache.set(key, entry);
    return entry.value;
  }

  set(key, value, ttlMs) {
    if (!key) return false;

    // If key exists, delete first to update position
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Evict oldest entry (first key in insertion order)
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
      }
    }

    const duration = typeof ttlMs === 'number' && ttlMs > 0 ? ttlMs : this.defaultTtlMs;
    const expiresAt = Date.now() + duration;

    this.cache.set(key, { value, expiresAt });
    return true;
  }

  has(key) {
    return this.get(key) !== undefined;
  }

  delete(key) {
    return this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }

  get size() {
    return this.cache.size;
  }
}

// Bounded LRU instances for production resilience
export const audioFeaturesCache = new BoundedLRUCache(25000, 24 * 60 * 60 * 1000); // 24 hours
export const lyricsCache = new BoundedLRUCache(25000, 24 * 60 * 60 * 1000);        // 24 hours
export const userProfileCache = new BoundedLRUCache(15000, 5 * 60 * 1000);         // 5 minutes

export default {
  BoundedLRUCache,
  audioFeaturesCache,
  lyricsCache,
  userProfileCache
};
