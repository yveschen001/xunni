import type { Env, TelegramMessage, TelegramCallbackQuery } from '~/types';
import type { Task } from '~/domain/task';
import { createDatabaseClient } from '~/db/client';
import { createTelegramService } from '~/services/telegram';
import { AdminTasksService } from '~/domain/admin/tasks';
import { upsertSession, getActiveSession, deleteSession } from '~/db/queries/sessions';
import { parseSessionData } from '~/domain/session';
import { isAdmin } from '~/domain/admin/auth';

const SESSION_TYPE = 'admin_task_wizard';

interface WizardData {
  step: 'icon' | 'name' | 'desc' | 'url' | 'verify_type' | 'target_id' | 'reward' | 'confirm';
  task_data: Partial<Task>;
  edit_id?: string;
}

/**
 * Handle /admin_tasks command
 */
export async function handleAdminTasks(message: TelegramMessage, env: Env): Promise<void> {
  const telegramId = message.from!.id.toString();
  if (!isAdmin(env, telegramId)) return;

  const telegram = createTelegramService(env);
  const service = new AdminTasksService(env.DB, env, telegramId);

  try {
    const tasks = await service.getTasks();

    let text = '📋 **任務管理系統**\n\n';

    // Group by category
    const systemTasks = tasks.filter((t) => t.category !== 'social');
    const socialTasks = tasks.filter((t) => t.category === 'social');

    text += `🔧 **系統任務** (${systemTasks.length})\n`;
    for (const t of systemTasks) {
      text += `${t.is_enabled ? '✅' : '⏸️'} ${t.name} (ID: ${t.id})\n`;
    }

    text += `\n📢 **社群任務** (${socialTasks.length})\n`;

    const buttons: any[][] = [];

    for (const t of socialTasks) {
      const statusEmoji = t.is_enabled ? '✅' : '⏸️';
      buttons.push([
        {
          text: `${statusEmoji} ${t.icon || '📢'} ${t.name}`,
          callback_data: `admin_task_view_${t.id}`,
        },
      ]);
    }

    // Actions
    buttons.push([{ text: '➕ 創建社群任務', callback_data: 'admin_task_create' }]);
    buttons.push([{ text: '🔄 刷新', callback_data: 'admin_task_refresh' }]);

    await telegram.sendMessageWithButtons(message.chat.id, text, buttons);
  } catch (error) {
    console.error('[handleAdminTasks] Error:', error);
    await telegram.sendMessage(message.chat.id, `❌ 錯誤: ${(error as Error).message}`);
  }
}

/**
 * Handle admin task callbacks
 */
