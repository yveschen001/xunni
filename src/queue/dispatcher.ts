
import { Env } from '../types';
import { FortuneService } from '../services/fortune';
import { FortuneJobPayload, FortuneJobResponse } from './types';
import { createTelegramService } from '../services/telegram';
import { createI18n } from '../i18n';

/**
 * Dispatcher: Decides whether to queue the job or run it synchronously.
 */
export async function dispatchFortuneJob(
  env: Env, 
  payload: FortuneJobPayload, 
  db: D1Database,
  onProgress?: (msg: string) => Promise<void>
): Promise<FortuneJobResponse> {
  
  // 1. Check Feature Flag
  const enableAsyncQueue = env.ENABLE_ASYNC_QUEUE === 'true';
  console.log(`[Dispatcher] ENABLE_ASYNC_QUEUE = ${enableAsyncQueue}`);

  // 2. ASYNC MODE
  if (enableAsyncQueue) {
    if (!env.FORTUNE_QUEUE) {
      console.error('[Dispatcher] FORTUNE_QUEUE binding is missing!');
      // Fallback to sync? Or throw? Let's fallback to sync to be safe, or throw if critical.
      // Ideally we fallback.
    } else {
      try {
        await env.FORTUNE_QUEUE.send(payload, {
          contentType: 'json'
        });
        
        console.log(`[Dispatcher] Job queued for user ${payload.userId}`);
        
        return {
          status: 'queued',
          message: '🔮 命運計算中，請稍候... (已加入排程)'
        };
      } catch (e) {
        console.error('[Dispatcher] Failed to enqueue job:', e);
        // Fallback to sync on queue error
      }
    }
  }

  // 3. SYNC MODE (Legacy/Fallback)
  console.log('[Dispatcher] Running synchronously...');
  const service = new FortuneService(env, db);
  
  // Need to reconstruct User object slightly if not fully passed, 
  // but FortuneService mostly needs telegram_id. 
  // Wait, FortuneService.generateFortune takes a User object.
  // We need to fetch the full user from DB to be safe, or construct a partial one if we trust payload.
  // Let's fetch freshly to ensure latest state (like VIP).
  const { findUserByTelegramId } = await import('../db/queries/users');
  const { createDatabaseClient } = await import('../db/client');
  const dbClient = createDatabaseClient(env.DB); // Assuming env.DB is passed or available via env
  const user = await findUserByTelegramId(dbClient, payload.userId);
  
  if (!user) {
    throw new Error('User not found during sync dispatch');
  }

  const result = await service.generateFortune(
    user,
    payload.userProfile,
    payload.fortuneType,
    payload.targetDate,
    payload.targetProfile,
    payload.targetUserId,
    payload.context,
    onProgress
  );

  return {
    status: 'completed',
    result: result
  };
}

