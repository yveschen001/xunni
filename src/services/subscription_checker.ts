/**
 * Subscription Checker Service
 * 
 * Checks for expired VIP subscriptions and downgrades users.
 * Runs hourly via Cron Job.
 */

import type { Env } from '~/types';
import { createDatabaseClient } from '~/db/client';
import { createTelegramService } from './telegram';
import { notifySuperAdmin } from './admin_notification';

/**
 * Check and process expired subscriptions
 * 
 * Grace Period: 1 day (to handle payment delays from Telegram)
 */
export async function checkExpiredSubscriptions(env: Env): Promise<void> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  
  // Calculate grace period (1 day ago)
  const gracePeriodEnd = new Date();
  gracePeriodEnd.setDate(gracePeriodEnd.getDate() - 1);
  
  console.error('[checkExpiredSubscriptions] Checking for expired subscriptions...');
  console.error('[checkExpiredSubscriptions] Grace period end:', gracePeriodEnd.toISOString());
  
  try {
    // Find expired VIP users (with 1-day grace period)
    const expiredUsers = await db.d1.prepare(`
      SELECT 
        u.telegram_id,
        u.nickname,
        u.vip_expire_at,
        vs.id as subscription_id
      FROM users u
      LEFT JOIN vip_subscriptions vs ON u.telegram_id = vs.user_id AND vs.status = 'active'
      WHERE u.is_vip = 1
        AND u.vip_expire_at IS NOT NULL
        AND datetime(u.vip_expire_at) < datetime(?)
    `).bind(gracePeriodEnd.toISOString()).all();
    
    console.error(`[checkExpiredSubscriptions] Found ${expiredUsers.results.length} expired users`);
    
    for (const user of expiredUsers.results as any[]) {
      try {
        console.error(`[checkExpiredSubscriptions] Processing user ${user.telegram_id}`);
        
        // 1. Update user VIP status
        await db.d1.prepare(`
          UPDATE users
          SET is_vip = 0,
              vip_expire_at = NULL,
              updated_at = datetime('now')
          WHERE telegram_id = ?
        `).bind(user.telegram_id).run();
        
        // 2. Update subscription status
        if (user.subscription_id) {
          await db.d1.prepare(`
            UPDATE vip_subscriptions
            SET status = 'expired',
                updated_at = datetime('now')
            WHERE id = ?
          `).bind(user.subscription_id).run();
        }
        
        // 3. Notify user
        await telegram.sendMessage(
          parseInt(user.telegram_id),
          `😢 **VIP 訂閱已到期**\n\n` +
            `你的 VIP 訂閱已於 ${new Date(user.vip_expire_at).toLocaleDateString('zh-TW')} 到期。\n\n` +
            `你的帳號已恢復為免費會員。\n\n` +
            `💡 隨時可以重新訂閱 VIP：/vip\n\n` +
            `感謝你的支持！❤️`
        );
        
        // 4. Notify super admin
        await notifySuperAdmin(env, 'vip_downgraded', {
          user_id: user.telegram_id,
          expire_date: user.vip_expire_at,
        });
        
        console.error(`[checkExpiredSubscriptions] Successfully processed user ${user.telegram_id}`);
      } catch (error) {
        console.error(`[checkExpiredSubscriptions] Failed to process user ${user.telegram_id}:`, error);
      }
    }
    
    console.error('[checkExpiredSubscriptions] Completed');
  } catch (error) {
    console.error('[checkExpiredSubscriptions] Error:', error);
  }
}

