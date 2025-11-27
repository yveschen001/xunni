/**
 * Channel Membership Check Service
 * Checks if users have joined the official channel and marks task as pending claim
 */

import type { Env } from '~/types';
import { createTelegramService } from '~/services/telegram';
import { createDatabaseClient } from '~/db/client';
import { getUsersWithIncompleteTask, completeTask } from '~/db/queries/user_tasks';
import { markTaskAsPendingClaim } from '~/db/queries/user_tasks';
import { getTaskById } from '~/db/queries/tasks';

/**
 * Check channel membership for users with incomplete "join channel" task
 * This function is called by Cron Job every hour
 */
export async function checkChannelMembership(env: Env): Promise<void> {
  console.log('[checkChannelMembership] Starting channel membership check...');

  const telegram = createTelegramService(env);
  const db = createDatabaseClient(env.DB);

  // Get official channel ID from environment
  const channelId = env.OFFICIAL_CHANNEL_ID;
  if (!channelId) {
    console.error('[checkChannelMembership] OFFICIAL_CHANNEL_ID not configured');
    return;
  }

  try {
    // Get users with incomplete "join channel" task
    const users = await getUsersWithIncompleteTask(db, 'task_join_channel');

    console.log(`[checkChannelMembership] Checking ${users.length} users...`);

    for (const user of users) {
      try {
        // Check if user is in channel
        const isInChannel = await isUserInChannel(telegram, channelId, user.telegram_id);

        if (isInChannel) {
          // Mark task as pending claim
          await markTaskAsPendingClaim(db, user.telegram_id, 'task_join_channel');

          // Get user's language preference for i18n
          const { createI18n } = await import('~/i18n');
          const i18n = createI18n(user.language_pref || 'zh-TW');

          // Send notification with claim button
          await telegram.sendMessageWithButtons(
            parseInt(user.telegram_id),
            i18n.t('channelMembership.joined') + '\n\n' +
              i18n.t('channelMembership.claimReward') + '\n\n' +
              i18n.t('channelMembership.oneTimeReward'),
            [[{ text: i18n.t('channelMembership.claimButton'), callback_data: 'claim_task_join_channel' }]]
          );

          console.log(
            `[checkChannelMembership] User ${user.telegram_id} joined channel, sent claim notification`
          );
        }
      } catch (error) {
        console.error(`[checkChannelMembership] Error checking user ${user.telegram_id}:`, error);
      }
    }

    console.log('[checkChannelMembership] Channel membership check completed');
  } catch (error) {
    console.error('[checkChannelMembership] Error:', error);
  }
}

/**
 * Check if user is in channel
 */
async function isUserInChannel(
  telegram: ReturnType<typeof createTelegramService>,
  channelId: string,
  userId: string
): Promise<boolean> {
  try {
    // Make sure channelId starts with @ or -100 if it's a username or ID
    // If it's a public link, we need the username
    let target = channelId;
    if (channelId.startsWith('https://t.me/')) {
      const parts = channelId.split('/');
      target = '@' + parts[parts.length - 1];
    }
    
    const member = await telegram.getChatMember(target, userId);

    // Check user status
    return ['creator', 'administrator', 'member'].includes(member.status);
  } catch (error) {
    console.error('[isUserInChannel] Error:', error);
    return false;
  }
}

/**
 * Handle verify channel join (immediate check when user clicks "I've joined")
 */
