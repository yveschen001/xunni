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
import { createI18n } from '~/i18n';

// ============================================================================
// /mbti Command Handler
// ============================================================================

export async function handleMBTI(message: TelegramMessage, env: Env): Promise<void> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const chatId = message.chat.id;
  const telegramId = message.from!.id.toString();

  try {
    // Get user
    const user = await findUserByTelegramId(db, telegramId);
    if (!user) {
      const i18n = createI18n('zh-TW');
      await telegram.sendMessage(chatId, i18n.t('warnings.userNotFound'));
      return;
    }

    const i18n = createI18n(user.language_pref || 'zh-TW');

    // Build status message
    let statusMessage = i18n.t('common.mbti5') + '\n\n';

    if (user.mbti_result) {
      // User has MBTI set
      const descriptionKey = `mbti.description.${user.mbti_result}`;
      const description = i18n.t(descriptionKey as any);
      const sourceText =
        user.mbti_source === 'manual'
          ? i18n.t('common.mbti10').replace('✍️ 手動輸入 MBTI', '手動輸入')
          : user.mbti_source === 'test'
            ? i18n.t('common.short106')
            : i18n.t('catch.unknown');

      statusMessage +=
        i18n.t('common.mbti3', { user: { mbti_result: user.mbti_result } }) +
        '\n' +
        i18n.t('common.text43', { sourceText }) +
        '\n\n' +
        `${description}\n\n` +
        i18n.t('common.short58');
    } else {
      // User has no MBTI set
      statusMessage +=
        i18n.t('common.settings10') +
        '\n\n' +
        i18n.t('common.help') +
        '\n\n' +
        i18n.t('common.settings7');
    }

    // Show options
    await telegram.sendMessageWithButtons(chatId, statusMessage, [
      [{ text: i18n.t('common.mbti9'), callback_data: 'mbti_menu_test' }],
      [{ text: i18n.t('common.mbti10'), callback_data: 'mbti_menu_manual' }],
      [{ text: i18n.t('common.back2'), callback_data: 'edit_profile_callback' }],
    ]);
  } catch (error) {
    console.error('[handleMBTI] Error:', error);
    const errorI18n = createI18n('zh-TW');
    await telegram.sendMessage(chatId, errorI18n.t('errors.systemErrorRetry'));
  }
}

// ============================================================================
// MBTI Menu Handlers (called from callback queries)
// ============================================================================

/**
 * Handle "Take test" from /mbti menu - Show version selection
 */
export async function handleMBTIMenuTest(callbackQuery: any, env: Env): Promise<void> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const chatId = callbackQuery.message!.chat.id;
  const telegramId = callbackQuery.from.id.toString();

  try {
    const user = await findUserByTelegramId(db, telegramId);
    const i18n = createI18n(user?.language_pref || 'zh-TW');

    // Answer callback
    await telegram.answerCallbackQuery(callbackQuery.id);

    // Delete menu message
    await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);

    // Show version selection
    await telegram.sendMessageWithButtons(
      chatId,
      i18n.t('common.mbti4') +
        '\n\n' +
        i18n.t('common.text61') +
        '\n' +
        i18n.t('common.text106') +
        '\n' +
        i18n.t('success.text7') +
        '\n\n' +
        i18n.t('common.text62') +
        '\n' +
        i18n.t('common.text107') +
        '\n' +
        i18n.t('success.text13') +
        '\n' +
        i18n.t('success.text9') +
        '\n\n' +
        i18n.t('common.short21'),
      [
        [{ text: i18n.t('common.text117'), callback_data: 'mbti_test_quick' }],
        [{ text: i18n.t('common.text118'), callback_data: 'mbti_test_full' }],
        [{ text: i18n.t('buttons.back'), callback_data: 'mbti_menu_cancel' }],
      ]
    );
  } catch (error) {
    console.error('[handleMBTIMenuTest] Error:', error);
    const errorI18n = createI18n('zh-TW');
    await telegram.answerCallbackQuery(callbackQuery.id, errorI18n.t('errors.error.short4'));
  }
}

/**
 * Handle MBTI test version selection - Quick (12 questions)
 */
export async function handleMBTITestQuick(callbackQuery: any, env: Env): Promise<void> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const chatId = callbackQuery.message!.chat.id;
  const telegramId = callbackQuery.from.id.toString();

  try {
    // Start MBTI test (quick version)
    const { startMBTITest } = await import('~/services/mbti_test_service');
    await startMBTITest(db, telegramId, 'quick');

    const user = await findUserByTelegramId(db, telegramId);
    const i18n = createI18n(user?.language_pref || 'zh-TW');

    // Answer callback
    await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('success.start2'));

    // Delete menu message
    await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);

    // Show first question
    const { showMBTIQuestion } = await import('./mbti_test');
    await showMBTIQuestion(chatId, telegram, db, telegramId, 0);
  } catch (error) {
    console.error('[handleMBTITestQuick] Error:', error);
    const errorI18n = createI18n('zh-TW');
    await telegram.answerCallbackQuery(callbackQuery.id, errorI18n.t('errors.error.short4'));
  }
}

/**
 * Handle MBTI test version selection - Full (36 questions)
 */
