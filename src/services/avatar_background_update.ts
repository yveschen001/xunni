/**
 * Avatar Background Update Service
 * 
 * Handles batch updating of expired avatar caches
 */

import type { Env } from '~/types';
import type { DatabaseClient } from '~/db/client';
import { getAvatarUrlWithCache } from './avatar';

/**
 * Batch update expired avatars (called by Cron Job)
 * Updates up to 100 expired avatars per run
 */
export async function batchUpdateExpiredAvatars(
  db: DatabaseClient,
  env: Env
): Promise<{ updated: number; failed: number }> {
  console.log('[AvatarBatchUpdate] Starting batch update...');
  
  let updated = 0;
  let failed = 0;
  
  try {
    // Find users with expired avatar cache (older than 7 days)
    const expiredUsers = await db.d1
      .prepare(
        `SELECT telegram_id, gender, is_vip, vip_expire_at
         FROM users
         WHERE avatar_updated_at < datetime('now', '-7 days')
            OR avatar_updated_at IS NULL
         LIMIT 100`
      )
      .all<{
        telegram_id: string;
        gender: string | null;
        is_vip: number;
        vip_expire_at: string | null;
      }>();
    
    if (!expiredUsers.results || expiredUsers.results.length === 0) {
      console.log('[AvatarBatchUpdate] No expired avatars found');
      return { updated: 0, failed: 0 };
    }
    
    console.log(`[AvatarBatchUpdate] Found ${expiredUsers.results.length} expired avatars`);
    
    // Update each user's avatar
    for (const user of expiredUsers.results) {
      try {
        // Check VIP status
        const isVip = !!(
          user.is_vip &&
          user.vip_expire_at &&
          new Date(user.vip_expire_at) > new Date()
        );
        
        // Update avatar cache
        await getAvatarUrlWithCache(
          db,
          env,
          user.telegram_id,
          isVip,
          user.gender || undefined,
          false  // Don't force refresh, let smart detection handle it
        );
        
        updated++;
      } catch (error) {
        console.error(`[AvatarBatchUpdate] Failed to update avatar for user ${user.telegram_id}:`, error);
        failed++;
      }
    }
    
    console.log(`[AvatarBatchUpdate] Completed: ${updated} updated, ${failed} failed`);
    return { updated, failed };
  } catch (error) {
    console.error('[AvatarBatchUpdate] Error:', error);
    return { updated, failed };
  }
}

/**
 * Update avatar for a single user in background (non-blocking)
 */
export async function updateAvatarInBackground(
  db: DatabaseClient,
  env: Env,
  userId: string,
  isVip: boolean,
  gender?: string
): Promise<void> {
  // Run in background, don't block
  getAvatarUrlWithCache(db, env, userId, isVip, gender, false)
    .then(() => {
      console.log(`[AvatarBgUpdate] Successfully updated avatar for user ${userId}`);
    })
    .catch(error => {
      console.error(`[AvatarBgUpdate] Failed to update avatar for user ${userId}:`, error);
    });
}

