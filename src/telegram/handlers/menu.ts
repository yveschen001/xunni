/**
 * Menu Handler
 *
 * Handles /menu command - Main menu with quick action buttons.
 */

import type { Env, TelegramMessage, CallbackQuery } from '~/types';
import { createDatabaseClient } from '~/db/client';
import { createTelegramService } from '~/services/telegram';
import { findUserByTelegramId } from '~/db/queries/users';

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
      `${i18n.t('menu.greeting', { nickname: user.nickname })}\n\n` +
      `${i18n.t('menu.yourStatus')}\n` +
      `• ${isVip ? i18n.t('menu.levelVip') : i18n.t('menu.levelFree')}\n` +
      `${i18n.t('menu.mbtiLabel', { mbti: user.mbti_result || i18n.t('menu.notSet') })}\n` +
      `${i18n.t('menu.zodiacLabel', { zodiac: user.zodiac_sign || i18n.t('menu.notSet') })}\n\n`;

    // Add next task reminder if exists
    if (nextTask) {
      menuMessage += i18n.t('menu.nextTask', { 
        taskName: nextTask.name, 
        reward: nextTask.reward_amount, 
        description: nextTask.description 
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
      buttons.unshift([{ text: `✨ ${nextTask.name}`, callback_data: `next_task_${nextTask.id}` }]);
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
  const chatId = callbackQuery.message!.chat.id;
  const data = callbackQuery.data;

  try {
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
        const db = createDatabaseClient(env.DB);
        const telegramId = callbackQuery.from.id.toString();
        const { findUserByTelegramId } = await import('~/db/queries/users');
        const user = await findUserByTelegramId(db, telegramId);

        if (!user || !user.invite_code) {
          await telegram.sendMessage(chatId, '⚠️ 無法獲取邀請碼');
          break;
        }

        const inviteCode = user.invite_code;
        const botUsername = env.ENVIRONMENT === 'production' ? 'xunnibot' : 'xunni_dev_bot';
        const shareUrl = `https://t.me/share/url?url=https://t.me/${botUsername}?start=invite_${inviteCode}&text=來 XunNi 一起丟漂流瓶吧！🍾 使用我的邀請碼加入，我們都能獲得更多配額！`;

        await telegram.sendMessageWithButtons(
          chatId,
          `🎁 **邀請好友**\n\n` +
            `📋 你的邀請碼：\`${inviteCode}\`\n\n` +
            `💡 點擊下方按鈕分享給好友：\n` +
            `• 好友使用你的邀請碼註冊\n` +
            `• 好友丟出第一個瓶子後激活\n` +
            `• 你們都獲得每日配額 +1\n\n` +
            `📊 查看邀請統計：/profile`,
          [
            [{ text: '📤 分享邀請碼', url: shareUrl }],
            [{ text: '📊 查看邀請統計', callback_data: 'menu_profile' }],
            [{ text: '🏠 返回主選單', callback_data: 'return_to_menu' }],
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
        fakeMessage.text = '/settings';
        const { handleSettings } = await import('./settings');
        await handleSettings(fakeMessage, env);
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
        await telegram.sendMessage(chatId, '⚠️ 未知的選項');
    }
  } catch (error) {
    console.error('[handleMenuCallback] Error:', error);
    await telegram.answerCallbackQuery(callbackQuery.id, '❌ 系統發生錯誤');
  }
}

/**
 * Show "Return to Menu" button
 */
export async function showReturnToMenuButton(
  telegram: ReturnType<typeof createTelegramService>,
  chatId: number,
  message: string
): Promise<void> {
  await telegram.sendMessageWithButtons(chatId, message, [
    [{ text: '🏠 返回主選單', callback_data: 'return_to_menu' }],
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
    await telegram.answerCallbackQuery(callbackQuery.id, '✅ 正在加載...');

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
    await telegram.answerCallbackQuery(callbackQuery.id, '❌ 系統發生錯誤');
  }
}
