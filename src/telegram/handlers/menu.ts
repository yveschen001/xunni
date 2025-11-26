/**
 * Menu Handler
 *
 * Handles /menu command - Main menu with quick action buttons.
 */

import type { Env, TelegramMessage, CallbackQuery } from '~/types';
import { createDatabaseClient } from '~/db/client';
import { createTelegramService } from '~/services/telegram';
import { findUserByTelegramId } from '~/db/queries/users';
import { createI18n } from '~/i18n';

/**
 * Show main menu
 */
export async function handleMenu(message: TelegramMessage, env: Env): Promise<void> {
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
    const isVip = user.is_vip && user.vip_expire_at && new Date(user.vip_expire_at) > new Date();
    const vipBadge = isVip ? '💎' : '';

    // Get next incomplete task
    const { getNextIncompleteTask } = await import('./tasks');
    const nextTask = await getNextIncompleteTask(db, user);
    console.error('[handleMenu] Next task:', nextTask ? nextTask.id : 'null');

    // Build menu message
    let menuMessage =
      `${i18n.t('menu.title')} ${vipBadge}\n\n` +
      `${i18n.t('menu.text2', { user: { nickname: user.nickname } })}\n\n` +
      `${i18n.t('menu.yourStatus')}\n` +
      `• ${isVip ? i18n.t('menu.levelVip') : i18n.t('menu.levelFree')}\n` +
      `${i18n.t('menu.settings', { mbti: user.mbti_result || i18n.t('menu.notSet') })}\n` +
      `${i18n.t('menu.settings2', { zodiac: user.zodiac_sign || i18n.t('menu.notSet') })}\n\n`;

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
        { text: i18n.t('menu.buttonProfile'), callback_data: 'menu_profile' },
        { text: i18n.t('menu.buttonStats'), callback_data: 'menu_stats' },
      ],
      [
        { text: i18n.t('menu.buttonInvite'), callback_data: 'menu_invite' },
        { text: i18n.t('menu.buttonChats'), callback_data: 'menu_chats' },
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
      console.error('[handleMenu] Adding next task button:', {
        taskId: nextTask.id,
        taskName,
        callbackData,
        originalName: nextTask.name,
        taskI18nKey,
      });
      buttons.unshift([{ text: `✨ ${taskName}`, callback_data: callbackData }]);
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
    console.error('[handleMenuCallback] Received callback:', data);
    
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
          i18n.t('menu.invite') + '\n\n' +
            i18n.t('menu.invite2', { inviteCode }) + '\n\n' +
            i18n.t('menu.text3') + '\n' +
            i18n.t('menu.register') + '\n' +
            i18n.t('menu.bottle') + '\n' +
            i18n.t('menu.quota') + '\n\n' +
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
    const db = createDatabaseClient(env.DB);
    const telegramId = callbackQuery.from.id.toString();
    const user = await findUserByTelegramId(db, telegramId);
    const i18n = createI18n(user?.language_pref || 'zh-TW');
    await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('common.systemError'));
  }
}
