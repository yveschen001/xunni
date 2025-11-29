/**
 * Tutorial Handler
 * Handles new user tutorial flow
 */

import type { Env, TelegramMessage, CallbackQuery } from '~/types';
import { createTelegramService } from '~/services/telegram';
import { createDatabaseClient } from '~/db/client';
import { findUserByTelegramId } from '~/db/queries/users';
import { getNextTutorialStep, type TutorialStep } from '~/domain/tutorial';
import { createI18n } from '~/i18n';

/**
 * Start tutorial
 */
export async function startTutorial(message: TelegramMessage, env: Env): Promise<void> {
  const telegram = createTelegramService(env);
  const db = createDatabaseClient(env.DB);
  const chatId = message.chat.id;
  const telegramId = message.from!.id.toString();

  try {
    const user = await findUserByTelegramId(db, telegramId);
    const i18n = createI18n(user?.language_pref || 'zh-TW');
    if (!user) {
      await telegram.sendMessage(chatId, i18n.t('errors.userNotFoundRegister'));
      return;
    }

    // Set tutorial step to welcome
    await db.d1
      .prepare('UPDATE users SET tutorial_step = ? WHERE telegram_id = ?')
      .bind('welcome', telegramId)
      .run();

    // Show welcome page
    await showWelcomePage(chatId, telegram, db, telegramId, i18n);
  } catch (error) {
    console.error('[startTutorial] Error:', error);
    const user = await findUserByTelegramId(db, telegramId);
    const errorI18n = createI18n(user?.language_pref || 'zh-TW');
    await telegram.sendMessage(chatId, errorI18n.t('error.text5'));
  }
}

/**
 * Handle tutorial callback
 */
export async function handleTutorialCallback(
  callbackQuery: CallbackQuery,
  action: string,
  env: Env
): Promise<void> {
  const telegram = createTelegramService(env);
  const db = createDatabaseClient(env.DB);
  const chatId = callbackQuery.message!.chat.id;
  const telegramId = callbackQuery.from.id.toString();

  try {
    const user = await findUserByTelegramId(db, telegramId);
    const i18n = createI18n(user?.language_pref || 'zh-TW');
    if (!user) {
      await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('error.userNotFound4'));
      return;
    }

    switch (action) {
      case 'tutorial_next':
        await handleTutorialNext(
          chatId,
          telegram,
          db,
          telegramId,
          user.tutorial_step as TutorialStep,
          i18n
        );
        break;

      case 'tutorial_skip':
        await handleTutorialSkip(chatId, telegram, db, telegramId, i18n);
        break;

      case 'tutorial_throw':
        await handleTutorialThrow(chatId, telegram, db, telegramId, env, i18n);
        break;

      case 'tutorial_catch':
        await handleTutorialCatch(chatId, telegram, db, telegramId, env, i18n);
        break;

      case 'tutorial_view_tasks':
        await handleTutorialViewTasks(chatId, telegram, db, telegramId, env, i18n);
        break;

      default:
        await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('errors.unknownAction'));
        return;
    }

    await telegram.answerCallbackQuery(callbackQuery.id);
  } catch (error) {
    console.error('[handleTutorialCallback] Error:', error);
    const user = await findUserByTelegramId(db, telegramId);
    const errorI18n = createI18n(user?.language_pref || 'zh-TW');
    await telegram.answerCallbackQuery(callbackQuery.id, errorI18n.t('errors.operationFailed'));
  }
}

/**
 * Show welcome page
 */
async function showWelcomePage(
  chatId: number,
  telegram: ReturnType<typeof createTelegramService>,
  _db: ReturnType<typeof createDatabaseClient>,
  _telegramId: string,
  i18n: ReturnType<typeof createI18n>
): Promise<void> {
  const message =
    i18n.t('tutorial.welcome') +
    '\n\n' +
    i18n.t('tutorial.whatIsXunNi') +
    '\n' +
    i18n.t('tutorial.whatIsXunNiDesc') +
    '\n\n' +
    i18n.t('tutorial.throwBottle') +
    '\n' +
    i18n.t('tutorial.throwBottleDesc') +
    '\n\n' +
    i18n.t('tutorial.catchBottle') +
    '\n' +
    i18n.t('tutorial.catchBottleDesc') +
    '\n\n' +
    i18n.t('tutorial.howToBecomeFriends') +
    '\n' +
    i18n.t('tutorial.howToBecomeFriendsDesc');

  await telegram.sendMessageWithButtons(chatId, message, [
    [{ text: i18n.t('tutorial.startUsing'), callback_data: 'tutorial_next' }],
    [{ text: i18n.t('tutorial.skip'), callback_data: 'tutorial_skip' }],
  ]);
}

/**
 * Show start using page
 */
async function showStartUsingPage(
  chatId: number,
  telegram: ReturnType<typeof createTelegramService>,
  i18n: ReturnType<typeof createI18n>
): Promise<void> {
  const message =
    i18n.t('tutorial.readyToStart') + '\n\n' + i18n.t('tutorial.completeTasksForBottles');

  await telegram.sendMessageWithButtons(chatId, message, [
    [
      { text: i18n.t('buttons.bottle3'), callback_data: 'tutorial_throw' },
      { text: i18n.t('buttons.bottle4'), callback_data: 'tutorial_catch' },
    ],
    [{ text: i18n.t('tutorial.viewTasks'), callback_data: 'tutorial_view_tasks' }],
  ]);
}

