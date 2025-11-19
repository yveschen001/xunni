/**
 * Tasks Handler
 * Handles task center and task completion
 */

import type { Env, TelegramMessage, User } from '~/types';
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
      await telegram.sendMessage(chatId, '❌ 找不到用戶資料，請先使用 /start 註冊。');
      return;
    }
    
    // Get all tasks
    const allTasks = await getAllTasks(db);
    
    // Get user task progress
    const userTasks = await getAllUserTasks(db, telegramId);
    const userTaskMap = new Map(userTasks.map(ut => [ut.task_id, ut]));
    
    // Build task center message
    let message_text = '📋 **任務中心**\n\n完成任務獲得額外瓶子！\n\n';
    
    // Group tasks by category
    const profileTasks = allTasks.filter(t => t.category === 'profile');
    const socialTasks = allTasks.filter(t => t.category === 'social');
    const actionTasks = allTasks.filter(t => t.category === 'action');
    const inviteTasks = allTasks.filter(t => t.category === 'invite');
    
    // Profile tasks
    if (profileTasks.length > 0) {
      const completedCount = profileTasks.filter(t => {
        const userTask = userTaskMap.get(t.id);
        return userTask?.status === 'completed';
      }).length;
      
      message_text += `👤 **個人資料任務** (${completedCount}/${profileTasks.length})\n`;
      message_text += `━━━━━━━━━━━━━━━━\n`;
      
      for (const task of profileTasks) {
        const userTask = userTaskMap.get(task.id);
        const completed = userTask?.status === 'completed';
        const icon = completed ? '✅' : '⏳';
        message_text += `${icon} ${task.name} (+${task.reward_amount} 瓶子)\n`;
      }
      message_text += '\n';
    }
    
    // Social tasks
    if (socialTasks.length > 0) {
      const completedCount = socialTasks.filter(t => {
        const userTask = userTaskMap.get(t.id);
        return userTask?.status === 'completed';
      }).length;
      
      message_text += `📱 **社交媒體任務** (${completedCount}/${socialTasks.length})\n`;
      message_text += `━━━━━━━━━━━━━━━━\n`;
      
      for (const task of socialTasks) {
        const userTask = userTaskMap.get(task.id);
        const completed = userTask?.status === 'completed';
        const pending = userTask?.status === 'pending_claim';
        const icon = completed ? '✅' : pending ? '🎁' : '⏳';
        const status = completed ? '' : pending ? '(待領取)' : '';
        message_text += `${icon} ${task.name} ${status} (+${task.reward_amount} 瓶子)\n`;
      }
      message_text += '\n';
    }
    
    // Action tasks
    if (actionTasks.length > 0) {
      const completedCount = actionTasks.filter(t => {
        const userTask = userTaskMap.get(t.id);
        return userTask?.status === 'completed';
      }).length;
      
      message_text += `🎯 **行為任務** (${completedCount}/${actionTasks.length})\n`;
      message_text += `━━━━━━━━━━━━━━━━\n`;
      
      for (const task of actionTasks) {
        const userTask = userTaskMap.get(task.id);
        const completed = userTask?.status === 'completed';
        const icon = completed ? '✅' : '⏳';
        message_text += `${icon} ${task.name} (+${task.reward_amount} 瓶子)\n`;
      }
      message_text += '\n';
    }
    
    // Invite tasks
    if (inviteTasks.length > 0) {
      const inviteProgress = getInviteTaskProgress(user);
      
      message_text += `👥 **邀請任務** (持續進行中)\n`;
      message_text += `━━━━━━━━━━━━━━━━\n`;
      
      message_text += `🔄 邀請好友 (${inviteProgress.current}/${inviteProgress.max})\n`;
      message_text += `   每邀請 1 人 → 每日額度永久 +1\n`;
      message_text += `   當前每日配額：${calculateDailyQuota(user)} 個\n`;
      message_text += '\n';
    }
    
    // Summary
    const oneTimeCompleted = profileTasks.filter(t => userTaskMap.get(t.id)?.status === 'completed').length +
                             socialTasks.filter(t => userTaskMap.get(t.id)?.status === 'completed').length +
                             actionTasks.filter(t => userTaskMap.get(t.id)?.status === 'completed').length;
    const oneTimeTotal = profileTasks.length + socialTasks.length + actionTasks.length;
    const inviteProgress = getInviteTaskProgress(user);
    
    const todayTaskRewards = await getTasksCompletedToday(db, telegramId);
    const todayRewardCount = calculateTodayTaskRewards(todayTaskRewards);
    
    message_text += `📊 **總進度**\n`;
    message_text += `━━━━━━━━━━━━━━━━\n`;
    message_text += `• 一次性任務：${oneTimeCompleted}/${oneTimeTotal} 已完成\n`;
    message_text += `• 邀請任務：${inviteProgress.current}/${inviteProgress.max} 進行中\n\n`;
    message_text += `🎁 **已獲得**\n`;
    message_text += `• 一次性獎勵：${todayRewardCount} 個瓶子（當天有效）\n`;
    message_text += `• 永久獎勵：${inviteProgress.current} 個瓶子（每天發放）\n`;
    
    // Build inline keyboard
    const keyboard = [];
    
    // Row 1: Profile tasks
    const profileRow = [];
    if (profileTasks.some(t => !userTaskMap.get(t.id) || userTaskMap.get(t.id)?.status !== 'completed')) {
      profileRow.push({ text: '✏️ 編輯個人資料', callback_data: 'edit_profile' });
    }
    if (profileRow.length > 0) keyboard.push(profileRow);
    
    // Row 2: Social tasks
    const socialRow = [];
    const joinChannelTask = userTaskMap.get('task_join_channel');
    if (!joinChannelTask || joinChannelTask.status === 'available') {
      socialRow.push({ text: '📢 加入官方頻道', url: 'https://t.me/xunnichannel' });
    } else if (joinChannelTask.status === 'pending_claim') {
      socialRow.push({ text: '🎁 領取獎勵', callback_data: 'claim_task_task_join_channel' });
    }
    if (socialRow.length > 0) keyboard.push(socialRow);
    
    // Row 3: Action tasks
    const actionRow = [];
    if (actionTasks.some(t => !userTaskMap.get(t.id) || userTaskMap.get(t.id)?.status !== 'completed')) {
      actionRow.push({ text: '🌊 丟出漂流瓶', callback_data: 'throw' });
      actionRow.push({ text: '🎣 撿起漂流瓶', callback_data: 'catch' });
    }
    if (actionRow.length > 0) keyboard.push(actionRow);
    
    // Row 4: Invite task
    if (!inviteProgress.isCompleted) {
      keyboard.push([{ text: '👥 查看邀請碼', callback_data: 'profile' }]);
    }
    
    // Row 5: Return to menu
    keyboard.push([{ text: '↩️ 返回主選單', callback_data: 'return_to_menu' }]);
    
    await telegram.sendMessageWithButtons(chatId, message_text, keyboard);
  } catch (error) {
    console.error('[handleTasks] Error:', error);
    await telegram.sendMessage(chatId, '❌ 查看任務中心時發生錯誤，請稍後再試。');
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
    // Check if task is already completed
    const userTask = await getUserTask(db, user.telegram_id, taskId);
    if (userTask?.status === 'completed') {
      return false;
    }
    
    // Check if task is completed
    if (!isTaskCompleted(taskId, user, additionalData)) {
      return false;
    }
    
    // Complete task
    await completeUserTask(db, user.telegram_id, taskId);
    
    // Get task details
    const task = await getTaskById(db, taskId);
    if (!task) {
      return false;
    }
    
    // Send completion message
    await telegram.sendMessage(
      parseInt(user.telegram_id),
      `🎉 恭喜完成任務「${task.name}」！\n\n` +
      `獎勵：+${task.reward_amount} 瓶子（${task.reward_type === 'daily' ? '當天有效' : '永久有效'}）\n\n` +
      `[📋 查看任務中心] → /tasks`
    );
    
    return true;
  } catch (error) {
    console.error('[checkAndCompleteTask] Error:', error);
    return false;
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

