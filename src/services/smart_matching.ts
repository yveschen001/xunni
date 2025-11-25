/**
 * Smart Matching Service
 * Based on @doc/SMART_MATCHING_SYSTEM_DESIGN.md
 *
 * Implements layered query strategy for optimal performance and match quality.
 * 複用 domain/matching.ts 的配對分數計算函數。
 */

import type { D1Database } from '@cloudflare/workers-types';
import {
  calculateTotalMatchScore,
  getAgeRange,
  getAdjacentAgeRanges,
  type UserMatchData,
  type BottleMatchData,
  type MatchScoreBreakdown,
} from '~/domain/matching';

// ============================================================================
// Configuration
// ============================================================================

export const MATCHING_CONFIG = {
  activeMatching: {
    layers: [
      {
        name: 'tier1_same_language',
        limit: 200,
        timeWindow: '-2 hours', // 放寬到 2 小時（原 1 小時）
        minThreshold: 60, // 降低到 60 分（原 100 分，太嚴格）
      },
      {
        name: 'tier2_adjacent_age',
        limit: 150,
        timeWindow: '-4 hours', // 放寬到 4 小時（原 2 小時）
        minThreshold: 50, // 降低到 50 分（原 150 分，錯誤設置）
      },
      {
        name: 'tier3_all_active',
        limit: 100,
        timeWindow: '-6 hours', // 放寬到 6 小時（原 3 小時）
        minThreshold: 0, // 無最低分要求
      },
    ],
    topCandidates: 10,
    maxTotalCandidates: 450,
  },
  passiveMatching: {
    layers: [
      {
        name: 'tier1_same_language',
        limit: 100,
        minThreshold: 50, // 保持 50 分
      },
      {
        name: 'tier2_adjacent_age',
        limit: 50,
        minThreshold: 40, // 降低到 40 分（原 80 分，太嚴格）
      },
      {
        name: 'tier3_all_bottles',
        limit: 50,
        minThreshold: 0, // 無最低分要求
      },
    ],
    smartMatchThreshold: 60, // 降低到 60 分（原 70 分）
    maxTotalBottles: 200,
  },
};

// ============================================================================
// Types
// ============================================================================

export interface MatchResult {
  user?: UserMatchData;
  bottle?: BottleMatchData & { id: number; content: string; owner_id: string };
  score: MatchScoreBreakdown;
  matchType: 'smart' | 'random';
}

// ============================================================================
// Active Matching (丟瓶子時)
// ============================================================================

/**
 * 主動配對：當用戶丟瓶子時，立即為其找到最合適的活躍用戶
 * 使用分層查詢策略，優先查找高匹配度用戶
 *
 * @param db - D1 Database
 * @param bottleId - Bottle ID
 * @param kv - (Optional) KV Namespace for caching (成本優化)
 */
