/**
 * Admin VIP Avatar Refresh Handler
 * 
 * Allows super admin to batch refresh conversation history for VIP users
 */

import type { Env } from '~/types';
import type { DatabaseClient } from '~/db/client';
import { createTelegramService } from '~/services/telegram';
import { 
  refreshRecentVipAvatars, 
  getVipAvatarRefreshStats 
} from '~/services/admin_refresh_vip_avatars';

/**
 * Handle /admin_refresh_vip_avatars command
 * Only accessible by super admin
 */
export async function handleAdminRefreshVipAvatars(
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
    
    // Get statistics first
    const stats = await getVipAvatarRefreshStats(db);
    
    if (stats.usersNeedingRefresh === 0) {
      await telegram.sendMessage(
        chatId,
        '✅ **無需刷新**\n\n' +
        `📊 **統計：**\n` +
        `• 總 VIP 用戶：${stats.totalVipUsers}\n` +
        `• 需要刷新：${stats.usersNeedingRefresh}\n` +
        `• 過時帖子：${stats.totalOutdatedPosts}\n\n` +
        `所有 VIP 用戶的對話歷史都是最新的！`,
        {
          parse_mode: 'Markdown'
        }
      );
      return;
    }
    
    // Send initial message
    const initialMsg = await telegram.sendMessage(
      chatId,
      '🔄 **開始批量刷新 VIP 頭像**\n\n' +
      `📊 **統計：**\n` +
      `• 總 VIP 用戶：${stats.totalVipUsers}\n` +
      `• 需要刷新：${stats.usersNeedingRefresh}\n` +
      `• 過時帖子：${stats.totalOutdatedPosts}\n\n` +
      `⏳ 正在處理，請稍候...`,
      {
        parse_mode: 'Markdown'
      }
    );
    
    // Perform batch refresh
    const startTime = Date.now();
    const results = await refreshRecentVipAvatars(db, env, 30); // Look back 30 days
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    
    // Delete initial message
    await telegram.deleteMessage(chatId, initialMsg.message_id);
    
    // Send detailed results
    let resultMessage = `✅ **批量刷新完成**\n\n`;
    resultMessage += `⏱️ **耗時：** ${duration} 秒\n\n`;
    resultMessage += `📊 **總結：**\n`;
    resultMessage += `• 處理用戶：${results.totalUsers}\n`;
    resultMessage += `• 成功：${results.successUsers}\n`;
    resultMessage += `• 失敗：${results.failedUsers}\n`;
    resultMessage += `• 更新帖子：${results.totalPostsUpdated}\n`;
    resultMessage += `• 失敗帖子：${results.totalPostsFailed}\n\n`;
    
    if (results.details.length > 0) {
      resultMessage += `📝 **詳細結果：**\n`;
      for (const detail of results.details.slice(0, 10)) { // Show first 10
        const username = detail.username ? `@${detail.username}` : detail.userId;
        resultMessage += `• ${username}: ${detail.postsUpdated} 更新, ${detail.postsFailed} 失敗\n`;
      }
      
      if (results.details.length > 10) {
        resultMessage += `\n...還有 ${results.details.length - 10} 個用戶`;
      }
    }
    
    await telegram.sendMessage(chatId, resultMessage, {
      parse_mode: 'Markdown'
    });
    
  } catch (error) {
    console.error('[AdminRefreshVipAvatars] Error:', error);
    await telegram.sendMessage(
      chatId,
      '❌ **刷新失敗**\n\n' +
      '處理過程中發生錯誤，請查看日誌。\n\n' +
      `錯誤：${error instanceof Error ? error.message : String(error)}`
    );
  }
}

