/**
 * Task Domain Logic
 * Handles task completion checks and reward calculations
 */

import type { User } from '~/types';

export type TaskCategory = 'profile' | 'social' | 'action' | 'invite';
export type TaskStatus = 'available' | 'pending_claim' | 'completed';
export type RewardType = 'daily' | 'permanent';

export interface Task {
  id: string;
  category: TaskCategory;
  name: string;
  description: string;
  reward_amount: number;
  reward_type: RewardType;
  sort_order: number;
  is_enabled: boolean;
}

export interface UserTask {
  id: number;
  user_id: string;
  task_id: string;
  status: TaskStatus;
  completed_at: string | null;
  reward_claimed: boolean;
}

/**
 * Check if task is completed based on user data
 */
export function isTaskCompleted(taskId: string, user: User, additionalData?: {
  bottleCount?: number;
  catchCount?: number;
  conversationCount?: number;
}): boolean {
  switch (taskId) {
    case 'task_interests':
      return !!user.interests && user.interests.length > 0;
    
    case 'task_bio':
      return !!user.bio && user.bio.length > 0;
    
    case 'task_city':
      return !!user.city && user.city.length > 0;
    
    case 'task_confirm_country':
      return !!user.country_code;
    
    case 'task_first_bottle':
      return (additionalData?.bottleCount || 0) > 0;
    
    case 'task_first_catch':
      return (additionalData?.catchCount || 0) > 0;
    
    case 'task_first_conversation':
      return (additionalData?.conversationCount || 0) > 0;
    
    // Join channel and invite tasks are checked separately
    case 'task_join_channel':
    case 'task_invite_progress':
      return false;
    
    default:
      return false;
  }
}

/**
 * Calculate total task rewards for today
 */
export function calculateTodayTaskRewards(completedTasks: UserTask[]): number {
  const today = new Date().toISOString().split('T')[0];
  
  return completedTasks
    .filter(task => {
      if (!task.completed_at) return false;
      const completedDate = task.completed_at.split('T')[0];
      return completedDate === today && task.reward_claimed;
    })
    .length; // Each task gives 1 bottle
}

/**
 * Get invite task progress
 */
export function getInviteTaskProgress(user: User): {
  current: number;
  max: number;
  isCompleted: boolean;
} {
  const current = user.successful_invites || 0;
  const max = user.is_vip ? 100 : 10;
  const isCompleted = current >= max;
  
  return { current, max, isCompleted };
}

/**
 * Check if user should see task reminder
 */
export function shouldShowTaskReminder(
  lastReminderDate: string | null,
  taskRemindersEnabled: boolean
): boolean {
  if (!taskRemindersEnabled) return false;
  if (!lastReminderDate) return true;
  
  const today = new Date().toISOString().split('T')[0];
  const lastDate = lastReminderDate.split('T')[0];
  
  return lastDate !== today;
}

