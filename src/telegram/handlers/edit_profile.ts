/**
 * Edit Profile Handler
 * 
 * Handles profile editing functionality
 */

import type { Env, TelegramMessage, TelegramCallbackQuery } from '~/types';
import { createDatabaseClient } from '~/db/client';
import { createTelegramService } from '~/services/telegram';
import { findUserByTelegramId } from '~/db/queries/users';
import { upsertSession, getActiveSession, deleteSession } from '~/db/queries/sessions';
import { parseSessionData } from '~/domain/session';

const SESSION_TYPE = 'edit_profile';

/**
 * Handle /edit_profile command - show profile editing menu
 */
export async function handleEditProfile(message: TelegramMessage, env: Env): Promise<void> {
  const db = createDatabaseClient(env);
  const telegram = createTelegramService(env);
  const chatId = message.chat.id;
  const telegramId = message.from!.id.toString();

  try {
    const user = await findUserByTelegramId(db, telegramId);
    if (!user) {
      await telegram.sendMessage(chatId, '❌ 用戶不存在，請先使用 /start 註冊。');
      return;
    }

    if (user.onboarding_step !== 'completed') {
      await telegram.sendMessage(chatId, '❌ 請先完成註冊流程。\n\n使用 /start 繼續註冊。');
      return;
    }

    // Clear any existing session
    await deleteSession(db, telegramId, SESSION_TYPE);

    // Show profile editing menu
    await telegram.sendMessageWithButtons(
      chatId,
      `✏️ **編輯個人資料**\n\n` +
        `請選擇要編輯的項目：\n\n` +
        `📝 暱稱：${user.nickname}\n` +
        `📖 個人簡介：${user.bio || '未設定'}\n` +
        `🌍 地區：${user.region || '未設定'}\n` +
        `🏷️ 興趣標籤：${user.interests || '未設定'}\n\n` +
        `⚠️ **不可修改項目**：\n` +
        `👤 性別：${user.gender === 'male' ? '男' : '女'}\n` +
        `🎂 生日：${user.birthday}\n` +
        `🧠 MBTI：${user.mbti || '未設定'}（可重新測試）`,
      [
        [
          { text: '📝 編輯暱稱', callback_data: 'edit_nickname' },
          { text: '📖 編輯簡介', callback_data: 'edit_bio' },
        ],
        [
          { text: '🌍 編輯地區', callback_data: 'edit_region' },
          { text: '🏷️ 編輯興趣', callback_data: 'edit_interests' },
        ],
        [
          { text: '🧠 重新測試 MBTI', callback_data: 'retake_mbti' },
        ],
        [
          { text: '↩️ 返回', callback_data: 'return_to_menu' },
        ],
      ]
    );
  } catch (error) {
    console.error('[handleEditProfile] Error:', error);
    await telegram.sendMessage(chatId, '❌ 發生錯誤，請稍後再試。');
  }
}

/**
 * Handle edit nickname callback
 */
export async function handleEditNickname(callbackQuery: TelegramCallbackQuery, env: Env): Promise<void> {
  const db = createDatabaseClient(env);
  const telegram = createTelegramService(env);
  const chatId = callbackQuery.message!.chat.id;
  const telegramId = callbackQuery.from.id.toString();

  try {
    await telegram.answerCallbackQuery(callbackQuery.id);
    await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);

    // Create session
    await upsertSession(db, telegramId, SESSION_TYPE, { editing: 'nickname' });

    await telegram.sendMessage(
      chatId,
      '📝 **編輯暱稱**\n\n' +
        '請輸入新的暱稱：\n\n' +
        '💡 提示：\n' +
        '• 最多 36 個字符\n' +
        '• 顯示時最多 18 個字符\n' +
        '• 避免廣告或不當內容'
    );
  } catch (error) {
    console.error('[handleEditNickname] Error:', error);
    await telegram.answerCallbackQuery(callbackQuery.id, '❌ 發生錯誤');
  }
}

/**
 * Handle edit bio callback
 */
export async function handleEditBio(callbackQuery: TelegramCallbackQuery, env: Env): Promise<void> {
  const db = createDatabaseClient(env);
  const telegram = createTelegramService(env);
  const chatId = callbackQuery.message!.chat.id;
  const telegramId = callbackQuery.from.id.toString();

  try {
    await telegram.answerCallbackQuery(callbackQuery.id);
    await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);

    // Create session
    await upsertSession(db, telegramId, SESSION_TYPE, { editing: 'bio' });

    await telegram.sendMessage(
      chatId,
      '📖 **編輯個人簡介**\n\n' +
        '請輸入你的個人簡介：\n\n' +
        '💡 提示：\n' +
        '• 最多 200 個字符\n' +
        '• 介紹你的興趣、性格或想說的話\n' +
        '• 避免包含聯絡方式'
    );
  } catch (error) {
    console.error('[handleEditBio] Error:', error);
    await telegram.answerCallbackQuery(callbackQuery.id, '❌ 發生錯誤');
  }
}

/**
 * Handle edit region callback
 */
export async function handleEditRegion(callbackQuery: TelegramCallbackQuery, env: Env): Promise<void> {
  const db = createDatabaseClient(env);
  const telegram = createTelegramService(env);
  const chatId = callbackQuery.message!.chat.id;
  const telegramId = callbackQuery.from.id.toString();

  try {
    await telegram.answerCallbackQuery(callbackQuery.id);
    await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);

    // Create session
    await upsertSession(db, telegramId, SESSION_TYPE, { editing: 'region' });

    await telegram.sendMessage(
      chatId,
      '🌍 **編輯地區**\n\n' +
        '請輸入你的地區：\n\n' +
        '💡 提示：\n' +
        '• 例如：台北、香港、東京\n' +
        '• 最多 50 個字符'
    );
  } catch (error) {
    console.error('[handleEditRegion] Error:', error);
    await telegram.answerCallbackQuery(callbackQuery.id, '❌ 發生錯誤');
  }
}

