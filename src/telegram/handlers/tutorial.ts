/**
 * Tutorial Handler
 * Handles new user tutorial flow
 */

import type { Env, TelegramMessage, CallbackQuery } from '~/types';
import { createTelegramService } from '~/services/telegram';
import { createDatabaseClient } from '~/db/client';
import { findUserByTelegramId } from '~/db/queries/users';
import { getNextTutorialStep, type TutorialStep } from '~/domain/tutorial';

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
    if (!user) {
      await telegram.sendMessage(chatId, '❌ 找不到用戶資料，請先使用 /start 註冊。');
      return;
    }
    
    // Set tutorial step to welcome
    await db.d1
      .prepare('UPDATE users SET tutorial_step = ? WHERE telegram_id = ?')
      .bind('welcome', telegramId)
      .run();
    
    // Show welcome page
    await showWelcomePage(chatId, telegram, db, telegramId);
  } catch (error) {
    console.error('[startTutorial] Error:', error);
    await telegram.sendMessage(chatId, '❌ 啟動教學時發生錯誤，請稍後再試。');
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
    if (!user) {
      await telegram.answerCallbackQuery(callbackQuery.id, '❌ 找不到用戶資料');
      return;
    }
    
    switch (action) {
      case 'tutorial_next':
        await handleTutorialNext(chatId, telegram, db, telegramId, user.tutorial_step as TutorialStep);
        break;
      
      case 'tutorial_skip':
        await handleTutorialSkip(chatId, telegram, db, telegramId);
        break;
      
      case 'tutorial_throw':
        await handleTutorialThrow(chatId, telegram, db, telegramId, env);
        break;
      
      case 'tutorial_catch':
        await handleTutorialCatch(chatId, telegram, db, telegramId, env);
        break;
      
      case 'tutorial_view_tasks':
        await handleTutorialViewTasks(chatId, telegram, db, telegramId, env);
        break;
      
      default:
        await telegram.answerCallbackQuery(callbackQuery.id, '❌ 未知操作');
        return;
    }
    
    await telegram.answerCallbackQuery(callbackQuery.id);
  } catch (error) {
    console.error('[handleTutorialCallback] Error:', error);
    await telegram.answerCallbackQuery(callbackQuery.id, '❌ 操作失敗');
  }
}

/**
 * Show welcome page
 */
async function showWelcomePage(
  chatId: number,
  telegram: ReturnType<typeof createTelegramService>,
  _db: ReturnType<typeof createDatabaseClient>,
  _telegramId: string
): Promise<void> {
  const message =
    '🎉 恭喜完成註冊！\n\n' +
    '🌊 **XunNi 是什麼？**\n' +
    '匿名漂流瓶交友平台，透過 MBTI 和星座幫你找到志同道合的朋友\n\n' +
    '📦 **丟出漂流瓶**\n' +
    '寫下你的心情或想法，系統會幫你找到合適的人\n\n' +
    '🎣 **撿起漂流瓶**\n' +
    '看看別人的漂流瓶，有興趣就回覆開始聊天\n\n' +
    '💬 **如何成為朋友？**\n' +
    '你撿瓶回覆 → 對方也回覆 → 開始匿名聊天';
  
  await telegram.sendMessageWithButtons(
    chatId,
    message,
    [
      [{ text: '開始使用 →', callback_data: 'tutorial_next' }],
      [{ text: '跳過', callback_data: 'tutorial_skip' }],
    ]
  );
}

/**
 * Show start using page
 */
async function showStartUsingPage(
  chatId: number,
  telegram: ReturnType<typeof createTelegramService>
): Promise<void> {
  const message =
    '🎉 **準備好了！開始交朋友吧～**\n\n' +
    '💡 完成任務可獲得額外瓶子';
  
  await telegram.sendMessageWithButtons(
    chatId,
    message,
    [
      [
        { text: '🌊 丟出漂流瓶', callback_data: 'tutorial_throw' },
        { text: '🎣 撿起漂流瓶', callback_data: 'tutorial_catch' },
      ],
      [{ text: '📋 查看任務', callback_data: 'tutorial_view_tasks' }],
    ]
  );
}

/**
 * Handle tutorial next
 */
async function handleTutorialNext(
  chatId: number,
  telegram: ReturnType<typeof createTelegramService>,
  db: ReturnType<typeof createDatabaseClient>,
  telegramId: string,
  currentStep: TutorialStep
): Promise<void> {
  const nextStep = getNextTutorialStep(currentStep);
  
  if (!nextStep) {
    await telegram.sendMessage(chatId, '✅ 教學已完成！');
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
      await showStartUsingPage(chatId, telegram);
      break;
    
    case 'completed':
      await completeTutorial(chatId, telegram, db, telegramId);
      break;
    
    default:
      await telegram.sendMessage(chatId, '❌ 未知的教學步驟');
  }
}

/**
 * Handle tutorial skip
 */
async function handleTutorialSkip(
  chatId: number,
  telegram: ReturnType<typeof createTelegramService>,
  db: ReturnType<typeof createDatabaseClient>,
  telegramId: string
): Promise<void> {
  await completeTutorial(chatId, telegram, db, telegramId);
  await telegram.sendMessage(
    chatId,
    '✅ 已跳過教學\n\n' +
    '你可以隨時使用以下命令：\n' +
    '• /throw - 丟出漂流瓶\n' +
    '• /catch - 撿起漂流瓶\n' +
    '• /tasks - 查看任務中心\n' +
    '• /help - 查看幫助'
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
  env: Env
): Promise<void> {
  // Complete tutorial first
  await completeTutorial(chatId, telegram, db, telegramId);
  
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
  env: Env
): Promise<void> {
  // Complete tutorial first
  await completeTutorial(chatId, telegram, db, telegramId);
  
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
  env: Env
): Promise<void> {
  // Complete tutorial first
  await completeTutorial(chatId, telegram, db, telegramId);
  
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
  telegramId: string
): Promise<void> {
  const now = new Date().toISOString();
  
  await db.d1
    .prepare(
      'UPDATE users SET tutorial_step = ?, tutorial_completed = ?, tutorial_completed_at = ? WHERE telegram_id = ?'
    )
    .bind('completed', 1, now, telegramId)
    .run();
}

