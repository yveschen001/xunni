/**
 * Subscription Export API
 * 
 * GDPR Compliance: Allows users to export their subscription data
 * Required by Telegram for subscription_period feature
 * 
 * Endpoint: POST /subscription-export
 */

import type { Env } from '~/types';
import { createDatabaseClient } from '~/db/client';

export interface SubscriptionExportRequest {
  user_id: string; // Telegram user ID
}

export interface SubscriptionExportResponse {
  ok: boolean;
  result?: {
    user_id: string;
    subscriptions: Array<{
      id: number;
      start_date: string;
      expire_date: string;
      status: string;
      is_auto_renew: boolean;
      created_at: string;
    }>;
    payments: Array<{
      id: number;
      telegram_payment_id: string;
      amount_stars: number;
      currency: string;
      status: string;
      created_at: string;
    }>;
  };
  error?: string;
}

/**
 * Handle subscription export request
 * 
 * This endpoint is called by Telegram when a user requests to export their data
 * as part of GDPR compliance.
 */
export async function handleSubscriptionExport(
  request: Request,
  env: Env
): Promise<Response> {
  try {
    // Verify request method
    if (request.method !== 'POST') {
      return new Response(
        JSON.stringify({ ok: false, error: 'Method not allowed' }),
        { status: 405, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const body = (await request.json()) as SubscriptionExportRequest;
    const userId = body.user_id;

    if (!userId) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Missing user_id' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.error('[SubscriptionExport] Request for user:', userId);

    const db = createDatabaseClient(env.DB);

    // Get user's subscriptions
    const subscriptions = await db.d1
      .prepare(
        `
        SELECT 
          id,
          start_date,
          expire_date,
          status,
          auto_renew_enabled as is_auto_renew,
          created_at
        FROM vip_subscriptions
        WHERE user_id = ?
        ORDER BY created_at DESC
      `
      )
      .bind(userId)
      .all();

    // Get user's payments
    // Note: Using 'telegram_id' and 'amount' fields (exist in all schemas)
    const payments = await db.d1
      .prepare(
        `
        SELECT 
          id,
          telegram_payment_id,
          amount as amount_stars,
          currency,
          status,
          created_at
        FROM payments
        WHERE telegram_id = ?
        ORDER BY created_at DESC
      `
      )
      .bind(userId)
      .all();

    // Prepare response
    const response: SubscriptionExportResponse = {
      ok: true,
      result: {
        user_id: userId,
        subscriptions: subscriptions.results as any[],
        payments: payments.results as any[],
      },
    };

    console.error('[SubscriptionExport] Export successful:', {
      user_id: userId,
      subscriptions_count: subscriptions.results.length,
      payments_count: payments.results.length,
    });

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[SubscriptionExport] Error:', error);
    console.error('[SubscriptionExport] Error stack:', error instanceof Error ? error.stack : 'No stack');
    console.error('[SubscriptionExport] Error message:', error instanceof Error ? error.message : String(error));
    return new Response(
      JSON.stringify({
        ok: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

