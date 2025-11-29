/**
 * Broadcast Service
 * Handles broadcast message sending with rate limiting
 */

import type { Env } from '~/types';
import { createDatabaseClient } from '~/db/client';
import { createTelegramService } from '~/services/telegram';
import type { Broadcast } from '~/domain/broadcast';
import type { BroadcastFilters } from '~/domain/broadcast_filters';
import { translateText } from '~/services/translation/index';

/**
 * Create a new filtered broadcast
 *
 * @param env - Cloudflare environment
 * @param message - Broadcast message
 * @param filters - Custom filters (gender, zodiac, country, age, mbti, vip, is_birthday)
 * @param createdBy - Telegram ID of creator
 * @returns Broadcast ID and total users
 *
 * ⚠️ SAFETY: Enforces same limits as createBroadcast (MAX_SAFE_USERS = 100)
 */
export async function createFilteredBroadcast(
  env: Env,
  message: string,
  filters: BroadcastFilters,
  createdBy: string
): Promise<{ broadcastId: number; totalUsers: number }> {
  const db = createDatabaseClient(env.DB);

  // Get filtered user IDs
  const userIds = await getFilteredUserIds(db, filters);

  // ⚠️ SAFETY CHECK: Prevent large broadcasts
  const MAX_SAFE_USERS = 100;
  if (userIds.length > MAX_SAFE_USERS) {
    // Admin error message (typically in Chinese)
    const { createI18n } = await import('~/i18n');
    const i18n = createI18n('zh-TW');
    throw new Error(
      i18n.t('broadcast.maxUsersExceeded', { max: MAX_SAFE_USERS, current: userIds.length }) +
        '\n\n' +
        i18n.t('broadcast.upgradeRequired')
    );
  }

  // 🌍 AUTO-TRANSLATION: Pre-translate message
  const translationsJson = await translateBroadcastMessage(env, message);

  // Create broadcast record with filter_json
  const filterJson = JSON.stringify(filters);
  const result = await db.d1
    .prepare(
      `INSERT INTO broadcasts (message, target_type, total_users, created_by, status, filter_json, translations)
       VALUES (?, ?, ?, ?, 'pending', ?, ?)
       RETURNING id`
    )
    .bind(message, 'filtered', userIds.length, createdBy, filterJson, translationsJson)
    .first<{ id: number }>();

  const broadcastId = result?.id || 0;
  console.warn(
    `[createFilteredBroadcast] Created broadcast ${broadcastId} for ${userIds.length} users with filters: ${filterJson}`
  );

  // ✨ IMMEDIATE PROCESSING: Process broadcast synchronously
  try {
    await processBroadcast(env, broadcastId);
  } catch (error) {
    console.error(`[createFilteredBroadcast] Error processing broadcast ${broadcastId}:`, error);
    await updateBroadcastStatus(
      db,
      broadcastId,
      'failed',
      undefined,
      undefined,
      error instanceof Error ? error.message : String(error)
    );
    throw error;
  }

  return { broadcastId, totalUsers: userIds.length };
}

/**
 * Create a new broadcast
 */
export async function createBroadcast(
  env: Env,
  message: string,
  targetType: 'all' | 'vip' | 'non_vip',
  createdBy: string
): Promise<{ broadcastId: number; totalUsers: number }> {
  const db = createDatabaseClient(env.DB);

  // Get target user IDs
  const userIds = await getTargetUserIds(db, targetType);

  // ⚠️ SAFETY CHECK: Prevent large broadcasts with current implementation
  // Current system is NOT designed for large-scale broadcasts
  // See BROADCAST_SYSTEM_REDESIGN.md for proper implementation
  const MAX_SAFE_USERS = 100;
  if (userIds.length > MAX_SAFE_USERS) {
    // Admin error message (typically in Chinese)
    const { createI18n } = await import('~/i18n');
    const i18n = createI18n('zh-TW');
    throw new Error(
      i18n.t('broadcast.maxUsersExceeded', { max: MAX_SAFE_USERS, current: userIds.length }) +
        '\n\n' +
        i18n.t('broadcast.upgradeRequired')
    );
  }

  // 🌍 AUTO-TRANSLATION: Pre-translate message
  const translationsJson = await translateBroadcastMessage(env, message);

  // Create broadcast record
  const result = await db.d1
    .prepare(
      `INSERT INTO broadcasts (message, target_type, total_users, created_by, status, translations)
       VALUES (?, ?, ?, ?, 'pending', ?)
       RETURNING id`
    )
    .bind(message, targetType, userIds.length, createdBy, translationsJson)
    .first<{ id: number }>();

  const broadcastId = result?.id || 0;
  console.warn(`[createBroadcast] Created broadcast ${broadcastId} for ${userIds.length} users`);

  // ✨ IMMEDIATE PROCESSING: Process broadcast synchronously
  // This ensures messages are sent before the Worker terminates
  // For small broadcasts (≤100 users), this is fast enough
  try {
    await processBroadcast(env, broadcastId);
  } catch (error) {
    console.error(`[createBroadcast] Error processing broadcast ${broadcastId}:`, error);
    // Update status to failed
    await updateBroadcastStatus(
      db,
      broadcastId,
      'failed',
      undefined,
      undefined,
      error instanceof Error ? error.message : String(error)
    );
    throw error;
  }

  return { broadcastId, totalUsers: userIds.length };
}

