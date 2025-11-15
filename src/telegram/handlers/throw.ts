/**
 * Throw Bottle Handler
 * 
 * Handles /throw command - create and throw a bottle.
 */

import type { Env, TelegramMessage, User } from '~/types';
import { createDatabaseClient } from '~/db/client';
import { createTelegramService } from '~/services/telegram';
import { findUserByTelegramId } from '~/db/queries/users';
import {
  createBottle,
  getDailyThrowCount,
  incrementDailyThrowCount,
} from '~/db/queries/bottles';
import {
  validateBottleContent,
  canThrowBottle,
  getBottleQuota,
} from '~/domain/bottle';
import type { ThrowBottleInput } from '~/domain/bottle';
import { createI18n } from '~/i18n';

export async function handleThrow(message: TelegramMessage, env: Env): Promise<void> {
  const db = createDatabaseClient(env);
  const telegram = createTelegramService(env);
  const chatId = message.chat.id;
  const telegramId = message.from!.id.toString();

  try {
    console.log('[handleThrow] Starting for user:', telegramId);
    
    // Get user
    const user = await findUserByTelegramId(db, telegramId);
    if (!user) {
      await telegram.sendMessage(chatId, '❌ 用戶不存在，請先使用 /start 註冊。');
      return;
    }

    console.log('[handleThrow] User found:', user.nickname);
    const i18n = createI18n(user.language_pref || 'zh-TW');

    // Check if user completed onboarding
    if (user.onboarding_step !== 'completed') {
      await telegram.sendMessage(
        chatId,
        '❌ 請先完成註冊流程才能丟漂流瓶。\n\n使用 /start 繼續註冊。'
      );
      return;
    }

    // Check if user is banned
    if (user.is_banned) {
      await telegram.sendMessage(
        chatId,
        '❌ 你的帳號已被封禁，無法丟漂流瓶。\n\n如有疑問，請使用 /appeal 申訴。'
      );
      return;
    }

    // Check daily quota
    const throwsToday = await getDailyThrowCount(db, telegramId);
    const inviteBonus = 0; // TODO: Calculate from invites table
    const isVip = !!(user.is_vip && user.vip_expire_at && new Date(user.vip_expire_at) > new Date());
    
    if (!canThrowBottle(throwsToday, isVip, inviteBonus)) {
      const { quota } = getBottleQuota(isVip, inviteBonus);
      await telegram.sendMessage(
        chatId,
        `❌ 今日漂流瓶配額已用完（${throwsToday}/${quota}）\n\n` +
          `💡 升級 VIP 可獲得更多配額：/vip`
      );
      return;
    }

    // Show bottle creation UI
    await showBottleCreationUI(user, chatId, telegram);
  } catch (error) {
    console.error('[handleThrow] Error:', error);
    console.error('[handleThrow] Error stack:', error instanceof Error ? error.stack : 'No stack');
    await telegram.sendMessage(
      chatId, 
      `❌ 發生錯誤，請稍後再試。\n\n錯誤信息：${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Show bottle creation UI
 */
async function showBottleCreationUI(
  user: User,
  chatId: number,
  telegram: ReturnType<typeof createTelegramService>
): Promise<void> {
  const i18n = createI18n(user.language_pref || 'zh-TW');
  const isVip = !!(user.is_vip && user.vip_expire_at && new Date(user.vip_expire_at) > new Date());

  if (isVip) {
    // VIP: Show advanced options
    await telegram.sendMessageWithButtons(
      chatId,
      '🍾 丟漂流瓶\n\n' +
        '你想要尋找什麼樣的聊天對象？',
      [
        [
          { text: '👨 男生', callback_data: 'throw_target_male' },
          { text: '👩 女生', callback_data: 'throw_target_female' },
        ],
        [
          { text: '🌈 任何人都可以', callback_data: 'throw_target_any' },
        ],
        [
          { text: '⚙️ 進階篩選（MBTI/星座）', callback_data: 'throw_advanced' },
        ],
      ]
    );
  } else {
    // Free user: Simple gender selection
    await telegram.sendMessageWithButtons(
      chatId,
      '🍾 丟漂流瓶\n\n' +
        '你想要尋找什麼樣的聊天對象？\n\n' +
        '💡 升級 VIP 可使用進階篩選（MBTI/星座）：/vip',
      [
        [
          { text: '👨 男生', callback_data: 'throw_target_male' },
          { text: '👩 女生', callback_data: 'throw_target_female' },
        ],
        [
          { text: '🌈 任何人都可以', callback_data: 'throw_target_any' },
        ],
      ]
    );
  }
}

/**
 * Handle target gender selection
 */
export async function handleThrowTargetGender(
  callbackQuery: any,
  gender: 'male' | 'female' | 'any',
  env: Env
): Promise<void> {
  const db = createDatabaseClient(env);
  const telegram = createTelegramService(env);
  const chatId = callbackQuery.message!.chat.id;
  const telegramId = callbackQuery.from.id.toString();

  try {
    // Get user
    const user = await findUserByTelegramId(db, telegramId);
    if (!user) {
      await telegram.answerCallbackQuery(callbackQuery.id, '❌ 用戶不存在');
      return;
    }

    // Answer callback
    await telegram.answerCallbackQuery(callbackQuery.id, '✅ 已選擇');

    // Delete selection message
    await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);

    // Store target gender in user's session (using a simple approach)
    // In production, you'd use KV or a session table
    // For now, we'll ask for content directly
    
    await telegram.sendMessage(
      chatId,
      '📝 請輸入你的漂流瓶內容：\n\n' +
        '💡 提示：\n' +
        '• 只能使用文字和官方 Emoji\n' +
        '• 最多 500 字\n' +
        '• 不要包含個人聯絡方式\n' +
        '• 友善、尊重的內容更容易被撿到哦～'
    );

    // TODO: Store target_gender in session
    // For now, we'll handle it in the message handler
  } catch (error) {
    console.error('[handleThrowTargetGender] Error:', error);
    await telegram.answerCallbackQuery(callbackQuery.id, '❌ 發生錯誤');
  }
}

/**
 * Process bottle content (called from message handler)
 */
export async function processBottleContent(
  user: User,
  content: string,
  env: Env
): Promise<void> {
  const db = createDatabaseClient(env);
  const telegram = createTelegramService(env);
  const chatId = parseInt(user.telegram_id);

  try {
    // Validate content
    const validation = validateBottleContent(content);
    if (!validation.valid) {
      await telegram.sendMessage(
        chatId,
        `❌ ${validation.error}\n\n請重新輸入瓶子內容。`
      );
      return;
    }

    // TODO: Get target_gender from session
    // For now, use 'any' as default
    const bottleInput: ThrowBottleInput = {
      content,
      target_gender: 'any',
      language: user.language_pref,
    };

    // Create bottle
    const bottleId = await createBottle(db, user.telegram_id, bottleInput);

    // Increment daily count
    await incrementDailyThrowCount(db, user.telegram_id);

    // Get updated quota info
    const throwsToday = await getDailyThrowCount(db, user.telegram_id);
    const inviteBonus = 0; // TODO: Calculate from invites
    const isVip = !!(user.is_vip && user.vip_expire_at && new Date(user.vip_expire_at) > new Date());
    const { quota } = getBottleQuota(isVip, inviteBonus);

    // Send success message
    await telegram.sendMessage(
      chatId,
      `🎉 漂流瓶已丟出！\n\n` +
        `瓶子 ID：#${bottleId}\n` +
        `今日已丟：${throwsToday}/${quota}\n\n` +
        `💡 你的瓶子將在 24 小時內等待有緣人撿起～\n\n` +
        `想要撿別人的瓶子嗎？使用 /catch`
    );
  } catch (error) {
    console.error('[processBottleContent] Error:', error);
    await telegram.sendMessage(chatId, '❌ 發生錯誤，請稍後再試。');
  }
}
