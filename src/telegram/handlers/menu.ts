/**
 * Menu Handler
 *
 * Handles /menu command - Main menu with quick action buttons.
 */

import type { Env, TelegramMessage, CallbackQuery } from '~/types';
// import { createDatabaseClient } from '~/db/client'; // Moved to dynamic import to avoid ReferenceError
import { createTelegramService } from '~/services/telegram';
import { findUserByTelegramId } from '~/db/queries/users';
import { createI18n } from '~/i18n';

/**
 * Show main menu
 */
export async function handleMenu(message: TelegramMessage, env: Env): Promise<void> {
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
      console.error('[handleMenu] Failed to update user activity:', activityError);
    }

    // Get user
    const user = await findUserByTelegramId(db, telegramId);
    if (!user) {
      const { createI18n } = await import('~/i18n');
      const i18n = createI18n('zh-TW');
      await telegram.sendMessage(chatId, i18n.t('menu.userNotFound'));
      return;
    }

    const { createI18n } = await import('~/i18n');
    const i18n = createI18n(user.language_pref || 'zh-TW');

    // Check if user completed onboarding
    if (user.onboarding_step !== 'completed') {
      await telegram.sendMessage(chatId, i18n.t('menu.notRegistered'));
      return;
    }

    // Check VIP status
    let isVip = false;
    try {
      isVip = !!(user.is_vip && user.vip_expire_at && new Date(user.vip_expire_at).getTime() > Date.now());
    } catch (e) {
      console.error('[handleMenu] Error checking VIP status:', e);
    }
    const vipBadge = isVip ? '💎' : '';

    // Get next incomplete task
    const { getNextIncompleteTask } = await import('./tasks');
    const nextTask = await getNextIncompleteTask(db, user);
    console.log('[handleMenu] Next task:', nextTask ? nextTask.id : 'null');

    // Build menu message
    const { getZodiacDisplay } = await import('~/domain/zodiac');
    const { getDisplayName } = await import('~/domain/user');
    const zodiacDisplay = getZodiacDisplay(user.zodiac_sign, i18n);
    
    // Get Fortune Quota
    const { FortuneService } = await import('~/services/fortune');
    const fortuneService = new FortuneService(env, db.d1);
    const fortuneQuota = await fortuneService.refreshQuota(telegramId, !!user.is_vip);
    const fortuneTotal = fortuneQuota.weekly_free_quota + fortuneQuota.additional_quota;

    // Build rich profile display
    const { calculateDailyQuota } = await import('~/domain/invite');
    const { getDailyThrowCount } = await import('~/db/queries/bottles');
    const { calculateTaskBonus } = await import('./tasks');
    const { getTodayAdReward } = await import('~/db/queries/ad_rewards');

    // 1. Permanent Quota (Base + Invites)
    // calculateDailyQuota includes user base (3/30) + invite bonus
    const permanentQuota = calculateDailyQuota(user);

    // 2. Temporary Quota (Task + Ad Bonus)
    const taskBonus = await calculateTaskBonus(db, telegramId);
    const adReward = await getTodayAdReward(db.d1, telegramId);
    const adBonus = adReward?.quota_earned || 0;
    const temporaryQuota = taskBonus + adBonus;

    // 3. Total Quota
    const totalDailyQuota = permanentQuota + temporaryQuota;

    // 4. Used Quota
    const throwsToday = await getDailyThrowCount(db, telegramId);

    // 5. Remaining Quota
    const remainingQuota = Math.max(0, totalDailyQuota - throwsToday);
    
    // Display string: "Remaining / Permanent + Temporary"
    // Example: "2 / 3 + 1" (2 remaining, 3 permanent limit, +1 temporary earned)
    // If no temporary, just "2 / 3"
    let driftBottleQuota = `${remainingQuota} / ${permanentQuota}`;
    if (temporaryQuota > 0) {
      driftBottleQuota += ` + ${temporaryQuota}`;
    }
    
    // Format birth date
    const birthDate = user.birthday ? user.birthday : i18n.t('menu.notSet');
    
    // Format interests
    let interests = i18n.t('menu.notSet');
    if (user.interests) {
      try {
        const interestsArray = JSON.parse(user.interests);
        if (Array.isArray(interestsArray)) {
          // Translate each interest code (or keep as is if it's legacy text)
          const translatedInterests = interestsArray.map((item, i) => {
            // Try to translate as key "interests.items.{item}"
            const key = `interests.items.${item}`;
            const translated = i18n.t(key as any);
            
            // Debug first item
            if (i === 0) {
               // console.log(`[Menu] Interest Debug: Key=${key}, Result=${translated}`);
            }

            // If translation exists and is not just the key itself (simple check)
            // Note: i18n.t usually returns the key if missing, or a special placeholder depending on implementation.
            // Our current i18n implementation might return the key or a placeholder.
            // A safer check: does the item look like a code? (e.g. "foodie", "basketball") vs Chinese text.
            // If it matches a known item key in INTEREST_STRUCTURE, translate it.
            // Otherwise, keep original text.
            return translated !== key && !translated.startsWith('[') ? translated : item;
          });
          interests = translatedInterests.join(', ');
        }
      } catch (e) {
        // Fallback for legacy plain string format
        interests = user.interests;
      }
    }
    
    // Format blood type
    const { getBloodTypeDisplay } = await import('~/domain/blood_type');
    const { createI18n: createI18nForBloodType } = await import('~/i18n');
    const bloodTypeI18n = createI18nForBloodType(user.language_pref || 'zh-TW');
    const bloodType = getBloodTypeDisplay(user.blood_type as any, bloodTypeI18n);

    let menuMessage =
      `${i18n.t('menu.title')} ${vipBadge}\n\n` +
      `${i18n.t('menu.text2', { user: { nickname: getDisplayName(user) } })}\n\n` +
      `${i18n.t('menu.yourStatus')}\n` +
      `• ${isVip ? i18n.t('menu.levelVip') : i18n.t('menu.levelFree')}\n` +
      `• 🎂 ${i18n.t('menu.birthDate')}: ${birthDate}\n` +
      `• 🧠 MBTI: ${user.mbti_result || i18n.t('menu.notSet')}\n` +
      `• ⭐ ${i18n.t('menu.zodiac')}: ${zodiacDisplay}\n` +
      `• 🩸 ${i18n.t('menu.bloodType')}: ${bloodType}\n` +
      `• 🏷️ ${i18n.t('menu.interests')}: ${interests}\n` +
      `• 📝 ${i18n.t('menu.bio')}: ${user.bio || i18n.t('menu.notSet')}\n` +
      `• 🍾 ${i18n.t('menu.driftBottles')}: ${driftBottleQuota}\n` +
      `• 🔮 ${i18n.t('menu.fortuneBottles')}: ${fortuneTotal}\n\n`;

    // Add next task reminder if exists
    if (nextTask) {
      // Get task name: use i18n key based on task ID, or fallback to database name
      let taskName: string;
      const taskI18nKey = `tasks.name.${nextTask.id.replace('task_', '')}`;
      const translatedName = i18n.t(taskI18nKey as any);
      if (translatedName && !translatedName.startsWith('[') && !translatedName.endsWith(']')) {
        // Valid translation found
        taskName = translatedName;
      } else if (nextTask.name.startsWith('tasks.name.')) {
        // Database already has i18n key
        const keyPart = nextTask.name.replace('tasks.name.', '');
        taskName = i18n.t(`tasks.name.${keyPart}` as any) || nextTask.name;
      } else {
        // Fallback to database name (backward compatibility)
        taskName = nextTask.name;
      }

      // Get task description: use i18n key based on task ID, or fallback to database description
      let taskDescription: string;
      const descI18nKey = `tasks.description.${nextTask.id.replace('task_', '')}`;
      const translatedDesc = i18n.t(descI18nKey as any);
      if (translatedDesc && !translatedDesc.startsWith('[') && !translatedDesc.endsWith(']')) {
        // Valid translation found
        taskDescription = translatedDesc;
      } else if (nextTask.description.startsWith('tasks.description.')) {
        // Database already has i18n key
        const keyPart = nextTask.description.replace('tasks.description.', '');
        taskDescription = i18n.t(`tasks.description.${keyPart}` as any) || nextTask.description;
      } else {
        // Fallback to database description (backward compatibility)
        taskDescription = nextTask.description;
      }

      menuMessage +=
        i18n.t('menu.task', {
          nextTask: {
            name: taskName,
            reward_amount: nextTask.reward_amount,
            description: taskDescription,
          },
        }) + '\n\n';
    }

    menuMessage += i18n.t('menu.selectFeature');

    // Build menu buttons
    const buttons = [
      [
        { text: i18n.t('menu.buttonThrow'), callback_data: 'menu_throw' },
        { text: i18n.t('menu.buttonCatch'), callback_data: 'menu_catch' },
      ],
      [
        { text: `🔮 ${i18n.t('fortune.menuTitle')}`, callback_data: 'menu_fortune' },
        { text: i18n.t('fortune.menu.love').replace(/\s*\(.*\)/, ''), callback_data: 'menu_love_diagnosis' }, // High visibility shortcut
      ],
      [
        { text: i18n.t('menu.buttonInvite'), callback_data: 'menu_invite' },
        { text: i18n.t('menu.buttonChats'), callback_data: 'menu_chats' },
      ],
      [
        { text: i18n.t('menu.buttonProfile'), callback_data: 'menu_profile' },
        { text: i18n.t('menu.buttonStats'), callback_data: 'menu_stats' },
      ],
      [
        { text: i18n.t('menu.buttonSettings'), callback_data: 'menu_settings' },
        { text: i18n.t('menu.buttonHelp'), callback_data: 'menu_help' },
      ],
    ];

    // Add next task button if exists
    if (nextTask) {
      // Get task name: use i18n key based on task ID, or fallback to database name
      let taskName: string;
      const taskI18nKey = `tasks.name.${nextTask.id.replace('task_', '')}`;
      const translatedName = i18n.t(taskI18nKey as any);
      if (translatedName && !translatedName.startsWith('[') && !translatedName.endsWith(']')) {
        // Valid translation found
        taskName = translatedName;
      } else if (nextTask.name.startsWith('tasks.name.')) {
        // Database already has i18n key
        const keyPart = nextTask.name.replace('tasks.name.', '');
        taskName = i18n.t(`tasks.name.${keyPart}` as any) || nextTask.name;
      } else {
        // Fallback to database name (backward compatibility)
        taskName = nextTask.name;
      }
      const callbackData = `next_task_${nextTask.id}`;
      console.log('[handleMenu] Adding next task button:', {
        taskId: nextTask.id,
        taskName,
        callbackData,
        originalName: nextTask.name,
        taskI18nKey,
      });
      buttons.unshift([{ text: `✨ ${taskName}`, callback_data: callbackData }]);
    } else {
      // Suggest completing Fortune Profile if tasks are done
      try {
        const { FortuneService } = await import('~/services/fortune');
        const fortuneService = new FortuneService(env, db.d1);
        const profile = await fortuneService.getFortuneProfile(telegramId);
        // Only if profile is default/incomplete? 
        // Actually getFortuneProfile returns default one or null.
        // If profile doesn't exist OR lacks city/time (optional but recommended)
        // But getFortuneProfile creates a default one if not exists (in some logic)? 
        // No, it returns null if not found.
        
        if (!profile || !profile.birth_city_id || !profile.birth_time) {
           const hintText = i18n.t('fortune.profile_incomplete_hint') || '完善算命资料'; // Fallback
           buttons.unshift([{ text: `🔮 ${hintText}`, callback_data: 'menu_fortune' }]);
        }
      } catch (e) {
        // Ignore error
      }
    }

    // Add VIP button for non-VIP users
    if (!isVip) {
      buttons.push([{ text: i18n.t('menu.buttonVip'), callback_data: 'menu_vip' }]);
    }

    await telegram.sendMessageWithButtons(chatId, menuMessage, buttons);
  } catch (error) {
    console.error('[handleMenu] Error:', error);
    const { createI18n } = await import('~/i18n');
    const i18n = createI18n('zh-TW');
    await telegram.sendMessage(chatId, i18n.t('common.systemError'));
  }
}

