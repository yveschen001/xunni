/**
 * Ad Prompt Logic
 *
 * Determines what prompt/button to show to users after catching/throwing bottles
 * Priority: Ad (if available) > Tasks (if incomplete) > VIP upgrade
 */

import type { User } from '~/types';

export interface AdPromptResult {
  show_button: boolean;
  button_text: string;
  button_callback: string;
  priority: 'ad' | 'task' | 'vip' | 'none';
}

export interface AdPromptContext {
  user: User;
  ads_watched_today: number;
  has_incomplete_tasks: boolean;
  next_task_name?: string;
  next_task_id?: string;
}

const MAX_DAILY_ADS = 20;

/**
 * Determine what button to show after catching/throwing a bottle
 *
 * Priority:
 * 1. Watch Ad (if < 20 ads watched today)
 * 2. Complete Task (if has incomplete tasks)
 * 3. Upgrade VIP (if no ads/tasks available)
 * 4. None (if user is VIP)
 */
export function getAdPrompt(context: AdPromptContext, i18n?: any): AdPromptResult {
  const { user, ads_watched_today, has_incomplete_tasks, next_task_name, next_task_id } = context;

  // Check if user is VIP
  const isVip = !!(user.is_vip && user.vip_expire_at && new Date(user.vip_expire_at) > new Date());

  // VIP users don't see any prompts
  if (isVip) {
    return {
      show_button: false,
      button_text: '',
      button_callback: '',
      priority: 'none',
    };
  }

  // Priority 1: Watch Ad (if available)
  if (ads_watched_today < MAX_DAILY_ADS) {
    const remaining = MAX_DAILY_ADS - ads_watched_today;
    return {
      show_button: true,
      button_text: i18n?.t('buttons.bottle', { remaining }) || `📺 看廣告獲取更多瓶子 🎁 (${remaining}/20)`,
      button_callback: 'watch_ad',
      priority: 'ad',
    };
  }

  // Priority 2: Complete Task (if has incomplete tasks)
  if (has_incomplete_tasks && next_task_name && next_task_id) {
    return {
      show_button: true,
      button_text: i18n?.t('adPrompt.taskButton', { taskName: next_task_name }) || `✨ ${next_task_name} 🎁`,
      button_callback: `next_task_${next_task_id}`,
      priority: 'task',
    };
  }

  // Priority 3: Upgrade VIP (if no ads/tasks available)
  return {
    show_button: true,
    button_text: i18n?.t('buttons.bottle2') || '💎 升級 VIP 獲得更多瓶子',
    button_callback: 'menu_vip',
    priority: 'vip',
  };
}

/**
 * Get quota exhausted prompt buttons
 * Shows both ad and VIP options for non-VIP users
 */
export function getQuotaExhaustedButtons(
  context: AdPromptContext,
  i18n?: any
): Array<Array<{ text: string; callback_data: string }>> {
  const { user, ads_watched_today, has_incomplete_tasks, next_task_name, next_task_id } = context;

  // Check if user is VIP
  const isVip = !!(user.is_vip && user.vip_expire_at && new Date(user.vip_expire_at) > new Date());

  // VIP users don't see any buttons
  if (isVip) {
    return [];
  }

  const buttons: Array<Array<{ text: string; callback_data: string }>> = [];

  // Add ad button if available
  if (ads_watched_today < MAX_DAILY_ADS) {
    const remaining = MAX_DAILY_ADS - ads_watched_today;
    buttons.push([
      {
        text: i18n?.t('buttons.bottle', { remaining }) || `📺 看廣告獲取更多瓶子 🎁 (${remaining}/20)`,
        callback_data: 'watch_ad',
      },
    ]);
  }

  // Add task button if available
  if (has_incomplete_tasks && next_task_name && next_task_id) {
    buttons.push([
      {
        text: i18n?.t('adPrompt.taskButton', { taskName: next_task_name }) || `✨ ${next_task_name} 🎁`,
        callback_data: `next_task_${next_task_id}`,
      },
    ]);
  }

  // Always add VIP button
  buttons.push([
    {
      text: i18n?.t('buttons.vip') || '💎 升級 VIP',
      callback_data: 'menu_vip',
    },
  ]);

  return buttons;
}

/**
 * Get quota exhausted message
 */
export function getQuotaExhaustedMessage(quotaDisplay: string, context: AdPromptContext, i18n?: any): string {
  const { ads_watched_today, has_incomplete_tasks } = context;

  if (i18n) {
    let message = i18n.t('adPrompt.quotaExhausted', { quotaDisplay }) + '\n\n' + i18n.t('adPrompt.waysToGetMore') + '\n';

    // Add ad option if available
    if (ads_watched_today < MAX_DAILY_ADS) {
      const remaining = MAX_DAILY_ADS - ads_watched_today;
      message += i18n.t('adPrompt.watchAd', { remaining }) + '\n';
    } else {
      message += i18n.t('adPrompt.watchAdLimit') + '\n';
    }

    // Add task option if available
    if (has_incomplete_tasks) {
      message += i18n.t('adPrompt.completeTask') + '\n';
    }

    // Add invite and VIP options
    message += i18n.t('adPrompt.inviteFriends') + '\n';
    message += i18n.t('adPrompt.upgradeVip');

    return message;
  }

  // Fallback to default Chinese (向后兼容)
  let message = `❌ 今日漂流瓶配額已用完（${quotaDisplay}）\n\n💡 獲得更多配額的方式：\n`;

  // Add ad option if available
  if (ads_watched_today < MAX_DAILY_ADS) {
    const remaining = MAX_DAILY_ADS - ads_watched_today;
    message += `• 📺 觀看廣告（剩餘 ${remaining}/20 次）\n`;
  } else {
    message += `• 📺 觀看廣告（今日已達上限）\n`;
  }

  // Add task option if available
  if (has_incomplete_tasks) {
    message += `• ✨ 完成任務（獲得永久配額）\n`;
  }

  // Add invite and VIP options
  message += `• 🎁 邀請好友（每人 +1 配額）\n`;
  message += `• 💎 升級 VIP（每天 30 個配額）`;

  return message;
}
