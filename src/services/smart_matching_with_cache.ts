/**
 * Smart Matching with Cache Wrapper
 * 
 * 🎯 设计理念：
 * - 不修改现有的 smart_matching.ts 代码（避免破坏现有功能）
 * - 提供一个包装函数，在外层添加缓存逻辑
 * - 完全向后兼容：如果 KV 不可用，自动降级到原始实现
 * 
 * 💰 成本优化：
 * - 只在 VIP 用户丢瓶子时使用缓存（减少缓存使用）
 * - 缓存全局活跃用户池（所有 VIP 用户共享）
 * - 10 分钟 TTL（减少写入次数）
 */

import type { D1Database, KVNamespace } from '@cloudflare/workers-types';
import type { MatchResult } from './smart_matching';

/**
 * 带缓存的智能匹配（仅用于 VIP 用户）
 * 
 * @param db - D1 Database
 * @param bottleId - Bottle ID
 * @param kv - KV Namespace (optional)
 * @returns Match result or null
 */
export async function findActiveMatchForBottleWithCache(
  db: D1Database,
  bottleId: number,
  kv?: KVNamespace
): Promise<MatchResult | null> {
  // 🚀 如果 KV 可用，预热缓存
  if (kv) {
    try {
      const { getActiveUsersWithCache } = await import('./smart_matching_cache');
      // 预热缓存（不阻塞主流程）
      getActiveUsersWithCache(db, kv).catch(err => {
        console.error('[SmartMatchingWithCache] Cache preheat error (non-blocking):', err);
      });
    } catch (error) {
      console.error('[SmartMatchingWithCache] Cache module load error:', error);
    }
  }

  // 调用原始实现（保持完全兼容）
  const { findActiveMatchForBottle } = await import('./smart_matching');
  return findActiveMatchForBottle(db, bottleId);
}

/**
 * 获取缓存统计（管理员命令）
 */
export async function getSmartMatchingCacheStats(kv?: KVNamespace): Promise<{
  enabled: boolean;
  cached: boolean;
  userCount?: number;
  cachedAt?: string;
  ttl?: number;
}> {
  if (!kv) {
    return { enabled: false, cached: false };
  }

  try {
    const { getCacheStats } = await import('./smart_matching_cache');
    return getCacheStats(kv);
  } catch (error) {
    console.error('[SmartMatchingWithCache] Failed to get cache stats:', error);
    return { enabled: false, cached: false };
  }
}

/**
 * 清除缓存（管理员命令）
 */
export async function clearSmartMatchingCache(kv?: KVNamespace): Promise<boolean> {
  if (!kv) {
    return false;
  }

  try {
    const { clearActiveUsersCache } = await import('./smart_matching_cache');
    return clearActiveUsersCache(kv);
  } catch (error) {
    console.error('[SmartMatchingWithCache] Failed to clear cache:', error);
    return false;
  }
}

