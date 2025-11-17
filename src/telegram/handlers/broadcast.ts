/**
 * Broadcast Command Handlers
 * Handle admin broadcast commands
 */

import type { Env, TelegramMessage } from '~/types';
import { createDatabaseClient } from '~/db/client';
import { createTelegramService } from '~/services/telegram';
import { validateBroadcastMessage, formatBroadcastStatus } from '~/domain/broadcast';
import { createBroadcast, getBroadcast } from '~/services/broadcast';

/**
 * Handle /broadcast command
 * Usage: /broadcast <message>
 */
export async function handleBroadcast(message: TelegramMessage, env: Env): Promise<void> {
  const telegram = createTelegramService(env);
  const chatId = message.chat.id;
  const text = message.text || '';

  try {
    // Parse message
    const parts = text.split(' ');
    if (parts.length < 2) {
      await telegram.sendMessage(
        chatId,
        '❌ 使用方法錯誤\n\n' +
          '**正確格式：**\n' +
          `/broadcast <訊息內容>\n\n` +
          '**示例：**\n' +
          `/broadcast 系統將於今晚 22:00 進行維護`
      );
      return;
    }

    // Get message content (everything after /broadcast)
    const broadcastMessage = text.substring(text.indexOf(' ') + 1);

    // Validate message
    const validation = validateBroadcastMessage(broadcastMessage);
    if (!validation.valid) {
      await telegram.sendMessage(chatId, `❌ ${validation.error}`);
      return;
    }

    // Create broadcast
    const broadcastId = await createBroadcast(
      env,
      broadcastMessage,
      'all',
      message.from!.id.toString()
    );

    // Confirm to admin
    await telegram.sendMessage(
      chatId,
      `✅ 廣播已創建\n\n` +
        `ID: ${broadcastId}\n` +
        `目標: 所有用戶\n\n` +
        `廣播將在後台發送，使用 /broadcast_status ${broadcastId} 查看進度。`
    );
  } catch (error) {
    console.error('[handleBroadcast] Error:', error);
    await telegram.sendMessage(chatId, '❌ 創建廣播失敗，請稍後再試。');
  }
}

/**
 * Handle /broadcast_vip command
 * Usage: /broadcast_vip <message>
 */
export async function handleBroadcastVip(message: TelegramMessage, env: Env): Promise<void> {
  const telegram = createTelegramService(env);
  const chatId = message.chat.id;
  const text = message.text || '';

  try {
    const parts = text.split(' ');
    if (parts.length < 2) {
      await telegram.sendMessage(
        chatId,
        '❌ 使用方法錯誤\n\n' +
          '**正確格式：**\n' +
          `/broadcast_vip <訊息內容>`
      );
      return;
    }

    const broadcastMessage = text.substring(text.indexOf(' ') + 1);
    const validation = validateBroadcastMessage(broadcastMessage);
    
    if (!validation.valid) {
      await telegram.sendMessage(chatId, `❌ ${validation.error}`);
      return;
    }

    const broadcastId = await createBroadcast(
      env,
      broadcastMessage,
      'vip',
      message.from!.id.toString()
    );

    await telegram.sendMessage(
      chatId,
      `✅ 廣播已創建\n\n` +
        `ID: ${broadcastId}\n` +
        `目標: VIP 用戶\n\n` +
        `使用 /broadcast_status ${broadcastId} 查看進度。`
    );
  } catch (error) {
    console.error('[handleBroadcastVip] Error:', error);
    await telegram.sendMessage(chatId, '❌ 創建廣播失敗。');
  }
}

/**
 * Handle /broadcast_non_vip command
 * Usage: /broadcast_non_vip <message>
 */
export async function handleBroadcastNonVip(message: TelegramMessage, env: Env): Promise<void> {
  const telegram = createTelegramService(env);
  const chatId = message.chat.id;
  const text = message.text || '';

  try {
    const parts = text.split(' ');
    if (parts.length < 2) {
      await telegram.sendMessage(
        chatId,
        '❌ 使用方法錯誤\n\n' +
          '**正確格式：**\n' +
          `/broadcast_non_vip <訊息內容>`
      );
      return;
    }

    const broadcastMessage = text.substring(text.indexOf(' ') + 1);
    const validation = validateBroadcastMessage(broadcastMessage);
    
    if (!validation.valid) {
      await telegram.sendMessage(chatId, `❌ ${validation.error}`);
      return;
    }

    const broadcastId = await createBroadcast(
      env,
      broadcastMessage,
      'non_vip',
      message.from!.id.toString()
    );

    await telegram.sendMessage(
      chatId,
      `✅ 廣播已創建\n\n` +
        `ID: ${broadcastId}\n` +
        `目標: 非 VIP 用戶\n\n` +
        `使用 /broadcast_status ${broadcastId} 查看進度。`
    );
  } catch (error) {
    console.error('[handleBroadcastNonVip] Error:', error);
    await telegram.sendMessage(chatId, '❌ 創建廣播失敗。');
  }
}

/**
 * Handle /broadcast_status command
 * Usage: /broadcast_status [broadcast_id]
 */
export async function handleBroadcastStatus(message: TelegramMessage, env: Env): Promise<void> {
  const telegram = createTelegramService(env);
  const db = createDatabaseClient(env.DB);
  const chatId = message.chat.id;
  const text = message.text || '';

  try {
    const parts = text.split(' ');
    
    if (parts.length < 2) {
      // Show recent broadcasts
      const broadcasts = await db.d1
        .prepare(
          `SELECT * FROM broadcasts 
           ORDER BY created_at DESC 
           LIMIT 5`
        )
        .all<any>();

      if (!broadcasts.results || broadcasts.results.length === 0) {
        await telegram.sendMessage(chatId, '📊 目前沒有廣播記錄');
        return;
      }

      let message = '📊 最近 5 條廣播記錄\n\n';
      for (const b of broadcasts.results) {
        message += `ID: ${b.id}\n`;
        message += `狀態: ${b.status}\n`;
        message += `目標: ${b.target_type}\n`;
        message += `進度: ${b.sent_count}/${b.total_users}\n`;
        message += `時間: ${new Date(b.created_at).toLocaleString('zh-TW')}\n\n`;
      }

      message += '💡 使用 /broadcast_status <id> 查看詳細信息';
      await telegram.sendMessage(chatId, message);
      return;
    }

    // Show specific broadcast
    const broadcastId = parseInt(parts[1]);
    if (isNaN(broadcastId)) {
      await telegram.sendMessage(chatId, '❌ 廣播 ID 必須是數字');
      return;
    }

    const broadcast = await getBroadcast(db, broadcastId);
    if (!broadcast) {
      await telegram.sendMessage(chatId, '❌ 找不到該廣播記錄');
      return;
    }

    const statusMessage = formatBroadcastStatus(broadcast);
    await telegram.sendMessage(chatId, statusMessage);
  } catch (error) {
    console.error('[handleBroadcastStatus] Error:', error);
    await telegram.sendMessage(chatId, '❌ 查詢廣播狀態失敗。');
  }
}