export async function handleAdminTaskCallback(
  callbackQuery: TelegramCallbackQuery,
  env: Env
): Promise<void> {
  const telegramId = callbackQuery.from.id.toString();
  if (!isAdmin(env, telegramId)) return;

  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const service = new AdminTasksService(env.DB, env, telegramId);
  const chatId = callbackQuery.message!.chat.id;
  const data = callbackQuery.data!;

  try {
    await telegram.answerCallbackQuery(callbackQuery.id);

    if (data === 'admin_task_create') {
      await startTaskWizard(chatId, telegramId, env);
      return;
    }

    if (data === 'admin_task_refresh') {
      await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);
      await handleAdminTasks(callbackQuery.message!, env);
      return;
    }

    if (data.startsWith('admin_task_view_')) {
      const taskId = data.replace('admin_task_view_', '');
      const tasks = await service.getTasks();
      const task = tasks.find((t) => t.id === taskId);

      if (!task) {
        await telegram.sendMessage(chatId, '❌ 任務不存在');
        return;
      }

      const info = `
🆔 ID: \`${task.id}\`
📌 名稱: ${task.name}
📝 描述: ${task.description}
💰 獎勵: ${task.reward_amount} 瓶
🔗 URL: ${task.action_url || '無'}
🛡️ 驗證: ${task.verification_type === 'telegram_chat' ? 'Telegram 群組檢查' : '無 (點擊即領)'}
🎯 Target: ${task.target_id || '無'}
      `.trim();

      const buttons = [
        [
          {
            text: task.is_enabled ? '⏸️ 暫停' : '▶️ 啟用',
            callback_data: `admin_task_toggle_${task.id}`,
          },
          { text: '✏️ 編輯', callback_data: `admin_task_edit_${task.id}` },
        ],
        [{ text: '🗑️ 刪除', callback_data: `admin_task_delete_${task.id}` }],
        [{ text: '🔙 返回', callback_data: 'admin_task_refresh' }],
      ];

      await telegram.editMessageText(chatId, callbackQuery.message!.message_id, info, {
        reply_markup: { inline_keyboard: buttons },
      });
      return;
    }

    if (data.startsWith('admin_task_toggle_')) {
      const taskId = data.replace('admin_task_toggle_', '');
      const tasks = await service.getTasks();
      const task = tasks.find((t) => t.id === taskId);
      if (task) {
        await service.editTask(taskId, { is_enabled: !task.is_enabled });
        const newCallback = { ...callbackQuery, data: `admin_task_view_${taskId}` };
        await handleAdminTaskCallback(newCallback, env);
      }
      return;
    }

    if (data.startsWith('admin_task_delete_')) {
      const taskId = data.replace('admin_task_delete_', '');
      await service.deleteTask(taskId);
      await telegram.sendMessage(chatId, '✅ 任務已刪除');
      await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);
      await handleAdminTasks(callbackQuery.message!, env);
      return;
    }

    // Wizard callbacks
    if (data.startsWith('wizard_icon_')) {
      const icon = data.replace('wizard_icon_', '');
      await updateWizardStep(chatId, telegramId, { step: 'name', task_data: { icon } }, env);
      return;
    }

    if (data.startsWith('wizard_verify_')) {
      const type = data.replace('wizard_verify_', '') as 'none' | 'telegram_chat';
      if (type === 'telegram_chat') {
        await updateWizardStep(
          chatId,
          telegramId,
          { step: 'target_id', task_data: { verification_type: type } },
          env
        );
      } else {
        await updateWizardStep(
          chatId,
          telegramId,
          { step: 'reward', task_data: { verification_type: type } },
          env
        );
      }
      return;
    }

    if (data === 'wizard_confirm_task') {
      await finalizeTaskWizard(chatId, telegramId, env);
      return;
    }

    if (data === 'wizard_cancel_task') {
      await deleteSession(db, telegramId, SESSION_TYPE);
      await telegram.sendMessage(chatId, '🚫 操作已取消');
      return;
    }
  } catch (error) {
    console.error('[handleAdminTaskCallback] Error:', error);
    await telegram.sendMessage(chatId, `❌ 錯誤: ${(error as Error).message}`);
  }
}

/**
 * Handle admin task input
 */
export async function handleAdminTaskInput(message: TelegramMessage, env: Env): Promise<boolean> {
  const telegramId = message.from!.id.toString();
  if (!isAdmin(env, telegramId)) return false;

  const db = createDatabaseClient(env.DB);
  const session = await getActiveSession(db, telegramId, SESSION_TYPE);
  if (!session) return false;

  const text = message.text || '';
  if (text.startsWith('/')) {
    await deleteSession(db, telegramId, SESSION_TYPE);
    return false;
  }

  await handleTaskWizardInput(message.chat.id, telegramId, text, env, session);
  return true;
}

// ============================================================================
// Wizard Logic
// ============================================================================

async function startTaskWizard(chatId: number, telegramId: string, env: Env) {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);

  // Generate a unique ID for new task
  const newId = `task_social_${Date.now()}`;

  const initialData: WizardData = {
    step: 'icon',
    task_data: { id: newId },
  };

  await upsertSession(db, telegramId, SESSION_TYPE, { data: initialData });

  await telegram.sendMessageWithButtons(chatId, '🆕 **創建社群任務**\n\n請選擇圖示：', [
    [
      { text: '📢', callback_data: 'wizard_icon_📢' },
      { text: '🐦', callback_data: 'wizard_icon_🐦' },
      { text: '✈️', callback_data: 'wizard_icon_✈️' },
      { text: '📸', callback_data: 'wizard_icon_📸' },
    ],
    [
      { text: '🌐', callback_data: 'wizard_icon_🌐' },
      { text: '💬', callback_data: 'wizard_icon_💬' },
      { text: '📺', callback_data: 'wizard_icon_📺' },
      { text: '🎮', callback_data: 'wizard_icon_🎮' },
    ],
    [{ text: '🚫 取消', callback_data: 'wizard_cancel_task' }],
  ]);
}

