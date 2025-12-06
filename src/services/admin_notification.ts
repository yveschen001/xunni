/**
 * Admin Notification Service
 *
 * Sends notifications to super admin for important events.
 */

import type { Env } from '~/types';
import { createTelegramService } from './telegram';

export type NotificationType =
  | 'vip_purchased'
  | 'vip_renewed'
  | 'payment_failed'
  | 'refund_request'
  | 'vip_reminder_sent'
  | 'vip_downgraded'
  | 'translation_failure';

export interface NotificationData {
  user_id: string;
  [key: string]: any;
}

/**
 * Send notification to super admin
 */
export async function notifySuperAdmin(
  env: Env,
  type: NotificationType,
  data: NotificationData
): Promise<void> {
  // Always notify the designated admin log group if configured
  if (env.ADMIN_LOG_GROUP_ID) {
    try {
      const telegram = createTelegramService(env);
      // Admin notifications typically use Chinese
      const { createI18n } = await import('~/i18n');
      const adminLocale = 'zh-TW';
      const i18n = createI18n(adminLocale);
      const message = await formatNotificationMessage(type, data, i18n, adminLocale);
      await telegram.sendMessage(env.ADMIN_LOG_GROUP_ID, message);
    } catch (error) {
      console.error('[notifySuperAdmin] Failed to send notification to group:', error);
    }
  }

  // Also notify Super Admin via DM (optional, can be disabled if group is enough)
  const adminId = env.SUPER_ADMIN_USER_ID;
  if (adminId) {
    try {
      const telegram = createTelegramService(env);
      const { createI18n } = await import('~/i18n');
      const adminLocale = 'zh-TW';
      const i18n = createI18n(adminLocale);
      const message = await formatNotificationMessage(type, data, i18n, adminLocale);
      await telegram.sendMessage(parseInt(adminId), message);
    } catch (error) {
      // Ignore if admin blocked the bot, but log it
      console.warn('[notifySuperAdmin] Failed to DM super admin:', error);
    }
  }
}

/**
 * Format notification message
 * Note: Admin notifications are typically in Chinese (admin's language)
 */
async function formatNotificationMessage(
  type: NotificationType,
  data: NotificationData,
  i18n?: any,
  locale: string = 'zh-TW'
): Promise<string> {
  // Format timestamp based on locale
  const timestamp = new Date().toLocaleString(locale === 'zh-TW' ? 'zh-TW' : locale, {
    timeZone: 'Asia/Taipei',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  // Format date based on locale
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(locale === 'zh-TW' ? 'zh-TW' : locale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  if (i18n) {
    switch (type) {
      case 'vip_purchased':
        return (
          i18n.t('adminNotification.vipPurchased') +
          '\n\n' +
          i18n.t('adminNotification.user', { userId: data.user_id }) +
          '\n' +
          i18n.t('adminNotification.amount', { stars: data.amount_stars }) +
          '\n' +
          i18n.t('adminNotification.expireDate', { date: formatDate(data.expire_date) }) +
          '\n' +
          i18n.t('adminNotification.time', { time: timestamp })
        );

      case 'vip_renewed':
        return (
          i18n.t('adminNotification.vipRenewed') +
          '\n\n' +
          i18n.t('adminNotification.user', { userId: data.user_id }) +
          '\n' +
          i18n.t('adminNotification.amount', { stars: data.amount_stars }) +
          '\n' +
          i18n.t('adminNotification.newExpireDate', { date: formatDate(data.expire_date) }) +
          '\n' +
          i18n.t('adminNotification.time', { time: timestamp })
        );

      case 'payment_failed':
        return (
          i18n.t('adminNotification.paymentFailed') +
          '\n\n' +
          i18n.t('adminNotification.user', { userId: data.user_id }) +
          '\n' +
          i18n.t('adminNotification.reason', { reason: data.error_message }) +
          '\n' +
          i18n.t('adminNotification.time', { time: timestamp })
        );

      case 'refund_request':
        return (
          i18n.t('adminNotification.refundRequest') +
          '\n\n' +
          i18n.t('adminNotification.requestId', { id: data.request_id }) +
          '\n' +
          i18n.t('adminNotification.user', { userId: data.user_id }) +
          '\n' +
          i18n.t('adminNotification.paymentId', { id: data.payment_id }) +
          '\n' +
          i18n.t('adminNotification.reason', { reason: data.reason }) +
          '\n' +
          i18n.t('adminNotification.time', { time: timestamp }) +
          '\n\n' +
          i18n.t('adminNotification.viewRefundsHint')
        );

      case 'vip_reminder_sent':
        return (
          i18n.t('adminNotification.vipReminderSent') +
          '\n\n' +
          i18n.t('adminNotification.user', { userId: data.user_id }) +
          '\n' +
          i18n.t('adminNotification.daysLeft', { days: data.days_left }) +
          '\n' +
          i18n.t('adminNotification.expireDate', { date: formatDate(data.expire_date) }) +
          '\n' +
          i18n.t('adminNotification.time', { time: timestamp })
        );

      case 'vip_downgraded':
        return (
          i18n.t('adminNotification.vipDowngraded') +
          '\n\n' +
          i18n.t('adminNotification.user', { userId: data.user_id }) +
          '\n' +
          i18n.t('adminNotification.expireDate', { date: formatDate(data.expire_date) }) +
          '\n' +
          i18n.t('adminNotification.time', { time: timestamp })
        );

      case 'translation_failure':
        return (
          '⚠️ **翻譯服務異常通知**\n\n' +
          `提供商: ${data.provider}\n` +
          `錯誤訊息: ${data.error}\n` +
          `受影響用戶: ${data.user_id}\n` +
          `發生時間: ${timestamp}\n\n` +
          '請檢查 API Key 配額或服務狀態。'
        );

      default:
        return (
          i18n.t('adminNotification.systemNotification') +
          '\n\n' +
          i18n.t('adminNotification.type', { type }) +
          '\n' +
          i18n.t('adminNotification.data', { data: JSON.stringify(data) }) +
          '\n' +
          i18n.t('adminNotification.time', { time: timestamp })
        );
    }
  }

  // Fallback: create i18n if not provided
  const { createI18n } = await import('~/i18n');
  const fallbackLocale = 'zh-TW';
  const fallbackI18n = createI18n(fallbackLocale);
  return await formatNotificationMessage(type, data, fallbackI18n, fallbackLocale);
}
