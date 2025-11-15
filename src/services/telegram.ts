/**
 * Telegram Bot API Service
 * Based on @doc/SPEC.md
 *
 * Provides wrapper functions for Telegram Bot API.
 */

import type { Env } from '~/types';

// ============================================================================
// Telegram API Client
// ============================================================================

export class TelegramService {
  private botToken: string;
  private baseURL: string;

  constructor(env: Env) {
    this.botToken = env.TELEGRAM_BOT_TOKEN;
    this.baseURL = `https://api.telegram.org/bot${this.botToken}`;
  }

  /**
   * Send a text message
   */
  async sendMessage(chatId: number | string, text: string, options?: {
    reply_markup?: unknown;
    parse_mode?: 'Markdown' | 'HTML';
  }): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          ...options,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('[Telegram] sendMessage failed:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('[Telegram] sendMessage error:', error);
      return false;
    }
  }

  /**
   * Send a message with inline keyboard
   */
  async sendMessageWithButtons(
    chatId: number | string,
    text: string,
    buttons: Array<Array<{ text: string; callback_data?: string; url?: string }>>
  ): Promise<boolean> {
    return this.sendMessage(chatId, text, {
      reply_markup: {
        inline_keyboard: buttons,
      },
    });
  }

  /**
   * Edit a message
   */
  async editMessage(
    chatId: number | string,
    messageId: number,
    text: string,
    options?: {
      reply_markup?: unknown;
    }
  ): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/editMessageText`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          message_id: messageId,
          text,
          ...options,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('[Telegram] editMessage failed:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('[Telegram] editMessage error:', error);
      return false;
    }
  }

  /**
   * Edit message text (alias for editMessage)
   */
  async editMessageText(
    chatId: number | string,
    messageId: number,
    text: string,
    options?: {
      reply_markup?: unknown;
    }
  ): Promise<boolean> {
    return this.editMessage(chatId, messageId, text, options);
  }

  /**
   * Answer callback query
   */
  async answerCallbackQuery(
    callbackQueryId: string,
    text?: string,
    showAlert = false
  ): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/answerCallbackQuery`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          callback_query_id: callbackQueryId,
          text,
          show_alert: showAlert,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('[Telegram] answerCallbackQuery failed:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('[Telegram] answerCallbackQuery error:', error);
      return false;
    }
  }

  /**
   * Set webhook
   */
  async setWebhook(url: string, secretToken?: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/setWebhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          secret_token: secretToken,
          allowed_updates: ['message', 'callback_query', 'pre_checkout_query'],
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('[Telegram] setWebhook failed:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('[Telegram] setWebhook error:', error);
      return false;
    }
  }

  /**
   * Get webhook info
   */
  async getWebhookInfo(): Promise<unknown> {
    try {
      const response = await fetch(`${this.baseURL}/getWebhookInfo`);

      if (!response.ok) {
        const error = await response.text();
        console.error('[Telegram] getWebhookInfo failed:', error);
        return null;
      }

      const data = (await response.json()) as any;
      return data.result;
    } catch (error) {
      console.error('[Telegram] getWebhookInfo error:', error);
      return null;
    }
  }

  /**
   * Send invoice (for Telegram Stars payment)
   */
  async sendInvoice(
    chatId: number | string,
    title: string,
    description: string,
    payload: string,
    currency: string,
    prices: Array<{ label: string; amount: number }>
  ): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/sendInvoice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          title,
          description,
          payload,
          provider_token: '', // Empty for Telegram Stars
          currency,
          prices,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('[Telegram] sendInvoice failed:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('[Telegram] sendInvoice error:', error);
      return false;
    }
  }

  /**
   * Answer pre-checkout query
   */
  async answerPreCheckoutQuery(
    preCheckoutQueryId: string,
    ok: boolean,
    errorMessage?: string
  ): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/answerPreCheckoutQuery`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pre_checkout_query_id: preCheckoutQueryId,
          ok,
          error_message: errorMessage,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('[Telegram] answerPreCheckoutQuery failed:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('[Telegram] answerPreCheckoutQuery error:', error);
      return false;
    }
  }

  /**
   * Get user profile photos
   */
  async getUserProfilePhotos(userId: number, limit = 1): Promise<unknown> {
    try {
      const response = await fetch(`${this.baseURL}/getUserProfilePhotos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          limit,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('[Telegram] getUserProfilePhotos failed:', error);
        return null;
      }

      const data = (await response.json()) as any;
      return data.result;
    } catch (error) {
      console.error('[Telegram] getUserProfilePhotos error:', error);
      return null;
    }
  }

  /**
   * Get file URL
   */
  async getFileURL(fileId: string): Promise<string | null> {
    try {
      const response = await fetch(`${this.baseURL}/getFile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          file_id: fileId,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('[Telegram] getFile failed:', error);
        return null;
      }

      const data = (await response.json()) as any;
      const filePath = data.result.file_path;

      return `https://api.telegram.org/file/bot${this.botToken}/${filePath}`;
    } catch (error) {
      console.error('[Telegram] getFile error:', error);
      return null;
    }
  }

  /**
   * Delete a message
   */
  async deleteMessage(chatId: number, messageId: number): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/deleteMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          message_id: messageId,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('[Telegram] deleteMessage failed:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('[Telegram] deleteMessage error:', error);
      return false;
    }
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create Telegram service instance
 */
export function createTelegramService(env: Env): TelegramService {
  return new TelegramService(env);
}

