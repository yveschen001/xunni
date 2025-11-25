/**
 * Broadcast Service
 * Handles broadcast message sending with rate limiting
 */

import type { Env } from '~/types';
import { createDatabaseClient } from '~/db/client';
import { createTelegramService } from '~/services/telegram';
import type { Broadcast } from '~/domain/broadcast';
import { calculateBatchSize } from '~/domain/broadcast';
import type { BroadcastFilters } from '~/domain/broadcast_filters';

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
      i18n.t('broadcast.maxUsersExceeded', { max: MAX_SAFE_USERS, current: userIds.length }) + '\n\n' +
        i18n.t('broadcast.upgradeRequired')
    );
  }

  // Create broadcast record with filter_json
  const filterJson = JSON.stringify(filters);
  const result = await db.d1
    .prepare(
      `INSERT INTO broadcasts (message, target_type, total_users, created_by, status, filter_json)
       VALUES (?, ?, ?, ?, 'pending', ?)
       RETURNING id`
    )
    .bind(message, 'filtered', userIds.length, createdBy, filterJson)
    .first<{ id: number }>();

  const broadcastId = result?.id || 0;
  console.log(
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
      new Date().toISOString(),
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
      i18n.t('broadcast.maxUsersExceeded', { max: MAX_SAFE_USERS, current: userIds.length }) + '\n\n' +
        i18n.t('broadcast.upgradeRequired')
    );
  }

  // Create broadcast record
  const result = await db.d1
    .prepare(
      `INSERT INTO broadcasts (message, target_type, total_users, created_by, status)
       VALUES (?, ?, ?, ?, 'pending')
       RETURNING id`
    )
    .bind(message, targetType, userIds.length, createdBy)
    .first<{ id: number }>();

  const broadcastId = result?.id || 0;
  console.log(`[createBroadcast] Created broadcast ${broadcastId} for ${userIds.length} users`);

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
      new Date().toISOString(),
      error instanceof Error ? error.message : String(error)
    );
    throw error;
  }

  return { broadcastId, totalUsers: userIds.length };
}

/**
 * Process a broadcast (send to all users)
 */
async function processBroadcast(env: Env, broadcastId: number): Promise<void> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);

  try {
    // Get broadcast
    const broadcast = await getBroadcast(db, broadcastId);
    if (!broadcast) {
      throw new Error(`Broadcast ${broadcastId} not found`);
    }

    // Allow retry for 'sending' status (in case of previous failure)
    // Skip only 'completed', 'failed', or 'cancelled'
    if (
      broadcast.status === 'completed' ||
      broadcast.status === 'failed' ||
      broadcast.status === 'cancelled'
    ) {
      console.log(
        `[processBroadcast] Broadcast ${broadcastId} already in final state: ${broadcast.status}`
      );
      return;
    }

    // Update status to sending
    await updateBroadcastStatus(db, broadcastId, 'sending', new Date().toISOString());

    // Get target users
    let userIds: string[];
    if (broadcast.targetType === 'filtered' && broadcast.filterJson) {
      // Use filtered query
      const filters: BroadcastFilters = JSON.parse(broadcast.filterJson);
      userIds = await getFilteredUserIds(db, filters);
    } else {
      // Use traditional query
      userIds = await getTargetUserIds(db, broadcast.targetType as 'all' | 'vip' | 'non_vip');
    }

    // Calculate batches (使用低優先級，不影響瓶子推送)
    const { batchSize, delayMs } = calculateBatchSize(userIds.length, 'low');

    let sentCount = 0;
    let failedCount = 0;
    // ✨ NEW: Detailed error statistics
    let blockedCount = 0;
    let deletedCount = 0;
    let invalidCount = 0;

    // Send in batches
    for (let i = 0; i < userIds.length; i += batchSize) {
      const batch = userIds.slice(i, i + batchSize);

      // Send to each user in batch
      await Promise.all(
        batch.map(async (userId) => {
          try {
            await telegram.sendMessage(parseInt(userId), broadcast.message);
            sentCount++;
          } catch (error) {
            console.error(`[processBroadcast] Failed to send to ${userId}:`, error);

            // ✨ NEW: Handle error and classify (non-blocking)
            try {
              const { handleBroadcastError } = await import('./telegram_error_handler');
              const { errorType } = await handleBroadcastError(db, userId, error);

              if (errorType === 'blocked') {
                blockedCount++;
              } else if (errorType === 'deleted') {
                deletedCount++;
              } else if (errorType === 'invalid') {
                invalidCount++;
              } else {
                failedCount++;
              }
            } catch (handlerError) {
              // If error handler fails, fall back to original behavior
              console.error(`[processBroadcast] Error handler failed:`, handlerError);
              failedCount++;
            }
          }
        })
      );

      // Update progress
      await updateBroadcastProgress(db, broadcastId, sentCount, failedCount);

      // Delay between batches (except last batch)
      if (i + batchSize < userIds.length) {
        await sleep(delayMs);
      }
    }

    // Mark as completed
    await updateBroadcastStatus(db, broadcastId, 'completed', undefined, new Date().toISOString());

    // ✨ NEW: Detailed completion log
    console.log(
      `[processBroadcast] Completed broadcast ${broadcastId}: ` +
        `${sentCount} sent, ${failedCount} failed ` +
        `(blocked: ${blockedCount}, deleted: ${deletedCount}, invalid: ${invalidCount})`
    );
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
    console.log(`[processBroadcastQueue] Processing broadcast ${broadcastId}`);
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
  };
}

