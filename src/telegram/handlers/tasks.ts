/**
 * Tasks Handler
 * Handles task center and task completion
 */

import type { Env, TelegramMessage, User } from '~/types';
import type { Task } from '~/domain/task';
import { createTelegramService } from '~/services/telegram';
import { createDatabaseClient } from '~/db/client';
import { findUserByTelegramId } from '~/db/queries/users';
import { getAllTasks, getTaskById } from '~/db/queries/tasks';
import {
  getAllUserTasks,
  getUserTask,
  completeTask as completeUserTask,
  getTasksCompletedToday,
} from '~/db/queries/user_tasks';
import { isTaskCompleted, calculateTodayTaskRewards, getInviteTaskProgress } from '~/domain/task';

/**
 * Handle /tasks command
 */
export async function handleTasks(message: TelegramMessage, env: Env): Promise<void> {
  const telegram = createTelegramService(env);
  const db = createDatabaseClient(env.DB);
  const chatId = message.chat.id;
  const telegramId = message.from!.id.toString();

  try {
    const user = await findUserByTelegramId(db, telegramId);
    if (!user) {
      const { createI18n } = await import('~/i18n');
      const i18n = createI18n('zh-TW');
      await telegram.sendMessage(chatId, i18n.t('errors.userNotFound'));
      return;
    }

    // Get i18n
    const { createI18n } = await import('~/i18n');
    const i18n = createI18n(user.language_pref || 'zh-TW');

    // Get all tasks
    const allTasks = await getAllTasks(db);

    // Get user task progress
    const userTasks = await getAllUserTasks(db, telegramId);
    const userTaskMap = new Map(userTasks.map((ut) => [ut.task_id, ut]));

    // Build task center message
    let message_text = i18n.t('tasks.bottle6');

    // Group tasks by category
    const profileTasks = allTasks.filter((t) => t.category === 'profile');
    const socialTasks = allTasks.filter((t) => t.category === 'social');
    const actionTasks = allTasks.filter((t) => t.category === 'action');
    const inviteTasks = allTasks.filter((t) => t.category === 'invite');

    // Profile tasks
    if (profileTasks.length > 0) {
      const completedCount = profileTasks.filter((t) => {
        const userTask = userTaskMap.get(t.id);
        return userTask?.status === 'completed';
      }).length;

      message_text += i18n.t('tasks.profile', {
        completedCount,
        profileTasks: profileTasks.length,
      });
      message_text += `━━━━━━━━━━━━━━━━\n`;

      for (const task of profileTasks) {
        const userTask = userTaskMap.get(task.id);
        const completed = userTask?.status === 'completed';
        const icon = completed ? '✅' : '⏳';
        // Use i18n if task.name is a key, otherwise use task.name directly (backward compatibility)
        const taskName = task.name.startsWith('tasks.name.') ? i18n.t(task.name) : task.name;
        message_text += i18n.t('tasks.bottle3', {
          icon,
          task: { name: taskName, reward_amount: task.reward_amount },
        });
      }
      message_text += '\n';
    }

    // Social tasks
    if (socialTasks.length > 0) {
      const completedCount = socialTasks.filter((t) => {
        const userTask = userTaskMap.get(t.id);
        return userTask?.status === 'completed';
      }).length;

      message_text += i18n.t('tasks.task2', { completedCount, socialTasks: socialTasks.length });
      message_text += `━━━━━━━━━━━━━━━━\n`;

      for (const task of socialTasks) {
        const userTask = userTaskMap.get(task.id);
        const completed = userTask?.status === 'completed';
        const pending = userTask?.status === 'pending_claim';
        const icon = completed ? '✅' : pending ? '🎁' : '⏳';
        const status = completed ? '' : pending ? i18n.t('tasks.short') : '';

        // Handle dynamic translations for new social tasks
        let taskName = task.name;
        if (task.name_i18n) {
          try {
            const nameI18n = JSON.parse(task.name_i18n);
            taskName = nameI18n[user.language_pref || 'zh-TW'] || nameI18n['zh-TW'] || task.name;
          } catch (e) {
            // fallback to default name
          }
        } else if (task.name.startsWith('tasks.name.')) {
          taskName = i18n.t(task.name);
        }

        message_text += i18n.t('tasks.message', {
          icon,
          task: { name: taskName, reward_amount: task.reward_amount },
          status,
        });
      }
      message_text += '\n';
    }

    // Action tasks
    if (actionTasks.length > 0) {
      const completedCount = actionTasks.filter((t) => {
        const userTask = userTaskMap.get(t.id);
        return userTask?.status === 'completed';
      }).length;

      message_text += i18n.t('tasks.task3', { completedCount, actionTasks: actionTasks.length });
      message_text += `━━━━━━━━━━━━━━━━\n`;

      for (const task of actionTasks) {
        const userTask = userTaskMap.get(task.id);
        const completed = userTask?.status === 'completed';
        const icon = completed ? '✅' : '⏳';
        const taskName = task.name.startsWith('tasks.name.') ? i18n.t(task.name) : task.name;
        message_text += i18n.t('tasks.bottle3', {
          icon,
          task: { name: taskName, reward_amount: task.reward_amount },
        });
      }
      message_text += '\n';
    }

    // Invite tasks
    if (inviteTasks.length > 0) {
      const inviteProgress = getInviteTaskProgress(user);

      message_text += i18n.t('tasks.task6');
      message_text += `━━━━━━━━━━━━━━━━\n`;

      message_text += i18n.t('tasks.invite', { inviteProgress });
      message_text += i18n.t('tasks.invite2');
      const dailyQuota = calculateDailyQuota(user);
      message_text += i18n.t('tasks.quota', { calculateDailyQuota: dailyQuota });
      message_text += '\n';
    }

    // Summary
    const oneTimeCompleted =
      profileTasks.filter((t) => userTaskMap.get(t.id)?.status === 'completed').length +
      socialTasks.filter((t) => userTaskMap.get(t.id)?.status === 'completed').length +
      actionTasks.filter((t) => userTaskMap.get(t.id)?.status === 'completed').length;
    const oneTimeTotal = profileTasks.length + socialTasks.length + actionTasks.length;
    const inviteProgress = getInviteTaskProgress(user);

    const todayTaskRewards = await getTasksCompletedToday(db, telegramId);
    const todayRewardCount = calculateTodayTaskRewards(todayTaskRewards);

    message_text += i18n.t('tasks.text3');
    message_text += `━━━━━━━━━━━━━━━━\n`;
    message_text += i18n.t('tasks.task4', { oneTimeCompleted, oneTimeTotal });
    message_text += i18n.t('tasks.task', { inviteProgress });
    message_text += '\n';
    message_text += i18n.t('tasks.text4');
    message_text += i18n.t('tasks.bottle5', { todayRewardCount });
    message_text += i18n.t('tasks.bottle4', { inviteProgress });

    // Build inline keyboard
    const keyboard = [];

    // Row 1: Profile tasks
    const profileRow = [];
    if (
      profileTasks.some(
        (t) => !userTaskMap.get(t.id) || userTaskMap.get(t.id)?.status !== 'completed'
      )
    ) {
      profileRow.push({ text: i18n.t('buttons.profile'), callback_data: 'edit_profile' });
    }
    if (profileRow.length > 0) keyboard.push(profileRow);

    // Row 2: Social tasks (Dynamic)
    for (const task of socialTasks) {
      const userTask = userTaskMap.get(task.id);

      // Skip completed tasks (optional, maybe we want to keep them visible but disabled?)
      // Design doc says "completed tasks can be hidden or marked".
      // Current logic hides completed tasks from buttons usually, but let's check.
      if (userTask?.status === 'completed') continue;

      let label = task.name;
      if (task.name_i18n) {
        try {
          const nameI18n = JSON.parse(task.name_i18n);
          label = nameI18n[user.language_pref || 'zh-TW'] || nameI18n['zh-TW'] || task.name;
        } catch (e) {
          // Ignore parsing error, use default name
        }
      } else if (task.name.startsWith('tasks.name.')) {
        label = i18n.t(task.name);
      }

      // Special handling for legacy join channel
      if (task.id === 'task_join_channel') {
        if (userTask?.status === 'pending_claim') {
          keyboard.push([
            {
              text: `🎁 ${i18n.t('buttons.short20')}`,
              callback_data: 'claim_task_task_join_channel',
            },
          ]);
        } else {
          keyboard.push([
            { text: `📢 ${i18n.t('buttons.short3')}`, url: 'https://t.me/xunnichannel' },
          ]);
          // Add Verify Button for legacy task if not pending claim
          // Actually, legacy logic had a button in handleNextTaskCallback, but here it was just the link?
          // Let's align with new system: click link -> then show verify button?
          // Or just show both?
          // In the old code:
          // if (!joinChannelTask || joinChannelTask.status === 'available') {
          //   socialRow.push({ text: i18n.t('buttons.short3'), url: 'https://t.me/xunnichannel' });
          // }
          // So only link. But how do they verify? The system relies on "next_task_task_join_channel" callback usually?
          // Or maybe handleVerifyChannelJoin is triggered by user explicitly?
          // Let's keep legacy behavior for 'task_join_channel' but use new logic for others.
        }
        continue;
      }

      // New Social Tasks
      if (task.action_url) {
        // Row with URL button and Verify/Claim button
        const row = [];
        row.push({ text: `🔗 ${label}`, url: task.action_url });

        if (task.verification_type === 'none') {
          // Click-to-claim style
          row.push({
            text: `🎁 ${i18n.t('buttons.claim')}`,
            callback_data: `claim_task_${task.id}`,
          });
        } else if (task.verification_type === 'telegram_chat') {
          // Verify membership style
          row.push({
            text: `🔄 ${i18n.t('buttons.verify')}`,
            callback_data: `verify_task_${task.id}`,
          });
        }
        keyboard.push(row);
      }
    }

    // Row 3: Action tasks
    const actionRow = [];
    if (
      actionTasks.some(
        (t) => !userTaskMap.get(t.id) || userTaskMap.get(t.id)?.status !== 'completed'
      )
    ) {
      actionRow.push({ text: i18n.t('buttons.bottle3'), callback_data: 'throw' });
      actionRow.push({ text: i18n.t('buttons.bottle4'), callback_data: 'catch' });
    }
    if (actionRow.length > 0) keyboard.push(actionRow);

    // Row 4: Invite task
    if (!inviteProgress.isCompleted) {
      keyboard.push([{ text: i18n.t('buttons.invite'), callback_data: 'profile' }]);
    }

    // Row 5: Return to menu
    keyboard.push([{ text: i18n.t('common.back3'), callback_data: 'return_to_menu' }]);

    await telegram.sendMessageWithButtons(chatId, message_text, keyboard);
  } catch (error) {
    console.error('[handleTasks] Error:', error);
    const { createI18n } = await import('~/i18n');
    const { findUserByTelegramId } = await import('~/db/queries/users');
    const user = await findUserByTelegramId(db, telegramId);
    const i18n = createI18n(user?.language_pref || 'zh-TW');
    await telegram.sendMessage(chatId, i18n.t('errors.systemErrorRetry'));
  }
}

