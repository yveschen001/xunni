/**
 * Maintenance Mode Command Handlers
 * Handle admin maintenance mode commands
 */

import type { Env, TelegramMessage } from '~/types';
import { createDatabaseClient } from '~/db/client';
import { createTelegramService } from '~/services/telegram';
import {
  validateMaintenanceDuration,
  calculateEndTime,
  formatMaintenanceStatus,
  formatMaintenanceNotification,
  type MaintenanceMode,
} from '~/domain/maintenance';
import { createBroadcast } from '~/services/broadcast';

/**
 * Handle /maintenance_enable command
 * Usage: /maintenance_enable <duration_minutes> [message]
 */
export async function handleMaintenanceEnable(message: TelegramMessage, env: Env): Promise<void> {
  const telegram = createTelegramService(env);
  const db = createDatabaseClient(env.DB);
  const chatId = message.chat.id;
  const text = message.text || '';

  try {
    const parts = text.split(' ');
    if (parts.length < 2) {
      await telegram.sendMessage(
        chatId,
        '❌ 使用方法錯誤\n\n' +
          '**正確格式：**\n' +
          `/maintenance_enable <時長(分鐘)> [維護訊息]\n\n` +
          '**示例：**\n' +
          `/maintenance_enable 60 系統升級維護`
      );
      return;
    }

    // Parse duration
    const duration = parseInt(parts[1]);
    if (isNaN(duration)) {
      await telegram.sendMessage(chatId, '❌ 時長必須是數字（分鐘）');
      return;
    }

    // Validate duration
    const validation = validateMaintenanceDuration(duration);
    if (!validation.valid) {
      await telegram.sendMessage(chatId, `❌ ${validation.error}`);
      return;
    }

    // Get maintenance message (optional)
    const maintenanceMessage = parts.length > 2 ? parts.slice(2).join(' ') : undefined;

    // Calculate times
    const startTime = new Date();
    const endTime = calculateEndTime(startTime, duration);

    // Enable maintenance mode
    await db.d1
      .prepare(
        `UPDATE maintenance_mode 
         SET is_active = 1,
             start_time = ?,
             end_time = ?,
             estimated_duration = ?,
             maintenance_message = ?,
             enabled_by = ?,
             enabled_at = ?,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = 1`
      )
      .bind(
        startTime.toISOString(),
        endTime.toISOString(),
        duration,
        maintenanceMessage || null,
        message.from!.id.toString(),
        startTime.toISOString()
      )
      .run();

    // Get maintenance record
    const maintenance = await getMaintenanceMode(db);
    if (!maintenance) {
      throw new Error('Failed to get maintenance mode');
    }

    // Broadcast maintenance notification to all users
    const notificationMessage = formatMaintenanceNotification(maintenance);
    await createBroadcast(env, notificationMessage, 'all', message.from!.id.toString());

    // Confirm to admin
    await telegram.sendMessage(
      chatId,
      `✅ 維護模式已啟用\n\n` +
        `時長：${duration} 分鐘\n` +
        `開始：${startTime.toLocaleString('zh-TW')}\n` +
        `結束：${endTime.toLocaleString('zh-TW')}\n\n` +
        `維護通知已廣播給所有用戶。\n` +
        `一般用戶將無法使用服務，只有管理員可以登入。`
    );
  } catch (error) {
    console.error('[handleMaintenanceEnable] Error:', error);
    await telegram.sendMessage(chatId, '❌ 啟用維護模式失敗。');
  }
}

/**
 * Handle /maintenance_disable command
 */
export async function handleMaintenanceDisable(message: TelegramMessage, env: Env): Promise<void> {
  const telegram = createTelegramService(env);
  const db = createDatabaseClient(env.DB);
  const chatId = message.chat.id;

  try {
    // Disable maintenance mode
    await db.d1
      .prepare(
        `UPDATE maintenance_mode 
         SET is_active = 0,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = 1`
      )
      .run();

    // Broadcast recovery notification
    const recoveryMessage =
      '✅ 系統維護已完成\n\n' +
      '服務已恢復正常，感謝您的耐心等待！\n\n' +
      '現在可以正常使用所有功能了。';

    await createBroadcast(env, recoveryMessage, 'all', message.from!.id.toString());

    // Confirm to admin
    await telegram.sendMessage(
      chatId,
      `✅ 維護模式已關閉\n\n` + `恢復通知已廣播給所有用戶。`
    );
  } catch (error) {
    console.error('[handleMaintenanceDisable] Error:', error);
    await telegram.sendMessage(chatId, '❌ 關閉維護模式失敗。');
  }
}

/**
 * Handle /maintenance_status command
 */
export async function handleMaintenanceStatus(message: TelegramMessage, env: Env): Promise<void> {
  const telegram = createTelegramService(env);
  const db = createDatabaseClient(env.DB);
  const chatId = message.chat.id;

  try {
    const maintenance = await getMaintenanceMode(db);
    if (!maintenance) {
      await telegram.sendMessage(chatId, '❌ 無法獲取維護模式狀態');
      return;
    }

    const statusMessage = formatMaintenanceStatus(maintenance);
    await telegram.sendMessage(chatId, statusMessage);
  } catch (error) {
    console.error('[handleMaintenanceStatus] Error:', error);
    await telegram.sendMessage(chatId, '❌ 查詢維護模式狀態失敗。');
  }
}

/**
 * Get maintenance mode from database
 */
export async function getMaintenanceMode(
  db: ReturnType<typeof createDatabaseClient>
): Promise<MaintenanceMode | null> {
  const result = await db.d1
    .prepare(`SELECT * FROM maintenance_mode WHERE id = 1`)
    .first<any>();

  if (!result) return null;

  return {
    id: result.id,
    isActive: result.is_active === 1,
    startTime: result.start_time,
    endTime: result.end_time,
    estimatedDuration: result.estimated_duration,
    maintenanceMessage: result.maintenance_message,
    enabledBy: result.enabled_by,
    enabledAt: result.enabled_at,
    updatedAt: result.updated_at,
  };
}

