
import { MessageBatch } from '@cloudflare/workers-types';
import { Env } from '../types';
import { FortuneJobPayload } from './types';
import { FortuneService } from '../services/fortune';
import { createTelegramService } from '../services/telegram';
import { createI18n } from '../i18n';
import { findUserByTelegramId } from '../db/queries/users';
import { createDatabaseClient } from '../db/client';

/**
 * Consumer: Processes messages from the Queue.
 */
export async function fortuneQueueHandler(batch: MessageBatch<FortuneJobPayload>, env: Env): Promise<void> {
  console.log(`[QueueConsumer] Processing batch of ${batch.messages.length} messages`);
  
  const dbClient = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const service = new FortuneService(env, env.DB); // Assuming D1 is env.DB.d1 logic? No, types say env.DB is D1Database usually?
  // Let's check FortuneService constructor: constructor(env: Env, db: D1Database)
  // And env.DB is D1Database in types.ts usually.
  
  for (const message of batch.messages) {
    const job = message.body;
    const { userId, chatId, lang, messageId } = job;
    
    // Ack immediately? Or after success? Cloudflare retries if not acked/if throws.
    // We'll let it auto-ack on success, or retry on error.
    
    try {
      console.log(`[QueueConsumer] Processing job for User ${userId}, Type: ${job.fortuneType}`);
      
      const user = await findUserByTelegramId(dbClient, userId);
      if (!user) {
        console.error(`[QueueConsumer] User ${userId} not found`);
        message.ack(); // Cannot process, acknowledge to remove
        continue;
      }

      // Initialize i18n for notifications
      const i18n = createI18n(lang || 'zh-TW');

      // Execute Fortune Generation
      // Note: We might want to pass a fake onProgress or one that edits the message periodically?
      // Since we are async, editing the message *too* often might hit rate limits if many jobs run.
      // But we can try.
      const onProgress = async (msg: string) => {
        if (messageId) {
            try {
                await telegram.editMessageText(chatId, messageId, msg);
            } catch (e) {
                // Ignore edit errors
            }
        }
      };

      const result = await service.generateFortune(
        user,
        job.userProfile,
        job.fortuneType,
        job.targetDate,
        job.targetProfile,
        job.targetUserId,
        job.context,
        onProgress,
        job.skipQuota // Skip Quota Deduction (Handled in Dispatcher/Handler)
      );

      console.log(`[QueueConsumer] Job done. Result ID: ${result.id}`);

      // Notify Completion - DIRECTLY SEND REPORT
      console.log(`[QueueConsumer] Sending report directly for Result ID: ${result.id}`);

      // Delete "Generating" message if it exists
      if (messageId) {
          try {
              await telegram.deleteMessage(chatId, messageId);
          } catch (e) {
              console.warn('[QueueConsumer] Failed to delete generation msg:', e);
          }
      }

      // Use Report Viewer to render the full report
      const { handleReportDetail } = await import('../telegram/handlers/fortune_reports');
      await handleReportDetail(chatId, result.id, env);

      // Ack the message
      message.ack();

    } catch (error) {
      console.error(`[QueueConsumer] Job failed:`, error);
      
      // Notify Admin of Crash
      try {
        if (env.ADMIN_LOG_GROUP_ID) {
            await telegram.sendMessage(
                parseInt(env.ADMIN_LOG_GROUP_ID), 
                `🚨 **Queue Consumer Crash**\n\nUser: ${userId}\nType: ${job.fortuneType}\nError: ${error instanceof Error ? error.message : String(error)}`
            );
        }
      } catch (logErr) {
        console.error('Failed to send admin log:', logErr);
      }

      // If it's a retry-able error, we can let it throw (Cloudflare will retry).
      // If it's fatal (e.g. invalid data), we should ack.
      // For now, let's retry up to max retries (configured in toml).
      // If message.attempts > X, ack and notify user of failure.
      
      if (message.attempts >= 3) {
          console.error(`[QueueConsumer] Job failed after 3 attempts. Giving up.`);
          const i18n = createI18n(lang || 'zh-TW');
          await telegram.sendMessage(chatId, `❌ ${i18n.t('errors.systemError')}`);
          message.ack();
      } else {
          message.retry();
      }
    }
  }
}

