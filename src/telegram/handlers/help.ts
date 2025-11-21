/**
 * Help Handler
 *
 * Handles /help and /rules commands.
 */

import type { Env, TelegramMessage } from '~/types';
import { createTelegramService } from '~/services/telegram';

export async function handleHelp(message: TelegramMessage, env: Env): Promise<void> {
  const telegram = createTelegramService(env);
  const chatId = message.chat.id;
  const telegramId = message.from!.id.toString();

  try {
    // Check user role using new admin system
    const { getAdminIds, isSuperAdmin } = await import('./admin_ban');
    const adminIds = getAdminIds(env);
    const isUserSuperAdmin = isSuperAdmin(telegramId);
    const isUserAdmin = adminIds.includes(telegramId);

    // Base commands for all users
    let helpMessage =
      `📖 **XunNi 指令列表**\n\n` +
      `━━━━━━━━━━━━━━━━\n` +
      `🎮 **核心功能**\n` +
      `/start - 開始使用 / 繼續註冊\n` +
      `/menu - 主選單\n` +
      `/throw - 丟出漂流瓶\n` +
      `/catch - 撿起漂流瓶\n` +
      `/chats - 我的對話列表\n\n` +
      `👤 **個人資料**\n` +
      `/profile - 查看個人資料\n` +
      `/profile_card - 查看資料卡片\n` +
      `/edit_profile - 編輯個人資料\n` +
      `/refresh_avatar - 刷新頭像緩存\n` +
      `/mbti - MBTI 管理\n` +
      `/stats - 我的統計數據\n\n` +
      `🎁 **額度與 VIP**\n` +
      `/quota - 查看額度狀態\n` +
      `/tasks - 任務中心（完成任務獲得額外瓶子）\n` +
      `/invite - 邀請好友獲得額度\n` +
      `/vip - VIP 訂閱\n` +
      `• 觀看廣告獲得額度（額度用完時顯示）\n` +
      `• 查看官方廣告獲得永久額度\n\n` +
      `🛡️ **安全與申訴**\n` +
      `/block - 封鎖使用者\n` +
      `/report - 舉報不當內容\n` +
      `/appeal - 申訴封禁\n` +
      `/appeal_status - 查詢申訴狀態\n\n` +
      `📖 **幫助與設定**\n` +
      `/help - 顯示此列表\n` +
      `/rules - 查看遊戲規則\n` +
      `/settings - 推送設定`;

    // Add admin commands (for both regular admin and super admin)
    if (isUserAdmin) {
      helpMessage +=
        `\n\n━━━━━━━━━━━━━━━━\n` +
        `👮 **管理員功能**\n\n` +
        `**用戶管理**\n` +
        `/admin_ban <user_id> [hours|permanent] - 封禁用戶\n` +
        `/admin_unban <user_id> - 解除封禁\n` +
        `/admin_bans - 查看封禁記錄\n` +
        `/admin_bans <user_id> - 查看用戶封禁歷史\n\n` +
        `**申訴審核**\n` +
        `/admin_appeals - 查看待審核申訴\n` +
        `/admin_approve <id> [備註] - 批准申訴\n` +
        `/admin_reject <id> [備註] - 拒絕申訴\n\n` +
        `**廣播監控**\n` +
        `/broadcast_status - 查看廣播列表\n` +
        `/broadcast_status <id> - 查看廣播詳情\n` +
        `/broadcast_process - 手動處理廣播隊列\n` +
        `/broadcast_cleanup - 清理卡住的廣播\n` +
        `/broadcast_cancel <id> - 取消廣播\n\n` +
        `**系統維護**\n` +
        `/maintenance_status - 查看維護狀態`;
    }

    // Add super admin commands (only for super admin)
    if (isUserSuperAdmin) {
      helpMessage +=
        `\n\n━━━━━━━━━━━━━━━━\n` +
        `🔱 **超級管理員功能**\n\n` +
        `**管理員管理**\n` +
        `/admin_list - 查看管理員列表\n` +
        `/admin_add <user_id> - 添加管理員\n` +
        `/admin_remove <user_id> - 移除管理員\n\n` +
        `**廣播發送**\n` +
        `/broadcast <訊息> - 群發給所有用戶\n` +
        `/broadcast_vip <訊息> - 群發給 VIP 用戶\n` +
        `/broadcast_non_vip <訊息> - 群發給非 VIP 用戶\n\n` +
        `**數據分析**\n` +
        `/analytics - 每日運營報表\n` +
        `/ad_performance - 廣告效果報表\n` +
        `/funnel - VIP 轉化漏斗\n\n` +
        `**系統維護**\n` +
        `/maintenance_status - 查看維護狀態\n` +
        `/maintenance_enable <分鐘> <訊息> - 啟用維護模式\n` +
        `/maintenance_disable - 關閉維護模式\n\n` +
        `**開發工具**\n` +
        `/dev_info - 系統信息\n` +
        `/dev_reset - 重置帳號（測試用）\n` +
        `/dev_restart - 完全重置帳號`;
    }

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
      `🎁 **額度獲取方式**\n` +
      `• 每日免費額度：3 個（VIP：30 個）\n` +
      `• 完成任務：獲得額外瓶子（使用 /tasks 查看）\n` +
      `• 邀請好友：每人 +1 額度（最多 10/100）\n` +
      `• 觀看廣告：每次 +1 額度（每日最多 20 次）\n` +
      `• 官方廣告：永久額度獎勵\n` +
      `• 使用 /quota 查看額度狀態\n\n` +
      `🛡️ **安全規則**\n` +
      `• 禁止發送不當內容\n` +
      `• 禁止騷擾、辱罵他人\n` +
      `• 禁止詐騙、釣魚\n` +
      `• 違規將被封禁\n\n` +
      `💎 **VIP 權益**\n` +
      `• 解鎖對方清晰頭像 🆕\n` +
      `• 每天 30 個漂流瓶配額\n` +
      `• 可篩選 MBTI 和星座\n` +
      `• 34 種語言自動翻譯\n` +
      `• 無廣告體驗\n\n` +
      `━━━━━━━━━━━━━━━━\n` +
      `💡 遇到問題？使用 /help 查看指令列表`;

    await telegram.sendMessage(chatId, rulesMessage);
  } catch (error) {
    console.error('[handleRules] Error:', error);
    await telegram.sendMessage(chatId, '❌ 發生錯誤，請稍後再試。');
  }
}
