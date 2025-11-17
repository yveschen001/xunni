/**
 * Admin Ban Management Handler
 * Handles admin commands for ban management
 */

import type { TelegramMessage } from '~/types';
import type { Env } from '~/worker-configuration';
import { createTelegramService } from '~/services/telegram';
import { createDatabaseClient } from '~/db/client';
import { createI18n } from '~/i18n';
import { findUserByTelegramId } from '~/db/queries/users';

// Admin user IDs (should be moved to env vars in production)
const ADMIN_IDS = ['396943893']; // Replace with actual admin IDs

/**
 * Check if user is admin
 */
function isAdmin(telegramId: string): boolean {
  return ADMIN_IDS.includes(telegramId);
}

/**
 * Handle /admin_bans command - View ban history
 */
export async function handleAdminBans(message: TelegramMessage, env: Env): Promise<void> {
  const telegram = createTelegramService(env.TELEGRAM_BOT_TOKEN);
  const db = createDatabaseClient(env.DB);
  const chatId = message.chat.id.toString();
  const telegramId = message.from!.id.toString();

  // Check admin permission
  if (!isAdmin(telegramId)) {
    await telegram.sendMessage(chatId, '❌ 你沒有權限使用此命令。');
    return;
  }

  // Get user
  const user = await findUserByTelegramId(db, telegramId);
  if (!user) {
    await telegram.sendMessage(chatId, '❌ 用戶不存在。');
    return;
  }

  // Parse command for target user
  const parts = message.text?.split(' ') || [];
  const targetUserId = parts[1];

  if (!targetUserId) {
    // Show recent bans
    const recentBans = await db.d1
      .prepare(
        `SELECT b.id, b.user_id, b.reason, b.ban_start, b.ban_end, b.created_at,
                u.nickname
         FROM bans b
         LEFT JOIN users u ON b.user_id = u.telegram_id
         ORDER BY b.created_at DESC
         LIMIT 10`
      )
      .all<{
        id: number;
        user_id: string;
        reason: string;
        ban_start: string;
        ban_end: string | null;
        created_at: string;
        nickname: string | null;
      }>();

    if (!recentBans.results || recentBans.results.length === 0) {
      await telegram.sendMessage(chatId, '📊 目前沒有封禁記錄');
      return;
    }

    let message = '📊 最近 10 條封禁記錄\n\n';
    for (const ban of recentBans.results) {
      const banStart = new Date(ban.ban_start).toLocaleString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Taipei',
      });

      const banEnd = ban.ban_end
        ? new Date(ban.ban_end).toLocaleString('zh-TW', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Asia/Taipei',
          })
        : '永久';

      message +=
        `ID: ${ban.id}\n` +
        `用戶: ${ban.nickname || ban.user_id}\n` +
        `原因: ${ban.reason}\n` +
        `開始: ${banStart}\n` +
        `結束: ${banEnd}\n\n`;
    }

    message += '💡 使用 /admin_bans <user_id> 查看特定用戶的封禁歷史';

    await telegram.sendMessage(chatId, message);
    return;
  }

  // Show specific user's ban history
  const userBans = await db.d1
    .prepare(
      `SELECT b.id, b.reason, b.ban_start, b.ban_end, b.risk_snapshot, b.created_at
       FROM bans b
       WHERE b.user_id = ?
       ORDER BY b.created_at DESC`
    )
    .bind(targetUserId)
    .all<{
      id: number;
      reason: string;
      ban_start: string;
      ban_end: string | null;
      risk_snapshot: number;
      created_at: string;
    }>();

  if (!userBans.results || userBans.results.length === 0) {
    await telegram.sendMessage(chatId, `❌ 用戶 ${targetUserId} 沒有封禁記錄`);
    return;
  }

  const targetUser = await findUserByTelegramId(db, targetUserId);
  let responseText = `📊 用戶封禁歷史\n\n`;
  responseText += `用戶: ${targetUser?.nickname || targetUserId}\n`;
  responseText += `總封禁次數: ${userBans.results.length}\n\n`;

  for (const ban of userBans.results) {
    const banStart = new Date(ban.ban_start).toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Taipei',
    });

    const banEnd = ban.ban_end
      ? new Date(ban.ban_end).toLocaleString('zh-TW', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'Asia/Taipei',
        })
      : '永久';

    responseText +=
      `━━━━━━━━━━━━━━━━\n` +
      `ID: ${ban.id}\n` +
      `原因: ${ban.reason}\n` +
      `風險分數: ${ban.risk_snapshot}\n` +
      `開始: ${banStart}\n` +
      `結束: ${banEnd}\n\n`;
  }

  await telegram.sendMessage(chatId, responseText);
}

/**
 * Handle /admin_appeals command - View and manage appeals
 */
export async function handleAdminAppeals(message: TelegramMessage, env: Env): Promise<void> {
  const telegram = createTelegramService(env.TELEGRAM_BOT_TOKEN);
  const db = createDatabaseClient(env.DB);
  const chatId = message.chat.id.toString();
  const telegramId = message.from!.id.toString();

  // Check admin permission
  if (!isAdmin(telegramId)) {
    await telegram.sendMessage(chatId, '❌ 你沒有權限使用此命令。');
    return;
  }

  // Get pending appeals
  const pendingAppeals = await db.d1
    .prepare(
      `SELECT a.id, a.user_id, a.reason, a.created_at,
              u.nickname
       FROM appeals a
       LEFT JOIN users u ON a.user_id = u.telegram_id
       WHERE a.status = 'pending'
       ORDER BY a.created_at ASC
       LIMIT 10`
    )
    .all<{
      id: number;
      user_id: string;
      reason: string;
      created_at: string;
      nickname: string | null;
    }>();

  if (!pendingAppeals.results || pendingAppeals.results.length === 0) {
    await telegram.sendMessage(chatId, '✅ 目前沒有待審核的申訴');
    return;
  }

  let responseText = '📋 待審核申訴列表\n\n';
  for (const appeal of pendingAppeals.results) {
    const createdAt = new Date(appeal.created_at).toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Taipei',
    });

    responseText +=
      `━━━━━━━━━━━━━━━━\n` +
      `申訴 ID: ${appeal.id}\n` +
      `用戶: ${appeal.nickname || appeal.user_id}\n` +
      `理由: ${appeal.reason}\n` +
      `提交時間: ${createdAt}\n\n`;
  }

  responseText +=
    '💡 使用以下命令審核申訴：\n' +
    '/admin_approve <appeal_id> [備註]\n' +
    '/admin_reject <appeal_id> [備註]';

  await telegram.sendMessage(chatId, responseText);
}

