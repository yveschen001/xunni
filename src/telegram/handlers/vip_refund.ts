/**
 * VIP Refund Handler
 *
 * Handles VIP refund requests and admin approval/rejection.
 */

import type { Env, TelegramMessage } from '~/types';
import { createDatabaseClient } from '~/db/client';
import { createTelegramService } from '~/services/telegram';
import { findUserByTelegramId } from '~/db/queries/users';
import { notifySuperAdmin } from '~/services/admin_notification';
import { createI18n } from '~/i18n';

/**
 * User requests refund
 */
export async function handleVipRefund(message: TelegramMessage, env: Env): Promise<void> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const chatId = message.chat.id;
  const telegramId = message.from!.id.toString();

  try {
    // Update user activity
    try {
      const { updateUserActivity } = await import('~/services/user_activity');
      await updateUserActivity(db, telegramId);
    } catch (activityError) {
      console.error('[handleVipRefund] Failed to update user activity:', activityError);
    }

    // Check if user is VIP
    const user = await findUserByTelegramId(db, telegramId);
    const i18n = createI18n(user?.language_pref || 'zh-TW');
    if (!user || !user.is_vip) {
      await telegram.sendMessage(chatId, i18n.t('error.vip2'));
      return;
    }

    // Check for existing pending request
    const existingRequest = await db.d1
      .prepare(
        `
      SELECT id FROM refund_requests
      WHERE user_id = ? AND status = 'pending'
    `
      )
      .bind(telegramId)
      .first();

    if (existingRequest) {
      await telegram.sendMessage(chatId, i18n.t('vip.refundPending'));
      return;
    }

    // Get last payment
    const lastPayment = await db.d1
      .prepare(
        `
      SELECT 
        p.id,
        p.telegram_payment_id,
        p.amount_stars,
        p.created_at,
        vs.id as subscription_id
      FROM payments p
      LEFT JOIN vip_subscriptions vs ON p.user_id = vs.user_id AND vs.status = 'active'
      WHERE p.user_id = ? AND p.status = 'completed'
      ORDER BY p.created_at DESC
      LIMIT 1
    `
      )
      .bind(telegramId)
      .first();

    if (!lastPayment) {
      await telegram.sendMessage(chatId, i18n.t('vip.refundNoPayment'));
      return;
    }

    // Check refund time limit (7 days)
    const paymentDate = new Date(lastPayment.created_at as string);
    const now = new Date();
    const daysSincePayment = (now.getTime() - paymentDate.getTime()) / (1000 * 60 * 60 * 24);

    if (daysSincePayment > 7) {
      await telegram.sendMessage(
        chatId,
        i18n.t('vip.refundExpired', {
          paymentDate: paymentDate.toLocaleDateString(user.language_pref || 'zh-TW'),
        })
      );
      return;
    }

    // Request refund reason
    await telegram.sendMessage(chatId, i18n.t('vip.refundRequestReason'));

    // Create session for reason input
    await db.d1
      .prepare(
        `
      INSERT INTO user_sessions (user_id, session_type, data, expires_at)
      VALUES (?, 'vip_refund_reason', ?, datetime('now', '+1 hour'))
    `
      )
      .bind(
        telegramId,
        JSON.stringify({
          payment_id: lastPayment.telegram_payment_id,
          subscription_id: lastPayment.subscription_id,
        })
      )
      .run();
  } catch (error) {
    console.error('[handleVipRefund] Error:', error);
    const user = await findUserByTelegramId(db, telegramId);
    const errorI18n = createI18n(user?.language_pref || 'zh-TW');
    await telegram.sendMessage(chatId, errorI18n.t('error.text6'));
  }
}

/**
 * Handle refund reason input
 */
