/**
 * Block Handler
 * 
 * Handles /block command - block users without reporting.
 */

import type { Env, TelegramMessage } from '~/types';
import { createDatabaseClient } from '~/db/client';
import { createTelegramService } from '~/services/telegram';
import { findUserByTelegramId } from '~/db/queries/users';
import { getActiveConversation } from '~/db/queries/conversations';
import { getOtherUserId } from '~/domain/conversation';
import { createI18n } from '~/i18n';

export async function handleBlock(message: TelegramMessage, env: Env): Promise<void> {
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

    const i18n = createI18n(user.language_pref || 'zh-TW');

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

    // Block the user
    await blockUser(db, telegramId, otherUserId);

    // Update conversation status
    await updateConversationBlockStatus(db, conversation.id, telegramId);

    // Close conversation
    await db.d1.prepare(`
      UPDATE conversations
      SET status = 'blocked'
      WHERE id = ?
    `).bind(conversation.id).run();

    await telegram.sendMessage(
      chatId,
      '✅ 已封鎖此使用者\n\n' +
        '你們將不會再被匹配到對方的漂流瓶。\n\n' +
        '💡 使用 /catch 撿新的漂流瓶開始新對話。'
    );
  } catch (error) {
    console.error('[handleBlock] Error:', error);
    await telegram.sendMessage(chatId, '❌ 發生錯誤，請稍後再試。');
  }
}

/**
 * Block a user
 */
async function blockUser(
  db: ReturnType<typeof createDatabaseClient>,
  blockerId: string,
  blockedId: string
): Promise<void> {
  await db.d1.prepare(`
    INSERT INTO user_blocks (blocker_id, blocked_id, created_at)
    VALUES (?, ?, datetime('now'))
    ON CONFLICT(blocker_id, blocked_id) DO NOTHING
  `).bind(blockerId, blockedId).run();
}

/**
 * Update conversation block status
 */
async function updateConversationBlockStatus(
  db: ReturnType<typeof createDatabaseClient>,
  conversationId: number,
  blockerId: string
): Promise<void> {
  // Get conversation to determine which user blocked
  const conversation = await db.d1.prepare(`
    SELECT * FROM conversations WHERE id = ?
  `).bind(conversationId).first();

  if (!conversation) {
    return;
  }

  // Update appropriate block flag
  if (conversation.user_a_id === blockerId) {
    await db.d1.prepare(`
      UPDATE conversations
      SET a_blocked = 1
      WHERE id = ?
    `).bind(conversationId).run();
  } else if (conversation.user_b_id === blockerId) {
    await db.d1.prepare(`
      UPDATE conversations
      SET b_blocked = 1
      WHERE id = ?
    `).bind(conversationId).run();
  }
}