/**
 * Handle edit interests callback
 */
export async function handleEditInterests(callbackQuery: TelegramCallbackQuery, env: Env): Promise<void> {
  const db = createDatabaseClient(env);
  const telegram = createTelegramService(env);
  const chatId = callbackQuery.message!.chat.id;
  const telegramId = callbackQuery.from.id.toString();

  try {
    await telegram.answerCallbackQuery(callbackQuery.id);
    await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);

    // Create session
    await upsertSession(db, telegramId, SESSION_TYPE, { editing: 'interests' });

    await telegram.sendMessage(
      chatId,
      '🏷️ **編輯興趣標籤**\n\n' +
        '請輸入你的興趣標籤（用逗號分隔）：\n\n' +
        '💡 提示：\n' +
        '• 例如：音樂, 電影, 旅行, 美食\n' +
        '• 最多 5 個標籤\n' +
        '• 每個標籤最多 20 個字符'
    );
  } catch (error) {
    console.error('[handleEditInterests] Error:', error);
    await telegram.answerCallbackQuery(callbackQuery.id, '❌ 發生錯誤');
  }
}

/**
 * Handle profile edit text input
 */
export async function handleProfileEditInput(message: TelegramMessage, env: Env): Promise<boolean> {
  const db = createDatabaseClient(env);
  const telegram = createTelegramService(env);
  const chatId = message.chat.id;
  const telegramId = message.from!.id.toString();
  const text = message.text || '';

  try {
    // Check if user has an active edit session
    const session = await getActiveSession(db, telegramId, SESSION_TYPE);
    if (!session) {
      return false; // Not in edit mode
    }

    const sessionData = parseSessionData(session);
    const editing = sessionData.data?.editing;

    if (!editing) {
      return false;
    }

    const user = await findUserByTelegramId(db, telegramId);
    if (!user) {
      return false;
    }

    // Handle different edit types
    switch (editing) {
      case 'nickname': {
        if (text.length > 36) {
          await telegram.sendMessage(chatId, '❌ 暱稱太長，請輸入不超過 36 個字符的暱稱。');
          return true;
        }

        await db.d1.prepare('UPDATE users SET nickname = ? WHERE telegram_id = ?')
          .bind(text, telegramId).run();

        await deleteSession(db, telegramId, SESSION_TYPE);
        await telegram.sendMessage(chatId, `✅ 暱稱已更新為：${text}`);
        return true;
      }

      case 'bio': {
        if (text.length > 200) {
          await telegram.sendMessage(chatId, '❌ 個人簡介太長，請輸入不超過 200 個字符。');
          return true;
        }

        // Check for URLs
        const { checkUrlWhitelist } = await import('~/utils/url-whitelist');
        const urlCheck = checkUrlWhitelist(text);
        if (!urlCheck.allowed) {
          await telegram.sendMessage(
            chatId,
            '❌ 個人簡介包含不允許的連結。\n\n' +
              '為了安全，只允許以下網域的連結：\n' +
              '• t.me (Telegram)\n' +
              '• telegram.org\n' +
              '• telegram.me\n\n' +
              `🚫 禁止的網址：\n${urlCheck.blockedUrls?.map(url => `• ${url}`).join('\n')}\n\n` +
              '請移除這些連結後重新輸入。'
          );
          return true;
        }

        await db.d1.prepare('UPDATE users SET bio = ? WHERE telegram_id = ?')
          .bind(text, telegramId).run();

        await deleteSession(db, telegramId, SESSION_TYPE);
        await telegram.sendMessage(chatId, `✅ 個人簡介已更新！\n\n${text}`);
        return true;
      }

      case 'region': {
        if (text.length > 50) {
          await telegram.sendMessage(chatId, '❌ 地區名稱太長，請輸入不超過 50 個字符。');
          return true;
        }

        await db.d1.prepare('UPDATE users SET region = ? WHERE telegram_id = ?')
          .bind(text, telegramId).run();

        await deleteSession(db, telegramId, SESSION_TYPE);
        await telegram.sendMessage(chatId, `✅ 地區已更新為：${text}`);
        return true;
      }

      case 'interests': {
        const interests = text.split(',').map(i => i.trim()).filter(i => i.length > 0);
        
        if (interests.length > 5) {
          await telegram.sendMessage(chatId, '❌ 最多只能設定 5 個興趣標籤。');
          return true;
        }

        if (interests.some(i => i.length > 20)) {
          await telegram.sendMessage(chatId, '❌ 每個標籤最多 20 個字符。');
          return true;
        }

        const interestsStr = interests.join(', ');
        await db.d1.prepare('UPDATE users SET interests = ? WHERE telegram_id = ?')
          .bind(interestsStr, telegramId).run();

        await deleteSession(db, telegramId, SESSION_TYPE);
        await telegram.sendMessage(chatId, `✅ 興趣標籤已更新：\n\n${interestsStr}`);
        return true;
      }

      default:
        return false;
    }
  } catch (error) {
    console.error('[handleProfileEditInput] Error:', error);
    return false;
  }
}

