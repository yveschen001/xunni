/**
 * /throw Handler
 * Based on @doc/SPEC.md
 *
 * Handles throwing bottles (creating new bottles).
 */

import type { Env, TelegramMessage, User } from '~/types';
import { createDatabaseClient } from '~/db/client';
import { findUserByTelegramId } from '~/db/queries/users';
import { createBottle } from '~/db/queries/bottles';
import { getOrCreateDailyUsage, incrementThrowsCount } from '~/db/queries/daily_usage';
import { canUseBottleFeatures, isVIP } from '~/domain/user';
import { canThrowBottle, getDailyThrowLimit, getTodayDate } from '~/domain/usage';
import {
  validateBottleContent,
  calculateBottleExpiration,
} from '~/domain/bottle';
import { createTelegramService } from '~/services/telegram';

// ============================================================================
// /throw Handler
// ============================================================================

export async function handleThrow(message: TelegramMessage, env: Env): Promise<void> {
  const db = createDatabaseClient(env);
  const telegram = createTelegramService(env);
  const chatId = message.chat.id;
  const telegramId = message.from!.id.toString();

  try {
    // Get user
    const user = await findUserByTelegramId(db, telegramId);
    if (!user) {
      await telegram.sendMessage(chatId, '❌ 請先使用 /start 註冊');
      return;
    }

    // Check if user can use bottle features
    if (!canUseBottleFeatures(user)) {
      if (user.is_banned) {
        await telegram.sendMessage(
          chatId,
          '🚫 你的帳號已被封禁，無法使用此功能。\n\n' + '如有疑問，請使用 /appeal 申訴。'
        );
        return;
      }

      await telegram.sendMessage(
        chatId,
        '❌ 請先完成註冊流程。\n\n' + '使用 /start 繼續完成註冊。'
      );
      return;
    }

    // Check daily limit
    const today = getTodayDate();
    const usage = await getOrCreateDailyUsage(db, telegramId, today);

    if (!canThrowBottle(user, usage)) {
      const limit = getDailyThrowLimit(user);
      await telegram.sendMessage(
        chatId,
        `🚫 今日丟瓶次數已達上限（${usage.throws_count}/${limit}）\n\n` +
          `${
            isVIP(user)
              ? '💡 邀請好友可以增加每日上限（最高 100 個）'
              : '💡 升級 VIP 可以獲得更多丟瓶次數！\n使用 /vip 了解更多'
          }`
      );
      return;
    }

    // Show bottle creation UI
    await showBottleCreationUI(user, chatId, telegram);
  } catch (error) {
    console.error('[handleThrow] Error:', error);
    await telegram.sendMessage(chatId, '❌ 發生錯誤，請稍後再試。');
  }
}

// ============================================================================
// Bottle Creation UI
// ============================================================================

async function showBottleCreationUI(
  user: User,
  chatId: number,
  telegram: ReturnType<typeof createTelegramService>
): Promise<void> {
  const isVip = isVIP(user);

  let message = `🌊 丟出漂流瓶\n\n`;
  message += `請輸入瓶子內容（最多 500 字）：\n\n`;

  if (isVip) {
    message += `💎 VIP 功能：\n`;
    message += `• 可以設定目標性別\n`;
    message += `• 可以設定目標年齡範圍\n`;
    message += `• 可以設定目標星座\n`;
    message += `• 可以設定目標 MBTI\n\n`;
  } else {
    message += `💡 提示：\n`;
    message += `• 免費用戶只能設定目標性別\n`;
    message += `• 升級 VIP 可以使用更多篩選條件\n\n`;
  }

  message += `📝 範例：\n`;
  message += `「嗨！我是一個喜歡旅行和攝影的人，希望認識志同道合的朋友～」`;

  await telegram.sendMessage(chatId, message);
}

// ============================================================================
// Process Bottle Content
// ============================================================================

