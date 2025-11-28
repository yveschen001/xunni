import type { Env, TelegramMessage, TelegramCallbackQuery } from '~/types';
import { createTelegramService } from '~/services/telegram';
import { findUserByTelegramId } from '~/db/queries/users';
import { getDailyThrowCount, createBottle, incrementDailyThrowCount } from '~/db/queries/bottles';
import { canThrowBottle, validateBottleContent } from '~/domain/bottle';
import { getTargetGender } from '~/domain/user';
import { getActiveSession, upsertSession, deleteSession } from '~/db/queries/sessions';
import { showReturnToMenuButton } from './menu';

/**
 * Helper to send ForceReply for throwing a bottle
 */
export async function sendThrowForceReply(
  telegram: any,
  chatId: number,
  i18n: any,
  env: Env
): Promise<void> {
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
    const errorText = await response.text();
    console.error('[sendThrowForceReply] Failed to send ForceReply message:', errorText);
    await telegram.sendMessage(chatId, i18n.t('errors.systemErrorRetry'));
  }
}

/**
 * Handle /throw command
 * Supports optional parameters: /throw target_zodiac=leo&target_mbti=INTJ
 * (Passed via internal call or parsing text if command supports args)
 * 
 * NOTE: Telegram commands are just text like "/throw". 
 * Complex args usually come from Deep Links (start param) or internal logic.
 * Here we accept an optional `options` object for internal calls (like from Cron Push buttons).
 */
export async function handleThrow(
  message: TelegramMessage, 
  env: Env, 
  options?: { 
    target_zodiac?: string;
    target_mbti?: string;
    target_blood?: string;
  }
): Promise<void> {
  const { createDatabaseClient } = await import('~/db/client');
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

    // Check for existing draft (Only if NOT using quick throw with options)
    // If options are provided (VIP Quick Throw), we might want to bypass draft or overwrite it?
    // Let's say we prioritize the Quick Throw intent. If draft exists, we might warn?
    // For simplicity: If options provided, we overwrite session directly later.
    // If NO options, we check draft.
    if (!options) {
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
    }

    // Determine target gender based on user's preference
    const targetGender = getTargetGender(user);

    // Create session to store target gender and track user state
    // If options are provided (VIP filters), store them in session
    const sessionData: any = {
      target_gender: targetGender,
    };

    if (options && isVip) {
      if (options.target_zodiac) sessionData.target_zodiac = options.target_zodiac;
      if (options.target_mbti) sessionData.target_mbti = options.target_mbti;
      if (options.target_blood) sessionData.target_blood = options.target_blood;
    }

    const { upsertSession } = await import('~/db/queries/sessions');
    await upsertSession(db, telegramId, 'throw_bottle', sessionData);

    console.error('[handleThrow] Created throw_bottle session:', {
      userId: telegramId,
      ...sessionData
    });

    // Show prompt
    // If it's a VIP Quick Throw with preset targets, we should mention it!
    let targetText =
      targetGender === 'male'
        ? i18n.t('common.male')
        : targetGender === 'female'
          ? i18n.t('common.female')
          : i18n.t('throw.short3');
    
    // Append extra target info if present
    if (options && isVip) {
      if (options.target_zodiac) targetText += ` + ${options.target_zodiac}`; // Ideally translate
      // We can improve text formatting later
    }

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
        [{ text: i18n.t('buttons.bottle3'), callback_data: 'throw_input' }], // 保留按鈕作為備用
        [{ text: i18n.t('buttons.back'), callback_data: 'return_to_menu' }],
      ],
      { parse_mode: 'Markdown' }
    );

    // ✨ NEW: Automatically trigger ForceReply for better UX
    await sendThrowForceReply(telegram, chatId, i18n, env);

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
  const { createDatabaseClient } = await import('~/db/client');
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
    await sendThrowForceReply(telegram, chatId, i18n, env);

  } catch (error) {
    console.error('[handleThrowInputButton] Error:', error);
    const { createI18n } = await import('~/i18n');
    const errorI18n = createI18n('zh-TW');
    await telegram.answerCallbackQuery(callbackQuery.id, errorI18n.t('errors.systemErrorRetry'));
  }
}

/**
 * Process bottle content (from text message)
 */