export async function handleVipRefundReasonInput(
  message: TelegramMessage,
  sessionData: any,
  env: Env
): Promise<void> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const chatId = message.chat.id;
  const telegramId = message.from!.id.toString();
  const reason = message.text?.trim() || '';

  // Validate reason
  const user = await findUserByTelegramId(db, telegramId);
  const i18n = createI18n(user?.language_pref || 'zh-TW');
  if (reason.length < 10) {
    await telegram.sendMessage(chatId, i18n.t('vip.refundReasonTooShort'));
    return;
  }

  try {
    // Create refund request
    const result = await db.d1
      .prepare(
        `
      INSERT INTO refund_requests (
        user_id,
        payment_id,
        subscription_id,
        reason,
        status,
        requested_at
      ) VALUES (?, ?, ?, ?, 'pending', datetime('now'))
    `
      )
      .bind(telegramId, sessionData.payment_id, sessionData.subscription_id, reason)
      .run();

    // Clear session
    await db.d1
      .prepare(
        `
      DELETE FROM user_sessions
      WHERE user_id = ? AND session_type = 'vip_refund_reason'
    `
      )
      .bind(telegramId)
      .run();

    // Notify user
    await telegram.sendMessage(
      chatId,
      i18n.t('vip.refundSubmitted', {
        requestId: result.meta.last_row_id?.toString() || 'unknown',
      })
    );

    // Notify super admin
    await notifySuperAdmin(env, 'refund_request', {
      request_id: result.meta.last_row_id?.toString() || 'unknown',
      user_id: telegramId,
      payment_id: sessionData.payment_id,
      reason: reason,
    });
  } catch (error) {
    console.error('[handleVipRefundReasonInput] Error:', error);
    const user = await findUserByTelegramId(db, telegramId);
    const errorI18n = createI18n(user?.language_pref || 'zh-TW');
    await telegram.sendMessage(chatId, errorI18n.t('vip.refundSubmitFailed'));
  }
}

/**
 * Admin views refund requests (super admin only)
 */
export async function handleAdminRefunds(message: TelegramMessage, env: Env): Promise<void> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const chatId = message.chat.id;
  const telegramId = message.from!.id.toString();

  // Check permission
  const user = await findUserByTelegramId(db, telegramId);
  const i18n = createI18n(user?.language_pref || 'zh-TW');
  if (telegramId !== env.SUPER_ADMIN_USER_ID) {
    await telegram.sendMessage(chatId, i18n.t('error.admin'));
    return;
  }

  try {
    // Query pending refund requests
    const requests = await db.d1
      .prepare(
        `
      SELECT 
        rr.id,
        rr.user_id,
        rr.payment_id,
        rr.reason,
        rr.requested_at,
        u.nickname,
        p.amount_stars
      FROM refund_requests rr
      JOIN users u ON rr.user_id = u.telegram_id
      JOIN payments p ON rr.payment_id = p.telegram_payment_id
      WHERE rr.status = 'pending'
      ORDER BY rr.requested_at ASC
      LIMIT 10
    `
      )
      .all();

    if (requests.results.length === 0) {
      await telegram.sendMessage(chatId, i18n.t('vip.refundNoPending'));
      return;
    }

    // Display refund requests
    let msg = i18n.t('vip.refundPendingList', { count: requests.results.length }) + '\n\n';

    for (const req of requests.results as any[]) {
      msg += i18n.t('vip.refundRequestItem', {
        id: req.id,
        nickname: req.nickname,
        userId: req.user_id,
        amount: req.amount_stars,
        reason: req.reason,
        requestedAt: new Date(req.requested_at).toLocaleString(user.language_pref || 'zh-TW'),
      }) + '\n\n';
    }

    msg += i18n.t('vip.refundAdminCommands');

    await telegram.sendMessage(chatId, msg);
  } catch (error) {
    console.error('[handleAdminRefunds] Error:', error);
    const user = await findUserByTelegramId(db, telegramId);
    const errorI18n = createI18n(user?.language_pref || 'zh-TW');
    await telegram.sendMessage(chatId, errorI18n.t('error.text6'));
  }
}

/**
 * Admin approves refund
 */