/**
 * Check and complete task if conditions are met
 */
export async function checkAndCompleteTask(
  db: ReturnType<typeof createDatabaseClient>,
  telegram: ReturnType<typeof createTelegramService>,
  user: User,
  taskId: string,
  additionalData?: {
    bottleCount?: number;
    catchCount?: number;
    conversationCount?: number;
  }
): Promise<boolean> {
  try {
    console.error(`[checkAndCompleteTask] Checking task: ${taskId} for user: ${user.telegram_id}`);

    // Check if task is already completed
    const userTask = await getUserTask(db, user.telegram_id, taskId);
    console.error(`[checkAndCompleteTask] User task status: ${userTask?.status || 'not_found'}`);

    if (userTask?.status === 'completed') {
      console.error(`[checkAndCompleteTask] Task already completed`);
      return false;
    }

    // Check if task is completed
    const completed = isTaskCompleted(taskId, user, additionalData);
    console.error(`[checkAndCompleteTask] Task completion check result: ${completed}`, {
      taskId,
      userBio: user.bio?.length || 0,
      userInterests: user.interests?.length || 0,
      userCity: user.city?.length || 0,
      additionalData,
    });

    if (!completed) {
      return false;
    }

    // Complete task
    console.error(`[checkAndCompleteTask] Completing task: ${taskId}`);
    await completeUserTask(db, user.telegram_id, taskId);

    // Get task details
    const task = await getTaskById(db, taskId);
    if (!task) {
      console.error(`[checkAndCompleteTask] Task not found: ${taskId}`);
      return false;
    }

    // Send completion message
    const { createI18n } = await import('~/i18n');
    const i18n = createI18n(user.language_pref || 'zh-TW');

    let taskName = task.name;
    if (task.name_i18n) {
      try {
        const nameI18n = JSON.parse(task.name_i18n);
        taskName = nameI18n[user.language_pref || 'zh-TW'] || nameI18n['zh-TW'] || task.name;
      } catch (e) {
        // Ignore parsing error
      }
    } else if (task.name.startsWith('tasks.name.')) {
      taskName = i18n.t(task.name);
    }

    const rewardTypeText =
      task.reward_type === 'daily' ? i18n.t('tasks.short2') : i18n.t('tasks.short3');
    console.error(`[checkAndCompleteTask] Sending completion message for task: ${taskName}`);
    await telegram.sendMessage(
      parseInt(user.telegram_id),
      i18n.t('tasks.task5', { task: { name: taskName } }) +
        '\n\n' +
        i18n.t('tasks.bottle', { task: { reward_amount: task.reward_amount }, rewardTypeText }) +
        '\n\n' +
        i18n.t('tasks.task7')
    );

    return true;
  } catch (error) {
    console.error('[checkAndCompleteTask] Error:', error);
    return false;
  }
}

