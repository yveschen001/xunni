/**
 * Throw Bottle Handler
 *
 * Handles /throw command - create and throw a bottle.
 */

import type { Env, TelegramMessage, TelegramCallbackQuery, User } from '~/types';
import { createDatabaseClient } from '~/db/client';
import { createTelegramService } from '~/services/telegram';
import { findUserByTelegramId } from '~/db/queries/users';
import { createBottle, getDailyThrowCount, incrementDailyThrowCount } from '~/db/queries/bottles';
import { validateBottleContent, canThrowBottle } from '~/domain/bottle';
import type { ThrowBottleInput } from '~/domain/bottle';
import { canActivateInvite } from '~/domain/invite';
import {
  isInviteActivated,
  activateInvite,
  incrementSuccessfulInvites,
} from '~/db/queries/invites';

/**
 * Get target gender based on user's preference
 * Default: opposite gender (for heterosexual users)
 */
function getTargetGender(user: User): 'male' | 'female' | 'any' {
  // If user has explicitly set a preference, use it
  if (user.match_preference) {
    return user.match_preference as 'male' | 'female' | 'any';
  }

  // Default: opposite gender
  if (user.gender === 'male') {
    return 'female';
  } else if (user.gender === 'female') {
    return 'male';
  }

  // Fallback
  return 'any';
}

