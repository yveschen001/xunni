/**
 * Refresh Conversations Handler
 * 
 * Allows users to manually refresh all conversation history posts
 */

import type { Env } from '~/types';
import type { DatabaseClient } from '~/db/client';
import { createTelegramService } from '~/services/telegram';
import { findUserByTelegramId } from '~/db/queries/users';
import { refreshAllConversationHistoryPosts } from '~/services/refresh_conversation_history';
import { updateUserActivity } from '~/services/user_activity';

/**
 * Handle /refresh_conversations command
 */
export async function handleRefreshConversations(
  db: DatabaseClient,
  env: Env,
  chatId: number,
  telegramId: string
): Promise<void> {
  const telegram = createTelegramService(env);
  
  try {
    // Update user activity
    await updateUserActivity(db, telegramId);
    
    // Get user info
    const user = await findUserByTelegramId(db, telegramId);
    
    if (!user) {
      await telegram.sendMessage(chatId, '❌ 用戶不存在，請先註冊');
      return;
    }
    
    // Send processing message
    const processingMsg = await telegram.sendMessage(
      chatId,
      '🔄 正在刷新所有對話歷史...\n\n' +
      '這可能需要一些時間，請稍候。'
    );
    
    // Refresh all conversation history posts
    const result = await refreshAllConversationHistoryPosts(db, env, telegramId);
    
    // Delete processing message
    await telegram.deleteMessage(chatId, processingMsg.message_id);
    
    // Send result message
    if (result.updated === 0 && result.failed === 0) {
      await telegram.sendMessage(
        chatId,
        '💡 **沒有找到對話歷史**\n\n' +
        '您還沒有任何對話記錄。\n\n' +
        '使用 /throw 丟出漂流瓶開始聊天吧！'
      );
    } else if (result.failed === 0) {
      await telegram.sendMessage(
        chatId,
        `✅ **對話歷史已更新！**\n\n` +
        `成功刷新 ${result.updated} 個對話的歷史帖子。\n\n` +
        `💡 **提示：**\n` +
        `• VIP 用戶可以看到清晰的對方頭像\n` +
        `• 免費用戶看到的是模糊頭像\n` +
        `• 升級 VIP 後會自動刷新歷史帖子`,
        {
          parse_mode: 'Markdown'
        }
      );
    } else {
      await telegram.sendMessage(
        chatId,
        `⚠️ **對話歷史部分更新**\n\n` +
        `成功刷新：${result.updated} 個\n` +
        `失敗：${result.failed} 個\n\n` +
        `部分對話歷史可能未能更新，請稍後再試。`,
        {
          parse_mode: 'Markdown'
        }
      );
    }
  } catch (error) {
    console.error('[RefreshConversations] Error:', error);
    await telegram.sendMessage(
      chatId,
      '❌ 刷新對話歷史失敗\n\n' +
      '請稍後再試，或聯繫管理員。'
    );
  }
}