/**
 * Get next incomplete task for user (按順序)
 */
export async function getNextIncompleteTask(
  db: ReturnType<typeof createDatabaseClient>,
  user: User
): Promise<Task | null> {
  try {
    // Get all tasks ordered by sort_order
    const allTasks = await getAllTasks(db);

    // Get user's completed tasks
    const userTasks = await getAllUserTasks(db, user.telegram_id);
    const completedTaskIds = new Set(
      userTasks.filter((ut) => ut.status === 'completed').map((ut) => ut.task_id)
    );

    // Find first incomplete task (excluding invite task as it's continuous)
    for (const task of allTasks) {
      // Skip invite task (it's continuous)
      if (task.id === 'task_invite_progress') {
        continue;
      }

      // Skip join channel task if already pending claim
      if (task.id === 'task_join_channel') {
        const userTask = userTasks.find((ut) => ut.task_id === task.id);
        if (userTask?.status === 'pending_claim') {
          continue; // Already detected, waiting for claim
        }
      }

      // Check if task is completed
      if (!completedTaskIds.has(task.id)) {
        return task;
      }
    }

    return null; // All tasks completed
  } catch (error) {
    console.error('[getNextIncompleteTask] Error:', error);
    return null;
  }
}

/**
 * Handle next task button callback
 */
