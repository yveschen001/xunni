/**
 * Profile Handler
 *
 * Handles /profile command - view and edit user profile.
 */

import type { Env, TelegramMessage } from '~/types';
import { createDatabaseClient } from '~/db/client';
import { createTelegramService } from '~/services/telegram';
import { findUserByTelegramId } from '~/db/queries/users';
import { calculateAge } from '~/domain/user';
import { getInviteStats } from '~/db/queries/invites';
import { calculateDailyQuota, getInviteLimit } from '~/domain/invite';

export async function handleProfile(message: TelegramMessage, env: Env): Promise<void> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const chatId = message.chat.id;
  const telegramId = message.from!.id.toString();

  try {
    // ✨ NEW: Update user activity (non-blocking)
    try {
      const { updateUserActivity } = await import('~/services/user_activity');
      await updateUserActivity(db, telegramId);
    } catch (activityError) {
      console.error('[handleProfile] Failed to update user activity:', activityError);
    }

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

    // Build profile message
    const age = user.birthday ? calculateAge(user.birthday) : '未設定';
    const gender = user.gender === 'male' ? '男' : user.gender === 'female' ? '女' : '未設定';
    const mbti = user.mbti_result || '未設定';
    const mbtiSource =
      user.mbti_source === 'manual' ? '手動輸入' : user.mbti_source === 'test' ? '測驗結果' : '';
    const zodiac = user.zodiac_sign || 'Virgo';
    const { getBloodTypeDisplay } = await import('~/domain/blood_type');
    const bloodType = getBloodTypeDisplay(user.blood_type as any);
    const vipStatus =
      user.is_vip && user.vip_expire_at && new Date(user.vip_expire_at) > new Date()
        ? `✨ VIP（到期：${new Date(user.vip_expire_at).toLocaleDateString('zh-TW')}）`
        : '一般用戶';
    const inviteCode = user.invite_code || '未設定';

    // Get invite statistics
    const inviteStats = await getInviteStats(db, telegramId);
    const permanentQuota = calculateDailyQuota(user);
    const inviteLimit = getInviteLimit(user);
    const successfulInvites = user.successful_invites || 0;
    
    // Calculate task bonus
    const { calculateTaskBonus } = await import('./tasks');
    const taskBonus = await calculateTaskBonus(db, telegramId);
    const totalQuota = permanentQuota + taskBonus;

    const profileMessage =
      `👤 **個人資料**\n\n` +
      `📛 暱稱：${user.nickname || '未設定'}\n` +
      `🎂 年齡：${age}\n` +
      `👤 性別：${gender}\n` +
      `🩸 血型：${bloodType}\n` +
      `🧠 MBTI：${mbti}${mbtiSource ? ` (${mbtiSource})` : ''}\n` +
      `⭐ 星座：${zodiac}\n` +
      `🌍 語言：${user.language_pref || 'zh-TW'}\n` +
      `💎 會員：${vipStatus}\n\n` +
      `━━━━━━━━━━━━━━━━\n\n` +
      `🎁 **邀請資訊**\n\n` +
      `📋 你的邀請碼：\`${inviteCode}\`\n` +
      `✅ 已激活邀請：${successfulInvites} / ${inviteLimit} 人\n` +
      `⏳ 待激活邀請：${inviteStats.pending} 人\n` +
      `📈 轉化率：${inviteStats.conversionRate}%\n` +
      `📦 當前每日配額：${taskBonus > 0 ? `${permanentQuota}+${taskBonus}` : permanentQuota} 個瓶子\n\n` +
      `💡 每成功邀請 1 人，每日配額永久 +1\n` +
      `💡 完成任務可獲得當日額外配額（使用 /tasks 查看）\n` +
      `${!user.is_vip && successfulInvites >= inviteLimit ? '⚠️ 已達免費用戶邀請上限，升級 VIP 可解鎖 100 人上限！' : ''}\n\n` +
      `━━━━━━━━━━━━━━━━\n\n` +
      `💡 提示：\n` +
      `• 使用 /profile_card 查看完整資料卡片\n` +
      `• 使用 /mbti 重新測驗或修改 MBTI\n` +
      `• 使用 /vip 升級 VIP 會員\n` +
      `• 使用 /stats 查看統計數據\n\n` +
      `🏠 返回主選單：/menu`;

    const botUsername = env.ENVIRONMENT === 'production' ? 'xunnibot' : 'xunni_dev_bot';
    const shareUrl = `https://t.me/share/url?url=https://t.me/${botUsername}?start=invite_${inviteCode}&text=來 XunNi 一起丟漂流瓶吧！🍾 使用我的邀請碼：${inviteCode}`;

    await telegram.sendMessageWithButtons(chatId, profileMessage, [
      [{ text: '📤 分享邀請碼', url: shareUrl }],
      [{ text: '✏️ 編輯資料', callback_data: 'edit_profile_menu' }],
    ]);
  } catch (error) {
    console.error('[handleProfile] Error:', error);
    await telegram.sendMessage(chatId, '❌ 發生錯誤，請稍後再試。');
  }
}

/**
 * Handle /profile_card command - show profile card
 */
export async function handleProfileCard(message: TelegramMessage, env: Env): Promise<void> {
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

    // Build profile card
    const age = user.birthday ? calculateAge(user.birthday) : '?';
    const gender = user.gender === 'male' ? '♂️ 男' : user.gender === 'female' ? '♀️ 女' : '?';
    const mbti = user.mbti_result || '未設定';
    const zodiac = user.zodiac_sign || 'Virgo';
    const interests = user.interests ? JSON.parse(user.interests as string).join(', ') : '未設定';
    const bio = user.bio || '這個人很神秘，什麼都沒有留下～';
    const city = user.city || '未設定';

    const cardMessage =
      `┌─────────────────────────┐\n` +
      `│   📇 個人資料卡片       │\n` +
      `└─────────────────────────┘\n\n` +
      `👤 ${user.nickname || '匿名用戶'}\n` +
      `${gender} • ${age} 歲 • ${city}\n\n` +
      `🧠 MBTI：${mbti}\n` +
      `⭐ 星座：${zodiac}\n` +
      `🌍 語言：${user.language_pref || 'zh-TW'}\n\n` +
      `🏷️ 興趣：${interests}\n\n` +
      `📝 簡介：\n${bio}\n\n` +
      `━━━━━━━━━━━━━━━━\n` +
      `💡 這是你在對話中展示給對方的資料卡片\n\n` +
      `🏠 返回主選單：/menu`;

    await telegram.sendMessage(chatId, cardMessage);
  } catch (error) {
    console.error('[handleProfileCard] Error:', error);
    await telegram.sendMessage(chatId, '❌ 發生錯誤，請稍後再試。');
  }
}