/**
 * Handle menu button callbacks
 */
export async function handleMenuCallback(callbackQuery: CallbackQuery, env: Env): Promise<void> {
  const telegram = createTelegramService(env);
  const { createDatabaseClient } = await import('~/db/client');
  const db = createDatabaseClient(env.DB);
  const chatId = callbackQuery.message!.chat.id;
  const telegramId = callbackQuery.from.id.toString();
  const data = callbackQuery.data;

  // Get user language
  const { createI18n } = await import('~/i18n');
  const { findUserByTelegramId } = await import('~/db/queries/users');
  const user = await findUserByTelegramId(db, telegramId);
  const i18n = createI18n(user?.language_pref || 'zh-TW');

  try {
    // Debug: Log callback data
    console.log('[handleMenuCallback] Received callback:', data);

    // Answer callback
    await telegram.answerCallbackQuery(callbackQuery.id);

    // Delete menu message
    await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);

    // Route to appropriate handler
    const fakeMessage = {
      ...callbackQuery.message!,
      from: callbackQuery.from,
      text: '',
    };

    switch (data) {
      case 'menu_throw': {
        fakeMessage.text = '/throw';
        const { handleThrow } = await import('./throw');
        await handleThrow(fakeMessage, env);
        break;
      }

      case 'menu_catch': {
        fakeMessage.text = '/catch';
        const { handleCatch } = await import('./catch');
        await handleCatch(fakeMessage, env);
        break;
      }

      case 'menu_profile': {
        fakeMessage.text = '/profile';
        const { handleProfile } = await import('./profile');
        await handleProfile(fakeMessage, env);
        break;
      }

      case 'menu_stats': {
        fakeMessage.text = '/stats';
        const { handleStats } = await import('./stats');
        await handleStats(fakeMessage, env);
        break;
      }

      case 'menu_fortune': {
        fakeMessage.text = '/fortune';
        const { handleFortune } = await import('./fortune');
        await handleFortune(fakeMessage, env);
        break;
      }

      case 'menu_love_diagnosis': {
        console.error('[handleMenuCallback] Entering menu_love_diagnosis case');
        try {
          console.error('[handleMenuCallback] Importing fortune...');
          const { handleFortuneCallback } = await import('./fortune');
          console.error('[handleMenuCallback] Imported fortune. Creating modified callback...');
          const modifiedCallback = {
            ...callbackQuery,
            data: 'fortune_love_menu'
          };
            // Note: menu already answered the callback, fortune might try again but it's fine.
          console.error('[handleMenuCallback] Calling handleFortuneCallback...');
          await handleFortuneCallback(modifiedCallback as any, env);
          console.error('[handleMenuCallback] handleFortuneCallback completed');
        } catch (e) {
          console.error('[handleMenuCallback] Error in love_diagnosis:', e);
          await telegram.sendMessage(chatId, i18n.t('errors.systemErrorRetry'));
        }
        break;
      }

      case 'menu_invite': {
        // Get user's invite code and show share options
        if (!user || !user.invite_code) {
          await telegram.sendMessage(chatId, i18n.t('warning.invite'));
          break;
        }

        const inviteCode = user.invite_code;
        const botUsername = env.ENVIRONMENT === 'production' ? 'xunnibot' : 'xunni_dev_bot';
        const shareText = i18n.t('menu.message', { botUsername, inviteCode });
        const shareUrl = `https://t.me/share/url?url=https://t.me/${botUsername}?start=invite_${inviteCode}&text=${encodeURIComponent(shareText)}`;

        await telegram.sendMessageWithButtons(
          chatId,
          i18n.t('menu.invite') +
            '\n\n' +
            i18n.t('menu.invite2', { inviteCode }) +
            '\n\n' +
            i18n.t('menu.text3') +
            '\n' +
            i18n.t('menu.register') +
            '\n' +
            i18n.t('menu.bottle') +
            '\n' +
            i18n.t('menu.quota') +
            '\n\n' +
            i18n.t('menu.stats'),
          [
            [{ text: i18n.t('menu.invite3'), url: shareUrl }],
            [{ text: i18n.t('menu.stats2'), callback_data: 'menu_profile' }],
            [{ text: i18n.t('common.back3'), callback_data: 'return_to_menu' }],
          ]
        );
        break;
      }

      case 'menu_chats': {
        fakeMessage.text = '/chats';
        const { handleChats } = await import('./chats');
        await handleChats(fakeMessage, env);
        break;
      }

      case 'menu_settings': {
        try {
          fakeMessage.text = '/settings';
          const { handleSettings } = await import('./settings');
          await handleSettings(fakeMessage, env);
        } catch (error) {
          console.error('[handleMenuCallback] Error in menu_settings:', error);
          await telegram.sendMessage(chatId, i18n.t('errors.systemErrorRetry'));
        }
        break;
      }

      case 'menu_vip': {
        fakeMessage.text = '/vip';
        const { handleVip } = await import('./vip');
        await handleVip(fakeMessage, env);
        break;
      }

      case 'menu_help': {
        fakeMessage.text = '/help';
        const { handleHelp } = await import('./help');
        await handleHelp(fakeMessage, env);
        break;
      }

      default:
        await telegram.sendMessage(chatId, i18n.t('common.unknownOption'));
    }
  } catch (error) {
    console.error('[handleMenuCallback] Error:', error);
    // Fallback i18n
    const { createI18n } = await import('~/i18n');
    const i18n = createI18n('zh-TW');
    await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('error.text6'));
  }
}

