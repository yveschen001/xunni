import type { Env } from '~/types';

/**
 * KV-based Rate Limiter
 * Uses Fixed Window algorithm for performance with Cloudflare KV
 */
export class RateLimiter {
  private cache?: KVNamespace;

  constructor(env: Env) {
    this.cache = env.CACHE;
  }

  /**
   * Check if a request is allowed
   * @param identifier Unique ID (UserID or IP)
   * @param limit Max requests allowed in window
   * @param windowSeconds Window size in seconds
   * @returns true if allowed, false if blocked
   */
  async isAllowed(identifier: string, limit: number, windowSeconds: number): Promise<boolean> {
    if (!this.cache) {
      // If no cache binding, allow all (fail open)
      return true;
    }

    const now = Math.floor(Date.now() / 1000);
    const windowIndex = Math.floor(now / windowSeconds);
    const key = `rl:${identifier}:${windowIndex}`;

    try {
      const countStr = await this.cache.get(key);
      const count = countStr ? parseInt(countStr) : 0;

      if (count >= limit) {
        return false;
      }

      // Increment count (Fire & Forget to reduce latency impact)
      // Note: KV is eventually consistent, so this is "loose" rate limiting
      // which is sufficient for DoS protection.
      this.cache.put(key, (count + 1).toString(), { expirationTtl: windowSeconds * 2 }).catch(err => {
        console.error('[RateLimiter] Failed to update KV:', err);
      });

      return true;
    } catch (error) {
      console.error('[RateLimiter] Error:', error);
      return true; // Fail open on error
    }
  }
}

