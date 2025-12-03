import type { Env, TelegramMessage } from '~/types';
import { createDatabaseClient } from '~/db/client';
import { createTelegramService } from '~/services/telegram';
import { findUserByTelegramId } from '~/db/queries/users';
import { isSuperAdmin } from './admin_ban';

/**
 * Grant VIP to a user
 * Usage: /add_vip [user_id]
 */
export async function handleAddVip(message: TelegramMessage, env: Env): Promise<void> {
  const telegram = createTelegramService(env);
  const chatId = message.chat.id;
  const senderId = message.from!.id.toString();

  // Load i18n
  const db = createDatabaseClient(env.DB);
  const senderUser = await findUserByTelegramId(db, senderId);
  const { createI18n } = await import('~/i18n');
  const i18n = createI18n(senderUser?.language_pref || 'zh-TW');

  // Security Check
  if (!isSuperAdmin(senderId, env)) {
    await telegram.sendMessage(chatId, i18n.t('admin.grant.onlySuperAdmin'));
    return;
  }

  // Parse Target ID
  const args = message.text?.split(' ').slice(1) || [];
  const targetId = args[0] || senderId;

  // Validate ID
  if (!targetId || !/^\d+$/.test(targetId)) {
    await telegram.sendMessage(chatId, i18n.t('admin.grant.usageVip'));
    return;
  }

  try {
    const targetUser = await findUserByTelegramId(db, targetId);
    if (!targetUser) {
      await telegram.sendMessage(chatId, i18n.t('admin.grant.userNotFound', { userId: targetId }));
      return;
    }

    // Grant VIP (30 days)
    const now = new Date();
    const expireAt = new Date(now.setDate(now.getDate() + 30));
    
    await db.d1.prepare('UPDATE users SET is_vip = 1, vip_expire_at = ? WHERE telegram_id = ?')
      .bind(expireAt.toISOString(), targetId)
      .run();

    await telegram.sendMessage(chatId, i18n.t('admin.grant.successVip', { userId: targetId, nickname: targetUser.first_name || targetId }));

  } catch (error) {
    console.error('[handleAddVip] Error:', error);
    await telegram.sendMessage(chatId, i18n.t('admin.operationFailed'));
  }
}

/**
 * Grant 50 Fortune Bottles to a user
 * Usage: /add_bottles [user_id]
 */
export async function handleAddBottles(message: TelegramMessage, env: Env): Promise<void> {
  const telegram = createTelegramService(env);
  const chatId = message.chat.id;
  const senderId = message.from!.id.toString();

  // Load i18n
  const db = createDatabaseClient(env.DB);
  const senderUser = await findUserByTelegramId(db, senderId);
  const { createI18n } = await import('~/i18n');
  const i18n = createI18n(senderUser?.language_pref || 'zh-TW');

  // Security Check
  if (!isSuperAdmin(senderId, env)) {
    await telegram.sendMessage(chatId, i18n.t('admin.grant.onlySuperAdmin'));
    return;
  }

  // Parse Target ID
  const args = message.text?.split(' ').slice(1) || [];
  const targetId = args[0] || senderId;

  // Validate ID
  if (!targetId || !/^\d+$/.test(targetId)) {
    await telegram.sendMessage(chatId, i18n.t('admin.grant.usageBottles'));
    return;
  }

  try {
    const targetUser = await findUserByTelegramId(db, targetId);
    if (!targetUser) {
      await telegram.sendMessage(chatId, i18n.t('admin.grant.userNotFound', { userId: targetId }));
      return;
    }

    // Grant 50 Bottles
    // Use FortuneService to manage quota correctly if possible, or direct DB update.
    // Direct DB update for admin tool is acceptable if table structure is simple.
    // Table: fortune_quota (telegram_id, weekly_free_quota, additional_quota, ...)
    
    // Check if quota record exists
    const quota = await db.d1.prepare('SELECT * FROM fortune_quota WHERE telegram_id = ?').bind(targetId).first();
    
    if (quota) {
      await db.d1.prepare('UPDATE fortune_quota SET additional_quota = additional_quota + 50, updated_at = ? WHERE telegram_id = ?')
        .bind(new Date().toISOString(), targetId)
        .run();
    } else {
      // Create record
      await db.d1.prepare('INSERT INTO fortune_quota (telegram_id, weekly_free_quota, additional_quota, created_at, updated_at) VALUES (?, 0, 50, ?, ?)')
        .bind(targetId, new Date().toISOString(), new Date().toISOString())
        .run();
    }

    await telegram.sendMessage(chatId, i18n.t('admin.grant.successBottles', { userId: targetId, nickname: targetUser.first_name || targetId }));

  } catch (error) {
    console.error('[handleAddBottles] Error:', error);
    await telegram.sendMessage(chatId, i18n.t('admin.operationFailed'));
  }
}

