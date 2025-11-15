/**
 * /mbti Command Handler
 * 
 * Allows users to view, set, or retake their MBTI test.
 * Can be used both during onboarding and after registration.
 */

import type { Env, TelegramMessage } from '~/types';
import { createDatabaseClient } from '~/db/client';
import { findUserByTelegramId } from '~/db/queries/users';
import { createTelegramService } from '~/services/telegram';
import { MBTI_DESCRIPTIONS } from '~/domain/mbti_test';

// ============================================================================
// /mbti Command Handler
// ============================================================================

export async function handleMBTI(message: TelegramMessage, env: Env): Promise<void> {
  const db = createDatabaseClient(env);
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

    // Build status message
    let statusMessage = '🧠 **MBTI 性格類型管理**\n\n';

    if (user.mbti_result) {
      // User has MBTI set
      const description = MBTI_DESCRIPTIONS[user.mbti_result];
      const sourceText = user.mbti_source === 'manual' ? '手動輸入' : user.mbti_source === 'test' ? '測驗結果' : '未知';

      statusMessage +=
        `當前 MBTI：**${user.mbti_result}**\n` +
        `來源：${sourceText}\n\n` +
        `${description?.zh_TW || ''}\n\n` +
        `你可以：`;
    } else {
      // User has no MBTI set
      statusMessage +=
        `你還沒有設定 MBTI 類型。\n\n` +
        `MBTI 性格測驗可以幫助我們為你找到更合適的聊天對象～\n\n` +
        `你想要如何設定？`;
    }

    // Show options
    await telegram.sendMessageWithButtons(
      chatId,
      statusMessage,
      [
        [
          { text: '📝 重新進行測驗', callback_data: 'mbti_menu_test' },
        ],
        [
          { text: '✍️ 手動輸入 MBTI', callback_data: 'mbti_menu_manual' },
        ],
        ...(user.mbti_result
          ? [
              [
                { text: '🗑️ 清除 MBTI', callback_data: 'mbti_menu_clear' },
              ],
            ]
          : []),
        [
          { text: '❌ 取消', callback_data: 'mbti_menu_cancel' },
        ],
      ]
    );
  } catch (error) {
    console.error('[handleMBTI] Error:', error);
    await telegram.sendMessage(chatId, '❌ 發生錯誤，請稍後再試。');
  }
}

// ============================================================================
// MBTI Menu Handlers (called from callback queries)
// ============================================================================

/**
 * Handle "Take test" from /mbti menu
 */
export async function handleMBTIMenuTest(
  callbackQuery: any,
  env: Env
): Promise<void> {
  const db = createDatabaseClient(env);
  const telegram = createTelegramService(env);
  const chatId = callbackQuery.message!.chat.id;
  const telegramId = callbackQuery.from.id.toString();

  try {
    // Start MBTI test
    const { startMBTITest } = await import('~/services/mbti_test_service');
    await startMBTITest(db, telegramId);

    // Answer callback
    await telegram.answerCallbackQuery(callbackQuery.id, '✅ 開始測驗');

    // Delete menu message
    await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);

    // Show first question
    const { showMBTIQuestion } = await import('./mbti_test');
    await showMBTIQuestion(chatId, telegram, db, telegramId, 0);
  } catch (error) {
    console.error('[handleMBTIMenuTest] Error:', error);
    await telegram.answerCallbackQuery(callbackQuery.id, '❌ 發生錯誤');
  }
}

/**
 * Handle "Manual entry" from /mbti menu
 */
export async function handleMBTIMenuManual(
  callbackQuery: any,
  env: Env
): Promise<void> {
  const telegram = createTelegramService(env);
  const chatId = callbackQuery.message!.chat.id;

  try {
    // Answer callback
    await telegram.answerCallbackQuery(callbackQuery.id);

    // Delete menu message
    await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);

    // Show 16 MBTI type buttons
    await telegram.sendMessageWithButtons(
      chatId,
      `請選擇你的 MBTI 類型：`,
      [
        [
          { text: 'INTJ', callback_data: 'mbti_set_INTJ' },
          { text: 'INTP', callback_data: 'mbti_set_INTP' },
          { text: 'ENTJ', callback_data: 'mbti_set_ENTJ' },
          { text: 'ENTP', callback_data: 'mbti_set_ENTP' },
        ],
        [
          { text: 'INFJ', callback_data: 'mbti_set_INFJ' },
          { text: 'INFP', callback_data: 'mbti_set_INFP' },
          { text: 'ENFJ', callback_data: 'mbti_set_ENFJ' },
          { text: 'ENFP', callback_data: 'mbti_set_ENFP' },
        ],
        [
          { text: 'ISTJ', callback_data: 'mbti_set_ISTJ' },
          { text: 'ISFJ', callback_data: 'mbti_set_ISFJ' },
          { text: 'ESTJ', callback_data: 'mbti_set_ESTJ' },
          { text: 'ESFJ', callback_data: 'mbti_set_ESFJ' },
        ],
        [
          { text: 'ISTP', callback_data: 'mbti_set_ISTP' },
          { text: 'ISFP', callback_data: 'mbti_set_ISFP' },
          { text: 'ESTP', callback_data: 'mbti_set_ESTP' },
          { text: 'ESFP', callback_data: 'mbti_set_ESFP' },
        ],
        [
          { text: '❌ 取消', callback_data: 'mbti_menu_cancel' },
        ],
      ]
    );
  } catch (error) {
    console.error('[handleMBTIMenuManual] Error:', error);
    await telegram.answerCallbackQuery(callbackQuery.id, '❌ 發生錯誤');
  }
}

