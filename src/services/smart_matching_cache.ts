/**
 * Smart Matching Cache Service
 * 
 * 🎯 成本优化策略：
 * 1. 只缓存"活跃用户池"（全局共享），而不是每个瓶子的匹配结果
 * 2. 缓存时间较长（10 分钟），减少写入次数
 * 3. 使用条件缓存：只在用户数 > 50 时启用
 * 4. 提供降级方案：KV 不可用时直接查询数据库
 * 
 * 💰 成本预估：
 * - 写入：每 10 分钟 1 次 = 144 次/天（远低于 1000 次免费额度）
 * - 读取：每次丢瓶子 1 次 = 100-1000 次/天（远低于 100,000 次免费额度）
 * - 存储：约 50-100 KB（远低于 1 GB 免费额度）
 * 
 * ✅ 结论：完全在免费额度内，即使用户量增长 10 倍也不会产生费用
 */

import type { D1Database, KVNamespace } from '@cloudflare/workers-types';

// ============================================================================
// Configuration
// ============================================================================

const CACHE_CONFIG = {
  // 活跃用户池缓存键
  ACTIVE_USERS_KEY: 'active_users_pool_v1',
  
  // 缓存时间：10 分钟（减少写入次数）
  TTL_SECONDS: 600,
  
  // 最小用户数阈值：设为 0，始终启用缓存（用户要求）
  // 即使只有 1 个用户也会缓存，完全在免费额度内
  MIN_USERS_FOR_CACHE: 0,
  
  // 缓存的用户数据字段（只缓存必要字段，减少存储空间）
  CACHED_FIELDS: [
    'telegram_id',
    'gender',
    'birthday',
    'zodiac_sign',
    'mbti_result',
    'blood_type',
    'language_pref',
    'last_active_at',
    'country_code',
  ],
};

// ============================================================================
// Types
// ============================================================================

export interface CachedUser {
  telegram_id: string;
  gender: string;
  birthday: string;
  zodiac_sign: string | null;
  mbti_result: string | null;
  blood_type: string | null;
  language_pref: string;
  last_active_at: string;
  country_code: string | null;
}

export interface CacheMetadata {
  cached_at: string;
  user_count: number;
  version: string;
}

export interface CachedData {
  users: CachedUser[];
  metadata: CacheMetadata;
}

// ============================================================================
// Cache Functions
// ============================================================================

/**
 * 获取活跃用户池（带缓存）
 * 
 * 🎯 策略：
 * 1. 先尝试从 KV 读取
 * 2. 如果缓存未命中或过期，从数据库查询
 * 3. 只在用户数 > 50 时才写入缓存（节省成本）
 */
export async function getActiveUsersWithCache(
  db: D1Database,
  kv?: KVNamespace
): Promise<CachedUser[]> {
  // 1. 尝试从缓存读取
  if (kv) {
    try {
      const cached = await kv.get(CACHE_CONFIG.ACTIVE_USERS_KEY, 'json') as CachedData | null;
      
      if (cached && cached.users && cached.users.length > 0) {
        console.error('[SmartMatchingCache] ✅ Cache HIT - Using cached active users:', {
          count: cached.users.length,
          cachedAt: cached.metadata.cached_at,
        });
        return cached.users;
      }
      
      console.error('[SmartMatchingCache] ❌ Cache MISS - Fetching from database');
    } catch (cacheError) {
      console.error('[SmartMatchingCache] ⚠️ Cache read error (fallback to DB):', cacheError);
      // 降级：缓存读取失败，继续查询数据库
    }
  }

  // 2. 从数据库查询活跃用户
  const users = await queryActiveUsersFromDB(db);

  // 3. 写入缓存（始终启用，完全在免费额度内）
  if (kv && users.length > 0) {
    try {
      const cacheData: CachedData = {
        users,
        metadata: {
          cached_at: new Date().toISOString(),
          user_count: users.length,
          version: 'v1',
        },
      };

      await kv.put(
        CACHE_CONFIG.ACTIVE_USERS_KEY,
        JSON.stringify(cacheData),
        { expirationTtl: CACHE_CONFIG.TTL_SECONDS }
      );

      console.error('[SmartMatchingCache] ✅ Cache WRITE - Cached active users:', {
        count: users.length,
        ttl: CACHE_CONFIG.TTL_SECONDS,
      });
    } catch (cacheError) {
      console.error('[SmartMatchingCache] ⚠️ Cache write error (non-blocking):', cacheError);
      // 非阻塞：缓存写入失败不影响主流程
    }
  } else if (users.length === 0) {
    console.error('[SmartMatchingCache] ⏭️ Skip cache - No active users');
  }

  return users;
}

/**
 * 从数据库查询活跃用户
 * 
 * 🎯 优化：
 * 1. 只查询最近 24 小时活跃的用户
 * 2. 只查询已完成 onboarding 的用户
 * 3. 只查询必要字段（减少数据传输）
 */
async function queryActiveUsersFromDB(db: D1Database): Promise<CachedUser[]> {
  const result = await db
    .prepare(`
      SELECT 
        telegram_id,
        gender,
        birthday,
        zodiac_sign,
        mbti_result,
        blood_type,
        language_pref,
        last_active_at,
        country_code
      FROM users
      WHERE onboarding_step = 'completed'
        AND is_banned = 0
        AND last_active_at > datetime('now', '-24 hours')
      ORDER BY last_active_at DESC
      LIMIT 500
    `)
    .all();

  return (result.results as CachedUser[]) || [];
}

/**
 * 手动清除缓存（管理员命令）
 */
export async function clearActiveUsersCache(kv?: KVNamespace): Promise<boolean> {
  if (!kv) {
    return false;
  }

  try {
    await kv.delete(CACHE_CONFIG.ACTIVE_USERS_KEY);
    console.error('[SmartMatchingCache] ✅ Cache cleared');
    return true;
  } catch (error) {
    console.error('[SmartMatchingCache] ❌ Failed to clear cache:', error);
    return false;
  }
}

/**
 * 获取缓存统计信息（管理员命令）
 */
export async function getCacheStats(kv?: KVNamespace): Promise<{
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
    const cached = await kv.get(CACHE_CONFIG.ACTIVE_USERS_KEY, 'json') as CachedData | null;
    
    if (cached) {
      return {
        enabled: true,
        cached: true,
        userCount: cached.metadata.user_count,
        cachedAt: cached.metadata.cached_at,
        ttl: CACHE_CONFIG.TTL_SECONDS,
      };
    }

    return { enabled: true, cached: false };
  } catch (error) {
    console.error('[SmartMatchingCache] ❌ Failed to get cache stats:', error);
    return { enabled: false, cached: false };
  }
}

