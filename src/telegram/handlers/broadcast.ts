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
    const { broadcastId, totalUsers } = await createBroadcast(
      env,
      broadcastMessage,
      'all',
      message.from!.id.toString()
    );

    // Calculate estimated time
    const { estimateBroadcastTime } = await import('~/domain/broadcast');
    const estimatedTime = estimateBroadcastTime(totalUsers);

    // Confirm to admin
    await telegram.sendMessage(
      chatId,
      `✅ 廣播已創建\n\n` +
        `ID: ${broadcastId}\n` +
        `目標: 所有用戶\n` +
        `用戶數: ${totalUsers} 人\n` +
        `預計時間: ${estimatedTime}\n\n` +
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
        '❌ 使用方法錯誤\n\n' + '**正確格式：**\n' + `/broadcast_vip <訊息內容>`
      );
      return;
    }

    const broadcastMessage = text.substring(text.indexOf(' ') + 1);
    const validation = validateBroadcastMessage(broadcastMessage);

    if (!validation.valid) {
      await telegram.sendMessage(chatId, `❌ ${validation.error}`);
      return;
    }

    const { broadcastId, totalUsers } = await createBroadcast(
      env,
      broadcastMessage,
      'vip',
      message.from!.id.toString()
    );

    const { estimateBroadcastTime } = await import('~/domain/broadcast');
    const estimatedTime = estimateBroadcastTime(totalUsers);

    await telegram.sendMessage(
      chatId,
      `✅ 廣播已創建\n\n` +
        `ID: ${broadcastId}\n` +
        `目標: VIP 用戶\n` +
        `用戶數: ${totalUsers} 人\n` +
        `預計時間: ${estimatedTime}\n\n` +
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
        '❌ 使用方法錯誤\n\n' + '**正確格式：**\n' + `/broadcast_non_vip <訊息內容>`
      );
      return;
    }

    const broadcastMessage = text.substring(text.indexOf(' ') + 1);
    const validation = validateBroadcastMessage(broadcastMessage);

    if (!validation.valid) {
      await telegram.sendMessage(chatId, `❌ ${validation.error}`);
      return;
    }

    const { broadcastId, totalUsers } = await createBroadcast(
      env,
      broadcastMessage,
      'non_vip',
      message.from!.id.toString()
    );

    const { estimateBroadcastTime } = await import('~/domain/broadcast');
    const estimatedTime = estimateBroadcastTime(totalUsers);

    await telegram.sendMessage(
      chatId,
      `✅ 廣播已創建\n\n` +
        `ID: ${broadcastId}\n` +
        `目標: 非 VIP 用戶\n` +
        `用戶數: ${totalUsers} 人\n` +
        `預計時間: ${estimatedTime}\n\n` +
        `使用 /broadcast_status ${broadcastId} 查看進度。`
    );
  } catch (error) {
    console.error('[handleBroadcastNonVip] Error:', error);
    await telegram.sendMessage(chatId, '❌ 創建廣播失敗。');
  }
}

/**
 * Handle /broadcast_process command (manual trigger)
 * Usage: /broadcast_process
 */
