/**
 * Public Stats API Handler
 * Based on @doc/PUBLIC_STATS_API.md
 */

import type { Env } from '~/types';
import { createDatabaseClient } from '~/db/client';

const STATS_CACHE_KEY = 'public_stats';
const CACHE_TTL = 600; // 10 minutes in seconds

export async function handleStats(request: Request, env: Env): Promise<Response> {
  try {
    // 1. Check KV Cache
    const cachedStats = await env.CACHE.get(STATS_CACHE_KEY);
    if (cachedStats) {
      return new Response(cachedStats, {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': `public, max-age=${CACHE_TTL}, s-maxage=${CACHE_TTL}`,
          'X-Cache-Status': 'HIT',
        },
      });
    }

    // 2. Compute Stats from DB
    const db = createDatabaseClient(env.DB);
    const stats = await calculatePublicStats(db);

    // 3. Format Response
    const responseBody = JSON.stringify({
      success: true,
      data: stats,
    });

    // 4. Update KV Cache
    await env.CACHE.put(STATS_CACHE_KEY, responseBody, { expirationTtl: CACHE_TTL });

    // 5. Return Response
    return new Response(responseBody, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': `public, max-age=${CACHE_TTL}, s-maxage=${CACHE_TTL}`,
        'X-Cache-Status': 'MISS',
      },
    });
  } catch (error) {
    console.error('[API] Stats error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal Server Error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

async function calculatePublicStats(db: ReturnType<typeof createDatabaseClient>) {
  // 1. Overview Counts
  const totalUsersResult = await db.d1
    .prepare('SELECT COUNT(*) as count FROM users WHERE deleted_at IS NULL')
    .first<{ count: number }>();
  const totalUsers = totalUsersResult?.count || 0;

  const totalBottlesResult = await db.d1
    .prepare('SELECT COUNT(*) as count FROM bottles')
    .first<{ count: number }>();
  const totalBottles = totalBottlesResult?.count || 0;

  const totalConversationsResult = await db.d1
    .prepare('SELECT COUNT(*) as count FROM conversations')
    .first<{ count: number }>();
  const totalConversations = totalConversationsResult?.count || 0;

  // 2. Activity (Last 24h)
  // SQLite doesn't support 'NOW', use datetime('now')
  const activeLast24hResult = await db.d1
    .prepare(
      `SELECT COUNT(*) as count FROM users 
       WHERE last_active_at > datetime('now', '-1 day') 
       AND deleted_at IS NULL`
    )
    .first<{ count: number }>();
  const activeLast24h = activeLast24hResult?.count || 0;

  const newUsersLast24hResult = await db.d1
    .prepare(
      `SELECT COUNT(*) as count FROM users 
       WHERE created_at > datetime('now', '-1 day')`
    )
    .first<{ count: number }>();
  const newUsersLast24h = newUsersLast24hResult?.count || 0;

  // 3. Demographics - MBTI (Top 5)
  // Use raw query for aggregation
  const topMbtiResult = await db.d1
    .prepare(
      `SELECT mbti_result as type, COUNT(*) as count 
       FROM users 
       WHERE mbti_result IS NOT NULL 
         AND deleted_at IS NULL
       GROUP BY mbti_result 
       ORDER BY count DESC 
       LIMIT 5`
    )
    .all<{ type: string; count: number }>();

  const mbtiTotal = topMbtiResult.results.reduce((sum, item) => sum + item.count, 0) || 1; // avoid div by 0
  const topMbti = topMbtiResult.results.map((item) => ({
    type: item.type,
    percentage: Math.round((item.count / totalUsers) * 1000) / 10, // Percentage of TOTAL users
  }));

  // 4. Demographics - Zodiac (Top 5)
  const topZodiacResult = await db.d1
    .prepare(
      `SELECT zodiac_sign as sign, COUNT(*) as count 
       FROM users 
       WHERE zodiac_sign IS NOT NULL 
         AND deleted_at IS NULL
       GROUP BY zodiac_sign 
       ORDER BY count DESC 
       LIMIT 5`
    )
    .all<{ sign: string; count: number }>();

  const topZodiac = topZodiacResult.results.map((item) => ({
    sign: item.sign,
    percentage: Math.round((item.count / totalUsers) * 1000) / 10,
  }));

  // 5. Demographics - Region (Top 5)
  // Assuming language_pref as proxy for region since country_code might be sparse
  // Or check if we have country_code populated
  const topRegionsResult = await db.d1
    .prepare(
      `SELECT language_pref as code, COUNT(*) as count 
       FROM users 
       WHERE language_pref IS NOT NULL 
         AND deleted_at IS NULL
       GROUP BY language_pref 
       ORDER BY count DESC 
       LIMIT 5`
    )
    .all<{ code: string; count: number }>();

  const topRegions = topRegionsResult.results.map((item) => ({
    code: item.code, // e.g. 'zh-TW', 'en'
    percentage: Math.round((item.count / totalUsers) * 1000) / 10,
  }));

  return {
    overview: {
      total_users: totalUsers,
      total_bottles: totalBottles,
      total_conversations: totalConversations,
    },
    activity: {
      active_last_24h: activeLast24h,
      new_users_last_24h: newUsersLast24h,
    },
    demographics: {
      top_mbti: topMbti,
      top_zodiac: topZodiac,
      top_regions: topRegions,
    },
    updated_at: new Date().toISOString(),
  };
}