export async function findActiveMatchForBottle(
  db: D1Database,
  bottleId: number,
  _kv?: import('@cloudflare/workers-types').KVNamespace
): Promise<MatchResult | null> {
  // 1. 獲取瓶子信息（JOIN 優化，一次查詢）
  const bottle = await db
    .prepare(
      `
      SELECT 
        b.*,
        u.birthday as owner_birthday,
        u.language_pref as owner_language,
        u.gender as owner_gender
      FROM bottles b
      JOIN users u ON b.owner_telegram_id = u.telegram_id
      WHERE b.id = ?
    `
    )
    .bind(bottleId)
    .first();

  if (!bottle) return null;

  // 確定目標性別過濾條件
  const targetGender = bottle.target_gender || 'any';
  const genderFilter = targetGender === 'any' ? '' : `AND gender = '${targetGender}'`;

  console.log(`[Smart Matching] Bottle ${bottleId} looking for gender: ${targetGender}`);

  const allCandidates: UserMatchData[] = [];

  // 2. 第 1 層：優先查找同語言用戶（2 小時內，200 個）
  const tier1 = await db
    .prepare(
      `
      SELECT 
        telegram_id, nickname, username, language_pref as language, mbti_result, zodiac_sign as zodiac,
        blood_type, birthday, last_active_at, is_vip, gender
      FROM users
      WHERE telegram_id != ?
        AND is_banned = 0
        AND language_pref = ?
        AND last_active_at > datetime('now', '${MATCHING_CONFIG.activeMatching.layers[0].timeWindow}')
        ${genderFilter}
      ORDER BY last_active_at DESC
      LIMIT ?
    `
    )
    .bind(
      bottle.owner_telegram_id,
      bottle.owner_language,
      MATCHING_CONFIG.activeMatching.layers[0].limit
    )
    .all();

  if (tier1.results) {
    allCandidates.push(...(tier1.results as UserMatchData[]));
  }

  console.log(
    `[Smart Matching] Tier 1 (same language, 2h) found ${tier1.results?.length || 0} candidates`
  );

  // 如果第 1 層已經有足夠候選（> 100），直接進行配對
  if (allCandidates.length < MATCHING_CONFIG.activeMatching.layers[0].minThreshold) {
    // 3. 第 2 層：查找相鄰年齡區間用戶（4 小時內，150 個）
    const ownerAgeRange = getAgeRange(bottle.owner_birthday);
    const adjacentRanges = getAdjacentAgeRanges(ownerAgeRange);

    const existingIds = allCandidates.map((u) => u.telegram_id);

    // 構建排除條件（如果有已存在的 ID）
    const excludeClause =
      existingIds.length > 0
        ? `AND telegram_id NOT IN (${existingIds.map(() => '?').join(',')})`
        : '';

    const tier2 = await db
      .prepare(
        `
        SELECT 
          telegram_id, nickname, username, language_pref as language, mbti_result, zodiac_sign as zodiac,
          blood_type, birthday, last_active_at, is_vip, gender
        FROM users
        WHERE telegram_id != ?
          AND is_banned = 0
          AND age_range IN (?, ?, ?)
          AND last_active_at > datetime('now', '${MATCHING_CONFIG.activeMatching.layers[1].timeWindow}')
          ${excludeClause}
          ${genderFilter}
        ORDER BY last_active_at DESC
        LIMIT ?
      `
      )
      .bind(
        bottle.owner_telegram_id,
        ...adjacentRanges,
        ...existingIds,
        MATCHING_CONFIG.activeMatching.layers[1].limit
      )
      .all();

    if (tier2.results) {
      allCandidates.push(...(tier2.results as UserMatchData[]));
    }

    console.log(
      `[Smart Matching] Tier 2 (adjacent age, 4h) found ${tier2.results?.length || 0} candidates`
    );

    // 如果第 2 層仍不足，查找第 3 層
    if (allCandidates.length < MATCHING_CONFIG.activeMatching.layers[1].minThreshold) {
      const existingIds2 = allCandidates.map((u) => u.telegram_id);

      // 構建排除條件（如果有已存在的 ID）
      const excludeClause =
        existingIds2.length > 0
          ? `AND telegram_id NOT IN (${existingIds2.map(() => '?').join(',')})`
          : '';

      const tier3 = await db
        .prepare(
          `
          SELECT 
            telegram_id, nickname, username, language_pref as language, mbti_result, zodiac_sign as zodiac,
            blood_type, birthday, last_active_at, is_vip, gender
          FROM users
          WHERE telegram_id != ?
            AND is_banned = 0
            AND last_active_at > datetime('now', '${MATCHING_CONFIG.activeMatching.layers[2].timeWindow}')
            ${excludeClause}
            ${genderFilter}
          ORDER BY last_active_at DESC
          LIMIT ?
        `
        )
        .bind(
          bottle.owner_telegram_id,
          ...existingIds2,
          MATCHING_CONFIG.activeMatching.layers[2].limit
        )
        .all();

      if (tier3.results) {
        allCandidates.push(...(tier3.results as UserMatchData[]));
      }

      console.log(
        `[Smart Matching] Tier 3 (all active, 6h) found ${tier3.results?.length || 0} candidates`
      );
    }
  }

  console.log(`[Smart Matching] Total candidates found: ${allCandidates.length}`);

  if (allCandidates.length === 0) {
    console.log(`[Smart Matching] No active users found in last 6 hours`);
    return null;
  }

  // 4. 計算配對分數並過濾
  const bottleData: BottleMatchData = {
    language: bottle.owner_language,
    mbti_result: bottle.mbti_result,
    zodiac: bottle.zodiac_sign,
    blood_type: bottle.blood_type,
    owner_birthday: bottle.owner_birthday,
  };

  const scoredCandidates = allCandidates
    .map((user) => ({
      user,
      score: calculateTotalMatchScore(user, bottleData),
    }))
    .filter((item) => item.score.total > 0); // 過濾掉分數為 0 的

  if (scoredCandidates.length === 0) {
    return null;
  }

  // 5. 排序並選擇前 10 名
  scoredCandidates.sort((a, b) => b.score.total - a.score.total);
  const topCandidates = scoredCandidates.slice(0, MATCHING_CONFIG.activeMatching.topCandidates);

  console.log(
    `[Smart Matching] Top candidate scores: ${topCandidates
      .slice(0, 3)
      .map((c) => c.score.total.toFixed(1))
      .join(', ')}`
  );

  // 6. 從前 10 名中隨機選擇 1 個
  const selected = topCandidates[Math.floor(Math.random() * topCandidates.length)];

  console.log(
    `[Smart Matching] Selected user ${selected.user.telegram_id} with score ${selected.score.total.toFixed(1)}`
  );

  return {
    user: selected.user,
    score: selected.score,
    matchType: 'smart',
  };
}

