/**
 * Refresh Avatar Handler
 * 
 * Allows users to manually refresh their cached avatar
 */

import type { Env } from '~/types';
import type { DatabaseClient } from '~/db/client';
import { createTelegramService } from '~/services/telegram';
import { findUserByTelegramId } from '~/db/queries/users';
import { getAvatarUrlWithCache } from '~/services/avatar';
import { updateUserActivity } from '~/services/user_activity';

/**
 * Handle /refresh_avatar command
 */
export async function handleRefreshAvatar(
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
      '🔄 正在刷新頭像...\n\n' +
      '這可能需要幾秒鐘時間。'
    );
    
    // Check VIP status
    const isVip = !!(
      user.is_vip &&
      user.vip_expire_at &&
      new Date(user.vip_expire_at) > new Date()
    );
    
    // Force refresh avatar
    await getAvatarUrlWithCache(
      db,
      env,
      telegramId,
      isVip,
      user.gender || undefined,
      true  // Force refresh
    );
    
    // Delete processing message
    await telegram.deleteMessage(chatId, processingMsg.message_id);
    
    // Send success message
    await telegram.sendMessage(
      chatId,
      '✅ **頭像已更新！**\n\n' +
      '您的頭像緩存已刷新，下次查看對話歷史時將顯示最新頭像。\n\n' +
      '💡 **提示：**\n' +
      '• 頭像會自動每 7 天更新一次\n' +
      '• 如果您更換了 Telegram 頭像，系統會自動檢測\n' +
      '• 您也可以隨時使用此命令手動刷新',
      {
        parse_mode: 'Markdown'
      }
    );
  } catch (error) {
    console.error('[RefreshAvatar] Error:', error);
    await telegram.sendMessage(
      chatId,
      '❌ 刷新頭像失敗\n\n' +
      '請稍後再試，或聯繫管理員。'
    );
  }
}