async function updateWizardStep(
  chatId: number,
  telegramId: string,
  updates: { step?: WizardData['step']; task_data?: Partial<Task> },
  env: Env
) {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);

  const session = await getActiveSession(db, telegramId, SESSION_TYPE);
  if (!session) return;

  const currentData = parseSessionData(session).data as WizardData;
  const newData: WizardData = {
    ...currentData,
    step: updates.step || currentData.step,
    task_data: { ...currentData.task_data, ...updates.task_data },
  };

  await upsertSession(db, telegramId, SESSION_TYPE, { data: newData });

  switch (newData.step) {
    case 'name':
      await telegram.sendMessage(chatId, '請輸入 **任務名稱** (Max 20字):\n(系統將自動翻譯)');
      break;
    case 'desc':
      await telegram.sendMessage(chatId, '請輸入 **任務描述** (Max 50字):\n(系統將自動翻譯)');
      break;
    case 'url':
      await telegram.sendMessage(chatId, '請輸入 **跳轉 URL** (https://...):');
      break;
    case 'verify_type':
      await telegram.sendMessageWithButtons(chatId, '請選擇 **驗證方式**:', [
        [{ text: '無需驗證 (點擊即領)', callback_data: 'wizard_verify_none' }],
        [{ text: 'Telegram 群組/頻道檢查', callback_data: 'wizard_verify_telegram_chat' }],
      ]);
      break;
    case 'target_id':
      await telegram.sendMessage(chatId, '請輸入 **Target ID** (@channel 或 Chat ID):');
      break;
    case 'reward':
      await telegram.sendMessage(chatId, '請輸入 **獎勵瓶子數** (1-10):');
      break;
    case 'confirm': {
      const t = newData.task_data;
      const msg = `
🔍 **確認內容**

圖示: ${t.icon}
名稱: ${t.name}
描述: ${t.description}
URL: ${t.action_url}
驗證: ${t.verification_type}
Target: ${t.target_id || 'N/A'}
獎勵: ${t.reward_amount}

確認創建?
`;
      await telegram.sendMessageWithButtons(chatId, msg, [
        [{ text: '🚀 確認發布', callback_data: 'wizard_confirm_task' }],
        [{ text: '🚫 取消', callback_data: 'wizard_cancel_task' }],
      ]);
      break;
    }
  }
}

async function handleTaskWizardInput(
  chatId: number,
  telegramId: string,
  text: string,
  env: Env,
  session: any
) {
  const data = parseSessionData(session).data as WizardData;
  const telegram = createTelegramService(env);

  switch (data.step) {
    case 'name': {
      if (text.length > 20) return telegram.sendMessage(chatId, '❌ 名稱太長 (Max 20字)');
      await updateWizardStep(chatId, telegramId, { step: 'desc', task_data: { name: text } }, env);
      break;
    }
    case 'desc': {
      if (text.length > 50) return telegram.sendMessage(chatId, '❌ 描述太長 (Max 50字)');
      await updateWizardStep(
        chatId,
        telegramId,
        { step: 'url', task_data: { description: text } },
        env
      );
      break;
    }
    case 'url': {
      try {
        new URL(text);
        await updateWizardStep(
          chatId,
          telegramId,
          { step: 'verify_type', task_data: { action_url: text } },
          env
        );
      } catch {
        return telegram.sendMessage(chatId, '❌ 無效 URL');
      }
      break;
    }
    case 'target_id': {
      await updateWizardStep(
        chatId,
        telegramId,
        { step: 'reward', task_data: { target_id: text } },
        env
      );
      break;
    }
    case 'reward': {
      const amount = parseInt(text, 10);
      if (isNaN(amount) || amount < 1 || amount > 10)
        return telegram.sendMessage(chatId, '❌ 請輸入 1-10');
      await updateWizardStep(
        chatId,
        telegramId,
        { step: 'confirm', task_data: { reward_amount: amount } },
        env
      );
      break;
    }
  }
}

async function finalizeTaskWizard(chatId: number, telegramId: string, env: Env) {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const service = new AdminTasksService(env.DB, env, telegramId);

  const session = await getActiveSession(db, telegramId, SESSION_TYPE);
  if (!session) return;

  const data = parseSessionData(session).data as WizardData;

  try {
    await service.createSocialTask(data.task_data as any);
    await deleteSession(db, telegramId, SESSION_TYPE);
    await telegram.sendMessage(chatId, '✅ 任務創建成功');
    const fakeMessage = { chat: { id: chatId }, from: { id: parseInt(telegramId) } } as any;
    await handleAdminTasks(fakeMessage, env);
  } catch (error) {
    console.error('[finalizeTaskWizard] Error:', error);
    await telegram.sendMessage(chatId, `❌ 錯誤: ${(error as Error).message}`);
  }
}
