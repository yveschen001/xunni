import type { KVNamespace } from '@cloudflare/workers-types';
import type { Env } from '~/types';

/**
 * Cache Service
 * 
 * Provides a standardized way to cache data using Cloudflare KV.
 * Implements the "Read-Through" pattern:
 * 1. Check cache for key
 * 2. If hit, return cached value
 * 3. If miss, execute fetch function
 * 4. Store result in cache (if not null)
 * 5. Return result
 */
export class CacheService {
  private kv: KVNamespace | undefined;
  private prefix: string = 'cache:';

  constructor(env: Env) {
    this.kv = env.CACHE;
    if (!this.kv) {
      console.warn('[CacheService] CACHE KV binding not found. Caching is disabled.');
    }
  }

  /**
   * Get value from cache, or fetch from source if missing
   * @param key Unique cache key (will be prefixed)
   * @param ttlInSeconds Time to live in seconds
   * @param fetchFn Function to fetch data if cache miss
   */
  async getOrSet<T>(
    key: string,
    ttlInSeconds: number,
    fetchFn: () => Promise<T>
  ): Promise<T> {
    // If caching is disabled, just fetch directly
    if (!this.kv) {
      return fetchFn();
    }

    const fullKey = this.prefix + key;

    try {
      // 1. Try to get from cache
      const cachedValue = await this.kv.get(fullKey, 'json');
      if (cachedValue !== null) {
        // console.debug(`[CacheService] Hit: ${key}`);
        return cachedValue as T;
      }
    } catch (error) {
      console.error(`[CacheService] Error reading from KV for key ${fullKey}:`, error);
      // Fallback to fetch on error
    }

    // 2. Cache miss - Fetch from source
    // console.debug(`[CacheService] Miss: ${key}`);
    const value = await fetchFn();

    // 3. Store in cache (only if value is not null/undefined)
    if (value !== null && value !== undefined) {
      try {
        // Ensure TTL is valid (Cloudflare KV requires TTL >= 60s)
        // If we need shorter TTL, we might handle it in application logic or accept min 60s
        const validTTL = Math.max(60, ttlInSeconds);
        
        await this.kv.put(fullKey, JSON.stringify(value), {
          expirationTtl: validTTL,
        });
      } catch (error) {
        console.error(`[CacheService] Error writing to KV for key ${fullKey}:`, error);
      }
    }

    return value;
  }

  /**
   * Delete a key from cache
   * @param key Cache key (without prefix)
   */
  async delete(key: string): Promise<void> {
    if (!this.kv) return;
    const fullKey = this.prefix + key;
    try {
      await this.kv.delete(fullKey);
    } catch (error) {
      console.error(`[CacheService] Error deleting from KV for key ${fullKey}:`, error);
    }
  }
}