export async function handleAdminApproveRefund(
  message: TelegramMessage,
  requestId: string,
  env: Env
): Promise<void> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const chatId = message.chat.id;
  const adminId = message.from!.id.toString();

  const user = await findUserByTelegramId(db, adminId);
  const i18n = createI18n(user?.language_pref || 'zh-TW');
  try {
    // Get refund request
    const request = await db.d1
      .prepare(
        `
      SELECT 
        rr.*,
        p.telegram_payment_id,
        p.amount_stars
      FROM refund_requests rr
      JOIN payments p ON rr.payment_id = p.telegram_payment_id
      WHERE rr.id = ? AND rr.status = 'pending'
    `
      )
      .bind(requestId)
      .first();

    if (!request) {
      await telegram.sendMessage(chatId, i18n.t('vip.refundRequestNotFound'));
      return;
    }

    // Execute Telegram Stars refund
    const refundResponse = await fetch(
      `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/refundStarPayment`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: parseInt(request.user_id as string),
          telegram_payment_charge_id: request.telegram_payment_id,
        }),
      }
    );

    if (!refundResponse.ok) {
      const error = await refundResponse.json();
      throw new Error(`Refund failed: ${JSON.stringify(error)}`);
    }

    // Update refund request status
    await db.d1
      .prepare(
        `
      UPDATE refund_requests
      SET status = 'completed',
          admin_id = ?,
          processed_at = datetime('now')
      WHERE id = ?
    `
      )
      .bind(adminId, requestId)
      .run();

    // Update payment record
    await db.d1
      .prepare(
        `
      UPDATE payments
      SET status = 'refunded',
          payment_type = 'refund',
          refunded_at = datetime('now')
      WHERE telegram_payment_id = ?
    `
      )
      .bind(request.telegram_payment_id)
      .run();

    // Cancel VIP
    await db.d1
      .prepare(
        `
      UPDATE users
      SET is_vip = 0,
          vip_expire_at = NULL,
          updated_at = datetime('now')
      WHERE telegram_id = ?
    `
      )
      .bind(request.user_id)
      .run();

    // Update subscription status
    if (request.subscription_id) {
      await db.d1
        .prepare(
          `
        UPDATE vip_subscriptions
        SET status = 'cancelled',
            updated_at = datetime('now')
        WHERE id = ?
      `
        )
        .bind(request.subscription_id)
        .run();
    }

    // Notify user
    const requestUser = await findUserByTelegramId(db, request.user_id as string);
    const userI18n = createI18n(requestUser?.language_pref || 'zh-TW');
    await telegram.sendMessage(
      parseInt(request.user_id as string),
      userI18n.t('vip.refundApproved', {
        amount: request.amount_stars,
      })
    );

    // Notify admin
    await telegram.sendMessage(
      chatId,
      i18n.t('vip.refundApprovedAdmin', {
        requestId,
        userId: request.user_id,
        amount: request.amount_stars,
      })
    );
  } catch (error) {
    console.error('[handleAdminApproveRefund] Error:', error);
    await telegram.sendMessage(
      chatId,
      i18n.t('vip.refundFailed', {
        error: error instanceof Error ? error.message : String(error),
      })
    );
  }
}

/**
 * Admin rejects refund
 */
export async function handleAdminRejectRefund(
  message: TelegramMessage,
  requestId: string,
  reason: string,
  env: Env
): Promise<void> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const chatId = message.chat.id;
  const adminId = message.from!.id.toString();

  const user = await findUserByTelegramId(db, adminId);
  const i18n = createI18n(user?.language_pref || 'zh-TW');
  try {
    // Get refund request
    const request = await db.d1
      .prepare(
        `
      SELECT * FROM refund_requests
      WHERE id = ? AND status = 'pending'
    `
      )
      .bind(requestId)
      .first();

    if (!request) {
      await telegram.sendMessage(chatId, i18n.t('vip.refundRequestNotFound'));
      return;
    }

    // Update refund request status
    await db.d1
      .prepare(
        `
      UPDATE refund_requests
      SET status = 'rejected',
          admin_id = ?,
          admin_note = ?,
          processed_at = datetime('now')
      WHERE id = ?
    `
      )
      .bind(adminId, reason, requestId)
      .run();

    // Notify user
    const requestUser = await findUserByTelegramId(db, request.user_id as string);
    const userI18n = createI18n(requestUser?.language_pref || 'zh-TW');
    await telegram.sendMessage(
      parseInt(request.user_id as string),
      userI18n.t('vip.refundRejected', { reason })
    );

    // Notify admin
    await telegram.sendMessage(
      chatId,
      i18n.t('vip.refundRejectedAdmin', {
        requestId,
        userId: request.user_id,
      })
    );
  } catch (error) {
    console.error('[handleAdminRejectRefund] Error:', error);
    await telegram.sendMessage(
      chatId,
      i18n.t('errors.operationFailed', {
        error: error instanceof Error ? error.message : String(error),
      })
    );
  }
}
