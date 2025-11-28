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
import { canCatchBottle, getBottleQuota } from '~/domain/bottle';
import { calculateAge } from '~/domain/user';
import { maskNickname } from '~/domain/invite';

export async function handleCatch(message: TelegramMessage, env: Env): Promise<void> {
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
      console.error('[handleCatch] Failed to update user activity:', activityError);
    }

    // Get user
    const user = await findUserByTelegramId(db, telegramId);
    
    // Get i18n
    const { createI18n } = await import('~/i18n');
    const i18n = createI18n(user?.language_pref || 'zh-TW');
    
    if (!user) {
      await telegram.sendMessage(chatId, i18n.t('errors.userNotFound'));
      return;
    }

    // Check if user completed onboarding
    if (user.onboarding_step !== 'completed') {
      await telegram.sendMessage(
        chatId,
        i18n.t('catch.notRegistered')
      );
      return;
    }

    // Check if user is banned
    if (user.is_banned) {
      await telegram.sendMessage(
        chatId,
        i18n.t('catch.banned')
      );
      return;
    }

    // Check daily quota
    const catchesToday = await getDailyCatchCount(db, telegramId);
    const inviteBonus = user.successful_invites || 0;
    const isVip = !!(
      user.is_vip &&
      user.vip_expire_at &&
      new Date(user.vip_expire_at) > new Date()
    );

    // Calculate task bonus
    const { calculateTaskBonus } = await import('./tasks');
    const taskBonus = await calculateTaskBonus(db, telegramId);

    // Get ad reward info
    const { getTodayAdReward } = await import('~/db/queries/ad_rewards');
    const adReward = await getTodayAdReward(db.d1, telegramId);
    const adBonus = adReward?.quota_earned || 0;

    if (!canCatchBottle(catchesToday, isVip, inviteBonus, taskBonus, adBonus)) {
      // Calculate permanent quota (base + invite)
      const baseQuota = isVip ? 30 : 3;
      const maxQuota = isVip ? 100 : 10;
      const permanentQuota = Math.min(baseQuota + inviteBonus, maxQuota);

      // Calculate temporary bonus (task + ad)
      const temporaryBonus = taskBonus + adBonus;

      // Format quota display
      const quotaDisplay =
        temporaryBonus > 0
          ? `${catchesToday}/${permanentQuota}+${temporaryBonus}`
          : `${catchesToday}/${permanentQuota}`;

      // Get smart buttons based on ad/task availability
      if (!isVip) {
        const { getNextIncompleteTask } = await import('./tasks');
        const { getQuotaExhaustedMessage, getQuotaExhaustedButtons } = await import(
          '~/domain/ad_prompt'
        );

        const nextTask = await getNextIncompleteTask(db, user);

        const context = {
          user,
          ads_watched_today: adReward?.ads_watched || 0,
          has_incomplete_tasks: !!nextTask,
          next_task_name: nextTask?.name,
          next_task_id: nextTask?.id,
        };

        const quotaMessage = getQuotaExhaustedMessage(quotaDisplay, context, i18n);
        const buttons = getQuotaExhaustedButtons(context, i18n);

        if (buttons.length > 0) {
          await telegram.sendMessageWithButtons(chatId, quotaMessage, buttons);
        } else {
          await telegram.sendMessage(chatId, quotaMessage);
        }
      } else {
        await telegram.sendMessage(
          chatId,
          i18n.t('catch.quotaExhausted', { quotaDisplay }) + '\n\n' + i18n.t('catch.bottle5')
        );
      }
      return;
    }

    // Calculate user info for matching
    const userAge = user.birthday ? calculateAge(user.birthday) : 0;
    const userZodiac = user.zodiac_sign || '';
    const userMbti = user.mbti_result || '';
    const userBloodType = user.blood_type || null;

    // ✨ NEW: Try smart matching first (non-breaking, falls back to existing logic)
    let bottle: any = null;
    let matchScore: number | null = null;
    let matchType: 'smart' | 'random' = 'random';

    try {
      const { findSmartBottleForUser } = await import('~/services/smart_matching');
      const smartMatch = await findSmartBottleForUser(db.d1, telegramId);

      if (smartMatch && smartMatch.bottle) {
        bottle = smartMatch.bottle;
        matchScore = smartMatch.score.total;
        matchType = smartMatch.matchType;

        console.log(
          `[Smart Matching] User ${telegramId} got ${matchType} match with score ${matchScore}`
        );
      }
    } catch (smartMatchError) {
      console.error('[Smart Matching] Error, falling back to random:', smartMatchError);
    }

    // Fallback to existing random matching if smart matching didn't find anything
    if (!bottle) {
      bottle = await findMatchingBottle(
        db,
        telegramId,
        user.gender || 'any',
        userAge,
        userZodiac,
        userMbti,
        userBloodType
      );
    }

    if (!bottle) {
      await telegram.sendMessage(
        chatId,
        i18n.t('catch.bottle') + '\n' + i18n.t('catch.bottle2')
      );
      return;
    }

    const bottleOwner = await findUserByTelegramId(db, bottle.owner_telegram_id);
    const { maskNickname } = await import('~/domain/invite');
    const ownerMaskedNickname = maskNickname(
      bottleOwner?.nickname || bottleOwner?.username || i18n.t('catch.short3')
    );

    // Get language display name
    const { getLanguageDisplay } = await import('~/i18n/languages');
    const ownerLanguage = bottleOwner?.language_pref
      ? getLanguageDisplay(bottleOwner.language_pref)
      : i18n.t('profile.settings');

    // Create conversation
    const conversationId = await createConversation(
      db,
      bottle.id,
      bottle.owner_telegram_id,
      telegramId
    );

    if (!conversationId) {
      await telegram.sendMessage(chatId, i18n.t('catch.conversationError'));
      return;
    }

    // 🆕 Handle VIP triple bottle slots
    if (bottle.is_vip_triple) {
      const { getFirstAvailableSlot, updateSlotMatched, getRemainingSlots } = await import(
        '~/db/queries/bottle_match_slots'
      );

      // 找到第一個可用槽位
      const availableSlot = await getFirstAvailableSlot(db, bottle.id);

      if (!availableSlot) {
        // 所有槽位都已配對
        await telegram.sendMessage(chatId, i18n.t('error.bottle3'));
        return;
      }

      // 更新槽位狀態
      await updateSlotMatched(db, availableSlot.id, telegramId, conversationId);
      console.error(
        `[handleCatch] VIP triple bottle slot matched: bottle=${bottle.id}, slot=${availableSlot.id}`
      );

      // 檢查是否所有槽位都已配對
      const remainingSlots = await getRemainingSlots(db, bottle.id);
      if (remainingSlots === 0) {
        // 所有槽位都已配對，更新瓶子狀態
        await updateBottleStatus(db, bottle.id, 'matched');
        console.error(`[handleCatch] All slots matched for bottle ${bottle.id}`);
      } else {
        console.error(`[handleCatch] ${remainingSlots} slots remaining for bottle ${bottle.id}`);
      }
    } else {
      // 普通瓶子（現有邏輯）
      await updateBottleStatus(db, bottle.id, 'matched');
    }

    // Initialize conversation history for both users
    const { getOrCreateIdentifier } = await import('~/db/queries/conversation_identifiers');
    const { updateConversationHistory } = await import('~/services/conversation_history');

    const catcherIdentifier = await getOrCreateIdentifier(
      db,
      telegramId,
      bottle.owner_telegram_id,
      conversationId
    );
    const ownerIdentifier = await getOrCreateIdentifier(
      db,
      bottle.owner_telegram_id,
      telegramId,
      conversationId
    );

    const bottleTime = new Date(bottle.created_at);

    // Prepare partner info (use already masked nickname)
    const ownerPartnerInfo = {
      partnerTelegramId: bottle.owner_telegram_id,
      maskedNickname: ownerMaskedNickname,
      mbti: bottleOwner?.mbti_result || i18n.t('catch.settings10'),
      bloodType: bottleOwner?.blood_type || i18n.t('catch.settings10'),
      zodiac: bottleOwner?.zodiac_sign || 'Virgo',
      matchScore: matchScore || undefined,
    };

    const catcherNickname = user.nickname || user.username || i18n.t('catch.short3');
    const { formatNicknameWithFlag } = await import('~/utils/country_flag');
    const catcherPartnerInfo = {
      partnerTelegramId: telegramId,
      maskedNickname: formatNicknameWithFlag(maskNickname(catcherNickname), user.country_code),
      mbti: user.mbti_result || i18n.t('catch.settings10'),
      bloodType: user.blood_type || i18n.t('catch.settings10'),
      zodiac: user.zodiac_sign || 'Virgo',
      matchScore: matchScore || undefined,
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

    // Check and complete "first catch" task
    try {
      const { checkAndCompleteTask } = await import('./tasks');
      const catchCount = await db.d1
        .prepare(
          `SELECT COUNT(*) as count FROM bottles WHERE matched_with_telegram_id = ? AND status = 'matched'`
        )
        .bind(telegramId)
        .first<{ count: number }>();
      await checkAndCompleteTask(db, telegram, user, 'task_first_catch', {
        catchCount: catchCount?.count || 0,
      });
    } catch (taskError) {
      console.error('[handleCatch] Task check error:', taskError);
    }

    // Get updated quota info
    const newCatchesCount = catchesToday + 1;
    const { quota } = getBottleQuota(!!isVip, inviteBonus, taskBonus, adBonus);

    // Translate bottle content if needed
    let bottleContent = bottle.content;
    let translationSection = '';

    const bottleLanguage = bottle.language || 'zh-TW';
    const catcherLanguage = user.language_pref || 'zh-TW';

    if (bottleLanguage !== catcherLanguage) {
      const { translateText } = await import('~/services/translation');
      const catcherIsVip = !!(
        user.is_vip &&
        user.vip_expire_at &&
        new Date(user.vip_expire_at) > new Date()
      );

      // Get language display names
      const bottleLangDisplay = getLanguageDisplay(bottleLanguage);
      const catcherLangDisplay = getLanguageDisplay(catcherLanguage);

      try {
        const result = await translateText(
          bottle.content,
          catcherLanguage,
          bottleLanguage,
          catcherIsVip,
          env,
          telegramId // Pass userId for logging
        );

        bottleContent = result.text;
        translationSection =
          i18n.t('catch.originalLanguage', { language: bottleLangDisplay }) + '\n' +
          i18n.t('catch.translatedLanguage', { language: catcherLangDisplay }) + '\n' +
          i18n.t('catch.originalContent', { content: bottle.content }) + '\n' +
          i18n.t('catch.translatedContent', { content: bottleContent }) + '\n';

        if (result.fallback && catcherIsVip) {
          translationSection += i18n.t('catch.translationServiceFallback') + '\n';
        }

        if (result.error && result.text === bottle.content) {
          translationSection += i18n.t('catch.translationServiceUnavailable') + '\n';
        }
      } catch (error) {
        console.error('[handleCatch] Translation error:', error);
        const bottleLangDisplay = getLanguageDisplay(bottleLanguage);
        const catcherLangDisplay = getLanguageDisplay(catcherLanguage);
        translationSection =
          i18n.t('catch.originalLanguage', { language: bottleLangDisplay }) + '\n' +
          i18n.t('catch.translatedLanguage', { language: catcherLangDisplay }) + '\n' +
          i18n.t('catch.translationServiceUnavailable') + '\n';
      }
    } else {
      // Same language, no translation needed - don't show any message
      translationSection = '';
    }
    // ✨ NEW: Add smart matching score if applicable (will be used in catchMessage)
    // const matchScoreSection = ''; // Moved to catchMessage construction

    // Get conversation identifier for reply button
    // First find the conversation
    const conversationInfo = await db.d1
      .prepare(
        `SELECT c.id, c.user_a_telegram_id, c.user_b_telegram_id
         FROM conversations c
         WHERE (c.user_a_telegram_id = ? OR c.user_b_telegram_id = ?)
         AND c.status = 'active'
         ORDER BY c.created_at DESC
         LIMIT 1`
      )
      .bind(user.telegram_id, user.telegram_id)
      .first<{ id: number; user_a_telegram_id: string; user_b_telegram_id: string }>();

    let conversationIdentifier: string | undefined;
    if (conversationInfo) {
      // Get partner_telegram_id
      const partnerId =
        conversationInfo.user_a_telegram_id === user.telegram_id
          ? conversationInfo.user_b_telegram_id
          : conversationInfo.user_a_telegram_id;

      // Get identifier from conversation_identifiers
      const identifierResult = await db.d1
        .prepare(
          `SELECT identifier 
           FROM conversation_identifiers 
           WHERE user_telegram_id = ? AND partner_telegram_id = ?`
        )
        .bind(user.telegram_id, partnerId)
        .first<{ identifier: string }>();

      conversationIdentifier = identifierResult?.identifier;
    }

    // Build message
    const matchScoreText = matchScore && matchType === 'smart'
      ? i18n.t('catch.message', { score: Math.round(matchScore) }) + '\n'
      : '';
    
    const catchMessage =
      i18n.t('catch.bottle4') + '\n\n' +
      matchScoreText +
      i18n.t('catch.nickname', { ownerMaskedNickname }) + '\n' +
      i18n.t('catch.settings', { mbti: bottle.mbti_result || i18n.t('catch.settings10') }) + '\n' +
      i18n.t('catch.zodiac', { zodiac: bottle.zodiac || 'Virgo' }) +
      i18n.t('catch.language', { language: ownerLanguage }) + '\n\n' +
      '━━━━━━━━━━━━━━━━\n' +
      `${bottleContent}\n\n` +
      `${translationSection}` +
      '━━━━━━━━━━━━━━━━\n\n' +
      i18n.t('catch.replyMethods') + '\n' +
      i18n.t('catch.message5') + '\n' +
      i18n.t('catch.message4') + '\n\n' +
      i18n.t('catch.catch', { newCatchesCount, quota }) + '\n' +
      i18n.t('catch.safetyTips') + '\n' +
      i18n.t('catch.conversation2') + '\n' +
      i18n.t('catch.report') + '\n' +
      i18n.t('catch.block') + '\n\n' +
      i18n.t('catch.back');

    // Build buttons based on VIP status
    if (!isVip) {
      // Non-VIP: Reply button + Ad/Task button
      const { getNextIncompleteTask } = await import('./tasks');
      const { getAdPrompt } = await import('~/domain/ad_prompt');

      const nextTask = await getNextIncompleteTask(db, user);

      const prompt = getAdPrompt(
        {
          user,
          ads_watched_today: adReward?.ads_watched || 0,
          has_incomplete_tasks: !!nextTask,
          next_task_name: nextTask?.name,
          next_task_id: nextTask?.id,
        },
        i18n
      );

      const buttons = [];

      // Always add reply button if conversation identifier exists
      if (conversationIdentifier) {
        buttons.push([
          { text: i18n.t('catch.replyButton'), callback_data: `conv_reply_${conversationIdentifier}` },
        ]);
      }

      // Add ad/task button if available
      if (prompt.show_button) {
        buttons.push([{ text: prompt.button_text, callback_data: prompt.button_callback }]);
      }

      if (buttons.length > 0) {
        await telegram.sendMessageWithButtons(chatId, catchMessage, buttons);
      } else {
        await telegram.sendMessage(chatId, catchMessage);
      }
    } else {
      // VIP: Reply button + View all chats button
      if (conversationIdentifier) {
        await telegram.sendMessageWithButtons(chatId, catchMessage, [
          [{ text: i18n.t('catch.replyButton'), callback_data: `conv_reply_${conversationIdentifier}` }],
          [{ text: i18n.t('catch.conversation3'), callback_data: 'chats' }],
        ]);
      } else {
        await telegram.sendMessage(chatId, catchMessage);
      }
    }

    // Send notification to bottle owner
    await notifyBottleOwner(bottle.owner_telegram_id, user, env);
  } catch (error) {
    console.error('[handleCatch] Error:', error);
    console.error('[handleCatch] Error stack:', error instanceof Error ? error.stack : 'No stack');
    await telegram.sendMessage(
      chatId,
      i18n.t('errors.systemErrorRetry')
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

    // Get owner's i18n
    const { createI18n } = await import('~/i18n');
    const ownerI18n = createI18n(owner?.language_pref || 'zh-TW');
    
    // Format catcher info
    const catcherNickname = maskNickname(catcher.nickname || catcher.username || ownerI18n.t('catch.anonymousUser'));
    const catcherMBTI = catcher.mbti_result || ownerI18n.t('catch.settings10');
    const catcherZodiac = catcher.zodiac_sign || 'Virgo';
    const catcherGender =
      catcher.gender === 'male' ? ownerI18n.t('catch.short4') : catcher.gender === 'female' ? ownerI18n.t('catch.short5') : ownerI18n.t('catch.settings10');
    const catcherAge = catcher.birthday ? calculateAge(catcher.birthday) : ownerI18n.t('catch.unknown');

    // Get conversation identifier for this conversation
    // First find the conversation
    const conversationInfo = await db.d1
      .prepare(
        `SELECT c.id, c.user_a_telegram_id, c.user_b_telegram_id
         FROM conversations c
         WHERE (c.user_a_telegram_id = ? OR c.user_b_telegram_id = ?)
         AND c.status = 'active'
         ORDER BY c.created_at DESC
         LIMIT 1`
      )
      .bind(ownerId, ownerId)
      .first<{ id: number; user_a_telegram_id: string; user_b_telegram_id: string }>();

    let conversationIdentifier: string | undefined;
    if (conversationInfo) {
      // Get partner_telegram_id (catcher)
      const partnerId =
        conversationInfo.user_a_telegram_id === ownerId
          ? conversationInfo.user_b_telegram_id
          : conversationInfo.user_a_telegram_id;

      // Get identifier from conversation_identifiers
      const identifierResult = await db.d1
        .prepare(
          `SELECT identifier 
           FROM conversation_identifiers 
           WHERE user_telegram_id = ? AND partner_telegram_id = ?`
        )
        .bind(ownerId, partnerId)
        .first<{ identifier: string }>();

      conversationIdentifier = identifierResult?.identifier;
    }

    const notificationMessage =
      ownerI18n.t('catch.bottle3') + '\n\n' +
      ownerI18n.t('catch.nickname2', { catcherNickname }) + '\n' +
      ownerI18n.t('catch.mbti', { mbti: catcherMBTI }) + '\n' +
      i18n.t('catch.zodiac', { zodiac: catcherZodiac }) +
      ownerI18n.t('catch.message2', { catcherGender, catcherAge }) + '\n\n' +
      ownerI18n.t('catch.conversation') + '\n\n' +
      ownerI18n.t('catch.replyMethods') + '\n' +
      ownerI18n.t('catch.message5') + '\n' +
      ownerI18n.t('catch.message4');

    // Send notification with button if identifier exists
    if (conversationIdentifier) {
      await telegram.sendMessageWithButtons(parseInt(ownerId), notificationMessage, [
        [{ text: ownerI18n.t('catch.replyButton'), callback_data: `conv_reply_${conversationIdentifier}` }],
        [{ text: ownerI18n.t('catch.conversation3'), callback_data: 'chats' }],
      ]);
    } else {
      // Fallback: send without button if identifier not found
      await telegram.sendMessage(parseInt(ownerId), notificationMessage);
    }
  } catch (error) {
    console.error('[notifyBottleOwner] Error:', error);
    // Don't throw - notification failure shouldn't break the main flow
  }
}
