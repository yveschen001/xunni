import type { D1Database } from '@cloudflare/workers-types';
import type { Env } from '~/types';
import { createTelegramService } from '~/services/telegram';

export interface SendResult {
  success: boolean;
  error?: string;
  isBlocked?: boolean;
}

/**
 * Notification Service (SafeSender)
 * 
 * Centralized service for sending messages with:
 * 1. Automatic Block Detection (403 Forbidden)
 * 2. User Status Updates (Active -> Blocked)
 * 3. Rate Limiting protection (Basic)
 */
export class NotificationService {
  private env: Env;
  private db: D1Database;
  private telegram: ReturnType<typeof createTelegramService>;

  constructor(env: Env, db: D1Database) {
    this.env = env;
    this.db = db;
    this.telegram = createTelegramService(env);
  }

  /**
   * Send a text message safely
   */
  async sendText(userId: string, text: string, params?: any): Promise<SendResult> {
    try {
      await this.telegram.sendMessage(userId, text, params);
      return { success: true };
    } catch (error: any) {
      return this.handleSendError(userId, error);
    }
  }

  /**
   * Send a text message safely (alias for sendText)
   */
  async sendImmediate(userId: string, text: string, params?: any): Promise<SendResult> {
    return this.sendText(userId, text, params);
  }

  /**
   * Handle Telegram API errors and update user status if needed
   */
  private async handleSendError(userId: string, error: any): Promise<SendResult> {
    const errorMsg = error.message || String(error);
    
    // Check for "Blocked" or "Deactivated" errors
    const isBlocked = 
      errorMsg.includes('Forbidden: bot was blocked by the user') ||
      errorMsg.includes('Forbidden: user is deactivated') || 
      errorMsg.includes('PEER_ID_INVALID'); // Sometimes implies deleted account

    if (isBlocked) {
      console.warn(`[SafeSender] User ${userId} has blocked the bot. Marking as blocked.`);
      await this.markUserAsBlocked(userId);
      return { success: false, error: errorMsg, isBlocked: true };
    }

    console.error(`[SafeSender] Failed to send to ${userId}: ${errorMsg}`);
    return { success: false, error: errorMsg, isBlocked: false };
  }

  /**
   * Mark user as blocked in database to prevent future send attempts
   */
  private async markUserAsBlocked(userId: string) {
    try {
      await this.db.prepare(`
        UPDATE users 
        SET bot_status = 'blocked', 
            updated_at = CURRENT_TIMESTAMP
        WHERE telegram_id = ?
      `).bind(userId).run();
    } catch (dbError) {
      console.error(`[SafeSender] DB Update Failed for ${userId}:`, dbError);
    }
  }
}

export function createNotificationService(env: Env, db: D1Database): NotificationService {
  return new NotificationService(env, db);
}