/**
 * Translate broadcast message to major languages
 */
async function translateBroadcastMessage(env: Env, message: string): Promise<string> {
  // Check feature flag (env var)
  if (env.ENABLE_TRANSLATION !== 'true') {
    return JSON.stringify({});
  }

  // Major languages to translate to
  // Assuming source is zh-TW (Admin language)
  const targetLangs = ['en', 'ja', 'ko', 'th', 'vi', 'id', 'zh-CN'];
  const translations: Record<string, string> = {};

  console.warn('[translateBroadcastMessage] Starting translation for languages:', targetLangs);

  // Parallel translation
  await Promise.all(
    targetLangs.map(async (lang) => {
      try {
        const result = await translateText(
          message,
          lang,
          'zh-TW', // Source is always zh-TW for admin broadcast
          true, // Use high quality (VIP) mode for official broadcasts
          env
        );
        if (result.text) { // Fix: translateText returns 'text', not 'translatedText'
          translations[lang] = result.text;
        }
      } catch (e) {
        console.warn(`[translateBroadcastMessage] Failed to translate to ${lang}`, e);
      }
    })
  );

  console.warn('[translateBroadcastMessage] Translation completed');
  return JSON.stringify(translations);
}

/**
 * Process a broadcast (send to all users)
 * Uses cursor pagination to prevent OOM and support large broadcasts
 */