/**
 * Handle /admin_approve command - Approve an appeal
 */
export async function handleAdminApprove(message: TelegramMessage, env: Env): Promise<void> {
  const telegram = createTelegramService(env.TELEGRAM_BOT_TOKEN);
  const db = createDatabaseClient(env.DB);
  const chatId = message.chat.id.toString();
  const telegramId = message.from!.id.toString();

  // Check admin permission
  if (!isAdmin(telegramId)) {
    await telegram.sendMessage(chatId, '❌ 你沒有權限使用此命令。');
    return;
  }

  // Parse command
  const parts = message.text?.split(' ') || [];
  const appealId = parts[1];
  const notes = parts.slice(2).join(' ') || '申訴已批准';

  if (!appealId) {
    await telegram.sendMessage(chatId, '❌ 請提供申訴 ID\n\n用法: /admin_approve <appeal_id> [備註]');
    return;
  }

  // Get appeal
  const appeal = await db.d1
    .prepare('SELECT user_id, status FROM appeals WHERE id = ?')
    .bind(appealId)
    .first<{ user_id: string; status: string }>();

  if (!appeal) {
    await telegram.sendMessage(chatId, `❌ 找不到申訴 ID: ${appealId}`);
    return;
  }

  if (appeal.status !== 'pending') {
    await telegram.sendMessage(chatId, `❌ 申訴 ${appealId} 已經被審核過了`);
    return;
  }

  // Update appeal
  const now = new Date().toISOString();
  await db.d1
    .prepare(
      `UPDATE appeals 
       SET status = 'approved', 
           reviewed_by = ?, 
           review_notes = ?, 
           reviewed_at = ?
       WHERE id = ?`
    )
    .bind(telegramId, notes, now, appealId)
    .run();

  // Unban user
  await db.d1
    .prepare(
      `UPDATE users 
       SET is_banned = 0, 
           ban_reason = NULL, 
           banned_at = NULL, 
           banned_until = NULL
       WHERE telegram_id = ?`
    )
    .bind(appeal.user_id)
    .run();

  // Notify user
  const user = await findUserByTelegramId(db, appeal.user_id);
  if (user) {
    const i18n = createI18n(user.language_pref || 'zh-TW');
    try {
      await telegram.sendMessage(appeal.user_id, i18n.t('appeal.approved', {}));
    } catch (error) {
      console.error('[handleAdminApprove] Failed to notify user:', error);
    }
  }

  await telegram.sendMessage(chatId, `✅ 申訴 ${appealId} 已批准，用戶已解封`);
}

/**
 * Handle /admin_reject command - Reject an appeal
 */
export async function handleAdminReject(message: TelegramMessage, env: Env): Promise<void> {
  const telegram = createTelegramService(env.TELEGRAM_BOT_TOKEN);
  const db = createDatabaseClient(env.DB);
  const chatId = message.chat.id.toString();
  const telegramId = message.from!.id.toString();

  // Check admin permission
  if (!isAdmin(telegramId)) {
    await telegram.sendMessage(chatId, '❌ 你沒有權限使用此命令。');
    return;
  }

  // Parse command
  const parts = message.text?.split(' ') || [];
  const appealId = parts[1];
  const notes = parts.slice(2).join(' ') || '申訴被拒絕';

  if (!appealId) {
    await telegram.sendMessage(chatId, '❌ 請提供申訴 ID\n\n用法: /admin_reject <appeal_id> [備註]');
    return;
  }

  // Get appeal
  const appeal = await db.d1
    .prepare('SELECT user_id, status FROM appeals WHERE id = ?')
    .bind(appealId)
    .first<{ user_id: string; status: string }>();

  if (!appeal) {
    await telegram.sendMessage(chatId, `❌ 找不到申訴 ID: ${appealId}`);
    return;
  }

  if (appeal.status !== 'pending') {
    await telegram.sendMessage(chatId, `❌ 申訴 ${appealId} 已經被審核過了`);
    return;
  }

  // Update appeal
  const now = new Date().toISOString();
  await db.d1
    .prepare(
      `UPDATE appeals 
       SET status = 'rejected', 
           reviewed_by = ?, 
           review_notes = ?, 
           reviewed_at = ?
       WHERE id = ?`
    )
    .bind(telegramId, notes, now, appealId)
    .run();

  // Notify user
  const user = await findUserByTelegramId(db, appeal.user_id);
  if (user) {
    const i18n = createI18n(user.language_pref || 'zh-TW');
    try {
      await telegram.sendMessage(appeal.user_id, i18n.t('appeal.rejected', { notes }));
    } catch (error) {
      console.error('[handleAdminReject] Failed to notify user:', error);
    }
  }

  await telegram.sendMessage(chatId, `✅ 申訴 ${appealId} 已拒絕`);
}