export async function handleVerifyChannelJoin(
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
  const userId = callbackQuery.from.id.toString();
  const chatId = callbackQuery.message?.chat.id;
  const messageId = callbackQuery.message?.message_id;

  // Determine which task and target to verify
  let taskId = 'task_join_channel';
  let targetId = env.OFFICIAL_CHANNEL_ID;

  if (callbackQuery.data && callbackQuery.data.startsWith('verify_task_')) {
    taskId = callbackQuery.data.replace('verify_task_', '');
    const task = await getTaskById(db, taskId);
    if (task && task.target_id) {
      targetId = task.target_id;
    } else {
      // If custom task has no target ID, fail
      const { findUserByTelegramId } = await import('~/db/queries/users');
      const { createI18n } = await import('~/i18n');
      const user = await findUserByTelegramId(db, userId);
      const i18n = createI18n(user?.language_pref || 'zh-TW');
      await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('errors.channelConfigError'));
      return;
    }
  }

  if (!targetId) {
    // Get user's language preference for i18n
    const { findUserByTelegramId } = await import('~/db/queries/users');
    const { createI18n } = await import('~/i18n');
    const user = await findUserByTelegramId(db, callbackQuery.from.id.toString());
    const i18n = createI18n(user?.language_pref || 'zh-TW');
    await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('errors.channelConfigError'));
    return;
  }

  try {
    // Check if user is in channel
    const isInChannel = await isUserInChannel(telegram, targetId, userId);

    if (!isInChannel) {
      // Get user's language preference for i18n
      const { findUserByTelegramId } = await import('~/db/queries/users');
      const { createI18n } = await import('~/i18n');
      const user = await findUserByTelegramId(db, userId);
      const i18n = createI18n(user?.language_pref || 'zh-TW');
      await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('channelMembership.notJoined'));
      return;
    }

    // User is in channel, complete task immediately
    await completeTask(db, userId, taskId);

    // Get user's language preference for i18n
    const { findUserByTelegramId } = await import('~/db/queries/users');
    const { createI18n } = await import('~/i18n');
    const user = await findUserByTelegramId(db, userId);
    const i18n = createI18n(user?.language_pref || 'zh-TW');
    await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('channelMembership.rewardGranted'));

    // Update message
    if (chatId && messageId) {
      await telegram.editMessageText(
        chatId,
        messageId,
        i18n.t('channelMembership.taskCompleted') + '\n\n' +
          i18n.t('channelMembership.rewardAdded') + '\n\n' +
          i18n.t('channelMembership.viewMoreTasks')
      );
    } else {
      await telegram.sendMessage(
        parseInt(userId),
        i18n.t('channelMembership.taskCompleted') + '\n\n' +
          i18n.t('channelMembership.rewardAdded') + '\n\n' +
          i18n.t('channelMembership.viewMoreTasks')
      );
    }
  } catch (error) {
    console.error('[handleVerifyChannelJoin] Error:', error);
    // Get user's language preference for i18n
    const { findUserByTelegramId } = await import('~/db/queries/users');
    const { createI18n } = await import('~/i18n');
    const user = await findUserByTelegramId(db, userId);
    const i18n = createI18n(user?.language_pref || 'zh-TW');
    await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('errors.verificationFailed'));
  }
}

/**
 * Handle claim task reward callback
 */
export async function handleClaimTaskReward(
  callbackQuery: { id: string; from: { id: number } },
  taskId: string,
  env: Env
): Promise<void> {
  const telegram = createTelegramService(env);
  const db = createDatabaseClient(env.DB);
  const userId = callbackQuery.from.id.toString();

  try {
    // For join channel task, verify user is still in channel
    if (taskId === 'task_join_channel') {
      const channelId = env.OFFICIAL_CHANNEL_ID;
      if (!channelId) {
        // Get user's language preference for i18n
        const { findUserByTelegramId } = await import('~/db/queries/users');
        const { createI18n } = await import('~/i18n');
        const user = await findUserByTelegramId(db, userId);
        const i18n = createI18n(user?.language_pref || 'zh-TW');
        await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('errors.channelConfigError'));
        return;
      }

      const isInChannel = await isUserInChannel(telegram, channelId, userId);

      if (!isInChannel) {
        // Get user's language preference for i18n
        const { findUserByTelegramId } = await import('~/db/queries/users');
        const { createI18n } = await import('~/i18n');
        const user = await findUserByTelegramId(db, userId);
        const i18n = createI18n(user?.language_pref || 'zh-TW');
        await telegram.answerCallbackQuery(
          callbackQuery.id,
          i18n.t('channelMembership.leftChannel')
        );
        return;
      }
    }

    // Complete task and claim reward
    await completeTask(db, userId, taskId);

    // Get user's language preference for i18n
    const { findUserByTelegramId } = await import('~/db/queries/users');
    const { createI18n } = await import('~/i18n');
    const user = await findUserByTelegramId(db, userId);
    const i18n = createI18n(user?.language_pref || 'zh-TW');

    await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('channelMembership.rewardGranted'));

    await telegram.sendMessage(
      parseInt(userId),
      i18n.t('channelMembership.taskCompleted') + '\n\n' +
        i18n.t('channelMembership.rewardAdded') + '\n\n' +
        i18n.t('channelMembership.viewTaskCenter')
    );
  } catch (error) {
    console.error('[handleClaimTaskReward] Error:', error);
    // Get user's language preference for i18n
    const { findUserByTelegramId } = await import('~/db/queries/users');
    const { createI18n } = await import('~/i18n');
    const user = await findUserByTelegramId(db, userId);
    const i18n = createI18n(user?.language_pref || 'zh-TW');
    await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('errors.claimRewardFailed'));
  }
}