/**
 * Show "Return to Menu" button
 */
export async function showReturnToMenuButton(
  telegram: ReturnType<typeof createTelegramService>,
  chatId: number,
  message: string,
  languagePref: string = 'zh-TW'
): Promise<void> {
  const { createI18n } = await import('~/i18n');
  const i18n = createI18n(languagePref);
  await telegram.sendMessageWithButtons(chatId, message, [
    [{ text: i18n.t('common.back3'), callback_data: 'return_to_menu' }],
  ]);
}

/**
 * Handle "Return to Menu" callback
 */
export async function handleReturnToMenu(callbackQuery: CallbackQuery, env: Env): Promise<void> {
  const telegram = createTelegramService(env);
  const chatId = callbackQuery.message!.chat.id;

  try {
    // Answer callback with immediate feedback
    const { createDatabaseClient } = await import('~/db/client');
    const db = createDatabaseClient(env.DB);
    const telegramId = callbackQuery.from.id.toString();
    const user = await findUserByTelegramId(db, telegramId);
    const i18n = createI18n(user?.language_pref || 'zh-TW');
    await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('common.loading'));

    // Delete current message
    await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);

    // Show menu
    const fakeMessage = {
      ...callbackQuery.message!,
      from: callbackQuery.from,
      text: '/menu',
    };
    await handleMenu(fakeMessage as any, env);
  } catch (error) {
    console.error('[handleReturnToMenu] Error:', error);
    const { createDatabaseClient } = await import('~/db/client');
    const db = createDatabaseClient(env.DB);
    const telegramId = callbackQuery.from.id.toString();
    const user = await findUserByTelegramId(db, telegramId);
    const i18n = createI18n(user?.language_pref || 'zh-TW');
    await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('common.systemError'));
  }
}
