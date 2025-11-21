/**
 * Admin VIP Avatar Refresh Service
 * 
 * Batch refresh conversation history posts for recently upgraded VIP users
 */

import type { Env } from '~/types';
import type { DatabaseClient } from '~/db/client';
import { refreshAllConversationHistoryPosts } from './refresh_conversation_history';

/**
 * Refresh conversation history for all recently upgraded VIP users
 * @param db Database client
 * @param env Environment variables
 * @param daysBack Number of days to look back for VIP upgrades (default: 7)
 * @returns Summary of refresh results
 */
export async function refreshRecentVipAvatars(
  db: DatabaseClient,
  env: Env,
  daysBack: number = 7
): Promise<{
  totalUsers: number;
  successUsers: number;
  failedUsers: number;
  totalPostsUpdated: number;
  totalPostsFailed: number;
  details: Array<{
    userId: string;
    username: string | null;
    postsUpdated: number;
    postsFailed: number;
  }>;
}> {
  console.error('[AdminRefreshVIP] Starting batch refresh for recent VIP users');
  
  const results = {
    totalUsers: 0,
    successUsers: 0,
    failedUsers: 0,
    totalPostsUpdated: 0,
    totalPostsFailed: 0,
    details: [] as Array<{
      userId: string;
      username: string | null;
      postsUpdated: number;
      postsFailed: number;
    }>,
  };
  
  try {
    // Get users who upgraded to VIP in the last N days
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);
    
    const recentVipUsers = await db.d1
      .prepare(
        `SELECT DISTINCT u.telegram_id, u.username, u.is_vip, u.vip_expire_at
         FROM users u
         WHERE u.is_vip = 1 
           AND u.vip_expire_at > datetime('now')
           AND EXISTS (
             SELECT 1 FROM conversation_history_posts chp
             WHERE chp.user_telegram_id = u.telegram_id
               AND chp.created_with_vip_status = 0
               AND chp.is_latest = 1
           )
         ORDER BY u.telegram_id`
      )
      .all<{
        telegram_id: string;
        username: string | null;
        is_vip: number;
        vip_expire_at: string;
      }>();
    
    if (!recentVipUsers.results || recentVipUsers.results.length === 0) {
      console.error('[AdminRefreshVIP] No VIP users with outdated history posts found');
      return results;
    }
    
    results.totalUsers = recentVipUsers.results.length;
    console.error(`[AdminRefreshVIP] Found ${results.totalUsers} VIP users with outdated history posts`);
    
    // Refresh each user's conversation history
    for (const user of recentVipUsers.results) {
      try {
        console.error(`[AdminRefreshVIP] Refreshing user: ${user.telegram_id} (@${user.username || 'unknown'})`);
        
        const refreshResult = await refreshAllConversationHistoryPosts(
          db,
          env,
          user.telegram_id
        );
        
        results.details.push({
          userId: user.telegram_id,
          username: user.username,
          postsUpdated: refreshResult.updated,
          postsFailed: refreshResult.failed,
        });
        
        results.totalPostsUpdated += refreshResult.updated;
        results.totalPostsFailed += refreshResult.failed;
        
        if (refreshResult.updated > 0) {
          results.successUsers++;
        } else {
          results.failedUsers++;
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (error) {
        console.error(`[AdminRefreshVIP] Failed to refresh user ${user.telegram_id}:`, error);
        results.failedUsers++;
        results.details.push({
          userId: user.telegram_id,
          username: user.username,
          postsUpdated: 0,
          postsFailed: 1,
        });
      }
    }
    
    console.error('[AdminRefreshVIP] Batch refresh completed:', results);
    return results;
    
  } catch (error) {
    console.error('[AdminRefreshVIP] Error:', error);
    throw error;
  }
}

/**
 * Get statistics about VIP users with outdated history posts
 */
export async function getVipAvatarRefreshStats(
  db: DatabaseClient
): Promise<{
  totalVipUsers: number;
  usersNeedingRefresh: number;
  totalOutdatedPosts: number;
}> {
  try {
    // Count total active VIP users
    const totalVipResult = await db.d1
      .prepare(
        `SELECT COUNT(*) as count
         FROM users
         WHERE is_vip = 1 AND vip_expire_at > datetime('now')`
      )
      .first<{ count: number }>();
    
    // Count VIP users with outdated history posts
    const needsRefreshResult = await db.d1
      .prepare(
        `SELECT COUNT(DISTINCT u.telegram_id) as count
         FROM users u
         WHERE u.is_vip = 1 
           AND u.vip_expire_at > datetime('now')
           AND EXISTS (
             SELECT 1 FROM conversation_history_posts chp
             WHERE chp.user_telegram_id = u.telegram_id
               AND chp.created_with_vip_status = 0
               AND chp.is_latest = 1
           )`
      )
      .first<{ count: number }>();
    
    // Count total outdated posts
    const outdatedPostsResult = await db.d1
      .prepare(
        `SELECT COUNT(*) as count
         FROM conversation_history_posts chp
         JOIN users u ON chp.user_telegram_id = u.telegram_id
         WHERE u.is_vip = 1 
           AND u.vip_expire_at > datetime('now')
           AND chp.created_with_vip_status = 0
           AND chp.is_latest = 1`
      )
      .first<{ count: number }>();
    
    return {
      totalVipUsers: totalVipResult?.count || 0,
      usersNeedingRefresh: needsRefreshResult?.count || 0,
      totalOutdatedPosts: outdatedPostsResult?.count || 0,
    };
  } catch (error) {
    console.error('[AdminRefreshVIP] Error getting stats:', error);
    return {
      totalVipUsers: 0,
      usersNeedingRefresh: 0,
      totalOutdatedPosts: 0,
    };
  }
}

