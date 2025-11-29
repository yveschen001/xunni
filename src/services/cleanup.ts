import type { Env } from '~/types';
import { createDatabaseClient } from '~/db/client';

const BATCH_SIZE = 1000;
const MAX_EXECUTION_MS = 25000; // 25 seconds (Cloudflare Worker limit is usually 30s)

/**
 * Clean up old analytics events to save storage.
 * Retention: 90 days.
 */
export async function deleteOldAnalyticsEvents(env: Env): Promise<{ deleted: number; completed: boolean }> {
  const db = createDatabaseClient(env.DB);
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 90);
  const cutoffStr = cutoffDate.toISOString();

  let totalDeleted = 0;
  const startTime = Date.now();
  let completed = false;

  console.log(`[Cleanup] Starting analytics_events cleanup. Cutoff: ${cutoffStr}`);

  try {
    while (true) {
      // Check execution time
      if (Date.now() - startTime > MAX_EXECUTION_MS) {
        console.warn('[Cleanup] Time limit reached, stopping analytics cleanup.');
        break;
      }

      // Delete in batches
      const result = await db.d1
        .prepare(`DELETE FROM analytics_events WHERE created_at < ? LIMIT ?`)
        .bind(cutoffStr, BATCH_SIZE)
        .run();

      const deletedCount = result.meta.changes || 0;
      totalDeleted += deletedCount;

      if (deletedCount < BATCH_SIZE) {
        completed = true;
        break; // No more rows to delete
      }

      console.log(`[Cleanup] Deleted batch of ${deletedCount} analytics events...`);
    }
  } catch (error) {
    console.error('[Cleanup] Error deleting analytics events:', error);
  }

  console.log(`[Cleanup] Finished analytics_events cleanup. Total deleted: ${totalDeleted}. Completed: ${completed}`);
  return { deleted: totalDeleted, completed };
}

/**
 * Clean up old conversation messages.
 * Policy:
 * 1. Delete ALL messages older than 3 years.
 * 2. Delete messages older than 1 year IF neither participant is VIP.
 */
export async function deleteOldConversationMessages(env: Env): Promise<{ deleted: number; completed: boolean }> {
  const db = createDatabaseClient(env.DB);
  
  // Cutoff dates
  const year1Date = new Date();
  year1Date.setFullYear(year1Date.getFullYear() - 1);
  const year1Str = year1Date.toISOString();

  const year3Date = new Date();
  year3Date.setFullYear(year3Date.getFullYear() - 3);
  const year3Str = year3Date.toISOString();

  let totalDeleted = 0;
  const startTime = Date.now();
  let completed = true; // Assume success unless stopped

  console.log(`[Cleanup] Starting messages cleanup. 1yr Cutoff: ${year1Str}, 3yr Cutoff: ${year3Str}`);

  try {
    // Phase 1: Hard delete > 3 years (Global)
    while (true) {
      if (Date.now() - startTime > MAX_EXECUTION_MS) {
        console.warn('[Cleanup] Time limit reached during Phase 1 cleanup.');
        return { deleted: totalDeleted, completed: false };
      }

      const result = await db.d1
        .prepare(`DELETE FROM conversation_messages WHERE created_at < ? LIMIT ?`)
        .bind(year3Str, BATCH_SIZE)
        .run();

      const count = result.meta.changes || 0;
      totalDeleted += count;
      if (count < BATCH_SIZE) break;
    }

    // Phase 2: Soft delete > 1 year (Non-VIP only)
    // Strategy: Find messages > 1 year belonging to non-VIP conversations
    while (true) {
      if (Date.now() - startTime > MAX_EXECUTION_MS) {
        console.warn('[Cleanup] Time limit reached during Phase 2 cleanup.');
        return { deleted: totalDeleted, completed: false };
      }

      // Complex delete with JOIN
      // Note: SQLite DELETE with JOIN/Subquery can be slow. We use IN clause.
      const query = `
        DELETE FROM conversation_messages
        WHERE created_at < ?
        AND conversation_id IN (
            SELECT c.id
            FROM conversations c
            JOIN users ua ON c.user_a_telegram_id = ua.telegram_id
            JOIN users ub ON c.user_b_telegram_id = ub.telegram_id
            WHERE (ua.is_vip IS NULL OR ua.is_vip = 0)
              AND (ub.is_vip IS NULL OR ub.is_vip = 0)
        )
        LIMIT ?
      `;

      const result = await db.d1
        .prepare(query)
        .bind(year1Str, BATCH_SIZE)
        .run();

      const count = result.meta.changes || 0;
      totalDeleted += count;
      
      if (count < BATCH_SIZE) break;
      console.log(`[Cleanup] Deleted batch of ${count} old non-VIP messages...`);
    }

  } catch (error) {
    console.error('[Cleanup] Error deleting conversation messages:', error);
    completed = false;
  }

  console.log(`[Cleanup] Finished messages cleanup. Total deleted: ${totalDeleted}`);
  return { deleted: totalDeleted, completed };
}

