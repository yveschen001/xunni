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
  | 'vip_downgraded';

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
  const adminId = env.SUPER_ADMIN_USER_ID;
  if (!adminId) {
    console.warn('[notifySuperAdmin] SUPER_ADMIN_USER_ID not configured');
    return;
  }
  
  try {
    const telegram = createTelegramService(env);
    const message = formatNotificationMessage(type, data);
    await telegram.sendMessage(parseInt(adminId), message);
  } catch (error) {
    console.error('[notifySuperAdmin] Failed to send notification:', error);
  }
}

/**
 * Format notification message
 */
function formatNotificationMessage(type: NotificationType, data: NotificationData): string {
  const timestamp = new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' });
  
  switch (type) {
    case 'vip_purchased':
      return `🎉 **新 VIP 購買**\n\n` +
        `用戶：\`${data.user_id}\`\n` +
        `金額：${data.amount_stars} ⭐\n` +
        `到期：${new Date(data.expire_date).toLocaleDateString('zh-TW')}\n` +
        `時間：${timestamp}`;
    
    case 'vip_renewed':
      return `🔄 **VIP 續費**\n\n` +
        `用戶：\`${data.user_id}\`\n` +
        `金額：${data.amount_stars} ⭐\n` +
        `新到期：${new Date(data.expire_date).toLocaleDateString('zh-TW')}\n` +
        `時間：${timestamp}`;
    
    case 'payment_failed':
      return `❌ **支付失敗**\n\n` +
        `用戶：\`${data.user_id}\`\n` +
        `原因：${data.error_message}\n` +
        `時間：${timestamp}`;
    
    case 'refund_request':
      return `🔴 **退款請求**\n\n` +
        `請求 ID：#${data.request_id}\n` +
        `用戶：\`${data.user_id}\`\n` +
        `支付 ID：\`${data.payment_id}\`\n` +
        `原因：${data.reason}\n` +
        `時間：${timestamp}\n\n` +
        `💡 使用 /admin_refunds 查看詳情`;
    
    case 'vip_reminder_sent':
      return `⏰ **VIP 到期提醒已發送**\n\n` +
        `用戶：\`${data.user_id}\`\n` +
        `剩餘：${data.days_left} 天\n` +
        `到期：${new Date(data.expire_date).toLocaleDateString('zh-TW')}\n` +
        `時間：${timestamp}`;
    
    case 'vip_downgraded':
      return `⬇️ **VIP 自動降級**\n\n` +
        `用戶：\`${data.user_id}\`\n` +
        `到期：${new Date(data.expire_date).toLocaleDateString('zh-TW')}\n` +
        `時間：${timestamp}`;
    
    default:
      return `📢 **系統通知**\n\n` +
        `類型：${type}\n` +
        `數據：${JSON.stringify(data)}\n` +
        `時間：${timestamp}`;
  }
}