async function processBroadcast(env: Env, broadcastId: number): Promise<void> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const BATCH_SIZE = 100; // Users per loop iteration
  const MAX_EXECUTION_TIME_MS = 45000; // 45 seconds limit for Worker
  const startTime = Date.now();

  try {
    // Get broadcast
    const broadcast = await getBroadcast(db, broadcastId);
    if (!broadcast) {
      throw new Error(`Broadcast ${broadcastId} not found`);
    }

    // Skip finished broadcasts
    if (['completed', 'failed', 'cancelled'].includes(broadcast.status)) {
      return;
    }

    // Parse translations
    let translations: Record<string, string> = {};
    if (broadcast.translations) {
      try {
        translations = JSON.parse(broadcast.translations);
      } catch (e) {
        console.error('[processBroadcast] Failed to parse translations JSON', e);
      }
    }

    // Update status to sending
    await updateBroadcastStatus(db, broadcastId, 'sending', new Date().toISOString());

    let cursor = broadcast.lastProcessedId || 0;
    let hasMore = true;
    let totalSent = broadcast.sentCount;
    let totalFailed = broadcast.failedCount;

    while (hasMore) {
      // Check execution time
      if (Date.now() - startTime > MAX_EXECUTION_TIME_MS) {
        console.warn(`[processBroadcast] Time limit reached, stopping for now. Cursor: ${cursor}`);
        break;
      }

      // Fetch next batch with language preference
      let users: { id: number; telegram_id: string; language_pref?: string }[] = [];
      if (broadcast.targetType === 'filtered' && broadcast.filterJson) {
        const filters: BroadcastFilters = JSON.parse(broadcast.filterJson);
        users = await getFilteredUserIds(db, filters, cursor, BATCH_SIZE);
      } else {
        users = await getTargetUserIds(
          db,
          broadcast.targetType as 'all' | 'vip' | 'non_vip',
          cursor,
          BATCH_SIZE
        );
      }

      if (users.length === 0) {
        hasMore = false;
        break;
      }

      console.warn(
        `[processBroadcast] Processing batch of ${users.length} users starting from ID ${cursor}`
      );

      // Send messages
      await Promise.all(
        users.map(async (user) => {
          try {
            // Determine message content based on user language
            let content = broadcast.message;
            if (user.language_pref && translations[user.language_pref]) {
              content = translations[user.language_pref];
            } else if (user.language_pref === 'zh-CN' && translations['zh-CN']) {
              // Special handling for zh-CN if prefered
              content = translations['zh-CN'];
            }

            await telegram.sendMessage(parseInt(user.telegram_id), content);
            totalSent++;
          } catch (error) {
            // Basic error handling, stats update later
            totalFailed++;
            try {
              // Handle error classification
              const { handleBroadcastError } = await import('./telegram_error_handler');
              await handleBroadcastError(db, user.telegram_id, error);
            } catch (e) {
              console.error('Error handler failed', e);
            }
          }
        })
      );

      // Update cursor
      cursor = users[users.length - 1].id;

      // Update progress in DB
      await db.d1
        .prepare(
          'UPDATE broadcasts SET sent_count = ?, failed_count = ?, last_processed_id = ? WHERE id = ?'
        )
        .bind(totalSent, totalFailed, cursor, broadcastId)
        .run();

      // Small delay to be nice to Telegram API
      await sleep(500);
    }

    // If we finished all users
    if (!hasMore) {
      await updateBroadcastStatus(
        db,
        broadcastId,
        'completed',
        undefined,
        new Date().toISOString()
      );
      console.warn(
        `[processBroadcast] Completed broadcast ${broadcastId}. Total sent: ${totalSent}`
      );
    } else {
      console.warn(`[processBroadcast] Paused broadcast ${broadcastId} at cursor ${cursor}`);
    }
  } catch (error) {
    console.error(`[processBroadcast] Error:`, error);
    await updateBroadcastStatus(
      db,
      broadcastId,
      'failed',
      undefined,
      undefined,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

/**
 * Process broadcast queue (called by cron)
 */
export async function processBroadcastQueue(env: Env): Promise<void> {
  const db = createDatabaseClient(env.DB);

  try {
    // Get pending or stuck 'sending' broadcasts (older than 5 minutes)
    const broadcasts = await db.d1
      .prepare(
        `SELECT id FROM broadcasts 
         WHERE status = 'pending' 
            OR (status = 'sending' AND started_at < datetime('now', '-5 minutes'))
         ORDER BY created_at ASC
         LIMIT 1`
      )
      .all<{ id: number }>();

    if (!broadcasts.results || broadcasts.results.length === 0) {
      return;
    }

    // Process first pending/stuck broadcast
    const broadcastId = broadcasts.results[0].id;
    console.warn(`[processBroadcastQueue] Processing broadcast ${broadcastId}`);
    await processBroadcast(env, broadcastId);
  } catch (error) {
    console.error('[processBroadcastQueue] Error:', error);
  }
}

/**
 * Get broadcast by ID
 */
export async function getBroadcast(
  db: ReturnType<typeof createDatabaseClient>,
  broadcastId: number
): Promise<Broadcast | null> {
  const result = await db.d1
    .prepare(`SELECT * FROM broadcasts WHERE id = ?`)
    .bind(broadcastId)
    .first<any>();

  if (!result) return null;

  return {
    id: result.id,
    message: result.message,
    targetType: result.target_type,
    status: result.status,
    totalUsers: result.total_users,
    sentCount: result.sent_count,
    failedCount: result.failed_count,
    createdBy: result.created_by,
    createdAt: result.created_at,
    startedAt: result.started_at,
    completedAt: result.completed_at,
    errorMessage: result.error_message,
    filterJson: result.filter_json,
    lastProcessedId: result.last_processed_id,
    translations: result.translations,
  };
}

/**
 * Get target user IDs based on type with cursor pagination
 */
async function getTargetUserIds(
  db: ReturnType<typeof createDatabaseClient>,
  targetType: 'all' | 'vip' | 'non_vip',
  cursor: number = 0,
  limit: number = 1000
): Promise<{ id: number; telegram_id: string; language_pref?: string }[]> {
  // ✨ SMART FILTERING: Only include active users from last 30 days
  let query = `
    SELECT id, telegram_id, language_pref
    FROM users 
    WHERE onboarding_step = 'completed'
      AND deleted_at IS NULL
      AND bot_status = 'active'
      AND last_active_at >= datetime('now', '-30 days')
      AND id > ?
  `;

  if (targetType === 'vip') {
    query += ` AND is_vip = 1 AND vip_expires_at > datetime('now')`;
  } else if (targetType === 'non_vip') {
    query += ` AND (is_vip = 0 OR vip_expires_at <= datetime('now'))`;
  }

  query += ` ORDER BY id ASC LIMIT ?`;

  const result = await db.d1
    .prepare(query)
    .bind(cursor, limit)
    .all<{ id: number; telegram_id: string; language_pref?: string }>();
  return result.results || [];
}

/**
 * Get filtered user IDs based on custom filters with cursor pagination
 *
 * @param db - Database client
 * @param filters - Broadcast filters
 * @param cursor - Last processed ID (exclusive)
 * @param limit - Number of records to fetch
 * @returns Array of users with id and telegram_id
 */
export async function getFilteredUserIds(
  db: ReturnType<typeof createDatabaseClient>,
  filters: BroadcastFilters,
  cursor: number = 0,
  limit: number = 1000
): Promise<{ id: number; telegram_id: string; language_pref?: string }[]> {
  // ✅ BASE QUERY: Always include mandatory safety filters
  let query = `
    SELECT id, telegram_id, language_pref
    FROM users 
    WHERE onboarding_step = 'completed'
      AND deleted_at IS NULL
      AND bot_status = 'active'
      AND last_active_at >= datetime('now', '-30 days')
      AND id > ?
  `;

  const params: (string | number)[] = [cursor];

  // ✅ GENDER FILTER
  if (filters.gender) {
    query += ` AND gender = ?`;
    params.push(filters.gender);
  }

  // ✅ ZODIAC FILTER
  if (filters.zodiac) {
    query += ` AND zodiac_sign = ?`; // Fixed column name
    params.push(filters.zodiac);
  }

  // ✅ COUNTRY FILTER
  if (filters.country) {
    query += ` AND country_code = ?`;
    params.push(filters.country);
  }

  // ✅ AGE FILTER
  if (filters.age) {
    const currentYear = new Date().getFullYear();
    // Default values are handled by validator, but here we must ensure they are defined
    const minAge = filters.age.min ?? 18;
    const maxAge = filters.age.max ?? 100;
    
    const maxBirthYear = currentYear - minAge;
    const minBirthYear = currentYear - maxAge;

    query += ` AND CAST(strftime('%Y', birthday) AS INTEGER) BETWEEN ? AND ?`;
    params.push(minBirthYear, maxBirthYear);
  }

  // ✅ MBTI FILTER
  if (filters.mbti) {
    query += ` AND mbti_result = ?`; // Fixed column name
    params.push(filters.mbti);
  }

  // ✅ VIP FILTER
  if (filters.vip !== undefined) {
    if (filters.vip) {
      query += ` AND is_vip = 1 AND vip_expires_at > datetime('now')`;
    } else {
      query += ` AND (is_vip = 0 OR vip_expires_at <= datetime('now'))`;
    }
  }

  // ✅ BIRTHDAY FILTER (for automated birthday greetings)
  if (filters.is_birthday) {
    query += ` AND strftime('%m-%d', birthday) = strftime('%m-%d', 'now')`;
  }

  query += ` ORDER BY id ASC LIMIT ?`;
  params.push(limit);

  // Execute query
  const result = await db.d1
    .prepare(query)
    .bind(...params)
    .all<{ id: number; telegram_id: string; language_pref?: string }>();

  return result.results || [];
}

/**
 * Update broadcast status
 */
async function updateBroadcastStatus(
  db: ReturnType<typeof createDatabaseClient>,
  broadcastId: number,
  status: string,
  startedAt?: string,
  completedAt?: string,
  errorMessage?: string
): Promise<void> {
  const updates: string[] = ['status = ?'];
  const params: any[] = [status];

  if (startedAt) {
    updates.push('started_at = ?');
    params.push(startedAt);
  }

  if (completedAt) {
    updates.push('completed_at = ?');
    params.push(completedAt);
  }

  if (errorMessage) {
    updates.push('error_message = ?');
    params.push(errorMessage);
  }

  params.push(broadcastId);

  await db.d1
    .prepare(`UPDATE broadcasts SET ${updates.join(', ')} WHERE id = ?`)
    .bind(...params)
    .run();
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
