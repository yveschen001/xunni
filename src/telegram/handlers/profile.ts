/**
 * Profile Handler
 * 
 * Handles /profile command - view and edit user profile.
 */

import type { Env, TelegramMessage } from '~/types';
import { createDatabaseClient } from '~/db/client';
import { createTelegramService } from '~/services/telegram';
import { findUserByTelegramId } from '~/db/queries/users';
import { createI18n } from '~/i18n';
import { calculateAge } from '~/domain/user';

export async function handleProfile(message: TelegramMessage, env: Env): Promise<void> {
  const db = createDatabaseClient(env);
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

    const i18n = createI18n(user.language_pref || 'zh-TW');

    // Check if user completed onboarding
    if (user.onboarding_step !== 'completed') {
      await telegram.sendMessage(
        chatId,
        '❌ 請先完成註冊流程。\n\n使用 /start 繼續註冊。'
      );
      return;
    }

    // Build profile message
    const age = user.birthday ? calculateAge(user.birthday) : '未設定';
    const gender = user.gender === 'male' ? '男' : user.gender === 'female' ? '女' : '未設定';
    const mbti = user.mbti_result || '未設定';
    const mbtiSource = user.mbti_source === 'manual' ? '手動輸入' : user.mbti_source === 'test' ? '測驗結果' : '';
    const zodiac = user.zodiac_sign || '未設定';
    const vipStatus = user.is_vip && user.vip_expire_at && new Date(user.vip_expire_at) > new Date()
      ? `✨ VIP（到期：${new Date(user.vip_expire_at).toLocaleDateString('zh-TW')}）`
      : '一般用戶';
    const inviteCode = user.invite_code || '未設定';

    const profileMessage = 
      `👤 **個人資料**\n\n` +
      `📛 暱稱：${user.nickname || '未設定'}\n` +
      `🎂 年齡：${age}\n` +
      `👤 性別：${gender}\n` +
      `🧠 MBTI：${mbti}${mbtiSource ? ` (${mbtiSource})` : ''}\n` +
      `⭐ 星座：${zodiac}\n` +
      `🌍 語言：${user.language_pref || 'zh-TW'}\n` +
      `💎 會員：${vipStatus}\n` +
      `🎁 邀請碼：\`${inviteCode}\`\n\n` +
      `━━━━━━━━━━━━━━━━\n\n` +
      `💡 提示：\n` +
      `• 使用 /profile_card 查看完整資料卡片\n` +
      `• 使用 /mbti 重新測驗或修改 MBTI\n` +
      `• 使用 /vip 升級 VIP 會員\n` +
      `• 使用 /stats 查看統計數據`;

    await telegram.sendMessage(chatId, profileMessage);
  } catch (error) {
    console.error('[handleProfile] Error:', error);
    await telegram.sendMessage(chatId, '❌ 發生錯誤，請稍後再試。');
  }
}

/**
 * Handle /profile_card command - show profile card
 */
export async function handleProfileCard(message: TelegramMessage, env: Env): Promise<void> {
  const db = createDatabaseClient(env);
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
      await telegram.sendMessage(
        chatId,
        '❌ 請先完成註冊流程。\n\n使用 /start 繼續註冊。'
      );
      return;
    }

    // Build profile card
    const age = user.birthday ? calculateAge(user.birthday) : '?';
    const gender = user.gender === 'male' ? '♂️ 男' : user.gender === 'female' ? '♀️ 女' : '?';
    const mbti = user.mbti_result || '未設定';
    const zodiac = user.zodiac_sign || '未設定';
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
      `💡 這是你在對話中展示給對方的資料卡片`;

    await telegram.sendMessage(chatId, cardMessage);
  } catch (error) {
    console.error('[handleProfileCard] Error:', error);
    await telegram.sendMessage(chatId, '❌ 發生錯誤，請稍後再試。');
  }
}

