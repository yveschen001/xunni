/**
 * VIP Subscription Service
 *
 * Handles VIP subscription lifecycle: reminders, auto-downgrade, etc.
 */

import type { Env } from '~/types';
import { createDatabaseClient } from '~/db/client';
import { createTelegramService } from './telegram';
import { notifySuperAdmin } from './admin_notification';

const VIP_PRICE_STARS = 150; // Default price

function resolveVipPrice(env: Env): number {
  const value = Number(env.VIP_PRICE_STARS ?? VIP_PRICE_STARS);
  if (Number.isFinite(value) && value > 0) {
    return value;
  }
  return VIP_PRICE_STARS;
}

/**
 * Check VIP expirations and send reminders (run daily via Cron)
 */
export async function checkVipExpirations(env: Env): Promise<void> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const now = new Date();

  // Calculate reminder dates
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const in3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const in1Day = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);
  const today = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  // Send reminders
  await sendExpirationReminders(db, telegram, in7Days, '7d', env);
  await sendExpirationReminders(db, telegram, in3Days, '3d', env);
  await sendExpirationReminders(db, telegram, in1Day, '1d', env);
  await sendExpirationReminders(db, telegram, today, '0d', env);

  // Auto-downgrade expired VIPs
  await autoDowngradeExpiredVips(db, telegram, env);
}

/**
 * Send expiration reminders
 */
async function sendExpirationReminders(
  db: ReturnType<typeof createDatabaseClient>,
  telegram: ReturnType<typeof createTelegramService>,
  targetDate: Date,
  reminderType: '7d' | '3d' | '1d' | '0d',
  env: Env
): Promise<void> {
  const reminderField = `reminder_sent_${reminderType}`;

  try {
    // Query users needing reminders
    const subscriptions = await db.d1
      .prepare(
        `
      SELECT 
        vs.id,
        vs.user_id,
        vs.expire_date,
        u.language_code
      FROM vip_subscriptions vs
      JOIN users u ON vs.user_id = u.telegram_id
      WHERE vs.status = 'active'
        AND DATE(vs.expire_date) = DATE(?)
        AND vs.${reminderField} = 0
    `
      )
      .bind(targetDate.toISOString())
      .all();

    const priceStars = resolveVipPrice(env);

    for (const sub of subscriptions.results as any[]) {
      try {
        // Get user's language preference for i18n
        const { findUserByTelegramId } = await import('~/db/queries/users');
        const { createI18n } = await import('~/i18n');
        const user = await findUserByTelegramId(db, sub.user_id);
        const i18n = createI18n(user?.language_pref || 'zh-TW');

        const daysLeft =
          reminderType === '7d' ? 7 : reminderType === '3d' ? 3 : reminderType === '1d' ? 1 : 0;
        const message =
          daysLeft > 0
            ? i18n.t('vip.reminderTitle') + '\n\n' +
              i18n.t('vip.reminderDaysLeft', { days: daysLeft }) + '\n\n' +
              i18n.t('vip.reminderExpireDate', { date: new Date(sub.expire_date).toLocaleDateString(user?.language_pref || 'zh-TW') }) + '\n\n' +
              i18n.t('vip.reminderRenewHint')
            : i18n.t('vip.reminderExpiringToday') + '\n\n' +
              i18n.t('vip.reminderExpiringTodayDesc') + '\n\n' +
              i18n.t('vip.reminderRenewHint2') + '\n' +
              i18n.t('vip.reminderGracePeriod');

        await telegram.sendMessageWithButtons(parseInt(sub.user_id), message, [
          [{ text: i18n.t('vip.renewButton', { stars: priceStars }), callback_data: 'vip_renew' }],
          [{ text: i18n.t('vip.cancelReminderButton'), callback_data: 'vip_cancel_reminder' }],
        ]);

        // Mark as sent
        await db.d1
          .prepare(
            `
          UPDATE vip_subscriptions
          SET ${reminderField} = 1,
              updated_at = datetime('now')
          WHERE id = ?
        `
          )
          .bind(sub.id)
          .run();

        // Notify super admin
        await notifySuperAdmin(env, 'vip_reminder_sent', {
          user_id: sub.user_id,
          days_left: daysLeft,
          expire_date: sub.expire_date,
        });
      } catch (error) {
        console.error(`[sendExpirationReminders] Failed for user ${sub.user_id}:`, error);
      }
    }
  } catch (error) {
    console.error(`[sendExpirationReminders] Error for ${reminderType}:`, error);
  }
}

