/**
 * Admin Test Refresh Handler
 * 
 * Test refresh for a specific user
 */

import type { Env } from '~/types';
import type { DatabaseClient } from '~/db/client';
import { createTelegramService } from '~/services/telegram';
import { refreshAllConversationHistoryPosts } from '~/services/refresh_conversation_history';

/**
 * Handle /admin_test_refresh command
 */
export async function handleAdminTestRefresh(
  db: DatabaseClient,
  env: Env,
  chatId: number,
  telegramId: string
): Promise<void> {
  const telegram = createTelegramService(env);
  
  try {
    // Check if user is super admin
    const superAdminId = env.SUPER_ADMIN_USER_ID;
    if (telegramId !== superAdminId) {
      await telegram.sendMessage(
        chatId,
        '❌ **權限不足**\n\n此命令僅限超級管理員使用。'
      );
      return;
    }
    
    await telegram.sendMessage(chatId, '🔄 開始刷新您的對話歷史...');
    
    console.error('[AdminTestRefresh] Starting refresh for user:', telegramId);
    
    const result = await refreshAllConversationHistoryPosts(db, env, telegramId);
    
    console.error('[AdminTestRefresh] Refresh completed:', result);
    
    await telegram.sendMessage(
      chatId,
      `✅ **刷新完成**\n\n` +
      `• 更新：${result.updated} 個帖子\n` +
      `• 失敗：${result.failed} 個帖子\n\n` +
      `請檢查對話歷史是否已更新為清晰頭像。`,
      {
        parse_mode: 'Markdown'
      }
    );
    
  } catch (error) {
    console.error('[AdminTestRefresh] Error:', error);
    await telegram.sendMessage(
      chatId,
      '❌ **刷新失敗**\n\n' +
      `錯誤：${error instanceof Error ? error.message : String(error)}`
    );
  }
}

