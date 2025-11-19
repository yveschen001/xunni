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
    if (!user || !user.is_vip) {
      await telegram.sendMessage(chatId, '❌ 你不是 VIP 用戶，無法申請退款。');
      return;
    }
    
    // Check for existing pending request
    const existingRequest = await db.d1.prepare(`
      SELECT id FROM refund_requests
      WHERE user_id = ? AND status = 'pending'
    `).bind(telegramId).first();
    
    if (existingRequest) {
      await telegram.sendMessage(chatId, '⏳ 你已有待處理的退款請求，請耐心等待管理員審核。');
      return;
    }
    
    // Get last payment
    const lastPayment = await db.d1.prepare(`
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
    `).bind(telegramId).first();
    
    if (!lastPayment) {
      await telegram.sendMessage(chatId, '❌ 找不到支付記錄。');
      return;
    }
    
    // Check refund time limit (7 days)
    const paymentDate = new Date(lastPayment.created_at as string);
    const now = new Date();
    const daysSincePayment = (now.getTime() - paymentDate.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysSincePayment > 7) {
      await telegram.sendMessage(
        chatId,
        `❌ 退款申請超過時限\n\n` +
          `支付時間：${paymentDate.toLocaleDateString('zh-TW')}\n` +
          `退款時限：支付後 7 天內\n\n` +
          `💡 如有特殊情況，請聯繫客服。`
      );
      return;
    }
    
    // Request refund reason
    await telegram.sendMessage(
      chatId,
      `📝 **申請退款**\n\n` +
        `請輸入退款原因（至少 10 個字）：`
    );
    
    // Create session for reason input
    await db.d1.prepare(`
      INSERT INTO user_sessions (user_id, session_type, data, expires_at)
      VALUES (?, 'vip_refund_reason', ?, datetime('now', '+1 hour'))
    `).bind(
      telegramId,
      JSON.stringify({ 
        payment_id: lastPayment.telegram_payment_id, 
        subscription_id: lastPayment.subscription_id 
      })
    ).run();
    
  } catch (error) {
    console.error('[handleVipRefund] Error:', error);
    await telegram.sendMessage(chatId, '❌ 發生錯誤，請稍後再試。');
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
  if (reason.length < 10) {
    await telegram.sendMessage(chatId, '❌ 退款原因至少需要 10 個字，請重新輸入：');
    return;
  }
  
  try {
    // Create refund request
    const result = await db.d1.prepare(`
      INSERT INTO refund_requests (
        user_id,
        payment_id,
        subscription_id,
        reason,
        status,
        requested_at
      ) VALUES (?, ?, ?, ?, 'pending', datetime('now'))
    `).bind(
      telegramId,
      sessionData.payment_id,
      sessionData.subscription_id,
      reason
    ).run();
    
    // Clear session
    await db.d1.prepare(`
      DELETE FROM user_sessions
      WHERE user_id = ? AND session_type = 'vip_refund_reason'
    `).bind(telegramId).run();
    
    // Notify user
    await telegram.sendMessage(
      chatId,
      `✅ **退款申請已提交**\n\n` +
        `申請編號：#${result.meta.last_row_id}\n` +
        `狀態：待審核\n\n` +
        `我們會在 1-3 個工作日內處理你的申請。\n` +
        `處理結果會通過 Bot 通知你。\n\n` +
        `感謝你的耐心等待！`
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
    await telegram.sendMessage(chatId, '❌ 提交失敗，請稍後再試。');
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
  if (telegramId !== env.SUPER_ADMIN_USER_ID) {
    await telegram.sendMessage(chatId, '❌ 權限不足');
    return;
  }
  
  try {
    // Query pending refund requests
    const requests = await db.d1.prepare(`
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
    `).all();
    
    if (requests.results.length === 0) {
      await telegram.sendMessage(chatId, '✅ 沒有待處理的退款請求。');
      return;
    }
    
    // Display refund requests
    let msg = `📋 **待處理退款請求** (${requests.results.length})\n\n`;
    
    for (const req of requests.results as any[]) {
      msg += `**#${req.id}** - ${req.nickname}\n`;
      msg += `用戶 ID：\`${req.user_id}\`\n`;
      msg += `金額：${req.amount_stars} ⭐\n`;
      msg += `原因：${req.reason}\n`;
      msg += `申請時間：${new Date(req.requested_at).toLocaleString('zh-TW')}\n`;
      msg += `\n`;
    }
    
    msg += `💡 使用以下命令處理：\n`;
    msg += `• 批准：\`/admin_approve_refund <ID>\`\n`;
    msg += `• 拒絕：\`/admin_reject_refund <ID> <原因>\``;
    
    await telegram.sendMessage(chatId, msg);
    
  } catch (error) {
    console.error('[handleAdminRefunds] Error:', error);
    await telegram.sendMessage(chatId, '❌ 發生錯誤');
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
  
  try {
    // Get refund request
    const request = await db.d1.prepare(`
      SELECT 
        rr.*,
        p.telegram_payment_id,
        p.amount_stars
      FROM refund_requests rr
      JOIN payments p ON rr.payment_id = p.telegram_payment_id
      WHERE rr.id = ? AND rr.status = 'pending'
    `).bind(requestId).first();
    
    if (!request) {
      await telegram.sendMessage(chatId, '❌ 退款請求不存在或已處理');
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
    await db.d1.prepare(`
      UPDATE refund_requests
      SET status = 'completed',
          admin_id = ?,
          processed_at = datetime('now')
      WHERE id = ?
    `).bind(adminId, requestId).run();
    
    // Update payment record
    await db.d1.prepare(`
      UPDATE payments
      SET status = 'refunded',
          payment_type = 'refund',
          refunded_at = datetime('now')
      WHERE telegram_payment_id = ?
    `).bind(request.telegram_payment_id).run();
    
    // Cancel VIP
    await db.d1.prepare(`
      UPDATE users
      SET is_vip = 0,
          vip_expire_at = NULL,
          updated_at = datetime('now')
      WHERE telegram_id = ?
    `).bind(request.user_id).run();
    
    // Update subscription status
    if (request.subscription_id) {
      await db.d1.prepare(`
        UPDATE vip_subscriptions
        SET status = 'cancelled',
            updated_at = datetime('now')
        WHERE id = ?
      `).bind(request.subscription_id).run();
    }
    
    // Notify user
    await telegram.sendMessage(
      parseInt(request.user_id as string),
      `✅ **退款已批准**\n\n` +
        `退款金額：${request.amount_stars} ⭐\n` +
        `退款將在 1-3 個工作日內到帳。\n\n` +
        `你的 VIP 會員已取消。\n\n` +
        `感謝你的理解！`
    );
    
    // Notify admin
    await telegram.sendMessage(
      chatId,
      `✅ 退款已批准\n\n` +
        `請求 ID：#${requestId}\n` +
        `用戶 ID：${request.user_id}\n` +
        `金額：${request.amount_stars} ⭐`
    );
    
  } catch (error) {
    console.error('[handleAdminApproveRefund] Error:', error);
    await telegram.sendMessage(chatId, `❌ 退款失敗：${error instanceof Error ? error.message : String(error)}`);
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
  
  try {
    // Get refund request
    const request = await db.d1.prepare(`
      SELECT * FROM refund_requests
      WHERE id = ? AND status = 'pending'
    `).bind(requestId).first();
    
    if (!request) {
      await telegram.sendMessage(chatId, '❌ 退款請求不存在或已處理');
      return;
    }
    
    // Update refund request status
    await db.d1.prepare(`
      UPDATE refund_requests
      SET status = 'rejected',
          admin_id = ?,
          admin_note = ?,
          processed_at = datetime('now')
      WHERE id = ?
    `).bind(adminId, reason, requestId).run();
    
    // Notify user
    await telegram.sendMessage(
      parseInt(request.user_id as string),
      `❌ **退款申請已被拒絕**\n\n` +
        `原因：${reason}\n\n` +
        `如有疑問，請聯繫客服。`
    );
    
    // Notify admin
    await telegram.sendMessage(
      chatId,
      `✅ 退款已拒絕\n\n` +
        `請求 ID：#${requestId}\n` +
        `用戶 ID：${request.user_id}`
    );
    
  } catch (error) {
    console.error('[handleAdminRejectRefund] Error:', error);
    await telegram.sendMessage(chatId, `❌ 操作失敗：${error instanceof Error ? error.message : String(error)}`);
  }
}

