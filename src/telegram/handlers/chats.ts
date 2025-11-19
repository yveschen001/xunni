/**
 * Chats Handler
 *
 * Handles /chats command - List user conversations with identifiers.
 */

import type { Env, TelegramMessage } from '~/types';
import { createDatabaseClient } from '~/db/client';
import { createTelegramService } from '~/services/telegram';
import { findUserByTelegramId } from '~/db/queries/users';
import { getOrCreateIdentifier } from '~/db/queries/conversation_identifiers';
import { formatIdentifier } from '~/domain/conversation_identifier';
import { maskNickname } from '~/domain/invite';

export async function handleChats(message: TelegramMessage, env: Env): Promise<void> {
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

    // Get conversations with partner info
    const conversations = await getUserConversationsWithPartners(db, telegramId);

    if (conversations.length === 0) {
      await telegram.sendMessage(
        chatId,
        `💬 **我的對話**\n\n` +
          `目前沒有任何對話。\n\n` +
          `使用 /catch 撿漂流瓶開始聊天吧！\n\n` +
          `🏠 返回主選單：/menu`
      );
      return;
    }

    // Format conversations list
    let messageText = `💬 **我的對話列表** (${conversations.length})\n\n`;

    for (const conv of conversations) {
      // Get or create identifier for this conversation
      const partnerTelegramId =
        conv.user_a_telegram_id === telegramId ? conv.user_b_telegram_id : conv.user_a_telegram_id;

      const identifier = await getOrCreateIdentifier(db, telegramId, partnerTelegramId);
      const formattedId = formatIdentifier(identifier);

      // Get partner info
      const partner = await findUserByTelegramId(db, partnerTelegramId);
      const partnerNickname = partner ? maskNickname(partner.nickname) : '未知用戶';

      const statusEmoji = conv.status === 'active' ? '✅' : '⏸️';
      const lastMessageTime = conv.last_message_at
        ? formatRelativeTime(new Date(conv.last_message_at))
        : '無訊息';

      messageText +=
        `${statusEmoji} **${partnerNickname}** ${formattedId}\n` +
        `• 訊息數：${conv.message_count} 則\n` +
        `• 最後訊息：${lastMessageTime}\n\n`;
    }

    messageText +=
      `━━━━━━━━━━━━━━━━\n` +
      `💡 點擊對方訊息的「回覆」按鈕即可繼續對話\n` +
      `📊 使用 /stats 查看詳細統計\n` +
      `🏠 返回主選單：/menu`;

    await telegram.sendMessage(chatId, messageText);
  } catch (error) {
    console.error('[handleChats] Error:', error);
    await telegram.sendMessage(chatId, '❌ 發生錯誤，請稍後再試。');
  }
}

/**
 * Get user conversations with partner info
 */
async function getUserConversationsWithPartners(
  db: ReturnType<typeof createDatabaseClient>,
  telegramId: string
): Promise<
  Array<{
    id: number;
    user_a_telegram_id: string;
    user_b_telegram_id: string;
    status: string;
    message_count: number;
    last_message_at: string | null;
    created_at: string;
  }>
> {
  const result = await db.d1
    .prepare(
      `
    SELECT 
      c.id,
      c.user_a_telegram_id,
      c.user_b_telegram_id,
      c.status,
      COUNT(cm.id) as message_count,
      MAX(cm.created_at) as last_message_at,
      c.created_at
    FROM conversations c
    LEFT JOIN conversation_messages cm ON cm.conversation_id = c.id
    WHERE c.user_a_telegram_id = ? OR c.user_b_telegram_id = ?
    GROUP BY c.id
    ORDER BY MAX(cm.created_at) DESC, c.created_at DESC
    LIMIT 20
  `
    )
    .bind(telegramId, telegramId)
    .all();

  return result.results as any[];
}

/**
 * Format relative time
 */
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) {
    return '剛剛';
  } else if (diffMins < 60) {
    return `${diffMins} 分鐘前`;
  } else if (diffHours < 24) {
    return `${diffHours} 小時前`;
  } else if (diffDays < 7) {
    return `${diffDays} 天前`;
  } else {
    return date.toLocaleDateString('zh-TW');
  }
}