export async function handleNextTaskCallback(
  callbackQuery: {
    id: string;
    from: { id: number };
    message?: { chat: { id: number }; message_id: number };
    data?: string;
  },
  env: Env
): Promise<void> {
  const telegram = createTelegramService(env);
  const db = createDatabaseClient(env.DB);
  const chatId = callbackQuery.message?.chat.id;
  const messageId = callbackQuery.message?.message_id;
  const telegramId = callbackQuery.from.id.toString();
  const taskId = callbackQuery.data?.replace('next_task_', '');

  // Debug: Log callback data
  console.error('[handleNextTaskCallback] Received callback:', callbackQuery.data);
  console.error('[handleNextTaskCallback] Extracted taskId:', taskId);

  // Get user language
  const { createI18n } = await import('~/i18n');
  const { findUserByTelegramId } = await import('~/db/queries/users');
  const user = await findUserByTelegramId(db, telegramId);
  const i18n = createI18n(user?.language_pref || 'zh-TW');

  if (!chatId || !messageId || !taskId) {
    console.error('[handleNextTaskCallback] Missing required data:', { chatId, messageId, taskId });
    await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('errors.invalidRequest'));
    return;
  }

  try {
    // Answer callback
    await telegram.answerCallbackQuery(callbackQuery.id);

    // Delete menu message
    await telegram.deleteMessage(chatId, messageId);

    // Route to appropriate action based on task ID
    const fakeMessage = {
      chat: { id: chatId },
      from: { id: callbackQuery.from.id },
      text: '',
    } as TelegramMessage;

    const task = await getTaskById(db, taskId);

    switch (taskId) {
      case 'task_interests': {
        // Directly open interests editor
        const { handleEditInterests } = await import('./edit_profile');
        const fakeCallback = {
          id: callbackQuery.id,
          from: callbackQuery.from,
          message: { chat: { id: chatId } }, // Don't pass message_id since we deleted it
          data: 'edit_interests',
        } as any;
        await handleEditInterests(fakeCallback, env);
        break;
      }

      case 'task_bio': {
        // Directly open bio editor
        const { handleEditBio } = await import('./edit_profile');
        const fakeCallback = {
          id: callbackQuery.id,
          from: callbackQuery.from,
          message: { chat: { id: chatId } }, // Don't pass message_id since we deleted it
          data: 'edit_bio',
        } as any;
        await handleEditBio(fakeCallback, env);
        break;
      }

      case 'task_city': {
        // Directly open region editor
        const { handleEditRegion } = await import('./edit_profile');
        const fakeCallback = {
          id: callbackQuery.id,
          from: callbackQuery.from,
          message: { chat: { id: chatId } }, // Don't pass message_id since we deleted it
          data: 'edit_region',
        } as any;
        await handleEditRegion(fakeCallback, env);
        break;
      }

      case 'task_join_channel': {
        // Directly open channel link with claim button
        const { createI18n } = await import('~/i18n');
        const { findUserByTelegramId } = await import('~/db/queries/users');
        const db = createDatabaseClient(env.DB);
        const user = await findUserByTelegramId(db, callbackQuery.from.id.toString());
        const i18n = createI18n(user?.language_pref || 'zh-TW');
        await telegram.sendMessageWithButtons(
          chatId,
          i18n.t('tasks.text2') + '\n\n' + i18n.t('tasks.message2') + '\n\n' + i18n.t('tasks.text'),
          [
            [{ text: i18n.t('buttons.short3'), url: 'https://t.me/xunnichannel' }],
            [{ text: i18n.t('buttons.short20'), callback_data: 'verify_channel_join' }],
            [{ text: i18n.t('common.back3'), callback_data: 'return_to_menu' }],
          ]
        );
        break;
      }

      case 'task_first_bottle': {
        // Directly start throw flow
        fakeMessage.text = '/throw';
        const { handleThrow } = await import('./throw');
        await handleThrow(fakeMessage, env);
        break;
      }

      case 'task_first_catch': {
        // Directly start catch flow
        fakeMessage.text = '/catch';
        const { handleCatch } = await import('./catch');
        await handleCatch(fakeMessage, env);
        break;
      }

      case 'task_first_conversation': {
        // Directly start catch flow (to enable conversation)
        fakeMessage.text = '/catch';
        const { handleCatch: handleCatchForConversation } = await import('./catch');
        await handleCatchForConversation(fakeMessage, env);
        break;
      }

      case 'task_invite_progress': {
        // Directly show invite code
        fakeMessage.text = '/invite';
        const { handleInvite } = await import('./invite');
        await handleInvite(fakeMessage, env);
        break;
      }

      default: {
        // Dynamic Social Tasks Handling
        if (task && task.category === 'social' && task.action_url) {
          let label = task.name;
          if (task.name_i18n) {
            try {
              const nameI18n = JSON.parse(task.name_i18n);
              label = nameI18n[user?.language_pref || 'zh-TW'] || nameI18n['zh-TW'] || task.name;
            } catch (e) {
              // Ignore parsing error
            }
          }

          let desc = task.description;
          if (task.description_i18n) {
            try {
              const descI18n = JSON.parse(task.description_i18n);
              desc =
                descI18n[user?.language_pref || 'zh-TW'] || descI18n['zh-TW'] || task.description;
            } catch (e) {
              // Ignore parsing error
            }
          }

          const buttons = [];
          buttons.push([{ text: `🔗 ${i18n.t('common.open')}`, url: task.action_url }]);

          if (task.verification_type === 'none') {
            buttons.push([
              { text: `🎁 ${i18n.t('buttons.claim')}`, callback_data: `claim_task_${task.id}` },
            ]);
          } else if (task.verification_type === 'telegram_chat') {
            buttons.push([
              { text: `🔄 ${i18n.t('buttons.verify')}`, callback_data: `verify_task_${task.id}` },
            ]);
          }
          buttons.push([{ text: i18n.t('common.back3'), callback_data: 'return_to_menu' }]);

          await telegram.sendMessageWithButtons(chatId, `📋 **${label}**\n\n${desc}`, buttons);
          return;
        }

        await telegram.sendMessage(chatId, i18n.t('errors.invalidRequest'));
      }
    }
  } catch (error) {
    console.error('[handleNextTaskCallback] Error:', error);
    const { createI18n } = await import('~/i18n');
    const { findUserByTelegramId } = await import('~/db/queries/users');
    const db = createDatabaseClient(env.DB);
    const user = await findUserByTelegramId(db, callbackQuery.from.id.toString());
    const i18n = createI18n(user?.language_pref || 'zh-TW');
    await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('errors.systemErrorRetry'));
  }
}

/**
 * Helper functions
 */

function calculateDailyQuota(user: User): number {
  const baseQuota = user.is_vip ? 30 : 3;
  const maxInvites = user.is_vip ? 100 : 10;
  const actualInvites = Math.min(user.successful_invites || 0, maxInvites);
  return baseQuota + actualInvites;
}

/**
 * Calculate task bonus for today
 * Export this function for use in other handlers
 */
export async function calculateTaskBonus(
  db: ReturnType<typeof createDatabaseClient>,
  userId: string
): Promise<number> {
  const { getTasksCompletedToday } = await import('~/db/queries/user_tasks');
  const { calculateTodayTaskRewards } = await import('~/domain/task');

  const completedTasks = await getTasksCompletedToday(db, userId);
  return calculateTodayTaskRewards(completedTasks);
}