/**
 * Handle "Clear MBTI" from /mbti menu
 */
export async function handleMBTIMenuClear(
  callbackQuery: any,
  env: Env
): Promise<void> {
  const db = createDatabaseClient(env);
  const telegram = createTelegramService(env);
  const chatId = callbackQuery.message!.chat.id;
  const telegramId = callbackQuery.from.id.toString();

  try {
    // Clear MBTI
    const now = new Date().toISOString();
    await db.d1
      .prepare(
        `UPDATE users
         SET mbti_result = NULL, mbti_source = NULL, mbti_completed_at = NULL, updated_at = ?
         WHERE telegram_id = ?`
      )
      .bind(now, telegramId)
      .run();

    // Answer callback
    await telegram.answerCallbackQuery(callbackQuery.id, '✅ MBTI 已清除');

    // Delete menu message
    await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);

    // Confirm
    await telegram.sendMessage(
      chatId,
      `✅ 你的 MBTI 類型已清除。\n\n` +
        `你可以隨時使用 /mbti 指令重新設定。`
    );
  } catch (error) {
    console.error('[handleMBTIMenuClear] Error:', error);
    await telegram.answerCallbackQuery(callbackQuery.id, '❌ 發生錯誤');
  }
}

/**
 * Handle "Cancel" from /mbti menu
 */
export async function handleMBTIMenuCancel(
  callbackQuery: any,
  env: Env
): Promise<void> {
  const telegram = createTelegramService(env);
  const chatId = callbackQuery.message!.chat.id;

  try {
    // Answer callback
    await telegram.answerCallbackQuery(callbackQuery.id, '已取消');

    // Delete menu message
    await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);
  } catch (error) {
    console.error('[handleMBTIMenuCancel] Error:', error);
    await telegram.answerCallbackQuery(callbackQuery.id, '❌ 發生錯誤');
  }
}

/**
 * Handle MBTI type selection from /mbti menu
 */
export async function handleMBTISet(
  callbackQuery: any,
  mbtiType: string,
  env: Env
): Promise<void> {
  const db = createDatabaseClient(env);
  const telegram = createTelegramService(env);
  const chatId = callbackQuery.message!.chat.id;
  const telegramId = callbackQuery.from.id.toString();

  try {
    // Validate MBTI type
    const { validateMBTI } = await import('~/domain/user');
    const validation = validateMBTI(mbtiType);
    if (!validation.valid) {
      await telegram.answerCallbackQuery(callbackQuery.id, '❌ 無效的 MBTI 類型');
      return;
    }

    // Save MBTI result with source = 'manual'
    const now = new Date().toISOString();
    await db.d1
      .prepare(
        `UPDATE users
         SET mbti_result = ?, mbti_source = 'manual', mbti_completed_at = ?, updated_at = ?
         WHERE telegram_id = ?`
      )
      .bind(mbtiType, now, now, telegramId)
      .run();

    // Answer callback
    await telegram.answerCallbackQuery(callbackQuery.id, `✅ MBTI 已設定為 ${mbtiType}`);

    // Delete selection message
    await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);

    // Get MBTI description
    const description = MBTI_DESCRIPTIONS[mbtiType];

    // Show result
    await telegram.sendMessage(
      chatId,
      `✅ 你的 MBTI 類型已更新為：**${mbtiType}**\n\n` +
        `${description?.zh_TW || ''}\n\n` +
        `你可以隨時使用 /mbti 指令重新設定。`
    );
  } catch (error) {
    console.error('[handleMBTISet] Error:', error);
    await telegram.answerCallbackQuery(callbackQuery.id, '❌ 發生錯誤');
  }
}

