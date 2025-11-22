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
      const quotaDisplay = temporaryBonus > 0 
        ? `${catchesToday}/${permanentQuota}+${temporaryBonus}`
        : `${catchesToday}/${permanentQuota}`;

      // Get smart buttons based on ad/task availability
      if (!isVip) {
        const { getNextIncompleteTask } = await import('./tasks');
        const { getQuotaExhaustedMessage, getQuotaExhaustedButtons } = await import('~/domain/ad_prompt');

        const nextTask = await getNextIncompleteTask(db, user);

        const context = {
          user,
          ads_watched_today: adReward?.ads_watched || 0,
          has_incomplete_tasks: !!nextTask,
          next_task_name: nextTask?.name,
          next_task_id: nextTask?.id,
        };

        const quotaMessage = getQuotaExhaustedMessage(quotaDisplay, context);
        const buttons = getQuotaExhaustedButtons(context);

        if (buttons.length > 0) {
          await telegram.sendMessageWithButtons(chatId, quotaMessage, buttons);
        } else {
          await telegram.sendMessage(chatId, quotaMessage);
        }
      } else {
        await telegram.sendMessage(
          chatId,
          `❌ 今日漂流瓶配額已用完（${quotaDisplay}）\n\n` +
            `💡 明天再來撿更多瓶子吧！`
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
        
        console.log(`[Smart Matching] User ${telegramId} got ${matchType} match with score ${matchScore}`);
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

    // 🆕 Handle VIP triple bottle slots
    if (bottle.is_vip_triple) {
      const {
        getFirstAvailableSlot,
        updateSlotMatched,
        getRemainingSlots,
      } = await import('~/db/queries/bottle_match_slots');

      // 找到第一個可用槽位
      const availableSlot = await getFirstAvailableSlot(db, bottle.id);

      if (!availableSlot) {
        // 所有槽位都已配對
        await telegram.sendMessage(chatId, '❌ 這個瓶子已經被其他人撿走了，請試試其他瓶子！');
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
      mbti: bottleOwner?.mbti_result || '未設定',
      bloodType: bottleOwner?.blood_type || '未設定',
      zodiac: bottleOwner?.zodiac_sign || '未設定',
      matchScore: matchScore || undefined,
    };

    const catcherNickname = user.nickname || user.username || '匿名用戶';
    const { formatNicknameWithFlag } = await import('~/utils/country_flag');
    const catcherPartnerInfo = {
      partnerTelegramId: telegramId,
      maskedNickname: formatNicknameWithFlag(
        maskNickname(catcherNickname),
        user.country_code
      ),
      mbti: user.mbti_result || '未設定',
      bloodType: user.blood_type || '未設定',
      zodiac: user.zodiac_sign || '未設定',
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
        .prepare(`SELECT COUNT(*) as count FROM bottles WHERE matched_with_telegram_id = ? AND status = 'matched'`)
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
    // ✨ NEW: Add smart matching score if applicable
    const matchScoreSection = matchScore && matchType === 'smart'
      ? `💫 配對度：${Math.round(matchScore)}分 (智能配對)\n\n`
      : '';
    
    // Get conversation identifier for reply button
    const conversation = await db.d1
      .prepare(
        `SELECT c.id, ci.identifier 
         FROM conversations c
         LEFT JOIN conversation_identifiers ci ON ci.conversation_id = c.id AND ci.user_telegram_id = ?
         WHERE (c.user1_telegram_id = ? OR c.user2_telegram_id = ?)
         AND c.status = 'active'
         ORDER BY c.created_at DESC
         LIMIT 1`
      )
      .bind(user.telegram_id, user.telegram_id, user.telegram_id)
      .first<{ id: number; identifier: string }>();

    const conversationIdentifier = conversation?.identifier;

    // Build message
    const catchMessage =
      `🧴 你撿到了一個漂流瓶！\n\n` +
      matchScoreSection +
      `📝 暱稱：${ownerMaskedNickname}\n` +
      `🧠 MBTI：${bottle.mbti_result || '未設定'}\n` +
      `⭐ 星座：${bottle.zodiac || 'Virgo'}\n` +
      `🗣️ 語言：${ownerLanguage}\n\n` +
      `━━━━━━━━━━━━━━━━\n` +
      `${bottleContent}\n\n` +
      `${translationSection}` +
      `━━━━━━━━━━━━━━━━\n\n` +
      `💡 **兩種回覆方式**：\n` +
      `1️⃣ 點擊下方「💬 回覆訊息」按鈕\n` +
      `2️⃣ 長按此訊息，選擇「回覆」後輸入內容\n\n` +
      `📊 今日已撿：${newCatchesCount}/${quota}\n\n` +
      `⚠️ 安全提示：\n` +
      `• 這是匿名對話，請保護個人隱私\n` +
      `• 遇到不當內容請使用 /report 舉報\n` +
      `• 不想再聊可使用 /block 封鎖\n\n` +
      `🏠 返回主選單：/menu`;

    // Build buttons based on VIP status
    if (!isVip) {
      // Non-VIP: Reply button + Ad/Task button
      const { getNextIncompleteTask } = await import('./tasks');
      const { getAdPrompt } = await import('~/domain/ad_prompt');

      const nextTask = await getNextIncompleteTask(db, user);

      const prompt = getAdPrompt({
        user,
        ads_watched_today: adReward?.ads_watched || 0,
        has_incomplete_tasks: !!nextTask,
        next_task_name: nextTask?.name,
        next_task_id: nextTask?.id,
      });

      const buttons = [];
      
      // Always add reply button if conversation identifier exists
      if (conversationIdentifier) {
        buttons.push([{ text: '💬 回覆訊息', callback_data: `conv_reply_${conversationIdentifier}` }]);
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
          [{ text: '💬 回覆訊息', callback_data: `conv_reply_${conversationIdentifier}` }],
          [{ text: '📊 查看所有對話', callback_data: 'chats' }],
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
    const catcherGender =
      catcher.gender === 'male' ? '♂️ 男' : catcher.gender === 'female' ? '♀️ 女' : '未設定';
    const catcherAge = catcher.birthday ? calculateAge(catcher.birthday) : '未知';

    // Get conversation identifier for this conversation
    const conversation = await db.d1
      .prepare(
        `SELECT c.id, ci.identifier 
         FROM conversations c
         LEFT JOIN conversation_identifiers ci ON ci.conversation_id = c.id AND ci.user_telegram_id = ?
         WHERE (c.user1_telegram_id = ? OR c.user2_telegram_id = ?)
         AND c.status = 'active'
         ORDER BY c.created_at DESC
         LIMIT 1`
      )
      .bind(ownerId, ownerId, ownerId)
      .first<{ id: number; identifier: string }>();

    const conversationIdentifier = conversation?.identifier;

    const notificationMessage =
      `🎣 有人撿到你的漂流瓶了！\n\n` +
      `📝 暱稱：${catcherNickname}\n` +
      `🧠 MBTI：${catcherMBTI}\n` +
      `⭐ 星座：${catcherZodiac}\n` +
      `${catcherGender} | 📅 ${catcherAge}歲\n\n` +
      `已為你們建立了匿名對話，快來開始聊天吧～\n\n` +
      `💡 **兩種回覆方式**：\n` +
      `1️⃣ 點擊下方「💬 回覆訊息」按鈕\n` +
      `2️⃣ 長按此訊息，選擇「回覆」後輸入內容`;

    // Send notification with button if identifier exists
    if (conversationIdentifier) {
      await telegram.sendMessageWithButtons(
        parseInt(ownerId),
        notificationMessage,
        [
          [{ text: '💬 回覆訊息', callback_data: `conv_reply_${conversationIdentifier}` }],
          [{ text: '📊 查看所有對話', callback_data: 'chats' }],
        ]
      );
    } else {
      // Fallback: send without button if identifier not found
      await telegram.sendMessage(parseInt(ownerId), notificationMessage);
    }
  } catch (error) {
    console.error('[notifyBottleOwner] Error:', error);
    // Don't throw - notification failure shouldn't break the main flow
  }
}
