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
  // createBottleChatHistory, // TODO: Re-enable when bottle_chat_history table is created
} from '~/db/queries/conversations';
import {
  canCatchBottle,
  getBottleQuota,
} from '~/domain/bottle';
import { calculateAge } from '~/domain/user';
import { maskNickname } from '~/domain/invite';

export async function handleCatch(message: TelegramMessage, env: Env): Promise<void> {
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
    const inviteBonus = user.successful_invites || 0;
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
    const userBloodType = user.blood_type || null;

    // Find matching bottle
    const bottle = await findMatchingBottle(
      db,
      telegramId,
      user.gender || 'any',
      userAge,
      userZodiac,
      userMbti,
      userBloodType
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

    const bottleOwner = await findUserByTelegramId(db, bottle.owner_telegram_id);
    const { maskNickname } = await import('~/domain/invite');
    const ownerMaskedNickname = maskNickname(
      bottleOwner?.nickname || bottleOwner?.username || '匿名'
    );
    
    // Get language display name
    const { getLanguageDisplay } = await import('~/i18n/languages');
    const ownerLanguage = bottleOwner?.language_pref 
      ? getLanguageDisplay(bottleOwner.language_pref)
      : '未設定';

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

    // Update bottle status
    await updateBottleStatus(db, bottle.id, 'matched');
    
    // Initialize conversation history for both users
    const { getOrCreateIdentifier } = await import('~/db/queries/conversation_identifiers');
    const { updateConversationHistory } = await import('~/services/conversation_history');
    
    const catcherIdentifier = await getOrCreateIdentifier(db, telegramId, bottle.owner_telegram_id, conversationId);
    const ownerIdentifier = await getOrCreateIdentifier(db, bottle.owner_telegram_id, telegramId, conversationId);
    
    const bottleTime = new Date(bottle.created_at);
    
    // Prepare partner info (use already masked nickname)
    const ownerPartnerInfo = {
      maskedNickname: ownerMaskedNickname,
      mbti: bottleOwner?.mbti_result || '未設定',
      bloodType: bottleOwner?.blood_type || '未設定',
      zodiac: bottleOwner?.zodiac_sign || '未設定'
    };
    
    const catcherNickname = user.nickname || user.username || '匿名用戶';
    const catcherPartnerInfo = {
      maskedNickname: maskNickname(catcherNickname),
      mbti: user.mbti_result || '未設定',
      bloodType: user.blood_type || '未設定',
      zodiac: user.zodiac_sign || '未設定'
    };
    
    // Initialize catcher's history (received the bottle message) - show owner's info
    await updateConversationHistory(
      db,
      env,
      conversationId,
      telegramId,
      catcherIdentifier,
      bottle.content,
      bottleTime,
      'received',
      ownerPartnerInfo
    );
    
    // Initialize owner's history (sent the bottle message) - show catcher's info
    await updateConversationHistory(
      db,
      env,
      conversationId,
      bottle.owner_telegram_id,
      ownerIdentifier,
      bottle.content,
      bottleTime,
      'sent',
      catcherPartnerInfo
    );

    // Increment daily count
    await incrementDailyCatchCount(db, telegramId);

    // Get updated quota info
    const newCatchesCount = catchesToday + 1;
    const { quota } = getBottleQuota(!!isVip, inviteBonus);

    // Translate bottle content if needed
    let bottleContent = bottle.content;
    let translationSection = '';
    
    const bottleLanguage = bottle.language || 'zh-TW';
    const catcherLanguage = user.language_pref || 'zh-TW';
    
    if (bottleLanguage !== catcherLanguage) {
      const { translateText } = await import('~/services/translation');
      const catcherIsVip = !!(user.is_vip && user.vip_expire_at && new Date(user.vip_expire_at) > new Date());
      
      // Get language display names
      const bottleLangDisplay = getLanguageDisplay(bottleLanguage);
      const catcherLangDisplay = getLanguageDisplay(catcherLanguage);
      
      try {
        const result = await translateText(
          bottle.content,
          catcherLanguage,
          bottleLanguage,
          catcherIsVip,
          env
        );
        
        bottleContent = result.text;
        translationSection =
          `原文語言：${bottleLangDisplay}\n` +
          `翻譯語言：${catcherLangDisplay}\n` +
          `原文：${bottle.content}\n` +
          `翻譯：${bottleContent}\n`;

        if (result.fallback && catcherIsVip) {
          translationSection += '💬 翻譯服務暫時有問題，已使用備援翻譯\n';
        }
        
        if (result.error && result.text === bottle.content) {
          translationSection += '⚠️ 翻譯服務暫時無法使用，以下為原文\n';
        }
      } catch (error) {
        console.error('[handleCatch] Translation error:', error);
        const bottleLangDisplay = getLanguageDisplay(bottleLanguage);
        const catcherLangDisplay = getLanguageDisplay(catcherLanguage);
        translationSection =
          `原文語言：${bottleLangDisplay}\n` +
          `翻譯語言：${catcherLangDisplay}\n` +
          `⚠️ 翻譯服務暫時無法使用，以下為原文\n`;
      }
    } else {
      // Same language, no translation needed - don't show any message
      translationSection = '';
    }
    await telegram.sendMessage(
      chatId,
      `🍾 你撿到了一個漂流瓶！\n\n` +
        `📝 暱稱：${ownerMaskedNickname}\n` +
        `🧠 MBTI：${bottle.mbti_result || '未設定'}\n` +
        `⭐ 星座：${bottle.zodiac || 'Virgo'}\n` +
        `🗣️ 語言：${ownerLanguage}\n\n` +
      `━━━━━━━━━━━━━━━━\n` +
        `${bottleContent}\n\n` +
        `${translationSection}` +
        `━━━━━━━━━━━━━━━━\n\n` +
        `💬 直接按 /reply 回覆訊息聊天\n` +
        `📊 今日已撿：${newCatchesCount}/${quota}\n\n` +
        `⚠️ 安全提示：\n` +
        `• 這是匿名對話，請保護個人隱私\n` +
        `• 遇到不當內容請使用 /report 舉報\n` +
        `• 不想再聊可使用 /block 封鎖\n\n` +
        `🏠 返回主選單：/menu`
    );

    // Send notification to bottle owner
    await notifyBottleOwner(bottle.owner_telegram_id, user, env);
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
async function notifyBottleOwner(ownerId: string, catcher: any, env: Env): Promise<void> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);

  try {
    // Get owner info
    const owner = await findUserByTelegramId(db, ownerId);
    if (!owner) {
      return;
    }

    // Format catcher info
    const catcherNickname = maskNickname(catcher.nickname || catcher.username || '匿名用戶');
    const catcherMBTI = catcher.mbti_result || '未設定';
    const catcherZodiac = catcher.zodiac_sign || 'Virgo';
    const catcherGender = catcher.gender === 'male' ? '♂️ 男' : catcher.gender === 'female' ? '♀️ 女' : '未設定';
    const catcherAge = catcher.birthday ? calculateAge(catcher.birthday) : '未知';

    // TODO: Check push preferences

    // Send notification
    await telegram.sendMessage(
      parseInt(ownerId),
      `🎉 有人撿到你的漂流瓶了！\n\n` +
        `📝 暱稱：${catcherNickname}\n` +
        `🧠 MBTI：${catcherMBTI}\n` +
        `⭐ 星座：${catcherZodiac}\n` +
        `${catcherGender} | 📅 ${catcherAge}歲\n\n` +
        `已為你們建立了匿名對話，快來開始聊天吧～\n\n` +
        `💬 直接回覆訊息即可開始對話`
    );
  } catch (error) {
    console.error('[notifyBottleOwner] Error:', error);
    // Don't throw - notification failure shouldn't break the main flow
  }
}