export async function processBottleContent(
  user: User,
  content: string,
  env: Env,
  chatId: number
): Promise<void> {
  const telegram = createTelegramService(env);

  try {
    // Validate content
    const validation = validateBottleContent(content);
    if (!validation.valid) {
      await telegram.sendMessage(chatId, `❌ ${validation.error}`);
      return;
    }

    // Show filter selection UI
    if (isVIP(user)) {
      await showVIPFilterUI(user, content, chatId, telegram);
    } else {
      await showFreeFilterUI(user, content, chatId, telegram);
    }
  } catch (error) {
    console.error('[processBottleContent] Error:', error);
    await telegram.sendMessage(chatId, '❌ 發生錯誤，請稍後再試。');
  }
}

// ============================================================================
// Filter Selection UI
// ============================================================================

async function showFreeFilterUI(
  user: User,
  content: string,
  chatId: number,
  telegram: ReturnType<typeof createTelegramService>
): Promise<void> {
  await telegram.sendMessageWithButtons(
    chatId,
    `🎯 選擇目標性別：\n\n` + `瓶子內容：「${content.substring(0, 50)}${content.length > 50 ? '...' : ''}」`,
    [
      [
        { text: '👨 男性', callback_data: `bottle_gender_male` },
        { text: '👩 女性', callback_data: `bottle_gender_female` },
      ],
      [{ text: '🌐 不限', callback_data: `bottle_gender_any` }],
    ]
  );
}

async function showVIPFilterUI(
  user: User,
  content: string,
  chatId: number,
  telegram: ReturnType<typeof createTelegramService>
): Promise<void> {
  await telegram.sendMessageWithButtons(
    chatId,
    `💎 VIP 篩選設定\n\n` +
      `瓶子內容：「${content.substring(0, 50)}${content.length > 50 ? '...' : ''}」\n\n` +
      `請選擇要設定的篩選條件：`,
    [
      [{ text: '👥 目標性別', callback_data: `bottle_filter_gender` }],
      [{ text: '🎂 目標年齡', callback_data: `bottle_filter_age` }],
      [{ text: '♈ 目標星座', callback_data: `bottle_filter_zodiac` }],
      [{ text: '🧠 目標 MBTI', callback_data: `bottle_filter_mbti` }],
      [{ text: '✅ 完成並丟出', callback_data: `bottle_confirm` }],
    ]
  );
}

// ============================================================================
// Create and Throw Bottle
// ============================================================================

export async function createAndThrowBottle(
  user: User,
  content: string,
  filters: {
    target_gender?: string;
    target_min_age?: number;
    target_max_age?: number;
    target_zodiac_filter?: string[];
    target_mbti_filter?: string[];
  },
  env: Env,
  chatId: number
): Promise<void> {
  const db = createDatabaseClient(env);
  const telegram = createTelegramService(env);
  const telegramId = user.telegram_id;

  try {
    // Create bottle
    const bottle = await createBottle(db, {
      owner_telegram_id: telegramId,
      content,
      target_gender: filters.target_gender,
      target_min_age: filters.target_min_age,
      target_max_age: filters.target_max_age,
      target_zodiac_filter: filters.target_zodiac_filter
        ? JSON.stringify(filters.target_zodiac_filter)
        : undefined,
      target_mbti_filter: filters.target_mbti_filter
        ? JSON.stringify(filters.target_mbti_filter)
        : undefined,
      require_anti_fraud: true,
      expires_at: calculateBottleExpiration(),
    });

    // Increment usage count
    const today = getTodayDate();
    await incrementThrowsCount(db, telegramId, today);

    // Send success message
    await telegram.sendMessage(
      chatId,
      `🌊 漂流瓶已丟出！\n\n` +
        `瓶子 ID：#${bottle.id}\n` +
        `內容：「${content.substring(0, 50)}${content.length > 50 ? '...' : ''}」\n` +
        `有效期限：24 小時\n\n` +
        `💡 提示：\n` +
        `• 瓶子將在 24 小時內被其他使用者撿起\n` +
        `• 如果有人撿到，我們會通知你\n` +
        `• 使用 /stats 查看你的瓶子狀態`
    );
  } catch (error) {
    console.error('[createAndThrowBottle] Error:', error);
    await telegram.sendMessage(chatId, '❌ 丟瓶失敗，請稍後再試。');
  }
}