export async function handleThrow(message: TelegramMessage, env: Env): Promise<void> {
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
      console.error('[handleThrow] Failed to update user activity:', activityError);
    }

    console.error('[handleThrow] Starting for user:', telegramId);

    // Get user
    const user = await findUserByTelegramId(db, telegramId);
    if (!user) {
      // Fallback for unknown user language
      const { createI18n } = await import('~/i18n');
      const i18n = createI18n('zh-TW');
      await telegram.sendMessage(chatId, i18n.t('common.userNotFound'));
      return;
    }

    const { createI18n } = await import('~/i18n');
    const i18n = createI18n(user.language_pref || 'zh-TW');

    console.error('[handleThrow] User found:', user.nickname);

    // Check if user completed onboarding
    if (user.onboarding_step !== 'completed') {
      await telegram.sendMessage(chatId, i18n.t('common.notRegistered'));
      return;
    }

    // Check if user is banned
    if (user.is_banned) {
      await telegram.sendMessage(
        chatId,
        i18n.t('errors.banned', { reason: i18n.t('errors.generic') }) // Generic reason if not available
      );
      return;
    }

    // Check daily quota
    const throwsToday = await getDailyThrowCount(db, telegramId);
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

    if (!canThrowBottle(throwsToday, isVip, inviteBonus, taskBonus, adBonus)) {
      // Calculate permanent quota (base + invite)
      const baseQuota = isVip ? 30 : 3;
      const maxQuota = isVip ? 100 : 10;
      const permanentQuota = Math.min(baseQuota + inviteBonus, maxQuota);

      // Calculate temporary bonus (task + ad)
      const temporaryBonus = taskBonus + adBonus;

      // Format quota display
      const quotaDisplay =
        temporaryBonus > 0
          ? `${throwsToday}/${permanentQuota}+${temporaryBonus}`
          : `${throwsToday}/${permanentQuota}`;

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
        // 🆕 更新配額用完提示
        await telegram.sendMessage(
          chatId,
          i18n.t('error.quota', { quotaDisplay }) +
            '\n\n' +
            i18n.t('throw.text15') +
            '\n' +
            i18n.t('throw.vip') +
            '\n\n' +
            i18n.t('throw.quota2') +
            '\n' +
            i18n.t('throw.text12') +
            '\n' +
            i18n.t('throw.vip4') +
            '\n\n' +
            i18n.t('throw.vip6') +
            '\n' +
            i18n.t('throw.text2') +
            '\n' +
            i18n.t('throw.quota') +
            '\n' +
            i18n.t('throw.text17') +
            '\n\n' +
            i18n.t('throw.text19')
        );
      }
      return;
    }

    // Check for existing draft
    const { getDraft } = await import('~/db/queries/drafts');
    const { getDraftPreview, formatDraftAge } = await import('~/domain/draft');
    const draft = await getDraft(db, telegramId);

    if (draft) {
      // Show draft recovery option
      const preview = getDraftPreview(draft.content);
      const age = formatDraftAge(draft, user.language_pref || 'zh-TW');

      await telegram.sendMessageWithButtons(
        chatId,
        i18n.t('throw.complete3') +
          '\n\n' +
          i18n.t('throw.text18', { age }) +
          '\n' +
          i18n.t('throw.text9', { preview }) +
          '\n\n' +
          i18n.t('throw.text22'),
        [
          [
            { text: i18n.t('success.short14'), callback_data: 'draft_continue' },
            { text: i18n.t('edit_profile.short19'), callback_data: 'draft_delete' },
          ],
          [{ text: i18n.t('throw.start'), callback_data: 'draft_new' }],
        ]
      );
      return;
    }

    // Determine target gender based on user's preference
    const targetGender = getTargetGender(user);

    // Create session to store target gender and track user state
    const { upsertSession } = await import('~/db/queries/sessions');
    await upsertSession(db, telegramId, 'throw_bottle', {
      target_gender: targetGender,
    });

    console.error('[handleThrow] Created throw_bottle session:', {
      userId: telegramId,
      targetGender,
    });

    // Show prompt with #THROW tag for reply detection
    const targetText =
      targetGender === 'male'
        ? i18n.t('common.male')
        : targetGender === 'female'
          ? i18n.t('common.female')
          : i18n.t('throw.short3');
    const throwPrompt =
      i18n.t('throw.bottle4') +
      '\n\n' +
      i18n.t('throw.text5', { targetText }) +
      '\n' +
      i18n.t('throw.message7') +
      '\n\n' +
      i18n.t('throw.bottle6') +
        '\n\n' +
        i18n.t('common.text112') +
          '\n' +
          i18n.t('common.text93') +
          '\n' +
          i18n.t('common.text77') +
          '\n' +
          i18n.t('throw.text13') +
          '\n\n' +
          i18n.t('throw.text20') +
          '\n' +
          i18n.t('throw.message6') +
          '\n\n' +
          i18n.t('throw.text14') +
          '\n' +
          i18n.t('throw.bottle7') +
          '\n' +
          i18n.t('catch.message4');

    await telegram.sendMessageWithButtons(
      chatId,
      throwPrompt,
      [
        [{ text: i18n.t('buttons.bottle3'), callback_data: 'throw_input' }],
        [{ text: i18n.t('buttons.back'), callback_data: 'return_to_menu' }],
      ],
      { parse_mode: 'Markdown' }
    );
  } catch (error) {
    console.error('[handleThrow] Error:', error);
    const errorStack = error instanceof Error ? error.stack : 'No stack';
    console.error('[handleThrow] Error stack:', errorStack);

    // Fallback i18n if user not found yet
    const { createI18n } = await import('~/i18n');
    const i18n = createI18n('zh-TW'); // Default to TW if we crashed before user load

    await telegram.sendMessage(
      chatId,
      i18n.t('errors.generic') +
        `\n\nError: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Handle "丟漂流瓶" button click - use ForceReply to prompt user input
 */
export async function handleThrowInputButton(
  callbackQuery: TelegramCallbackQuery,
  env: Env
): Promise<void> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const chatId = callbackQuery.message!.chat.id;
  const telegramId = callbackQuery.from.id.toString();

  try {
    // Get user
    const user = await findUserByTelegramId(db, telegramId);
    if (!user) {
      const { createI18n } = await import('~/i18n');
      const i18n = createI18n('zh-TW');
      await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('error.userNotFound4'));
      return;
    }

    // Check if user has active throw_bottle session
    const { getActiveSession } = await import('~/db/queries/sessions');
    const session = await getActiveSession(db, telegramId, 'throw_bottle');

    if (!session) {
      const { createI18n } = await import('~/i18n');
      const i18n = createI18n(user.language_pref || 'zh-TW');
      await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('warning.start'));
      return;
    }

    // Answer callback query first
    const { createI18n } = await import('~/i18n');
    const i18n = createI18n(user.language_pref || 'zh-TW');
    await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('common.text100'));

    // Send a message with ForceReply to prompt user input
    const response = await fetch(
      `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: i18n.t('throw.bottle8'),
          reply_markup: {
            force_reply: true,
            selective: true,
          },
        }),
      }
    );

    if (!response.ok) {
      console.error(
        '[handleThrowInputButton] Failed to send ForceReply message:',
        await response.text()
      );
    }
  } catch (error) {
    console.error('[handleThrowInputButton] Error:', error);
    const { createI18n } = await import('~/i18n');
    const errorI18n = createI18n('zh-TW');
    await telegram.answerCallbackQuery(callbackQuery.id, errorI18n.t('errors.systemErrorRetry'));
  }
}

