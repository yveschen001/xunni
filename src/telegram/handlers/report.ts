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
    if (recentReports >= 3) {
      await autoBanUser(db, otherUserId, 'Multiple reports');
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
 * Auto-ban user
 */
async function autoBanUser(
  db: ReturnType<typeof createDatabaseClient>,
  userId: string,
  reason: string
): Promise<void> {
  // Update user status
  await db.d1.prepare(`
    UPDATE users
    SET is_banned = 1
    WHERE telegram_id = ?
  `).bind(userId).run();

  // Create ban record (24 hours)
  await db.d1.prepare(`
    INSERT INTO bans (user_id, reason, risk_snapshot, ban_start, ban_end, created_at)
    SELECT 
      telegram_id,
      ?,
      risk_score,
      datetime('now'),
      datetime('now', '+24 hours'),
      datetime('now')
    FROM users
    WHERE telegram_id = ?
  `).bind(reason, userId).run();
}

