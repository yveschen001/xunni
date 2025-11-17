/**
 * Report Handler
 * 
 * Handles /report command - report inappropriate content.
 */

import type { Env, TelegramMessage } from '~/types';
import { createDatabaseClient } from '~/db/client';
import { createTelegramService } from '~/services/telegram';
import { findUserByTelegramId } from '~/db/queries/users';
import { getActiveConversation } from '~/db/queries/conversations';
import { getOtherUserId } from '~/domain/conversation';

export async function handleReport(message: TelegramMessage, env: Env): Promise<void> {
  const db = createDatabaseClient(env);
  const telegram = createTelegramService(env);
  const chatId = message.chat.id;
  const telegramId = message.from!.id.toString();

  try {
    // Get user
    const user = await findUserByTelegramId(db, telegramId);
    if (!user) {
      await telegram.sendMessage(chatId, '❌ 用戶不存在，請先使用 /start 註冊。');
      return;
    }

    // Check if user completed onboarding
    if (user.onboarding_step !== 'completed') {
      await telegram.sendMessage(
        chatId,
        '❌ 請先完成註冊流程。\n\n使用 /start 繼續註冊。'
      );
      return;
    }

    // Get active conversation
    const conversation = await getActiveConversation(db, telegramId);
    if (!conversation) {
      await telegram.sendMessage(
        chatId,
        '❌ 你目前沒有活躍的對話。\n\n' +
          '💡 使用 /catch 撿漂流瓶開始新對話。'
      );
      return;
    }

    // Get the other user
    const otherUserId = getOtherUserId(conversation, telegramId);
    if (!otherUserId) {
      await telegram.sendMessage(chatId, '❌ 對話資訊錯誤。');
      return;
    }

    // Show report reasons
    await telegram.sendMessageWithButtons(
      chatId,
      '🚨 **舉報不當內容**\n\n' +
        '請選擇舉報原因：',
      [
        [{ text: '🔞 色情內容', callback_data: 'report_reason_nsfw' }],
        [{ text: '💰 詐騙 / 釣魚', callback_data: 'report_reason_scam' }],
        [{ text: '😡 騷擾 / 辱罵', callback_data: 'report_reason_harassment' }],
        [{ text: '📢 垃圾廣告', callback_data: 'report_reason_spam' }],
        [{ text: '⚠️ 其他違規', callback_data: 'report_reason_other' }],
        [{ text: '❌ 取消', callback_data: 'report_cancel' }],
      ]
    );
  } catch (error) {
    console.error('[handleReport] Error:', error);
    await telegram.sendMessage(chatId, '❌ 發生錯誤，請稍後再試。');
  }
}

/**
 * Handle report reason selection
 */
export async function handleReportReason(
  callbackQuery: any,
  reason: string,
  env: Env
): Promise<void> {
  const db = createDatabaseClient(env);
  const telegram = createTelegramService(env);
  const chatId = callbackQuery.message!.chat.id;
  const telegramId = callbackQuery.from.id.toString();

  try {
    // Get user
    const user = await findUserByTelegramId(db, telegramId);
    if (!user) {
      await telegram.answerCallbackQuery(callbackQuery.id, '❌ 用戶不存在');
      return;
    }

    // Get active conversation
    const conversation = await getActiveConversation(db, telegramId);
    if (!conversation) {
      await telegram.answerCallbackQuery(callbackQuery.id, '❌ 沒有活躍對話');
      return;
    }

    // Get the other user
    const otherUserId = getOtherUserId(conversation, telegramId);
    if (!otherUserId) {
      await telegram.answerCallbackQuery(callbackQuery.id, '❌ 對話資訊錯誤');
      return;
    }

    // Create report
    await createReport(db, telegramId, otherUserId, conversation.id, reason);

    // Increment target user's risk score
    await incrementRiskScore(db, otherUserId);

    // Check if user should be auto-banned (e.g., 3+ reports in 24h)
    const recentReports = await getRecentReportCount(db, otherUserId);
    if (recentReports >= 1) {
      // Auto-ban based on report count
      await autoBanUser(db, telegram, otherUserId, '多次被舉報 / Multiple reports', recentReports);
    }

    // Answer callback
    await telegram.answerCallbackQuery(callbackQuery.id, '✅ 舉報已提交');

    // Delete report menu
    await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);

    // Send confirmation
    await telegram.sendMessage(
      chatId,
      '✅ **舉報已提交**\n\n' +
        '感謝你的舉報，我們會盡快審核。\n\n' +
        '💡 提示：\n' +
        '• 使用 /block 封鎖此使用者\n' +
        '• 使用 /catch 撿新的漂流瓶'
    );
  } catch (error) {
    console.error('[handleReportReason] Error:', error);
    await telegram.answerCallbackQuery(callbackQuery.id, '❌ 發生錯誤');
  }
}

