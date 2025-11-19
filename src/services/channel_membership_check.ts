/**
 * Channel Membership Check Service
 * Checks if users have joined the official channel and marks task as pending claim
 */

import type { Env } from '~/types';
import { createTelegramService } from '~/services/telegram';
import { createDatabaseClient } from '~/db/client';
import { getUsersWithIncompleteTask } from '~/db/queries/user_tasks';
import { markTaskAsPendingClaim } from '~/db/queries/user_tasks';

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
          
          // Send notification with claim button
          await telegram.sendMessageWithButtons(
            parseInt(user.telegram_id),
            '🎉 檢測到你已加入官方頻道！\n\n' +
            '點擊下方按鈕領取獎勵：+1 瓶子\n\n' +
            '💡 這是一次性獎勵，領取後會追加到今天的額度中。',
            [
              [{ text: '✅ 領取獎勵', callback_data: 'claim_task_join_channel' }]
            ]
          );
          
          console.log(`[checkChannelMembership] User ${user.telegram_id} joined channel, sent claim notification`);
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
    const member = await telegram.getChatMember(channelId, userId);
    
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
  callbackQuery: { id: string; from: { id: number }; message?: { chat: { id: number }; message_id: number } },
  env: Env
): Promise<void> {
  const telegram = createTelegramService(env);
  const db = createDatabaseClient(env.DB);
  const userId = callbackQuery.from.id.toString();
  const chatId = callbackQuery.message?.chat.id;
  const messageId = callbackQuery.message?.message_id;
  
  const channelId = env.OFFICIAL_CHANNEL_ID;
  if (!channelId) {
    await telegram.answerCallbackQuery(
      callbackQuery.id,
      '❌ 頻道配置錯誤'
    );
    return;
  }
  
  try {
    // Check if user is in channel
    const isInChannel = await isUserInChannel(telegram, channelId, userId);
    
    if (!isInChannel) {
      await telegram.answerCallbackQuery(
        callbackQuery.id,
        '❌ 未檢測到你加入頻道，請先加入後再試'
      );
      return;
    }
    
    // User is in channel, complete task immediately
    const { completeTask } = await import('~/db/queries/user_tasks');
    await completeTask(db, userId, 'task_join_channel');
    
    await telegram.answerCallbackQuery(
      callbackQuery.id,
      '✅ 獎勵已發放！+1 瓶子'
    );
    
    // Update message
    if (chatId && messageId) {
      await telegram.editMessageText(
        chatId,
        messageId,
        '🎉 恭喜完成任務：加入官方頻道！\n\n' +
        '獎勵：+1 瓶子（已追加到今天的額度）\n\n' +
        '💡 使用 /tasks 查看更多任務'
      );
    } else {
      await telegram.sendMessage(
        parseInt(userId),
        '🎉 恭喜完成任務：加入官方頻道！\n\n' +
        '獎勵：+1 瓶子（已追加到今天的額度）\n\n' +
        '💡 使用 /tasks 查看更多任務'
      );
    }
  } catch (error) {
    console.error('[handleVerifyChannelJoin] Error:', error);
    await telegram.answerCallbackQuery(
      callbackQuery.id,
      '❌ 驗證失敗，請稍後再試'
    );
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
        await telegram.answerCallbackQuery(
          callbackQuery.id,
          '❌ 頻道配置錯誤'
        );
        return;
      }
      
      const isInChannel = await isUserInChannel(telegram, channelId, userId);
      
      if (!isInChannel) {
        await telegram.answerCallbackQuery(
          callbackQuery.id,
          '❌ 檢測到你已離開頻道，無法領取獎勵。'
        );
        return;
      }
    }
    
    // Complete task and claim reward
    const { completeTask } = await import('~/db/queries/user_tasks');
    await completeTask(db, userId, taskId);
    
    await telegram.answerCallbackQuery(
      callbackQuery.id,
      '✅ 獎勵已發放！+1 瓶子'
    );
    
    await telegram.sendMessage(
      parseInt(userId),
      '🎉 恭喜完成任務：加入官方頻道！\n\n' +
      '獎勵：+1 瓶子（已追加到今天的額度）\n\n' +
      '[📋 查看任務中心] → /tasks'
    );
  } catch (error) {
    console.error('[handleClaimTaskReward] Error:', error);
    await telegram.answerCallbackQuery(
      callbackQuery.id,
      '❌ 領取獎勵失敗'
    );
  }
}