// ============================================================================
// Passive Matching (撿瓶子時)
// ============================================================================

/**
 * 被動配對：當用戶撿瓶子時，優先推薦高分配對
 * 使用分層查詢策略，優先查找高匹配度瓶子
 */
export async function findSmartBottleForUser(
  db: D1Database,
  userId: string
): Promise<MatchResult | null> {
  // 1. 獲取用戶信息
  const user = await db.prepare('SELECT * FROM users WHERE telegram_id = ?').bind(userId).first();

  if (!user) return null;

  // 性別過濾：瓶子的 target_gender 必須是 'any' 或匹配用戶性別
  const userGender = user.gender || 'any';
  const genderFilter = `AND (b.target_gender = 'any' OR b.target_gender = '${userGender}')`;

  console.log(`[Smart Matching] User ${userId} (gender: ${userGender}) looking for bottles`);

  const allBottles: any[] = [];

  // 2. 第 1 層：優先查找同語言瓶子（100 個）
  const tier1 = await db
    .prepare(
      `
      SELECT 
        b.id, b.content, b.owner_telegram_id as owner_id, b.language_pref as language,
        b.mbti_result, b.zodiac_sign as zodiac, b.blood_type, b.created_at, b.target_gender,
        u.birthday as owner_birthday, u.nickname as owner_nickname
      FROM bottles b
      JOIN users u ON b.owner_telegram_id = u.telegram_id
      WHERE b.match_status = 'active'
        AND b.owner_telegram_id != ?
        AND b.language_pref = ?
        AND b.id NOT IN (
          SELECT bottle_id FROM conversations WHERE user_a_telegram_id = ? OR user_b_telegram_id = ?
        )
        AND u.is_banned = 0
        ${genderFilter}
      ORDER BY b.created_at DESC
      LIMIT ?
    `
    )
    .bind(
      userId,
      user.language_pref,
      userId,
      userId,
      MATCHING_CONFIG.passiveMatching.layers[0].limit
    )
    .all();

  if (tier1.results) {
    allBottles.push(...tier1.results);
  }

  console.log(
    `[Smart Matching] Passive Tier 1 (same language) found ${tier1.results?.length || 0} bottles`
  );

  // 如果第 1 層不足，查找第 2 層
  if (allBottles.length < MATCHING_CONFIG.passiveMatching.layers[0].minThreshold) {
    const userAgeRange = getAgeRange(user.birthday);
    const adjacentRanges = getAdjacentAgeRanges(userAgeRange);

    const existingIds = allBottles.map((b) => b.id);
    const placeholders = existingIds.length > 0 ? existingIds.map(() => '?').join(',') : 'NULL';

    const tier2 = await db
      .prepare(
        `
        SELECT 
          b.id, b.content, b.owner_telegram_id as owner_id, b.language_pref as language,
          b.mbti_result, b.zodiac_sign as zodiac, b.blood_type, b.created_at, b.target_gender,
          u.birthday as owner_birthday, u.nickname as owner_nickname
        FROM bottles b
        JOIN users u ON b.owner_telegram_id = u.telegram_id
        WHERE b.match_status = 'active'
          AND b.owner_telegram_id != ?
          AND u.age_range IN (?, ?, ?)
          AND b.id NOT IN (
            SELECT bottle_id FROM conversations WHERE user_a_telegram_id = ? OR user_b_telegram_id = ?
          )
          AND b.id NOT IN (${placeholders})
          AND u.is_banned = 0
          ${genderFilter}
        ORDER BY b.created_at DESC
        LIMIT ?
      `
      )
      .bind(
        userId,
        ...adjacentRanges,
        userId,
        userId,
        ...existingIds,
        MATCHING_CONFIG.passiveMatching.layers[1].limit
      )
      .all();

    if (tier2.results) {
      allBottles.push(...tier2.results);
    }

    console.log(
      `[Smart Matching] Passive Tier 2 (adjacent age) found ${tier2.results?.length || 0} bottles`
    );

    // 如果第 2 層仍不足，查找第 3 層
    if (allBottles.length < MATCHING_CONFIG.passiveMatching.layers[1].minThreshold) {
      const existingIds2 = allBottles.map((b) => b.id);
      const placeholders2 =
        existingIds2.length > 0 ? existingIds2.map(() => '?').join(',') : 'NULL';

      const tier3 = await db
        .prepare(
          `
          SELECT 
            b.id, b.content, b.owner_telegram_id as owner_id, b.language_pref as language,
            b.mbti_result, b.zodiac_sign as zodiac, b.blood_type, b.created_at, b.target_gender,
            u.birthday as owner_birthday, u.nickname as owner_nickname
          FROM bottles b
          JOIN users u ON b.owner_telegram_id = u.telegram_id
          WHERE b.match_status = 'active'
            AND b.owner_telegram_id != ?
            AND b.id NOT IN (
              SELECT bottle_id FROM conversations WHERE user_a_telegram_id = ? OR user_b_telegram_id = ?
            )
            AND b.id NOT IN (${placeholders2})
            AND u.is_banned = 0
            ${genderFilter}
          ORDER BY b.created_at DESC
          LIMIT ?
        `
        )
        .bind(
          userId,
          userId,
          userId,
          ...existingIds2,
          MATCHING_CONFIG.passiveMatching.layers[2].limit
        )
        .all();

      if (tier3.results) {
        allBottles.push(...tier3.results);
      }

      console.log(
        `[Smart Matching] Passive Tier 3 (all bottles) found ${tier3.results?.length || 0} bottles`
      );
    }
  }

  console.log(`[Smart Matching] Total bottles found: ${allBottles.length}`);

  if (allBottles.length === 0) {
    console.log(`[Smart Matching] No available bottles found`);
    return null;
  }

  // 3. 計算配對分數
  const userData: UserMatchData = {
    language: user.language_pref,
    mbti_result: user.mbti_result,
    zodiac: user.zodiac_sign,
    blood_type: user.blood_type,
    birthday: user.birthday,
    last_active_at: user.last_active_at,
    is_vip: user.is_vip,
  };

  const scoredBottles = allBottles.map((bottle) => ({
    bottle,
    score: calculateTotalMatchScore(userData, {
      language: bottle.language,
      mbti_result: bottle.mbti_result,
      zodiac: bottle.zodiac,
      blood_type: bottle.blood_type,
      owner_birthday: bottle.owner_birthday,
    }),
  }));

  // 4. 排序
  scoredBottles.sort((a, b) => b.score.total - a.score.total);

  // 5. 如果有高分配對（> 閾值），返回智能配對
  console.log(
    `[Smart Matching] Best bottle score: ${scoredBottles[0].score.total.toFixed(1)} (threshold: ${MATCHING_CONFIG.passiveMatching.smartMatchThreshold})`
  );

  if (scoredBottles[0].score.total > MATCHING_CONFIG.passiveMatching.smartMatchThreshold) {
    console.log(
      `[Smart Matching] Smart match! Bottle ${scoredBottles[0].bottle.id} with score ${scoredBottles[0].score.total.toFixed(1)}`
    );
    return {
      bottle: scoredBottles[0].bottle,
      score: scoredBottles[0].score,
      matchType: 'smart',
    };
  }

  // 6. 否則隨機選擇
  const randomIndex = Math.floor(Math.random() * scoredBottles.length);
  console.log(
    `[Smart Matching] Random match! Bottle ${scoredBottles[randomIndex].bottle.id} with score ${scoredBottles[randomIndex].score.total.toFixed(1)}`
  );
  return {
    bottle: scoredBottles[randomIndex].bottle,
    score: scoredBottles[randomIndex].score,
    matchType: 'random',
  };
}

// ============================================================================
// Performance Tracking
// ============================================================================

/**
 * Track performance metrics (可選，用於監控)
 */
export async function trackPerformance<T>(
  operation: string,
  fn: () => Promise<T>,
  context?: any
): Promise<T> {
  const start = Date.now();

  try {
    const result = await fn();
    const duration = Date.now() - start;

    console.log(`[Performance] ${operation}: ${duration}ms`, context);

    // 如果超過閾值，記錄警告
    if (duration > 500) {
      console.warn(`[Performance] Slow operation: ${operation} took ${duration}ms`);
    }

    return result;
  } catch (error) {
    const duration = Date.now() - start;
    console.error(`[Performance] ${operation} failed after ${duration}ms:`, error);
    throw error;
  }
}
