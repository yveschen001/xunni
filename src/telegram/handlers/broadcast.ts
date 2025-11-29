// src/telegram/handlers/broadcast.ts
// Fix: Remove dependency on removed filter functions
// Replaced with new filter engine imports where needed or simplified

import type { Env, TelegramMessage } from '~/types';
import { createDatabaseClient } from '~/db/client';
import { createTelegramService } from '~/services/telegram';
import { validateBroadcastMessage, formatBroadcastStatus } from '~/domain/broadcast';
import { createBroadcast, getBroadcast, createFilteredBroadcast } from '~/services/broadcast';
import { parseFilters, formatFilters } from '~/domain/broadcast_filters';
import { findUserByTelegramId } from '~/db/queries/users';
import { createI18n } from '~/i18n';

/**
 * Handle /broadcast command
 * Usage: /broadcast <message>
 */
export async function handleBroadcast(message: TelegramMessage, env: Env): Promise<void> {
  const telegram = createTelegramService(env);
  const db = createDatabaseClient(env.DB);
  const chatId = message.chat.id;
  const telegramId = message.from!.id.toString();
  const text = message.text || '';

  try {
    // Parse message
    const parts = text.split(' ');
    if (parts.length < 2) {
      const user = await findUserByTelegramId(db, telegramId);
      const i18n = createI18n(user?.language_pref || 'zh-TW');

      await telegram.sendMessage(
        chatId,
        i18n.t('broadcast.usageError') +
          i18n.t('broadcast.correctFormat') +
          `/broadcast <${i18n.t('broadcast.messageContent')}>\n\n` +
          i18n.t('broadcast.example') +
          `/broadcast ${i18n.t('broadcast.exampleMessage')}`
      );
      return;
    }

    // Get message content (everything after /broadcast)
    const broadcastMessage = text.substring(text.indexOf(' ') + 1);

    // Validate message
    const user = await findUserByTelegramId(db, telegramId);
    const i18n = createI18n(user?.language_pref || 'zh-TW');
    const validation = validateBroadcastMessage(broadcastMessage, i18n);
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
      i18n.t('broadcast.created') +
        i18n.t('broadcast.id', { id: broadcastId }) +
        i18n.t('broadcast.targetLabel', { target: i18n.t('broadcast.targetAll') }) +
        i18n.t('broadcast.userCount', { count: totalUsers }) +
        i18n.t('broadcast.estimatedTime', { time: estimatedTime }) +
        i18n.t('broadcast.sendingInBackground', { id: broadcastId })
    );
  } catch (error) {
    console.error('[handleBroadcast] Error:', error);
    const user = await findUserByTelegramId(db, telegramId);
    const i18n = createI18n(user?.language_pref || 'zh-TW');
    await telegram.sendMessage(chatId, i18n.t('broadcast.createFailed'));
  }
}

/**
 * Handle /broadcast_vip command
 * Usage: /broadcast_vip <message>
 */
export async function handleBroadcastVip(message: TelegramMessage, env: Env): Promise<void> {
  const telegram = createTelegramService(env);
  const db = createDatabaseClient(env.DB);
  const chatId = message.chat.id;
  const telegramId = message.from!.id.toString();
  const text = message.text || '';

  try {
    const parts = text.split(' ');
    if (parts.length < 2) {
      const user = await findUserByTelegramId(db, telegramId);
      const i18n = createI18n(user?.language_pref || 'zh-TW');
      await telegram.sendMessage(
        chatId,
        i18n.t('broadcast.usageError') +
          i18n.t('broadcast.correctFormat') +
          `/broadcast_vip <${i18n.t('broadcast.messageContent')}>`
      );
      return;
    }

    const broadcastMessage = text.substring(text.indexOf(' ') + 1);
    const user = await findUserByTelegramId(db, telegramId);
    const i18n = createI18n(user?.language_pref || 'zh-TW');
    const validation = validateBroadcastMessage(broadcastMessage, i18n);

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
      i18n.t('broadcast.created') +
        i18n.t('broadcast.id', { id: broadcastId }) +
        i18n.t('broadcast.targetLabel', { target: i18n.t('broadcast.targetVip') }) +
        i18n.t('broadcast.userCount', { count: totalUsers }) +
        i18n.t('broadcast.estimatedTime', { time: estimatedTime }) +
        i18n.t('broadcast.sendingInBackground', { id: broadcastId })
    );
  } catch (error) {
    console.error('[handleBroadcastVip] Error:', error);
    const user = await findUserByTelegramId(db, telegramId);
    const i18n = createI18n(user?.language_pref || 'zh-TW');
    await telegram.sendMessage(chatId, i18n.t('broadcast.createFailedShort'));
  }
}