export async function handleMBTITestFull(callbackQuery: any, env: Env): Promise<void> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const chatId = callbackQuery.message!.chat.id;
  const telegramId = callbackQuery.from.id.toString();

  try {
    // Start MBTI test (full version)
    const { startMBTITest } = await import('~/services/mbti_test_service');
    await startMBTITest(db, telegramId, 'full');

    const user = await findUserByTelegramId(db, telegramId);
    const i18n = createI18n(user?.language_pref || 'zh-TW');

    // Answer callback
    await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('success.start3'));

    // Delete menu message
    await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);

    // Show first question
    const { showMBTIQuestion } = await import('./mbti_test');
    await showMBTIQuestion(chatId, telegram, db, telegramId, 0);
  } catch (error) {
    console.error('[handleMBTITestFull] Error:', error);
    const errorI18n = createI18n('zh-TW');
    await telegram.answerCallbackQuery(callbackQuery.id, errorI18n.t('errors.error.short4'));
  }
}

/**
 * Handle "Manual entry" from /mbti menu
 */
export async function handleMBTIMenuManual(callbackQuery: any, env: Env): Promise<void> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const chatId = callbackQuery.message!.chat.id;
  const telegramId = callbackQuery.from.id.toString();

  try {
    const user = await findUserByTelegramId(db, telegramId);
    const i18n = createI18n(user?.language_pref || 'zh-TW');

    // Answer callback
    await telegram.answerCallbackQuery(callbackQuery.id);

    // Delete menu message
    await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);

    // Show 16 MBTI type buttons
    await telegram.sendMessageWithButtons(chatId, i18n.t('common.mbti8'), [
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
      [{ text: i18n.t('errors.error.cancel9'), callback_data: 'mbti_menu_cancel' }],
    ]);
  } catch (error) {
    console.error('[handleMBTIMenuManual] Error:', error);
    const errorI18n = createI18n('zh-TW');
    await telegram.answerCallbackQuery(callbackQuery.id, errorI18n.t('errors.error.short4'));
  }
}

/**
 * Handle "Clear MBTI" from /mbti menu
 */
export async function handleMBTIMenuClear(callbackQuery: any, env: Env): Promise<void> {
  const db = createDatabaseClient(env.DB);
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

    const user = await findUserByTelegramId(db, telegramId);
    const i18n = createI18n(user?.language_pref || 'zh-TW');

    // Answer callback
    await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('success.mbti3'));

    // Delete menu message
    await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);

    // Confirm
    await telegram.sendMessage(
      chatId,
      i18n.t('success.mbti2') +
        '\n\n' +
        i18n.t('common.settings9')
    );
  } catch (error) {
    console.error('[handleMBTIMenuClear] Error:', error);
    const errorI18n = createI18n('zh-TW');
    await telegram.answerCallbackQuery(callbackQuery.id, errorI18n.t('errors.error.short4'));
  }
}

/**
 * Handle "Cancel" from /mbti menu
 */
export async function handleMBTIMenuCancel(callbackQuery: any, env: Env): Promise<void> {
  const telegram = createTelegramService(env);
  const chatId = callbackQuery.message!.chat.id;

  try {
    const db = createDatabaseClient(env.DB);
    const telegramId = callbackQuery.from.id.toString();
    const user = await findUserByTelegramId(db, telegramId);
    const i18n = createI18n(user?.language_pref || 'zh-TW');

    // Answer callback
    await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('errors.error.cancel9'));

    // Delete menu message
    await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);

    // Return to MBTI menu (not just delete, but show the menu again)
    await handleMBTI({ chat: { id: chatId }, from: callbackQuery.from, text: '/mbti' } as any, env);
  } catch (error) {
    console.error('[handleMBTIMenuCancel] Error:', error);
    const errorI18n = createI18n('zh-TW');
    await telegram.answerCallbackQuery(callbackQuery.id, errorI18n.t('errors.error.short4'));
  }
}

/**
 * Handle MBTI type selection from /mbti menu
 */
export async function handleMBTISet(callbackQuery: any, mbtiType: string, env: Env): Promise<void> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const chatId = callbackQuery.message!.chat.id;
  const telegramId = callbackQuery.from.id.toString();

  try {
    const user = await findUserByTelegramId(db, telegramId);
    const i18n = createI18n(user?.language_pref || 'zh-TW');

    // Validate MBTI type
    const { validateMBTI } = await import('~/domain/user');
    const validation = validateMBTI(mbtiType);
    if (!validation.valid) {
      await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('errors.error.mbti'));
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
    await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('success.settings', { mbtiType }));

    // Delete selection message
    await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);

    // Get MBTI description from i18n
    const descriptionKey = `mbti.description.${mbtiType}`;
    const description = i18n.t(descriptionKey as any);

    // Show result
    await telegram.sendMessage(
      chatId,
      i18n.t('success.mbti', { mbtiType }) +
        '\n\n' +
        `${description}\n\n` +
        i18n.t('common.settings9')
    );
  } catch (error) {
    console.error('[handleMBTISet] Error:', error);
    const errorI18n = createI18n('zh-TW');
    await telegram.answerCallbackQuery(callbackQuery.id, errorI18n.t('errors.error.short4'));
  }
}
