/**
 * Help Handler
 * 
 * Handles /help and /rules commands.
 */

import type { Env, TelegramMessage } from '~/types';
import { createDatabaseClient } from '~/db/client';
import { createTelegramService } from '~/services/telegram';
import { findUserByTelegramId } from '~/db/queries/users';

export async function handleHelp(message: TelegramMessage, env: Env): Promise<void> {
  const db = createDatabaseClient(env);
  const telegram = createTelegramService(env);
  const chatId = message.chat.id;
  const telegramId = message.from!.id.toString();

  try {
    // Get user
    const user = await findUserByTelegramId(db, telegramId);

    // Check user role for command visibility
    const role = user?.role || 'user';
    const isAdmin = role === 'group_admin' || role === 'angel' || role === 'god';
    const isGodOrAngel = role === 'angel' || role === 'god';

    let helpMessage = 
      `📖 **XunNi 指令列表**\n\n` +
      `🎮 **核心功能**\n` +
      `/start - 開始使用 / 繼續註冊\n` +
      `/throw - 丟出漂流瓶\n` +
      `/catch - 撿起漂流瓶\n` +
      `/profile - 查看個人資料\n` +
      `/profile_card - 查看資料卡片\n` +
      `/edit_profile - 編輯個人資料\n` +
      `/mbti - MBTI 管理\n` +
      `/stats - 我的統計數據\n` +
      `/chats - 我的對話列表\n` +
      `/vip - VIP 訂閱\n\n` +
      `🛡️ **安全功能**\n` +
      `/block - 封鎖使用者\n` +
      `/report - 舉報不當內容\n` +
      `/appeal - 申訴封禁\n\n` +
      `📖 **幫助**\n` +
      `/rules - 查看遊戲規則\n` +
      `/help - 顯示此列表\n` +
      `/settings - 推送設定`;

    // Add admin commands if user is admin
    if (isAdmin) {
      helpMessage += 
        `\n\n👮 **管理功能**\n` +
        `/admin - 管理主選單\n` +
        `/admin_stats - 運營數據\n` +
        `/admin_user - 使用者管理\n` +
        `/admin_ban - 封禁管理\n` +
        `/admin_vip - VIP 管理\n` +
        `/admin_appeal - 申訴審核`;
    }

    // Add god/angel commands
    if (isGodOrAngel) {
      helpMessage += 
        `\n\n👼 **平台管理**\n` +
        `/broadcast - 群發訊息`;
    }

    helpMessage += 
      `\n\n━━━━━━━━━━━━━━━━\n` +
      `💡 提示：直接發送訊息即可在對話中聊天`;

    await telegram.sendMessage(chatId, helpMessage);
  } catch (error) {
    console.error('[handleHelp] Error:', error);
    await telegram.sendMessage(chatId, '❌ 發生錯誤，請稍後再試。');
  }
}

export async function handleRules(message: TelegramMessage, env: Env): Promise<void> {
  const telegram = createTelegramService(env);
  const chatId = message.chat.id;

  try {
    const rulesMessage = 
      `📜 **XunNi 遊戲規則**\n\n` +
      `🍾 **漂流瓶系統**\n` +
      `• 每天可以丟出和撿起有限數量的漂流瓶\n` +
      `• 免費用戶：每天 3 個瓶子\n` +
      `• VIP 用戶：每天 30 個瓶子\n` +
      `• 邀請好友可增加配額（最多 10/100）\n` +
      `• 瓶子在 24 小時內有效\n\n` +
      `💬 **匿名聊天**\n` +
      `• 所有對話都是匿名的\n` +
      `• 只能發送文字和官方 Emoji\n` +
      `• 不要分享個人聯絡方式\n` +
      `• 尊重對方，友善交流\n\n` +
      `🛡️ **安全規則**\n` +
      `• 禁止發送不當內容\n` +
      `• 禁止騷擾、辱罵他人\n` +
      `• 禁止詐騙、釣魚\n` +
      `• 違規將被封禁\n\n` +
      `💎 **VIP 權益**\n` +
      `• 每天 30 個漂流瓶配額\n` +
      `• 可篩選 MBTI 和星座\n` +
      `• 34 種語言自動翻譯\n` +
      `• 無廣告體驗\n\n` +
      `🎁 **邀請獎勵**\n` +
      `• 邀請好友註冊可獲得配額獎勵\n` +
      `• 使用你的邀請碼：/profile\n` +
      `• 好友使用邀請碼註冊後生效\n\n` +
      `━━━━━━━━━━━━━━━━\n` +
      `💡 遇到問題？使用 /help 查看指令列表`;

    await telegram.sendMessage(chatId, rulesMessage);
  } catch (error) {
    console.error('[handleRules] Error:', error);
    await telegram.sendMessage(chatId, '❌ 發生錯誤，請稍後再試。');
  }
}