/**
 * Handle tutorial next
 */
async function handleTutorialNext(
  chatId: number,
  telegram: ReturnType<typeof createTelegramService>,
  db: ReturnType<typeof createDatabaseClient>,
  telegramId: string,
  currentStep: TutorialStep,
  i18n: ReturnType<typeof createI18n>
): Promise<void> {
  const nextStep = getNextTutorialStep(currentStep);

  if (!nextStep) {
    await telegram.sendMessage(chatId, i18n.t('tutorial.completed'));
    return;
  }

  // Update tutorial step
  await db.d1
    .prepare('UPDATE users SET tutorial_step = ? WHERE telegram_id = ?')
    .bind(nextStep, telegramId)
    .run();

  // Show next page
  switch (nextStep) {
    case 'start_using':
      await showStartUsingPage(chatId, telegram, i18n);
      break;

    case 'completed':
      await completeTutorial(chatId, telegram, db, telegramId, i18n);
      break;

    default:
      await telegram.sendMessage(chatId, i18n.t('tutorial.unknownStep'));
  }
}

/**
 * Handle tutorial skip
 */
async function handleTutorialSkip(
  chatId: number,
  telegram: ReturnType<typeof createTelegramService>,
  db: ReturnType<typeof createDatabaseClient>,
  telegramId: string,
  i18n: ReturnType<typeof createI18n>
): Promise<void> {
  await completeTutorial(chatId, telegram, db, telegramId, i18n);
  await telegram.sendMessage(
    chatId,
    i18n.t('tutorial.skipped') +
      '\n\n' +
      i18n.t('tutorial.availableCommands') +
      '\n' +
      i18n.t('tutorial.commandThrow') +
      '\n' +
      i18n.t('tutorial.commandCatch') +
      '\n' +
      i18n.t('tutorial.commandTasks') +
      '\n' +
      i18n.t('tutorial.commandHelp')
  );
}

/**
 * Handle tutorial throw
 */
async function handleTutorialThrow(
  chatId: number,
  telegram: ReturnType<typeof createTelegramService>,
  db: ReturnType<typeof createDatabaseClient>,
  telegramId: string,
  env: Env,
  i18n: ReturnType<typeof createI18n>
): Promise<void> {
  // Complete tutorial first
  await completeTutorial(chatId, telegram, db, telegramId, i18n);

  // Import and call handleThrow to start the throw flow
  const { handleThrow } = await import('./throw');

  // Create a mock message object for handleThrow
  const mockMessage = {
    chat: { id: chatId },
    from: { id: parseInt(telegramId) },
    text: '/throw',
  } as TelegramMessage;

  // Start throw flow
  await handleThrow(mockMessage, env);
}

/**
 * Handle tutorial catch
 */
async function handleTutorialCatch(
  chatId: number,
  telegram: ReturnType<typeof createTelegramService>,
  db: ReturnType<typeof createDatabaseClient>,
  telegramId: string,
  env: Env,
  i18n: ReturnType<typeof createI18n>
): Promise<void> {
  // Complete tutorial first
  await completeTutorial(chatId, telegram, db, telegramId, i18n);

  // Import and call handleCatch to start the catch flow
  const { handleCatch } = await import('./catch');

  // Create a mock message object for handleCatch
  const mockMessage = {
    chat: { id: chatId },
    from: { id: parseInt(telegramId) },
    text: '/catch',
  } as TelegramMessage;

  // Start catch flow
  await handleCatch(mockMessage, env);
}

/**
 * Handle tutorial view tasks
 */
async function handleTutorialViewTasks(
  chatId: number,
  telegram: ReturnType<typeof createTelegramService>,
  db: ReturnType<typeof createDatabaseClient>,
  telegramId: string,
  env: Env,
  i18n: ReturnType<typeof createI18n>
): Promise<void> {
  // Complete tutorial first
  await completeTutorial(chatId, telegram, db, telegramId, i18n);

  // Import and call handleTasks to show tasks
  const { handleTasks } = await import('./tasks');

  // Create a mock message object for handleTasks
  const mockMessage = {
    chat: { id: chatId },
    from: { id: parseInt(telegramId) },
    text: '/tasks',
  } as TelegramMessage;

  // Show tasks
  await handleTasks(mockMessage, env);
}

/**
 * Complete tutorial
 */
async function completeTutorial(
  _chatId: number,
  _telegram: ReturnType<typeof createTelegramService>,
  db: ReturnType<typeof createDatabaseClient>,
  telegramId: string,
  _i18n: ReturnType<typeof createI18n>
): Promise<void> {
  const now = new Date().toISOString();

  await db.d1
    .prepare(
      'UPDATE users SET tutorial_step = ?, tutorial_completed = ?, tutorial_completed_at = ? WHERE telegram_id = ?'
    )
    .bind('completed', 1, now, telegramId)
    .run();
}
