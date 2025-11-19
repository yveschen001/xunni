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
      await telegram.sendMessage(chatId, '❌ 用戶不存在，請先使用 /start 註冊。');
      return;
    }

    // Check if user completed onboarding
    if (user.onboarding_step !== 'completed') {
      await telegram.sendMessage(chatId, '❌ 請先完成註冊流程。\n\n使用 /start 繼續註冊。');
      return;
    }

    // Check VIP status
    const isVip = user.is_vip && user.vip_expire_at && new Date(user.vip_expire_at) > new Date();
    const vipBadge = isVip ? '💎' : '';

    // Build menu message
    const menuMessage =
      `🏠 **主選單** ${vipBadge}\n\n` +
      `👋 嗨，${user.nickname}！\n\n` +
      `📊 你的狀態：\n` +
      `• 等級：${isVip ? 'VIP 會員 💎' : '免費會員'}\n` +
      `• MBTI：${user.mbti_result || '未設定'}\n` +
      `• 星座：${user.zodiac_sign || '未設定'}\n\n` +
      `💡 選擇你想要的功能：`;

    // Build menu buttons
    const buttons = [
      [
        { text: '🌊 丟出漂流瓶', callback_data: 'menu_throw' },
        { text: '🎣 撿起漂流瓶', callback_data: 'menu_catch' },
      ],
      [
        { text: '👤 個人資料', callback_data: 'menu_profile' },
        { text: '📊 統計數據', callback_data: 'menu_stats' },
      ],
      [
        { text: '🎁 邀請好友', callback_data: 'menu_invite' },
        { text: '💬 聊天記錄', callback_data: 'menu_chats' },
      ],
      [
        { text: '⚙️ 設定', callback_data: 'menu_settings' },
        { text: '❓ 幫助', callback_data: 'menu_help' },
      ],
    ];

    // Add VIP button for non-VIP users
    if (!isVip) {
      buttons.push([{ text: '💎 升級 VIP', callback_data: 'menu_vip' }]);
    }

    await telegram.sendMessageWithButtons(chatId, menuMessage, buttons);
  } catch (error) {
    console.error('[handleMenu] Error:', error);
    await telegram.sendMessage(chatId, '❌ 發生錯誤，請稍後再試。');
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
          await telegram.sendMessage(chatId, '❌ 無法獲取邀請碼');
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
        await telegram.sendMessage(chatId, '❌ 未知的選項');
    }
  } catch (error) {
    console.error('[handleMenuCallback] Error:', error);
    await telegram.answerCallbackQuery(callbackQuery.id, '❌ 發生錯誤');
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
    // Answer callback
    await telegram.answerCallbackQuery(callbackQuery.id);

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
    await telegram.answerCallbackQuery(callbackQuery.id, '❌ 發生錯誤');
  }
}