/**
 * Handle report cancel
 */
export async function handleReportCancel(
  callbackQuery: any,
  env: Env
): Promise<void> {
  const telegram = createTelegramService(env);
  const chatId = callbackQuery.message!.chat.id;

  await telegram.answerCallbackQuery(callbackQuery.id, '已取消');
  await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);
}

/**
 * Create a report
 */
async function createReport(
  db: ReturnType<typeof createDatabaseClient>,
  reporterId: string,
  targetId: string,
  conversationId: number,
  reason: string
): Promise<void> {
  await db.d1.prepare(`
    INSERT INTO reports (reporter_id, target_id, conversation_id, reason, created_at)
    VALUES (?, ?, ?, ?, datetime('now'))
  `).bind(reporterId, targetId, conversationId, reason).run();
}

/**
 * Increment user's risk score
 */
async function incrementRiskScore(
  db: ReturnType<typeof createDatabaseClient>,
  userId: string
): Promise<void> {
  await db.d1.prepare(`
    UPDATE users
    SET risk_score = risk_score + 10
    WHERE telegram_id = ?
  `).bind(userId).run();
}

/**
 * Get recent report count (24 hours)
 */
async function getRecentReportCount(
  db: ReturnType<typeof createDatabaseClient>,
  userId: string
): Promise<number> {
  const result = await db.d1.prepare(`
    SELECT COUNT(*) as count
    FROM reports
    WHERE target_id = ?
      AND datetime(created_at) > datetime('now', '-24 hours')
  `).bind(userId).first();

  return (result?.count as number) || 0;
}

/**
 * Auto-ban user with proper ban duration and notification
 */
async function autoBanUser(
  db: ReturnType<typeof createDatabaseClient>,
  telegram: ReturnType<typeof createTelegramService>,
  userId: string,
  reason: string,
  reportCount: number
): Promise<void> {
  // Calculate ban duration based on report count
  let banHours: number;
  if (reportCount === 1) {
    banHours = 1;
  } else if (reportCount === 2) {
    banHours = 6;
  } else if (reportCount === 3) {
    banHours = 24;
  } else {
    banHours = 72; // 3 days for 5+ reports
  }

  const now = new Date();
  const banStart = now.toISOString();
  const banEnd = new Date(now.getTime() + banHours * 60 * 60 * 1000).toISOString();

  // Get user info for notification
  const user = await db.d1
    .prepare('SELECT telegram_id, language_pref, risk_score, ban_count FROM users WHERE telegram_id = ?')
    .bind(userId)
    .first<{ telegram_id: string; language_pref: string; risk_score: number; ban_count: number }>();

  if (!user) {
    console.error('[autoBanUser] User not found:', userId);
    return;
  }

  // Update user status
  await db.d1
    .prepare(`
      UPDATE users
      SET is_banned = 1,
          ban_reason = ?,
          banned_at = ?,
          banned_until = ?,
          ban_count = ban_count + 1,
          updated_at = ?
      WHERE telegram_id = ?
    `)
    .bind(reason, banStart, banEnd, now.toISOString(), userId)
    .run();

  // Create ban record
  await db.d1
    .prepare(`
      INSERT INTO bans (user_id, reason, risk_snapshot, ban_start, ban_end, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `)
    .bind(userId, reason, user.risk_score, banStart, banEnd, now.toISOString())
    .run();

  // Send ban notification
  const { createI18n } = await import('~/i18n');
  const i18n = createI18n(user.language_pref || 'zh-TW');

  const bannedUntil = new Date(banEnd);
  const unbanTime = bannedUntil.toLocaleString(user.language_pref === 'en' ? 'en-US' : 'zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: user.language_pref === 'en' ? 'UTC' : 'Asia/Taipei',
  });

  let duration: string;
  if (banHours < 24) {
    duration = `${banHours} ${user.language_pref === 'en' ? 'hours' : '小時'}`;
  } else {
    const days = Math.floor(banHours / 24);
    duration = `${days} ${user.language_pref === 'en' ? 'days' : '天'}`;
  }

  const message = i18n.t('ban.temporaryBan', {
    reason,
    duration,
    unbanTime,
  });

  try {
    await telegram.sendMessage(userId, message);
  } catch (error) {
    console.error('[autoBanUser] Failed to send ban notification:', error);
  }
}

