/**
 * Block Handler
 *
 * Handles /block command - block users without reporting.
 */

import type { Env, TelegramMessage } from '~/types';
import { createDatabaseClient } from '~/db/client';
import { createTelegramService } from '~/services/telegram';
import { findUserByTelegramId } from '~/db/queries/users';
import { getOtherUserId } from '~/domain/conversation';

export async function handleBlock(message: TelegramMessage, env: Env): Promise<void> {
  const db = createDatabaseClient(env.DB);
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
      await telegram.sendMessage(chatId, '❌ 請先完成註冊流程。\n\n使用 /start 繼續註冊。');
      return;
    }

    // ✨ NEW: Check if user replied to a message
    if (!message.reply_to_message) {
      await telegram.sendMessage(
        chatId,
        '❌ 請長按你要封鎖的訊息後回覆指令\n\n' +
          '**操作步驟：**\n' +
          '1️⃣ 長按對方的訊息\n' +
          '2️⃣ 選擇「回覆」\n' +
          '3️⃣ 輸入 /block\n\n' +
          '💡 這樣可以準確指定要封鎖的對象。'
      );
      return;
    }

    // ✨ NEW: Extract conversation identifier from replied message
    const replyText = message.reply_to_message.text || '';
    const conversationMatch = replyText.match(/#([A-Z0-9]+)/);

    if (!conversationMatch) {
      await telegram.sendMessage(
        chatId,
        '❌ 無法識別對話對象\n\n' + '請確保回覆的是對方發送的訊息（帶有 # 標識符）。'
      );
      return;
    }

    const conversationIdentifier = conversationMatch[1];

    // Find conversation by identifier
    const conversation = await db.d1
      .prepare(
        `
        SELECT * FROM conversations
        WHERE (user1_id = ? OR user2_id = ?)
          AND conversation_identifier = ?
          AND status IN ('active', 'paused')
        ORDER BY updated_at DESC
        LIMIT 1
      `
      )
      .bind(telegramId, telegramId, conversationIdentifier)
      .first<any>();

    if (!conversation) {
      await telegram.sendMessage(chatId, '❌ 找不到此對話\n\n' + '對話可能已結束或不存在。');
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

    // Close conversation
    await db.d1
      .prepare(
        `
      UPDATE conversations
      SET status = 'blocked'
      WHERE id = ?
    `
      )
      .bind(conversation.id)
      .run();

    await telegram.sendMessage(
      chatId,
      `✅ 已封鎖此使用者 (#${conversationIdentifier})\n\n` +
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
  await db.d1
    .prepare(
      `
    INSERT INTO user_blocks (blocker_telegram_id, blocked_telegram_id, created_at)
    VALUES (?, ?, datetime('now'))
    ON CONFLICT(blocker_telegram_id, blocked_telegram_id) DO NOTHING
  `
    )
    .bind(blockerId, blockedId)
    .run();
}