/**
 * Auto-downgrade expired VIPs (after 3-day grace period)
 */
async function autoDowngradeExpiredVips(
  db: ReturnType<typeof createDatabaseClient>,
  telegram: ReturnType<typeof createTelegramService>,
  env: Env
): Promise<void> {
  const now = new Date();
  const gracePeriodEnd = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000); // 3 days ago

  try {
    // Query expired subscriptions
    const expiredSubs = await db.d1
      .prepare(
        `
      SELECT 
        vs.id,
        vs.user_id,
        vs.expire_date,
        u.language_code
      FROM vip_subscriptions vs
      JOIN users u ON vs.user_id = u.telegram_id
      WHERE vs.status = 'active'
        AND DATE(vs.expire_date) <= DATE(?)
    `
      )
      .bind(gracePeriodEnd.toISOString())
      .all();

    for (const sub of expiredSubs.results as any[]) {
      try {
        // 1. Update user VIP status
        await db.d1
          .prepare(
            `
          UPDATE users
          SET is_vip = 0,
              vip_expire_at = NULL,
              updated_at = datetime('now')
          WHERE telegram_id = ?
        `
          )
          .bind(sub.user_id)
          .run();

        // 2. Update subscription status
        await db.d1
          .prepare(
            `
          UPDATE vip_subscriptions
          SET status = 'expired',
              updated_at = datetime('now')
          WHERE id = ?
        `
          )
          .bind(sub.id)
          .run();

        // 3. Send downgrade notification
        // Get user's language preference for i18n
        const { findUserByTelegramId } = await import('~/db/queries/users');
        const { createI18n } = await import('~/i18n');
        const user = await findUserByTelegramId(db, sub.user_id);
        const i18n = createI18n(user?.language_pref || 'zh-TW');
        await telegram.sendMessage(
          parseInt(sub.user_id),
          i18n.t('subscription.expired') + '\n\n' +
            i18n.t('subscription.expiredDate', { date: new Date(sub.expire_date).toLocaleDateString(user?.language_pref || 'zh-TW') }) + '\n\n' +
            i18n.t('subscription.downgradedToFree') + '\n\n' +
            i18n.t('subscription.renewVipHint') + '\n\n' +
            i18n.t('subscription.thankYou')
        );

        // 4. Notify super admin
        await notifySuperAdmin(env, 'vip_downgraded', {
          user_id: sub.user_id,
          expire_date: sub.expire_date,
        });
      } catch (error) {
        console.error(`[autoDowngradeExpiredVips] Failed for user ${sub.user_id}:`, error);
      }
    }
  } catch (error) {
    console.error('[autoDowngradeExpiredVips] Error:', error);
  }
}

/**
 * Create or update VIP subscription record
 */
export async function createOrUpdateSubscription(
  db: ReturnType<typeof createDatabaseClient>,
  userId: string,
  expireDate: Date,
  paymentId: string
): Promise<void> {
  try {
    // Check if subscription exists
    const existing = await db.d1
      .prepare(
        `
      SELECT id FROM vip_subscriptions
      WHERE user_id = ? AND status = 'active'
    `
      )
      .bind(userId)
      .first();

    if (existing) {
      // Update existing subscription
      await db.d1
        .prepare(
          `
        UPDATE vip_subscriptions
        SET expire_date = ?,
            last_payment_date = datetime('now'),
            last_payment_id = ?,
            reminder_sent_7d = 0,
            reminder_sent_3d = 0,
            reminder_sent_1d = 0,
            reminder_sent_0d = 0,
            updated_at = datetime('now')
        WHERE id = ?
      `
        )
        .bind(expireDate.toISOString(), paymentId, existing.id)
        .run();
    } else {
      // Create new subscription
      await db.d1
        .prepare(
          `
        INSERT INTO vip_subscriptions (
          user_id,
          status,
          start_date,
          expire_date,
          last_payment_date,
          last_payment_id,
          created_at,
          updated_at
        ) VALUES (?, 'active', datetime('now'), ?, datetime('now'), ?, datetime('now'), datetime('now'))
      `
        )
        .bind(userId, expireDate.toISOString(), paymentId)
        .run();
    }
  } catch (error) {
    console.error('[createOrUpdateSubscription] Error:', error);
    throw error;
  }
}
