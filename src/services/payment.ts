import type { Env } from '~/types';
import { createTelegramService } from './telegram';

export type PaymentProvider = 'telegram' | 'ton' | 'stripe';

export interface InvoiceOptions {
  chatId: number;
  title: string;
  description: string;
  payload: any;
  currency: string;
  prices: { label: string; amount: number }[];
  providerToken?: string; // Empty for Telegram Stars
  photoUrl?: string;
  subscriptionPeriod?: number; // For subscriptions
  provider?: PaymentProvider; // Future extensibility
}

/**
 * Payment Service
 * Encapsulates Payment API interactions (Telegram Stars, Future: TON, etc.)
 */
export class PaymentService {
  private telegram: ReturnType<typeof createTelegramService>;
  private env: Env;

  constructor(env: Env) {
    this.env = env;
    this.telegram = createTelegramService(env);
  }

  /**
   * Send an invoice to a user
   */
  async sendInvoice(options: InvoiceOptions): Promise<void> {
    const provider = options.provider || 'telegram';

    if (provider === 'telegram') {
      await this.sendTelegramInvoice(options);
    } else {
      // TODO: Implement other providers (TON, Stripe, etc.)
      console.warn(`[PaymentService] Provider ${provider} not implemented yet`);
      throw new Error(`Payment provider ${provider} not supported`);
    }
  }

  /**
   * Internal: Send Telegram Invoice
   */
  private async sendTelegramInvoice(options: InvoiceOptions): Promise<void> {
    const invoice: any = {
      chat_id: options.chatId,
      title: options.title,
      description: options.description,
      payload: JSON.stringify(options.payload),
      provider_token: options.providerToken || '',
      currency: options.currency,
      prices: options.prices,
    };

    if (options.photoUrl) {
      invoice.photo_url = options.photoUrl;
    }

    if (options.subscriptionPeriod) {
      invoice.subscription_period = options.subscriptionPeriod;
    }

    console.log('[PaymentService] Sending Telegram invoice:', JSON.stringify(invoice, null, 2));

    const apiRoot = this.env.TELEGRAM_API_ROOT || 'https://api.telegram.org';
    const response = await fetch(
      `${apiRoot}/bot${this.env.TELEGRAM_BOT_TOKEN}/sendInvoice`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invoice),
      }
    );

    const result = await response.json();
    
    if (!response.ok) {
      console.error('[PaymentService] Failed to send invoice:', JSON.stringify(result));
      throw new Error(`Failed to send invoice: ${JSON.stringify(result)}`);
    }
    
    console.log('[PaymentService] Invoice sent successfully');
  }

  /**
   * Record a successful payment in the database
   */
  async recordPayment(db: D1Database, data: {
    telegramId: string;
    transactionId: string; // Renamed from telegramPaymentId to be generic
    amount: number;
    currency: string;
    provider?: PaymentProvider;
    status?: 'completed' | 'pending' | 'refunded';
  }): Promise<void> {
    // Ensure both amount (old schema) and amount_stars (new schema) are populated
    // This handles the legacy schema constraint issue
    // Note: 'telegram_payment_id' currently serves as the generic transaction ID column
    await db.prepare(`
      INSERT INTO payments (
        telegram_id, 
        telegram_payment_id, 
        amount, 
        amount_stars, 
        currency, 
        status
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      data.telegramId,
      data.transactionId,
      data.amount,
      data.amount, // Populate amount_stars with same value
      data.currency,
      data.status || 'completed'
    ).run();
    
    console.log(`[PaymentService] Payment recorded for user ${data.telegramId}, amount: ${data.amount}, provider: ${data.provider || 'telegram'}`);
  }
}