/**
 * Get target user IDs based on type
 */
async function getTargetUserIds(
  db: ReturnType<typeof createDatabaseClient>,
  targetType: 'all' | 'vip' | 'non_vip'
): Promise<string[]> {
  // ✨ SMART FILTERING: Only include active users from last 30 days
  let query = `
    SELECT telegram_id 
    FROM users 
    WHERE onboarding_step = 'completed'
      AND deleted_at IS NULL
      AND bot_status = 'active'
      AND last_active_at >= datetime('now', '-30 days')
  `;

  if (targetType === 'vip') {
    query += ` AND is_vip = 1 AND vip_expires_at > datetime('now')`;
  } else if (targetType === 'non_vip') {
    query += ` AND (is_vip = 0 OR vip_expires_at <= datetime('now'))`;
  }

  const result = await db.d1.prepare(query).all<{ telegram_id: string }>();
  const userIds = result.results?.map((r) => r.telegram_id) || [];

  console.log(
    `[getTargetUserIds] Found ${userIds.length} active users for ${targetType} broadcast`
  );

  return userIds;
}

/**
 * Get filtered user IDs based on custom filters
 *
 * @param db - Database client
 * @param filters - Broadcast filters (gender, zodiac, country, age, mbti, vip, is_birthday)
 * @returns Array of telegram IDs
 *
 * ⚠️ SAFETY: Always includes mandatory filters:
 * - onboarding_step = 'completed'
 * - deleted_at IS NULL
 * - bot_status = 'active'
 * - last_active_at >= datetime('now', '-30 days')
 */
export async function getFilteredUserIds(
  db: ReturnType<typeof createDatabaseClient>,
  filters: BroadcastFilters
): Promise<string[]> {
  // ✅ BASE QUERY: Always include mandatory safety filters
  let query = `
    SELECT telegram_id 
    FROM users 
    WHERE onboarding_step = 'completed'
      AND deleted_at IS NULL
      AND bot_status = 'active'
      AND last_active_at >= datetime('now', '-30 days')
  `;

  const params: (string | number)[] = [];

  // ✅ GENDER FILTER
  if (filters.gender) {
    query += ` AND gender = ?`;
    params.push(filters.gender);
  }

  // ✅ ZODIAC FILTER
  if (filters.zodiac) {
    query += ` AND zodiac = ?`;
    params.push(filters.zodiac);
  }

  // ✅ COUNTRY FILTER
  if (filters.country) {
    query += ` AND country_code = ?`;
    params.push(filters.country);
  }

  // ✅ AGE FILTER
  if (filters.age) {
    // Calculate birth year range from age range
    // age = current_year - birth_year
    // birth_year = current_year - age
    const currentYear = new Date().getFullYear();
    const maxBirthYear = currentYear - filters.age.min; // Youngest (min age)
    const minBirthYear = currentYear - filters.age.max; // Oldest (max age)

    query += ` AND CAST(strftime('%Y', birthday) AS INTEGER) BETWEEN ? AND ?`;
    params.push(minBirthYear, maxBirthYear);
  }

  // ✅ MBTI FILTER
  if (filters.mbti) {
    query += ` AND mbti = ?`;
    params.push(filters.mbti);
  }

  // ✅ VIP FILTER
  if (filters.vip !== undefined) {
    if (filters.vip) {
      // VIP users only
      query += ` AND is_vip = 1 AND vip_expires_at > datetime('now')`;
    } else {
      // Non-VIP users only
      query += ` AND (is_vip = 0 OR vip_expires_at <= datetime('now'))`;
    }
  }

  // ✅ BIRTHDAY FILTER (for automated birthday greetings)
  if (filters.is_birthday) {
    // Match users whose birthday is today (month and day)
    query += ` AND strftime('%m-%d', birthday) = strftime('%m-%d', 'now')`;
  }

  // Execute query
  const result = await db.d1
    .prepare(query)
    .bind(...params)
    .all<{ telegram_id: string }>();
  const userIds = result.results?.map((r) => r.telegram_id) || [];

  console.log(
    `[getFilteredUserIds] Found ${userIds.length} users matching filters: ${JSON.stringify(filters)}`
  );

  return userIds;
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
 * Update broadcast progress
 */
async function updateBroadcastProgress(
  db: ReturnType<typeof createDatabaseClient>,
  broadcastId: number,
  sentCount: number,
  failedCount: number
): Promise<void> {
  await db.d1
    .prepare(`UPDATE broadcasts SET sent_count = ?, failed_count = ? WHERE id = ?`)
    .bind(sentCount, failedCount, broadcastId)
    .run();
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
