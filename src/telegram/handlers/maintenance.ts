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
import { findUserByTelegramId } from '~/db/queries/users';
import { createI18n } from '~/i18n';

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
    const telegramId = message.from!.id.toString();
    const user = await findUserByTelegramId(db, telegramId);
    const i18n = createI18n(user?.language_pref || 'zh-TW');
    
    const parts = text.split(' ');
    if (parts.length < 2) {
      await telegram.sendMessage(
        chatId,
        i18n.t('maintenance.usageError') + '\n\n' +
          i18n.t('maintenance.correctFormat') + '\n' +
          i18n.t('maintenance.example')
      );
      return;
    }

    // Parse duration
    const duration = parseInt(parts[1]);
    if (isNaN(duration)) {
      await telegram.sendMessage(chatId, i18n.t('maintenance.durationMustBeNumber'));
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
      i18n.t('maintenance.enableSuccess', {
        duration,
        startTime: startTime.toLocaleString(user?.language_pref || 'zh-TW'),
        endTime: endTime.toLocaleString(user?.language_pref || 'zh-TW'),
      })
    );
  } catch (error) {
    console.error('[handleMaintenanceEnable] Error:', error);
    const telegramId = message.from!.id.toString();
    const user = await findUserByTelegramId(db, telegramId);
    const i18n = createI18n(user?.language_pref || 'zh-TW');
    await telegram.sendMessage(chatId, i18n.t('maintenance.enableFailed'));
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

    // Get user for i18n
    const telegramId = message.from!.id.toString();
    const user = await findUserByTelegramId(db, telegramId);
    const i18n = createI18n(user?.language_pref || 'zh-TW');

    // Broadcast recovery notification
    const recoveryMessage =
      i18n.t('maintenance.completed') + '\n\n' +
      i18n.t('maintenance.serviceRestored') + '\n\n' +
      i18n.t('maintenance.allFeaturesAvailable');

    await createBroadcast(env, recoveryMessage, 'all', telegramId);

    // Confirm to admin
    await telegram.sendMessage(chatId, i18n.t('maintenance.disableSuccess'));
  } catch (error) {
    console.error('[handleMaintenanceDisable] Error:', error);
    const telegramId = message.from!.id.toString();
    const user = await findUserByTelegramId(db, telegramId);
    const i18n = createI18n(user?.language_pref || 'zh-TW');
    await telegram.sendMessage(chatId, i18n.t('maintenance.disableFailed'));
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
    const telegramId = message.from!.id.toString();
    const user = await findUserByTelegramId(db, telegramId);
    const i18n = createI18n(user?.language_pref || 'zh-TW');
    
    const maintenance = await getMaintenanceMode(db);
    if (!maintenance) {
      await telegram.sendMessage(chatId, i18n.t('maintenance.statusFailed'));
      return;
    }

    const statusMessage = formatMaintenanceStatus(maintenance, i18n);
    await telegram.sendMessage(chatId, statusMessage);
  } catch (error) {
    console.error('[handleMaintenanceStatus] Error:', error);
    const telegramId = message.from!.id.toString();
    const user = await findUserByTelegramId(db, telegramId);
    const i18n = createI18n(user?.language_pref || 'zh-TW');
    await telegram.sendMessage(chatId, i18n.t('error.failed10'));
  }
}

/**
 * Get maintenance mode from database
 */
export async function getMaintenanceMode(
  db: ReturnType<typeof createDatabaseClient>
): Promise<MaintenanceMode | null> {
  const result = await db.d1.prepare(`SELECT * FROM maintenance_mode WHERE id = 1`).first<any>();

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