/**
 * Handle /broadcast_non_vip command
 * Usage: /broadcast_non_vip <message>
 */
export async function handleBroadcastNonVip(message: TelegramMessage, env: Env): Promise<void> {
  const telegram = createTelegramService(env);
  const db = createDatabaseClient(env.DB);
  const chatId = message.chat.id;
  const telegramId = message.from!.id.toString();
  const text = message.text || '';

  try {
    const parts = text.split(' ');
    if (parts.length < 2) {
      const user = await findUserByTelegramId(db, telegramId);
      const i18n = createI18n(user?.language_pref || 'zh-TW');
      await telegram.sendMessage(
        chatId,
        i18n.t('broadcast.usageError') +
          i18n.t('broadcast.correctFormat') +
          `/broadcast_non_vip <${i18n.t('broadcast.messageContent')}>`
      );
      return;
    }

    const broadcastMessage = text.substring(text.indexOf(' ') + 1);
    const user = await findUserByTelegramId(db, telegramId);
    const i18n = createI18n(user?.language_pref || 'zh-TW');
    const validation = validateBroadcastMessage(broadcastMessage, i18n);

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
      i18n.t('broadcast.created') +
        i18n.t('broadcast.id', { id: broadcastId }) +
        i18n.t('broadcast.targetLabel', { target: i18n.t('broadcast.targetNonVip') }) +
        i18n.t('broadcast.userCount', { count: totalUsers }) +
        i18n.t('broadcast.estimatedTime', { time: estimatedTime }) +
        i18n.t('broadcast.sendingInBackground', { id: broadcastId })
    );
  } catch (error) {
    console.error('[handleBroadcastNonVip] Error:', error);
    const user = await findUserByTelegramId(db, telegramId);
    const i18n = createI18n(user?.language_pref || 'zh-TW');
    await telegram.sendMessage(chatId, i18n.t('broadcast.createFailedShort'));
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
  const telegramId = message.from!.id.toString();

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
      .all<{
        id: number;
        target_type: string;
        total_users: number;
        status: string;
        started_at: string | null;
      }>();

    const user = await findUserByTelegramId(db, telegramId);
    const i18n = createI18n(user?.language_pref || 'zh-TW');

    if (!pendingBroadcasts.results || pendingBroadcasts.results.length === 0) {
      await telegram.sendMessage(
        chatId,
        i18n.t('broadcast.queueProcessed') +
          i18n.t('broadcast.noPendingBroadcasts') +
          i18n.t('broadcast.viewAllRecords')
      );
      return;
    }

    // Show which broadcasts will be processed
    const broadcast = pendingBroadcasts.results[0];
    const statusEmoji = broadcast.status === 'pending' ? '⏳' : '🔄';
    const statusText =
      broadcast.status === 'pending'
        ? i18n.t('broadcast.statusPending')
        : i18n.t('broadcast.statusStuck');

    let message = i18n.t('broadcast.queueTriggered', { emoji: statusEmoji });
    message += i18n.t('broadcast.processingBroadcast', { id: broadcast.id });
    message += i18n.t('broadcast.statusLabel', { status: statusText });
    message += i18n.t('broadcast.targetType', { type: broadcast.target_type });
    message += i18n.t('broadcast.userCount2', { count: broadcast.total_users });

    if (pendingBroadcasts.results.length > 1) {
      message += i18n.t('broadcast.queueRemaining', {
        count: pendingBroadcasts.results.length - 1,
      });
    }

    message += i18n.t('broadcast.checkProgressLater');

    await telegram.sendMessage(chatId, message);

    // Import and call the broadcast queue processor
    const { processBroadcastQueue } = await import('~/services/broadcast');
    await processBroadcastQueue(env);
  } catch (error) {
    console.error('[handleBroadcastProcess] Error:', error);
    const user = await findUserByTelegramId(db, telegramId);
    const i18n = createI18n(user?.language_pref || 'zh-TW');
    await telegram.sendMessage(
      chatId,
      i18n.t('broadcast.processQueueFailed', {
        error: error instanceof Error ? error.message : String(error),
      })
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
  const telegramId = message.from!.id.toString();
  const text = message.text || '';

  try {
    const parts = text.split(' ');
    if (parts.length < 2) {
      const user = await findUserByTelegramId(db, telegramId);
      const i18n = createI18n(user?.language_pref || 'zh-TW');
      await telegram.sendMessage(
        chatId,
        i18n.t('broadcast.cancelUsageError') +
          i18n.t('broadcast.cancelCorrectFormat') +
          i18n.t('broadcast.cancelCommand') +
          i18n.t('broadcast.cancelExample') +
          i18n.t('broadcast.cancelExampleCommand')
      );
      return;
    }

    const broadcastId = parseInt(parts[1]);
    if (isNaN(broadcastId)) {
      const user = await findUserByTelegramId(db, telegramId);
      const i18n = createI18n(user?.language_pref || 'zh-TW');
      await telegram.sendMessage(chatId, i18n.t('broadcast.idMustBeNumber'));
      return;
    }

    // Check if broadcast exists
    const broadcast = await getBroadcast(db, broadcastId);
    const user = await findUserByTelegramId(db, telegramId);
    const i18n = createI18n(user?.language_pref || 'zh-TW');

    if (!broadcast) {
      await telegram.sendMessage(chatId, i18n.t('broadcast.broadcastNotFound'));
      return;
    }

    // Cancel the broadcast (mark as cancelled)
    await db.d1
      .prepare(
        `UPDATE broadcasts 
         SET status = 'cancelled', 
             completed_at = CURRENT_TIMESTAMP,
             error_message = ?
         WHERE id = ?`
      )
      .bind(i18n.t('broadcast.admin'), broadcastId)
      .run();
    await telegram.sendMessage(
      chatId,
      i18n.t('broadcast.cancelled') +
        i18n.t('broadcast.cancelledId', { id: broadcastId }) +
        i18n.t('broadcast.cancelledStatus') +
        i18n.t('broadcast.viewUpdatedStatus')
    );
  } catch (error) {
    console.error('[handleBroadcastCancel] Error:', error);
    const user = await findUserByTelegramId(db, telegramId);
    const i18n = createI18n(user?.language_pref || 'zh-TW');
    await telegram.sendMessage(
      chatId,
      i18n.t('broadcast.cancelFailed', {
        error: error instanceof Error ? error.message : String(error),
      })
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

    const telegramId = message.from!.id.toString();
    const user = await findUserByTelegramId(db, telegramId);
    const i18n = createI18n(user?.language_pref || 'zh-TW');

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
        await telegram.sendMessage(chatId, i18n.t('broadcast.noRecords'));
        return;
      }

      let responseMessage = i18n.t('broadcast.recentRecords');
      for (const b of broadcasts.results) {
        responseMessage += i18n.t('broadcast.recordId', { id: b.id });
        responseMessage += i18n.t('broadcast.recordStatus', { status: b.status });
        responseMessage += i18n.t('broadcast.recordTarget', { type: b.target_type });
        responseMessage += i18n.t('broadcast.recordProgress', {
          sent: b.sent_count,
          total: b.total_users,
        });
        responseMessage += i18n.t('broadcast.recordTime', {
          time: new Date(b.created_at).toLocaleString(i18n.language),
        });
      }

      responseMessage += i18n.t('broadcast.viewDetailsHint');
      console.error('[handleBroadcastStatus] Sending response');
      await telegram.sendMessage(chatId, responseMessage);
      return;
    }

    // Show specific broadcast
    console.error('[handleBroadcastStatus] Parsing broadcast ID');
    const broadcastId = parseInt(parts[1]);
    if (isNaN(broadcastId)) {
      await telegram.sendMessage(chatId, i18n.t('broadcast.idMustBeNumber'));
      return;
    }

    console.error('[handleBroadcastStatus] Getting broadcast:', broadcastId);
    const broadcast = await getBroadcast(db, broadcastId);
    if (!broadcast) {
      console.error('[handleBroadcastStatus] Broadcast not found');
      await telegram.sendMessage(chatId, i18n.t('broadcast.broadcastNotFound'));
      return;
    }

    console.error('[handleBroadcastStatus] Formatting status');
    const statusMessage = formatBroadcastStatus(broadcast);
    console.error('[handleBroadcastStatus] Sending status message');
    await telegram.sendMessage(chatId, statusMessage);
    console.error('[handleBroadcastStatus] Done');
  } catch (error) {
    console.error('[handleBroadcastStatus] Error:', error);
    const telegramId = message.from!.id.toString();
    const user = await findUserByTelegramId(db, telegramId);
    const i18n = createI18n(user?.language_pref || 'zh-TW');
    await telegram.sendMessage(
      chatId,
      i18n.t('broadcast.queryStatusFailed', {
        error: error instanceof Error ? error.message : String(error),
      })
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
  const telegramId = message.from!.id.toString();

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

    const user = await findUserByTelegramId(db, telegramId);
    const i18n = createI18n(user?.language_pref || 'zh-TW');

    if (!stuckBroadcasts.results || stuckBroadcasts.results.length === 0) {
      await telegram.sendMessage(
        chatId,
        i18n.t('broadcast.noStuckBroadcasts') + i18n.t('broadcast.allBroadcastsNormal')
      );
      return;
    }

    // Check if user confirmed
    const text = message.text || '';
    const isConfirmed = text.includes('confirm');

    if (!isConfirmed) {
      // Show stuck broadcasts and ask for confirmation
      let message_text = i18n.t('broadcast.foundStuckBroadcasts', {
        count: stuckBroadcasts.results.length,
      });

      for (const broadcast of stuckBroadcasts.results) {
        const messagePreview =
          broadcast.message.length > 30
            ? broadcast.message.substring(0, 30) + '...'
            : broadcast.message;
        message_text += i18n.t('broadcast.stuckBroadcastId', { id: broadcast.id });
        message_text += i18n.t('broadcast.stuckBroadcastMessage', { message: messagePreview });
        message_text += i18n.t('broadcast.stuckBroadcastTarget', { type: broadcast.target_type });
        message_text += i18n.t('broadcast.stuckBroadcastProgress', {
          sent: broadcast.sent_count,
          total: broadcast.total_users,
        });
        message_text += i18n.t('broadcast.stuckBroadcastStartTime', { time: broadcast.started_at });
      }

      message_text += i18n.t('broadcast.stuckBroadcastDivider');
      message_text += i18n.t('broadcast.stuckBroadcastWillMarkFailed');
      message_text += i18n.t('broadcast.stuckBroadcastNoRetry');
      message_text += i18n.t('broadcast.stuckBroadcastConfirm');
      message_text += i18n.t('broadcast.stuckBroadcastConfirmCommand');

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
             error_message = ?
         WHERE id IN (${ids.map(() => '?').join(', ')})`
      )
      .bind(i18n.t('broadcast.admin2'), ...ids)
      .run();

    await telegram.sendMessage(
      chatId,
      i18n.t('broadcast.cleanupSuccess', { count: ids.length }) +
        i18n.t('broadcast.cleanupIds', { ids: ids.join(', ') }) +
        i18n.t('broadcast.cleanupMarkedFailed') +
        i18n.t('broadcast.cleanupViewStatus')
    );
  } catch (error) {
    console.error('[handleBroadcastCleanup] Error:', error);
    const user = await findUserByTelegramId(db, telegramId);
    const i18n = createI18n(user?.language_pref || 'zh-TW');
    await telegram.sendMessage(
      chatId,
      i18n.t('broadcast.cleanupFailed', {
        error: error instanceof Error ? error.message : String(error),
      })
    );
  }
}

/**
 * Handle /broadcast_filter command
 * LEGACY FUNCTION: Use handleBroadcastFilter in broadcast_v2.ts instead
 * Re-implemented here briefly to avoid compile error if called directly,
 * but should be routed to v2.
 */
export async function handleBroadcastFilter(message: TelegramMessage, env: Env): Promise<void> {
  const { handleBroadcastFilter: v2 } = await import('./broadcast_v2');
  return v2(message, env);
}