export async function handleBroadcastProcess(message: TelegramMessage, env: Env): Promise<void> {
  const telegram = createTelegramService(env);
  const chatId = message.chat.id;
  const db = createDatabaseClient(env.DB);

  try {
    console.error('[handleBroadcastProcess] Manually triggering broadcast queue processing');

    // Check if there are pending or stuck 'sending' broadcasts
    const pendingBroadcasts = await db.d1
      .prepare(
        `SELECT id, target_type, total_users, status, started_at 
         FROM broadcasts 
         WHERE status = 'pending' 
            OR (status = 'sending' AND started_at < datetime('now', '-5 minutes'))
         ORDER BY created_at ASC`
      )
      .all<{ id: number; target_type: string; total_users: number; status: string; started_at: string | null }>();

    if (!pendingBroadcasts.results || pendingBroadcasts.results.length === 0) {
      await telegram.sendMessage(
        chatId,
        '✅ 廣播隊列處理完成\n\n' +
          '目前沒有待處理或卡住的廣播。\n\n' +
          '使用 /broadcast_status 查看所有廣播記錄。'
      );
      return;
    }

    // Show which broadcasts will be processed
    const broadcast = pendingBroadcasts.results[0];
    const statusEmoji = broadcast.status === 'pending' ? '⏳' : '🔄';
    const statusText = broadcast.status === 'pending' ? '待處理' : '卡住（重試中）';
    
    let message = `${statusEmoji} 廣播隊列處理已觸發\n\n`;
    message += `正在處理廣播 #${broadcast.id}\n`;
    message += `狀態：${statusText}\n`;
    message += `目標：${broadcast.target_type}\n`;
    message += `用戶數：${broadcast.total_users} 人\n`;
    
    if (pendingBroadcasts.results.length > 1) {
      message += `\n隊列中還有 ${pendingBroadcasts.results.length - 1} 個廣播待處理\n`;
    }
    
    message += `\n請稍後使用 /broadcast_status 查看進度。`;
    
    await telegram.sendMessage(chatId, message);

    // Import and call the broadcast queue processor
    const { processBroadcastQueue } = await import('~/services/broadcast');
    await processBroadcastQueue(env);
  } catch (error) {
    console.error('[handleBroadcastProcess] Error:', error);
    await telegram.sendMessage(
      chatId,
      `❌ 處理廣播隊列失敗：${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Handle /broadcast_cancel command
 * Usage: /broadcast_cancel <broadcast_id>
 */
export async function handleBroadcastCancel(message: TelegramMessage, env: Env): Promise<void> {
  const telegram = createTelegramService(env);
  const db = createDatabaseClient(env.DB);
  const chatId = message.chat.id;
  const text = message.text || '';

  try {
    const parts = text.split(' ');
    if (parts.length < 2) {
      await telegram.sendMessage(
        chatId,
        '❌ 使用方法錯誤\n\n' +
          '**正確格式：**\n' +
          '/broadcast_cancel <廣播ID>\n\n' +
          '**示例：**\n' +
          '/broadcast_cancel 1'
      );
      return;
    }

    const broadcastId = parseInt(parts[1]);
    if (isNaN(broadcastId)) {
      await telegram.sendMessage(chatId, '❌ 廣播 ID 必須是數字');
      return;
    }

    // Check if broadcast exists
    const broadcast = await getBroadcast(db, broadcastId);
    if (!broadcast) {
      await telegram.sendMessage(chatId, '❌ 找不到該廣播記錄');
      return;
    }

    // Cancel the broadcast (mark as cancelled)
    await db.d1
      .prepare(
        `UPDATE broadcasts 
         SET status = 'cancelled', 
             completed_at = CURRENT_TIMESTAMP,
             error_message = '管理員手動取消'
         WHERE id = ?`
      )
      .bind(broadcastId)
      .run();

    await telegram.sendMessage(
      chatId,
      `✅ 廣播已取消\n\n` +
        `ID: ${broadcastId}\n` +
        `狀態: 已取消\n\n` +
        `使用 /broadcast_status 查看更新後的狀態。`
    );
  } catch (error) {
    console.error('[handleBroadcastCancel] Error:', error);
    await telegram.sendMessage(
      chatId,
      `❌ 取消廣播失敗：${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Handle /broadcast_status command
 * Usage: /broadcast_status [broadcast_id]
 */
export async function handleBroadcastStatus(message: TelegramMessage, env: Env): Promise<void> {
  console.error('[handleBroadcastStatus] Function called');
  const telegram = createTelegramService(env);
  const db = createDatabaseClient(env.DB);
  const chatId = message.chat.id;
  const text = message.text || '';

  try {
    console.error('[handleBroadcastStatus] Parsing command:', text);
    const parts = text.split(' ');

    if (parts.length < 2) {
      console.error('[handleBroadcastStatus] No broadcast ID provided, showing recent broadcasts');
      // Show recent broadcasts
      const broadcasts = await db.d1
        .prepare(
          `SELECT * FROM broadcasts 
           ORDER BY created_at DESC 
           LIMIT 5`
        )
        .all<any>();

      console.error('[handleBroadcastStatus] Found broadcasts:', broadcasts.results?.length || 0);

      if (!broadcasts.results || broadcasts.results.length === 0) {
        await telegram.sendMessage(chatId, '📊 目前沒有廣播記錄');
        return;
      }

      let responseMessage = '📊 最近 5 條廣播記錄\n\n';
      for (const b of broadcasts.results) {
        responseMessage += `ID: ${b.id}\n`;
        responseMessage += `狀態: ${b.status}\n`;
        responseMessage += `目標: ${b.target_type}\n`;
        responseMessage += `進度: ${b.sent_count}/${b.total_users}\n`;
        responseMessage += `時間: ${new Date(b.created_at).toLocaleString('zh-TW')}\n\n`;
      }

      responseMessage += '💡 使用 /broadcast_status <id> 查看詳細信息';
      console.error('[handleBroadcastStatus] Sending response');
      await telegram.sendMessage(chatId, responseMessage);
      return;
    }

    // Show specific broadcast
    console.error('[handleBroadcastStatus] Parsing broadcast ID');
    const broadcastId = parseInt(parts[1]);
    if (isNaN(broadcastId)) {
      await telegram.sendMessage(chatId, '❌ 廣播 ID 必須是數字');
      return;
    }

    console.error('[handleBroadcastStatus] Getting broadcast:', broadcastId);
    const broadcast = await getBroadcast(db, broadcastId);
    if (!broadcast) {
      console.error('[handleBroadcastStatus] Broadcast not found');
      await telegram.sendMessage(chatId, '❌ 找不到該廣播記錄');
      return;
    }

    console.error('[handleBroadcastStatus] Formatting status');
    const statusMessage = formatBroadcastStatus(broadcast);
    console.error('[handleBroadcastStatus] Sending status message');
    await telegram.sendMessage(chatId, statusMessage);
    console.error('[handleBroadcastStatus] Done');
  } catch (error) {
    console.error('[handleBroadcastStatus] Error:', error);
    await telegram.sendMessage(
      chatId,
      `❌ 查詢廣播狀態失敗：${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Handle /broadcast_cleanup command
 * Clean up stuck broadcasts (status = 'sending' with 0 progress)
 * Usage: /broadcast_cleanup [confirm]
 */
export async function handleBroadcastCleanup(message: TelegramMessage, env: Env): Promise<void> {
  const telegram = createTelegramService(env);
  const db = createDatabaseClient(env.DB);
  const chatId = message.chat.id;

  try {
    // Find stuck broadcasts (sending with 0 progress or old sending status)
    const stuckBroadcasts = await db.d1
      .prepare(
        `SELECT id, message, target_type, total_users, sent_count, started_at 
         FROM broadcasts 
         WHERE status = 'sending' 
           AND (sent_count = 0 OR started_at < datetime('now', '-1 hour'))
         ORDER BY created_at ASC`
      )
      .all<{
        id: number;
        message: string;
        target_type: string;
        total_users: number;
        sent_count: number;
        started_at: string;
      }>();

    if (!stuckBroadcasts.results || stuckBroadcasts.results.length === 0) {
      await telegram.sendMessage(
        chatId,
        '✅ 沒有需要清理的廣播\n\n' + '所有廣播狀態正常。'
      );
      return;
    }

    // Check if user confirmed
    const text = message.text || '';
    const isConfirmed = text.includes('confirm');

    if (!isConfirmed) {
      // Show stuck broadcasts and ask for confirmation
      let message_text = `⚠️ 發現 ${stuckBroadcasts.results.length} 個卡住的廣播\n\n`;

      for (const broadcast of stuckBroadcasts.results) {
        const messagePreview =
          broadcast.message.length > 30
            ? broadcast.message.substring(0, 30) + '...'
            : broadcast.message;
        message_text += `**ID: ${broadcast.id}**\n`;
        message_text += `訊息: ${messagePreview}\n`;
        message_text += `目標: ${broadcast.target_type}\n`;
        message_text += `進度: ${broadcast.sent_count}/${broadcast.total_users}\n`;
        message_text += `開始時間: ${broadcast.started_at}\n\n`;
      }

      message_text += '━━━━━━━━━━━━━━━━\n';
      message_text += '這些廣播將被標記為「失敗」狀態\n';
      message_text += '不會再被自動處理或重新發送\n\n';
      message_text += '**確認清理？**\n';
      message_text += '使用 `/broadcast_cleanup confirm` 確認';

      await telegram.sendMessage(chatId, message_text);
      return;
    }

    // Mark all stuck broadcasts as failed
    const ids = stuckBroadcasts.results.map((b) => b.id);
    await db.d1
      .prepare(
        `UPDATE broadcasts 
         SET status = 'failed', 
             completed_at = CURRENT_TIMESTAMP,
             error_message = '管理員手動清理（廣播卡住）'
         WHERE id IN (${ids.map(() => '?').join(', ')})`
      )
      .bind(...ids)
      .run();

    await telegram.sendMessage(
      chatId,
      `✅ 已清理 ${ids.length} 個卡住的廣播\n\n` +
        `廣播 ID: ${ids.join(', ')}\n\n` +
        `這些廣播已標記為「失敗」狀態\n` +
        `使用 /broadcast_status 查看更新後的記錄。`
    );
  } catch (error) {
    console.error('[handleBroadcastCleanup] Error:', error);
    await telegram.sendMessage(
      chatId,
      `❌ 清理廣播失敗：${error instanceof Error ? error.message : String(error)}`
    );
  }
}