export async function processBottleContent(
  user: any, // User type
  text: string,
  env: Env
): Promise<void> {
  const { createDatabaseClient } = await import('~/db/client');
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const { createI18n } = await import('~/i18n');
  const i18n = createI18n(user.language_pref || 'zh-TW');

  try {
    // Validate content
    const validation = validateBottleContent(text);
    if (!validation.valid) {
      await telegram.sendMessage(
        Number(user.telegram_id),
        validation.error || i18n.t(validation.errorCode as any, validation.errorParams)
      );
      return;
    }

    // Get session to check target gender AND other filters
    const { getActiveSession } = await import('~/db/queries/sessions');
    const session = await getActiveSession(db, user.telegram_id, 'throw_bottle');
    
    let targetGender: 'male' | 'female' | 'any' = 'any';
    // Extra filters for VIP
    let targetZodiac: string | undefined;
    let targetMbti: string | undefined;
    let targetBlood: string | undefined;
    
    if (session) {
      const sessionData = JSON.parse(session.data || '{}');
      targetGender = sessionData.target_gender || 'any';
      targetZodiac = sessionData.target_zodiac;
      targetMbti = sessionData.target_mbti;
      targetBlood = sessionData.target_blood;
    } else {
      // Fallback: use user preference or default
      targetGender = getTargetGender(user);
    }

    // Check quota again (double check)
    const throwsToday = await getDailyThrowCount(db, user.telegram_id);
    const inviteBonus = user.successful_invites || 0;
    // const isVip = !!(user.is_vip && user.vip_expire_at && new Date(user.vip_expire_at) > new Date());
    // We already checked quota at start, but double check is fine.
    // Assuming user IS VIP if they have target filters set in session (since we set them only for VIP)
    // But strictly we should check again or pass it down.
    
    const isVip = !!(user.is_vip && user.vip_expire_at && new Date(user.vip_expire_at) > new Date());

    // Create bottle input
    const input: any = {
      content: text,
      target_gender: targetGender,
    };

    if (isVip) {
      if (targetZodiac) input.target_zodiac_filter = JSON.stringify([targetZodiac]);
      if (targetMbti) input.target_mbti_filter = JSON.stringify([targetMbti]); // Or array of targets if engine supports it
      // Blood type filter logic might need db support if not already there
      // Assuming db supports it or we add it later.
      // Based on schema, we have target_zodiac_filter and target_mbti_filter.
      // Blood type filter might be missing in bottles table?
      // Let's check migrations later. For now, we support Zodiac and MBTI.
    }

    // Create bottle
    await createBottle(db, user.telegram_id, input, isVip);

    // Increment usage
    await incrementDailyThrowCount(db, user.telegram_id);

    // Delete session if exists
    if (session) {
      await deleteSession(db, user.telegram_id, 'throw_bottle');
    }

    // Success message
    const { showReturnToMenuButton } = await import('./menu');
    await showReturnToMenuButton(
      telegram, 
      Number(user.telegram_id), 
      i18n.t('success.bottleThrown'), 
      user.language_pref
    );

  } catch (error) {
    console.error('[processBottleContent] Error:', error);
    await telegram.sendMessage(Number(user.telegram_id), i18n.t('errors.systemErrorRetry'));
  }
}

/**
 * Handle target gender selection callback
 */
export async function handleThrowTargetGender(
  callbackQuery: TelegramCallbackQuery,
  gender: 'male' | 'female' | 'any',
  env: Env
): Promise<void> {
  const { createDatabaseClient } = await import('~/db/client');
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const { createI18n } = await import('~/i18n');
  
  try {
    const telegramId = callbackQuery.from.id.toString();
    const user = await findUserByTelegramId(db, telegramId);
    if (!user) return;
    
    const i18n = createI18n(user.language_pref || 'zh-TW');

    // Update session
    await upsertSession(db, telegramId, 'throw_bottle', {
      target_gender: gender,
    });

    await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('success.saved'));
    
    // Update message text to reflect selection?
    // For now just acknowledge.
    
    // Trigger ForceReply again?
    await sendThrowForceReply(telegram, callbackQuery.message!.chat.id, i18n, env);

  } catch (error) {
    console.error('[handleThrowTargetGender] Error:', error);
  }
}