/**
 * Process bottle content (called from message handler)
 */
export async function processBottleContent(user: User, content: string, env: Env): Promise<void> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const chatId = parseInt(user.telegram_id);
  let statusMsg: { message_id: number } | null = null;

  const { createI18n } = await import('~/i18n');
  const i18n = createI18n(user.language_pref || 'zh-TW');

  try {
    // Step 1: Basic validation (length, links, sensitive words)
    const validation = validateBottleContent(content);
    if (!validation.valid) {
      // Record risk score if validation failed due to inappropriate content
      if (validation.riskScore && validation.riskScore > 0) {
        await recordRiskScore(db, user.telegram_id, validation.riskScore);
      }

      // 🎨 UX: 友善的錯誤提示
      // 优先使用 errorCode（i18n），如果没有则使用 error（向后兼容）
      const errorMessage = validation.errorCode
        ? i18n.t(validation.errorCode, validation.errorParams || {})
        : validation.error || i18n.t('errors.unknownError');
      await telegram.sendMessage(chatId, errorMessage);
      return;
    }

    // Step 2: AI moderation (optional, controlled by environment variable)
    if (env.ENABLE_AI_MODERATION === 'true') {
      try {
        const { createOpenAIService } = await import('~/services/openai');
        const openai = createOpenAIService(env);

        const aiResult = await openai.moderateContent(content);

        if (aiResult.flagged) {
          // AI detected inappropriate content
          const riskScore = 20; // AI detection risk score
          await recordRiskScore(db, user.telegram_id, riskScore);

          await telegram.sendMessage(chatId, i18n.t('bottle.throw.aiModerationFailed'));
          return;
        }
      } catch (aiError) {
        // AI moderation failed, don't block (avoid false positives)
        console.error('[AI Moderation] Error:', aiError);
      }
    }

    // Step 3: URL whitelist check (backup check, should be caught by validateBottleContent)
    const { checkUrlWhitelist } = await import('~/utils/url-whitelist');
    const urlCheck = checkUrlWhitelist(content);
    if (!urlCheck.allowed) {
      await telegram.sendMessage(
        chatId,
        i18n.t('bottle.throw.urlNotAllowed', {
          urls: urlCheck.blockedUrls?.map((url) => `• ${url}`).join('\n'),
        })
      );
      return;
    }

    // Get filter settings from session (if any)
    const { getActiveSession } = await import('~/db/queries/sessions');
    const { parseSessionData } = await import('~/domain/session');
    const session = await getActiveSession(db, user.telegram_id, 'throw_bottle');

    let target_gender: 'male' | 'female' | 'any' = 'any';
    let target_mbti_filter: string[] = [];
    let target_zodiac_filter: string[] = [];
    let target_blood_type_filter: string | null = null;

    if (session) {
      const sessionData = parseSessionData(session);
      target_gender = sessionData.data?.target_gender || 'any';
      target_mbti_filter = sessionData.data?.target_mbti || [];
      target_zodiac_filter = sessionData.data?.target_zodiac || [];
      target_blood_type_filter = sessionData.data?.target_blood_type || null;
    }

    const bottleInput: ThrowBottleInput = {
      content,
      target_gender,
      target_mbti_filter: target_mbti_filter.length > 0 ? target_mbti_filter : undefined,
      target_zodiac_filter: target_zodiac_filter.length > 0 ? target_zodiac_filter : undefined,
      target_blood_type_filter:
        target_blood_type_filter && target_blood_type_filter !== 'any'
          ? target_blood_type_filter
          : null,
      language: user.language_pref,
    };

    // 🆕 Check if user is VIP
    const isVip = !!(
      user.is_vip &&
      user.vip_expire_at &&
      new Date(user.vip_expire_at) > new Date()
    );

    // 🎨 UX: 階段 1 - 立即反饋（< 1 秒）
    const startTime = Date.now();
    try {
      statusMsg = await telegram.sendMessage(
        chatId,
        isVip
          ? i18n.t('throw.bottle3') + '\n\n' +
              i18n.t('throw.vip7') + '\n' +
              i18n.t('throw.text6') + '\n\n' +
              i18n.t('throw.complete4')
          : i18n.t('throw.bottle3') + '\n\n' +
              i18n.t('throw.text10') + '\n\n' +
              i18n.t('throw.complete5')
      );
    } catch (sendError) {
      console.error('[handleThrow] Failed to send initial progress message:', sendError);
      // 如果發送失敗，設為 null，後續會跳過進度更新
      statusMsg = null;
    }

    // 🆕 Create bottle (VIP triple or regular)
    let bottleId: number;
    let vipMatchInfo: {
      matched: boolean;
      conversationId?: number;
      conversationIdentifier?: string;
      matcherNickname?: string;
    } | null = null;
    if (isVip) {
      // VIP 用戶：創建三倍瓶子
      const { createVipTripleBottle } = await import('~/domain/vip_triple_bottle');
      const result = await createVipTripleBottle(db, user, bottleInput, env);
      bottleId = result.bottleId;
      vipMatchInfo = result.primaryMatch;
      console.error(
        '[handleThrow] VIP triple bottle created:',
        bottleId,
        'Primary match:',
        vipMatchInfo.matched
      );
    } else {
      // 免費用戶：創建普通瓶子
      bottleId = await createBottle(db, user.telegram_id, bottleInput, false);
      console.error('[handleThrow] Regular bottle created:', bottleId);
    }

    // 🎨 UX: 階段 2 - 創建瓶子完成（約 2 秒後）
    const elapsed1 = Date.now() - startTime;
    if (elapsed1 < 2000) {
      await new Promise((resolve) => setTimeout(resolve, 2000 - elapsed1));
    }
    if (statusMsg && statusMsg.message_id) {
      try {
        await telegram.editMessageText(
          chatId,
          statusMsg.message_id,
          isVip
            ? i18n.t('throw.bottle3') + '\n\n' +
        i18n.t('throw.bottle10') + '\n' +
          i18n.t('throw.vip7') + '\n' +
                i18n.t('throw.text6') + '\n\n' +
                i18n.t('throw.complete5')
            : i18n.t('throw.bottle3') + '\n\n' +
                i18n.t('success.bottle3') + '\n' +
                i18n.t('throw.text10') + '\n\n' +
                i18n.t('throw.complete6')
        );
      } catch (editError) {
        // 如果編輯失敗（訊息被刪除等），忽略錯誤，繼續執行
        console.error('[handleThrow] Failed to update progress (stage 2):', editError);
      }
    }

    // Increment daily count
    await incrementDailyThrowCount(db, user.telegram_id);

    // ✨ NEW: Try smart matching (non-blocking, won't affect existing flow)
    // 🆕 Skip smart matching for VIP triple bottles (already handled in createVipTripleBottle)
    if (!isVip) {
      // 🎨 UX: 階段 3 - 智能匹配進行中（約 4 秒後）
      const elapsed2 = Date.now() - startTime;
      if (elapsed2 < 4000) {
        await new Promise((resolve) => setTimeout(resolve, 4000 - elapsed2));
      }
      if (statusMsg && statusMsg.message_id) {
        try {
          await telegram.editMessageText(
            chatId,
            statusMsg.message_id,
            i18n.t('throw.bottle3') + '\n\n' +
          i18n.t('success.bottle3') + '\n' +
              i18n.t('throw.text8') + '\n\n' +
              i18n.t('throw.text3')
          );
        } catch (editError) {
          console.error('[handleThrow] Failed to update progress (stage 3):', editError);
        }
      }

      try {
        const { findActiveMatchForBottle } = await import('~/services/smart_matching');
        const matchResult = await findActiveMatchForBottle(db.d1, bottleId);

        if (matchResult && matchResult.user) {
          // Found a match! Update bottle status and send notification
          await db.d1
            .prepare(`UPDATE bottles SET match_status = 'matched' WHERE id = ?`)
            .bind(bottleId)
            .run();

          // Record matching history
          await db.d1
            .prepare(
              `
            INSERT INTO matching_history 
            (bottle_id, matched_user_id, match_score, score_breakdown, match_type)
            VALUES (?, ?, ?, ?, ?)
          `
            )
            .bind(
              bottleId,
              matchResult.user.telegram_id,
              matchResult.score.total,
              JSON.stringify(matchResult.score),
              'active'
            )
            .run();

          // Send notification to matched user (一對一配對，直接推送)
          const matchedChatId = parseInt(matchResult.user.telegram_id);

          // 獲取擾碼暱稱
          const { maskNickname } = await import('~/domain/invite');
          const ownerMaskedNickname = maskNickname(user.nickname || user.username || i18n.t('conversation.short2'));

          // 計算匹配度百分比
          const matchPercentage = Math.min(100, Math.round(matchResult.score.total));

          // 構建匹配亮點
          const highlights: string[] = [];
          if (matchResult.score.language >= 85) highlights.push(i18n.t('throw.short'));
          if (matchResult.score.mbti >= 80) highlights.push(i18n.t('throw.mbti6'));
          if (matchResult.score.zodiac >= 80) highlights.push(i18n.t('throw.zodiac6'));
          if (matchResult.score.ageRange >= 70) highlights.push(i18n.t('throw.age'));

          const highlightsText =
            highlights.length > 0
              ? '\n' + i18n.t('throw.bottle') + '\n' + highlights.join('\n') + '\n'
              : '';

          // 獲取瓶子內容前 12 字作為預覽
          const contentPreview = content.length > 12 ? content.substring(0, 12) + '...' : content;

          // 發送通知給接收者
          await telegram.sendMessage(
            matchedChatId,
            `🍾 ${contentPreview} 📨🌊\n\n` +
              i18n.t('throw.nickname', { matchedUserMaskedNickname: ownerMaskedNickname }) + '\n' +
              i18n.t('throw.settings3', { mbti: user.mbti_result }) +
              '\n' +
              i18n.t('throw.settings4', { zodiac: user.zodiac_sign }) +
              '\n' +
              i18n.t('throw.text', { matchPercentage }) +
              '\n' +
              highlightsText +
              '\n━━━━━━━━━━━━━━━━\n' +
              `${content}\n` +
              '━━━━━━━━━━━━━━━━\n\n' +
              i18n.t('throw.message8') +
              '\n' +
              i18n.t('throw.conversation5')
          );

          // 發送通知給丟瓶子的人
          const matchedUserMaskedNickname = maskNickname(
            matchResult.user.nickname || matchResult.user.username || i18n.t('catch.anonymousUser')
          );
          await telegram.sendMessage(
            chatId,
            i18n.t('throw.success3') +
              '\n\n' +
              i18n.t('throw.nickname', { matchedUserMaskedNickname }) +
              '\n' +
              i18n.t('throw.settings', { mbti: matchResult.user.mbti_result || i18n.t('common.notSet') }) +
              '\n' +
              i18n.t('throw.settings2', { zodiac: matchResult.user.zodiac || i18n.t('common.notSet') }) +
              '\n' +
              i18n.t('throw.text', { matchPercentage }) +
              '\n' +
              highlightsText +
              '\n' + i18n.t('throw.text11') + '\n' + i18n.t('throw.conversation6')
          );

          console.log(
            `[Smart Matching] Bottle ${bottleId} matched to user ${matchResult.user.telegram_id} with score ${matchResult.score.total}`
          );
        } else {
          // No match found, bottle enters public pool
          await db.d1
            .prepare(`UPDATE bottles SET match_status = 'active' WHERE id = ?`)
            .bind(bottleId)
            .run();

          console.log(
            `[Smart Matching] Bottle ${bottleId} enters public pool (no active match found)`
          );
        }
      } catch (matchError) {
        console.error('[Smart Matching] Error:', matchError);
        // Fallback: bottle enters public pool
        await db.d1
          .prepare(`UPDATE bottles SET match_status = 'active' WHERE id = ?`)
          .bind(bottleId)
          .run();
      }
    } // End of if (!isVip)

    // Check and complete "first bottle" task
    try {
      const { checkAndCompleteTask } = await import('./tasks');
      const bottleCount = await db.d1
        .prepare(`SELECT COUNT(*) as count FROM bottles WHERE owner_telegram_id = ?`)
        .bind(user.telegram_id)
        .first<{ count: number }>();
      await checkAndCompleteTask(db, telegram, user, 'task_first_bottle', {
        bottleCount: bottleCount?.count || 0,
      });
    } catch (taskError) {
      console.error('[handleThrow] Task check error:', taskError);
    }

    // Check and activate invite (first bottle thrown)
    const hasThrown = true; // User just threw a bottle
    if (canActivateInvite(user, hasThrown)) {
      const alreadyActivated = await isInviteActivated(db, user.telegram_id);

      if (!alreadyActivated) {
        // Activate invite
        await activateInvite(db, user.telegram_id);
        await incrementSuccessfulInvites(db, user.invited_by!);

        // Send notification (will be implemented in next step)
        const { handleInviteActivation } = await import('./invite_activation');
        await handleInviteActivation(db, telegram, user);
      }
    }

    // Get updated quota info
    const throwsToday = await getDailyThrowCount(db, user.telegram_id);
    const inviteBonus = user.successful_invites || 0;
    // isVip already declared above
    const { calculateTaskBonus } = await import('./tasks');
    const taskBonus = await calculateTaskBonus(db, user.telegram_id);

    // Get ad reward info
    const { getTodayAdReward } = await import('~/db/queries/ad_rewards');
    const adRewardInfo = await getTodayAdReward(db.d1, user.telegram_id);
    const adBonus = adRewardInfo?.quota_earned || 0;

    // Calculate permanent quota (base + invite)
    const baseQuota = isVip ? 30 : 3;
    const maxQuota = isVip ? 100 : 10;
    const permanentQuota = Math.min(baseQuota + inviteBonus, maxQuota);

    // Calculate temporary bonus (task + ad)
    const temporaryBonus = taskBonus + adBonus;

    // Format quota display
    const quotaDisplay =
      temporaryBonus > 0
        ? `${throwsToday}/${permanentQuota}+${temporaryBonus}`
        : `${throwsToday}/${permanentQuota}`;

    // Clear throw_bottle session (bottle successfully created)
    const { clearSession } = await import('~/db/queries/sessions');
    await clearSession(db, user.telegram_id, 'throw_bottle');

    // 🎨 UX: 階段 4 - 完成，刪除進度訊息
    if (statusMsg && statusMsg.message_id) {
      try {
        await telegram.deleteMessage(chatId, statusMsg.message_id);
      } catch (deleteError) {
        // 如果刪除失敗（訊息已被刪除等），忽略錯誤，繼續執行
        console.error('[handleThrow] Failed to delete progress message:', deleteError);
      }
    }

    // 🆕 Send success message (different for VIP and free users)
    let successMessage: string;
    let conversationIdentifier: string | undefined;

    if (isVip) {
      // VIP 用戶成功訊息
      if (vipMatchInfo && vipMatchInfo.matched) {
        // 有智能配對成功
        conversationIdentifier = vipMatchInfo.conversationIdentifier;
        successMessage =
            i18n.t('throw.success2') + '\n\n' + i18n.t('throw.complete2') + '\n' +
          i18n.t('throw.message5', { vipMatchInfo: { matcherNickname: vipMatchInfo.matcherNickname } }) +
          '\n' +
          i18n.t('throw.conversation', { vipMatchInfo: { conversationIdentifier: vipMatchInfo.conversationIdentifier } }) +
          '\n\n' +
          i18n.t('throw.text7') +
          '\n' +
          i18n.t('throw.catch2') +
          '\n' +
          i18n.t('throw.catch3') +
          '\n\n' +
          i18n.t('throw.conversation3') +
          '\n' +
          i18n.t('throw.throw', { quotaDisplay }) +
          '\n\n' +
          i18n.t('throw.conversation5') +
          '\n\n' +
          i18n.t('throw.text14') +
          '\n' +
          i18n.t('buttons.message') +
          '\n' +
          i18n.t('catch.message4');
      } else {
        // 智能配對未成功，3 個槽位都進入公共池
        successMessage =
          i18n.t('throw.vip5') +
          '\n\n' +
          i18n.t('throw.bottle2') +
          '\n' +
          i18n.t('throw.catch3') +
          '\n' +
          i18n.t('throw.catch2') +
          '\n' +
          i18n.t('throw.catch') +
          '\n\n' +
          i18n.t('throw.conversation4') +
          '\n' +
          i18n.t('throw.throw', { quotaDisplay }) +
          '\n\n' +
          i18n.t('throw.conversation2') + '\n\n' + i18n.t('throw.conversation5');
      }
    } else {
      // 免費用戶成功訊息（加上 VIP 提示）
      successMessage =
        i18n.t('throw.bottle10') +
        '\n\n' +
        i18n.t('throw.bottle5', { bottleId }) +
        '\n\n' +
        i18n.t('throw.catch4') +
        '\n' +
        i18n.t('throw.throw', { quotaDisplay }) +
        '\n\n' +
        i18n.t('throw.vip2') +
        '\n' +
        i18n.t('throw.success') +
        '\n\n' +
        i18n.t('throw.text21');
    }

    // Determine what button to show (ad/task/vip) for non-VIP users
    if (!isVip) {
      const { getNextIncompleteTask } = await import('./tasks');
      const { getAdPrompt } = await import('~/domain/ad_prompt');

      const nextTask = await getNextIncompleteTask(db, user);

      const prompt = getAdPrompt(
        {
          user,
          ads_watched_today: adRewardInfo?.ads_watched || 0,
          has_incomplete_tasks: !!nextTask,
          next_task_name: nextTask?.name,
          next_task_id: nextTask?.id,
        },
        i18n
      );

      if (prompt.show_button) {
        await telegram.sendMessageWithButtons(chatId, successMessage, [
          [
            {
              text: prompt.button_text,
              callback_data: prompt.button_callback,
            },
          ],
        ]);
      } else {
        await telegram.sendMessage(chatId, successMessage);
      }
    } else {
      // VIP 用戶：如果有對話標識符，顯示回覆按鈕
      if (conversationIdentifier) {
        await telegram.sendMessageWithButtons(chatId, successMessage, [
          [{ text: i18n.t('buttons.message'), callback_data: `conv_reply_${conversationIdentifier}` }],
          [{ text: i18n.t('buttons.short18'), callback_data: 'chats' }],
        ]);
      } else {
        await telegram.sendMessage(chatId, successMessage);
      }
    }
  } catch (error) {
    console.error('[processBottleContent] Error:', error);
    console.error('[processBottleContent] Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      userId: user.telegram_id,
      contentLength: content.length,
    });

    // 🎨 UX: 錯誤時也要刪除進度訊息
    if (statusMsg) {
      try {
        await telegram.deleteMessage(chatId, statusMsg.message_id);
      } catch (deleteError) {
        console.error('[processBottleContent] Failed to delete progress message:', deleteError);
      }
    }

    const _errorMsg = error instanceof Error ? error.message : String(error);
    await telegram.sendMessage(chatId, i18n.t('errors.processError'));
  }
}

/**
 * Record risk score for user
 * Updates user's risk score and checks for auto-ban
 */
async function recordRiskScore(
  db: DatabaseClient,
  telegramId: string,
  riskScore: number
): Promise<void> {
  try {
    // Update user risk score
    const { addRiskScore, shouldAutoBan } = await import('~/domain/risk');
    const { findUserByTelegramId } = await import('~/db/queries/users');

    const user = await findUserByTelegramId(db, telegramId);
    if (!user) return;

    const newRiskScore = addRiskScore(user.risk_score, riskScore);

    // Update database
    await db.d1
      .prepare('UPDATE users SET risk_score = ? WHERE telegram_id = ?')
      .bind(newRiskScore, telegramId)
      .run();

    // Check if auto-ban is needed
    if (shouldAutoBan(newRiskScore)) {
      const { banUser } = await import('~/db/queries/users');
      await banUser(db, telegramId, 'Auto-ban: High risk score', 24); // 24 hours

      console.error(`[Risk] User ${telegramId} auto-banned. Risk score: ${newRiskScore}`);
    }
  } catch (error) {
    console.error('[recordRiskScore] Error:', error);
    // Error doesn't affect main flow
  }
}
