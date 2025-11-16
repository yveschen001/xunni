/**
 * Catch Bottle Handler
 * 
 * Handles /catch command - catch a random bottle.
 */

import type { Env, TelegramMessage } from '~/types';
import { createDatabaseClient } from '~/db/client';
import { createTelegramService } from '~/services/telegram';
import { findUserByTelegramId } from '~/db/queries/users';
import {
  findMatchingBottle,
  getDailyCatchCount,
  incrementDailyCatchCount,
  updateBottleStatus,
} from '~/db/queries/bottles';
import {
  createConversation,
  createBottleChatHistory,
} from '~/db/queries/conversations';
import {
  canCatchBottle,
  getBottleQuota,
} from '~/domain/bottle';
import { calculateAge } from '~/domain/user';
import { createI18n } from '~/i18n';

export async function handleCatch(message: TelegramMessage, env: Env): Promise<void> {
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
        '❌ 請先完成註冊流程才能撿漂流瓶。\n\n使用 /start 繼續註冊。'
      );
      return;
    }

    // Check if user is banned
    if (user.is_banned) {
      await telegram.sendMessage(
        chatId,
        '❌ 你的帳號已被封禁，無法撿漂流瓶。\n\n如有疑問，請使用 /appeal 申訴。'
      );
      return;
    }

    // Check daily quota
    const catchesToday = await getDailyCatchCount(db, telegramId);
    const inviteBonus = 0; // TODO: Calculate from invites table
    const isVip = !!(user.is_vip && user.vip_expire_at && new Date(user.vip_expire_at) > new Date());
    
    if (!canCatchBottle(catchesToday, isVip, inviteBonus)) {
      const { quota } = getBottleQuota(isVip, inviteBonus);
      await telegram.sendMessage(
        chatId,
        `❌ 今日漂流瓶配額已用完（${catchesToday}/${quota}）\n\n` +
          `💡 升級 VIP 可獲得更多配額：/vip`
      );
      return;
    }

    // Calculate user info for matching
    const userAge = user.birthday ? calculateAge(user.birthday) : 0;
    const userZodiac = user.zodiac_sign || '';
    const userMbti = user.mbti_result || '';

    // Find matching bottle
    const bottle = await findMatchingBottle(
      db,
      telegramId,
      user.gender || 'any',
      userAge,
      userZodiac,
      userMbti
    );

    if (!bottle) {
      await telegram.sendMessage(
        chatId,
        '😔 目前沒有適合你的漂流瓶\n\n' +
          '💡 提示：\n' +
          '• 稍後再試\n' +
          '• 或者自己丟一個瓶子：/throw'
      );
      return;
    }

    // Create conversation
    const conversationId = await createConversation(
      db,
      bottle.id,
      bottle.owner_telegram_id,
      telegramId
    );

    if (!conversationId) {
      await telegram.sendMessage(chatId, '❌ 建立對話失敗，請稍後再試。');
      return;
    }

    // Create bottle chat history
    await createBottleChatHistory(
      db,
      bottle.id,
      conversationId,
      bottle.owner_telegram_id,
      telegramId,
      bottle.content
    );

    // Update bottle status
    await updateBottleStatus(db, bottle.id, 'matched');

    // Increment daily count
    await incrementDailyCatchCount(db, telegramId);

    // Get updated quota info
    const newCatchesCount = catchesToday + 1;
    const { quota } = getBottleQuota(!!isVip, inviteBonus);

    // Translate bottle content if needed
    let bottleContent = bottle.content;
    let translationNote = '';
    
    const bottleLanguage = bottle.language || 'zh-TW';
    const catcherLanguage = user.language_pref || 'zh-TW';
    
    if (bottleLanguage !== catcherLanguage) {
      const { translateText } = await import('~/services/translation');
      const catcherIsVip = !!(user.is_vip && user.vip_expire_at && new Date(user.vip_expire_at) > new Date());
      
      try {
        const result = await translateText(
          bottle.content,
          catcherLanguage,
          bottleLanguage,
          catcherIsVip,
          env
        );
        
        bottleContent = result.text;
        
        if (result.fallback && catcherIsVip) {
          translationNote = '\n\n💬 翻譯服務暫時有問題，已使用備用翻譯';
        }
        
        if (result.error && result.text === bottle.content) {
          translationNote = '\n\n⚠️ 翻譯服務暫時無法使用，以下為原文';
        }
      } catch (error) {
        console.error('[handleCatch] Translation error:', error);
        translationNote = '\n\n⚠️ 翻譯服務暫時無法使用，以下為原文';
      }
    }

    // Send bottle content to catcher
    await telegram.sendMessage(
      chatId,
      `🍾 你撿到了一個漂流瓶！\n\n` +
        `━━━━━━━━━━━━━━━━\n` +
        `${bottleContent}${translationNote}\n` +
        `━━━━━━━━━━━━━━━━\n\n` +
        `💬 你可以直接回覆訊息開始聊天\n` +
        `📊 今日已撿：${newCatchesCount}/${quota}\n\n` +
        `⚠️ 安全提示：\n` +
        `• 這是匿名對話，請保護個人隱私\n` +
        `• 遇到不當內容請使用 /report 舉報\n` +
        `• 不想再聊可使用 /block 封鎖`
    );

    // Send notification to bottle owner
    await notifyBottleOwner(bottle.owner_telegram_id, env);
  } catch (error) {
    console.error('[handleCatch] Error:', error);
    console.error('[handleCatch] Error stack:', error instanceof Error ? error.stack : 'No stack');
    await telegram.sendMessage(
      chatId,
      `❌ 發生錯誤，請稍後再試。\n\n錯誤信息：${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Notify bottle owner that someone caught their bottle
 */
async function notifyBottleOwner(ownerId: string, env: Env): Promise<void> {
  const db = createDatabaseClient(env);
  const telegram = createTelegramService(env);

  try {
    // Get owner info
    const owner = await findUserByTelegramId(db, ownerId);
    if (!owner) {
      return;
    }

    const i18n = createI18n(owner.language_pref || 'zh-TW');

    // TODO: Check push preferences

    // Send notification
    await telegram.sendMessage(
      parseInt(ownerId),
      '🎉 有人撿到你的漂流瓶了！\n\n' +
        '已為你們建立了匿名對話，快來開始聊天吧～\n\n' +
        '💬 直接回覆訊息即可開始對話'
    );
  } catch (error) {
    console.error('[notifyBottleOwner] Error:', error);
    // Don't throw - notification failure shouldn't break the main flow
  }
}
