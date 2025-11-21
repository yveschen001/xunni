/**
 * Admin Avatar Diagnosis Handler
 * 
 * Diagnose avatar and conversation history status for a user
 */

import type { Env } from '~/types';
import type { DatabaseClient } from '~/db/client';
import { createTelegramService } from '~/services/telegram';

/**
 * Handle /admin_diagnose_avatar command
 */
export async function handleAdminDiagnoseAvatar(
  db: DatabaseClient,
  env: Env,
  chatId: number,
  telegramId: string,
  targetUserId?: string
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
    
    // Use target user ID or self
    const userId = targetUserId || telegramId;
    
    // Get user info
    const { findUserByTelegramId } = await import('~/db/queries/users');
    const user = await findUserByTelegramId(db, userId);
    
    if (!user) {
      await telegram.sendMessage(chatId, `❌ 用戶不存在：${userId}`);
      return;
    }
    
    // Check VIP status
    const isVip = !!(
      user.is_vip &&
      user.vip_expire_at &&
      new Date(user.vip_expire_at) > new Date()
    );
    
    // Get conversation history posts
    const historyPosts = await db.d1
      .prepare(
        `SELECT chp.id, chp.conversation_id, chp.identifier, chp.post_number, 
                chp.is_latest, chp.created_with_vip_status, chp.partner_avatar_url,
                chp.created_at, chp.updated_at
         FROM conversation_history_posts chp
         WHERE chp.user_telegram_id = ?
         ORDER BY chp.updated_at DESC
         LIMIT 10`
      )
      .bind(userId)
      .all<{
        id: number;
        conversation_id: number;
        identifier: string;
        post_number: number;
        is_latest: number;
        created_with_vip_status: number;
        partner_avatar_url: string | null;
        created_at: string;
        updated_at: string;
      }>();
    
    // Get avatar cache info
    const avatarInfo = await db.d1
      .prepare(
        `SELECT avatar_file_id, avatar_original_url, avatar_blurred_url, avatar_updated_at
         FROM users
         WHERE telegram_id = ?`
      )
      .bind(userId)
      .first<{
        avatar_file_id: string | null;
        avatar_original_url: string | null;
        avatar_blurred_url: string | null;
        avatar_updated_at: string | null;
      }>();
    
    // Build diagnosis message
    let message = `🔍 **頭像診斷報告**\n\n`;
    message += `👤 **用戶信息：**\n`;
    message += `• ID：${userId}\n`;
    message += `• 暱稱：${user.nickname || '未設定'}\n`;
    message += `• 用戶名：@${user.username || '無'}\n`;
    message += `• VIP 狀態：${isVip ? '✅ 是' : '❌ 否'}\n`;
    
    if (user.vip_expire_at) {
      message += `• VIP 到期：${new Date(user.vip_expire_at).toLocaleString('zh-TW')}\n`;
    }
    
    message += `\n📸 **頭像緩存：**\n`;
    if (avatarInfo?.avatar_file_id) {
      message += `• File ID：${avatarInfo.avatar_file_id.substring(0, 20)}...\n`;
      message += `• 原始 URL：${avatarInfo.avatar_original_url ? '✅' : '❌'}\n`;
      message += `• 模糊 URL：${avatarInfo.avatar_blurred_url ? '✅' : '❌'}\n`;
      message += `• 更新時間：${avatarInfo.avatar_updated_at ? new Date(avatarInfo.avatar_updated_at).toLocaleString('zh-TW') : '未知'}\n`;
    } else {
      message += `• 無緩存\n`;
    }
    
    message += `\n💬 **對話歷史帖子：**\n`;
    if (historyPosts.results && historyPosts.results.length > 0) {
      message += `• 總數：${historyPosts.results.length}\n\n`;
      
      for (const post of historyPosts.results.slice(0, 5)) {
        message += `📝 **帖子 #${post.identifier}-H${post.post_number}**\n`;
        message += `  • ID：${post.id}\n`;
        message += `  • 最新：${post.is_latest ? '✅' : '❌'}\n`;
        message += `  • 創建時 VIP：${post.created_with_vip_status ? '✅' : '❌'}\n`;
        message += `  • 有頭像：${post.partner_avatar_url ? '✅' : '❌'}\n`;
        message += `  • 更新時間：${new Date(post.updated_at).toLocaleString('zh-TW', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}\n\n`;
      }
      
      if (historyPosts.results.length > 5) {
        message += `...還有 ${historyPosts.results.length - 5} 個帖子\n`;
      }
    } else {
      message += `• 無對話歷史帖子\n`;
    }
    
    // Analysis
    message += `\n🔎 **分析：**\n`;
    
    if (!historyPosts.results || historyPosts.results.length === 0) {
      message += `⚠️ 此用戶沒有對話歷史帖子\n`;
      message += `💡 對話歷史帖子只在有新消息時創建\n`;
    } else {
      const outdatedPosts = historyPosts.results.filter(
        p => p.is_latest && p.created_with_vip_status === 0 && isVip
      );
      
      if (outdatedPosts.length > 0) {
        message += `⚠️ 發現 ${outdatedPosts.length} 個過時帖子需要刷新\n`;
        message += `💡 使用 /admin_refresh_vip_avatars 批量刷新\n`;
      } else if (isVip) {
        message += `✅ 所有帖子都是最新的（VIP 狀態正確）\n`;
      } else {
        message += `✅ 所有帖子都是最新的（免費用戶狀態正確）\n`;
      }
    }
    
    await telegram.sendMessage(chatId, message, {
      parse_mode: 'Markdown'
    });
    
  } catch (error) {
    console.error('[AdminDiagnoseAvatar] Error:', error);
    await telegram.sendMessage(
      chatId,
      '❌ **診斷失敗**\n\n' +
      `錯誤：${error instanceof Error ? error.message : String(error)}`
    );
  }
}

