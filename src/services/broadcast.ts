/**
 * Broadcast Service
 * Handles broadcast message sending with rate limiting
 */

import type { Env } from '~/types';
import { createDatabaseClient } from '~/db/client';
import { createTelegramService } from '~/services/telegram';
import type { Broadcast } from '~/domain/broadcast';
import { calculateBatchSize } from '~/domain/broadcast';

/**
 * Create a new broadcast
 */
export async function createBroadcast(
  env: Env,
  message: string,
  targetType: 'all' | 'vip' | 'non_vip',
  createdBy: string
): Promise<number> {
  const db = createDatabaseClient(env.DB);

  // Get target user IDs
  const userIds = await getTargetUserIds(db, targetType);

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

  // Start sending in background
  processBroadcast(env, broadcastId).catch((error) => {
    console.error(`[createBroadcast] Error processing broadcast ${broadcastId}:`, error);
  });

  return broadcastId;
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

    if (broadcast.status !== 'pending') {
      console.log(`[processBroadcast] Broadcast ${broadcastId} already processed`);
      return;
    }

    // Update status to sending
    await updateBroadcastStatus(db, broadcastId, 'sending', new Date().toISOString());

    // Get target users
    const userIds = await getTargetUserIds(db, broadcast.targetType as 'all' | 'vip' | 'non_vip');

    // Calculate batches
    const { batchSize, delayMs } = calculateBatchSize(userIds.length);

    let sentCount = 0;
    let failedCount = 0;

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
            failedCount++;
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
    await updateBroadcastStatus(
      db,
      broadcastId,
      'completed',
      undefined,
      new Date().toISOString()
    );

    console.log(
      `[processBroadcast] Completed broadcast ${broadcastId}: ${sentCount} sent, ${failedCount} failed`
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
    // Get pending broadcasts
    const broadcasts = await db.d1
      .prepare(`SELECT id FROM broadcasts WHERE status = 'pending' LIMIT 1`)
      .all<{ id: number }>();

    if (!broadcasts.results || broadcasts.results.length === 0) {
      return;
    }

    // Process first pending broadcast
    const broadcastId = broadcasts.results[0].id;
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
  };
}

/**
 * Get target user IDs based on type
 */
async function getTargetUserIds(
  db: ReturnType<typeof createDatabaseClient>,
  targetType: 'all' | 'vip' | 'non_vip'
): Promise<string[]> {
  let query = `SELECT telegram_id FROM users WHERE onboarding_step = 'completed'`;

  if (targetType === 'vip') {
    query += ` AND is_vip = 1`;
  } else if (targetType === 'non_vip') {
    query += ` AND is_vip = 0`;
  }

  const result = await db.d1.prepare(query).all<{ telegram_id: string }>();
  return result.results?.map((r) => r.telegram_id) || [];
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

