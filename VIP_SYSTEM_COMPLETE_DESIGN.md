# VIP 系統完整設計與實現方案

**日期**: 2025-11-19  
**版本**: v2.0 - 完整運營版

---

## 📊 當前實現狀態

### ✅ 已完成功能

| 功能 | 狀態 | 文件位置 |
|------|------|----------|
| **VIP 購買流程** | ✅ | `src/telegram/handlers/vip.ts` |
| **Telegram Stars 支付** | ✅ | `src/telegram/handlers/vip.ts` |
| **Pre-checkout 驗證** | ✅ | `handlePreCheckout()` |
| **支付成功處理** | ✅ | `handleSuccessfulPayment()` |
| **VIP 狀態檢查** | ✅ | `handleVip()` |
| **VIP 續訂** | ✅ | `handleVipRenew()` |
| **Payment 記錄** | ✅ | `payments` 表 |
| **VIP 權益顯示** | ✅ | `/vip` 命令 |
| **Staging 測試價格** | ✅ | `VIP_PRICE_STARS` 環境變數 |

### ❌ 缺失功能

| 功能 | 狀態 | 優先級 |
|------|------|--------|
| **自動續費** | ❌ | 🔴 P0 |
| **VIP 到期提醒** | ❌ | 🔴 P0 |
| **VIP 自動降級** | ❌ | 🔴 P0 |
| **退款處理** | ❌ | 🔴 P0 |
| **支付失敗處理** | ❌ | 🟡 P1 |
| **超級管理員通知** | ❌ | 🟡 P1 |
| **VIP 統計報表** | ❌ | 🟢 P2 |
| **訂閱管理** | ❌ | 🟢 P2 |

---

## 🎯 完整設計方案

### 1. 自動續費系統

#### 1.1 設計原則

**Telegram Stars 不支持自動扣款**，因此我們採用「主動提醒 + 一鍵續費」模式：

1. **到期前提醒**：到期前 7天、3天、1天、當天各提醒一次
2. **一鍵續費**：提供快速續費按鈕
3. **到期後寬限期**：到期後 3 天內仍可續費（不中斷服務）
4. **自動降級**：寬限期後自動降級為免費用戶

#### 1.2 數據庫 Schema

```sql
-- 新增 VIP 訂閱管理表
CREATE TABLE vip_subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('active', 'expiring', 'expired', 'cancelled')),
  start_date TEXT NOT NULL,
  expire_date TEXT NOT NULL,
  last_payment_date TEXT,
  last_payment_id TEXT,
  auto_renew_enabled INTEGER DEFAULT 0,  -- 用戶是否希望續費（提醒用）
  reminder_sent_7d INTEGER DEFAULT 0,
  reminder_sent_3d INTEGER DEFAULT 0,
  reminder_sent_1d INTEGER DEFAULT 0,
  reminder_sent_0d INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(telegram_id)
);

CREATE INDEX idx_vip_subscriptions_user_id ON vip_subscriptions(user_id);
CREATE INDEX idx_vip_subscriptions_status ON vip_subscriptions(status);
CREATE INDEX idx_vip_subscriptions_expire_date ON vip_subscriptions(expire_date);

-- 擴展 payments 表
ALTER TABLE payments ADD COLUMN subscription_id INTEGER;
ALTER TABLE payments ADD COLUMN payment_type TEXT CHECK(payment_type IN ('initial', 'renewal', 'refund'));
ALTER TABLE payments ADD COLUMN refund_reason TEXT;
ALTER TABLE payments ADD COLUMN refunded_at TEXT;
```

#### 1.3 Cron Job 實現

```typescript
// src/services/vip_subscription.ts

/**
 * VIP 訂閱到期檢查和提醒（每天執行一次）
 */
export async function checkVipExpirations(
  env: Env,
  db: ReturnType<typeof createDatabaseClient>
): Promise<void> {
  const telegram = createTelegramService(env);
  const now = new Date();
  
  // 計算各個提醒時間點
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const in3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const in1Day = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);
  const today = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  
  // 1. 7天提醒
  await sendExpirationReminders(db, telegram, in7Days, '7d', env);
  
  // 2. 3天提醒
  await sendExpirationReminders(db, telegram, in3Days, '3d', env);
  
  // 3. 1天提醒
  await sendExpirationReminders(db, telegram, in1Day, '1d', env);
  
  // 4. 當天提醒
  await sendExpirationReminders(db, telegram, today, '0d', env);
  
  // 5. 自動降級（到期 + 3天寬限期）
  await autoDowngradeExpiredVips(db, telegram, env);
}

/**
 * 發送到期提醒
 */
async function sendExpirationReminders(
  db: ReturnType<typeof createDatabaseClient>,
  telegram: ReturnType<typeof createTelegramService>,
  targetDate: Date,
  reminderType: '7d' | '3d' | '1d' | '0d',
  env: Env
): Promise<void> {
  const reminderField = `reminder_sent_${reminderType}`;
  
  // 查詢需要提醒的用戶
  const subscriptions = await db.d1.prepare(`
    SELECT 
      vs.id,
      vs.user_id,
      vs.expire_date,
      u.language_code
    FROM vip_subscriptions vs
    JOIN users u ON vs.user_id = u.telegram_id
    WHERE vs.status = 'active'
      AND DATE(vs.expire_date) = DATE(?)
      AND vs.${reminderField} = 0
  `).bind(targetDate.toISOString()).all();
  
  const priceStars = resolveVipPrice(env);
  
  for (const sub of subscriptions.results) {
    try {
      const daysLeft = reminderType === '7d' ? 7 : reminderType === '3d' ? 3 : reminderType === '1d' ? 1 : 0;
      const message = daysLeft > 0
        ? `⏰ **VIP 到期提醒**\n\n` +
          `你的 VIP 會員將在 ${daysLeft} 天後到期。\n\n` +
          `到期時間：${new Date(sub.expire_date).toLocaleDateString('zh-TW')}\n\n` +
          `💡 立即續費，享受不間斷的 VIP 服務！`
        : `⚠️ **VIP 今天到期**\n\n` +
          `你的 VIP 會員今天到期。\n\n` +
          `💡 立即續費，繼續享受 VIP 權益！\n` +
          `📌 寬限期：到期後 3 天內續費不會中斷服務。`;
      
      await telegram.sendMessageWithButtons(
        parseInt(sub.user_id),
        message,
        [
          [{ text: `💳 立即續費 (${priceStars} ⭐)`, callback_data: 'vip_renew' }],
          [{ text: '❌ 取消', callback_data: 'vip_cancel_reminder' }],
        ]
      );
      
      // 標記已發送
      await db.d1.prepare(`
        UPDATE vip_subscriptions
        SET ${reminderField} = 1,
            updated_at = datetime('now')
        WHERE id = ?
      `).bind(sub.id).run();
      
      // 通知超級管理員
      await notifySuperAdmin(telegram, env, 'vip_reminder_sent', {
        user_id: sub.user_id,
        days_left: daysLeft,
        expire_date: sub.expire_date,
      });
      
    } catch (error) {
      console.error(`[sendExpirationReminders] Failed for user ${sub.user_id}:`, error);
    }
  }
}

/**
 * 自動降級過期 VIP
 */
async function autoDowngradeExpiredVips(
  db: ReturnType<typeof createDatabaseClient>,
  telegram: ReturnType<typeof createTelegramService>,
  env: Env
): Promise<void> {
  const now = new Date();
  const gracePeriodEnd = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000); // 3天前
  
  // 查詢需要降級的用戶（到期 + 3天寬限期）
  const expiredSubs = await db.d1.prepare(`
    SELECT 
      vs.id,
      vs.user_id,
      vs.expire_date,
      u.language_code
    FROM vip_subscriptions vs
    JOIN users u ON vs.user_id = u.telegram_id
    WHERE vs.status = 'active'
      AND DATE(vs.expire_date) <= DATE(?)
  `).bind(gracePeriodEnd.toISOString()).all();
  
  for (const sub of expiredSubs.results) {
    try {
      // 1. 更新用戶 VIP 狀態
      await db.d1.prepare(`
        UPDATE users
        SET is_vip = 0,
            vip_expire_at = NULL,
            updated_at = datetime('now')
        WHERE telegram_id = ?
      `).bind(sub.user_id).run();
      
      // 2. 更新訂閱狀態
      await db.d1.prepare(`
        UPDATE vip_subscriptions
        SET status = 'expired',
            updated_at = datetime('now')
        WHERE id = ?
      `).bind(sub.id).run();
      
      // 3. 發送降級通知
      await telegram.sendMessage(
        parseInt(sub.user_id),
        `😢 **VIP 會員已到期**\n\n` +
          `你的 VIP 會員已於 ${new Date(sub.expire_date).toLocaleDateString('zh-TW')} 到期。\n\n` +
          `你的帳號已恢復為免費用戶。\n\n` +
          `💡 隨時可以重新訂閱 VIP：/vip\n\n` +
          `感謝你的支持！❤️`
      );
      
      // 4. 通知超級管理員
      await notifySuperAdmin(telegram, env, 'vip_downgraded', {
        user_id: sub.user_id,
        expire_date: sub.expire_date,
      });
      
    } catch (error) {
      console.error(`[autoDowngradeExpiredVips] Failed for user ${sub.user_id}:`, error);
    }
  }
}
```

---

### 2. 退款處理系統

#### 2.1 退款流程

**Telegram Stars 退款需要手動處理**：

1. **用戶申請退款**：通過 `/vip_refund` 命令
2. **管理員審核**：超級管理員收到通知，審核退款請求
3. **執行退款**：管理員通過 Telegram Bot API 執行退款
4. **自動降級**：退款成功後自動取消 VIP

#### 2.2 數據庫 Schema

```sql
-- 退款請求表
CREATE TABLE refund_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  payment_id TEXT NOT NULL,
  subscription_id INTEGER,
  reason TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('pending', 'approved', 'rejected', 'completed')),
  admin_id TEXT,
  admin_note TEXT,
  requested_at TEXT DEFAULT CURRENT_TIMESTAMP,
  processed_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(telegram_id),
  FOREIGN KEY (subscription_id) REFERENCES vip_subscriptions(id)
);

CREATE INDEX idx_refund_requests_user_id ON refund_requests(user_id);
CREATE INDEX idx_refund_requests_status ON refund_requests(status);
```

#### 2.3 實現代碼

```typescript
// src/telegram/handlers/vip_refund.ts

/**
 * 用戶申請退款
 */
export async function handleVipRefund(message: TelegramMessage, env: Env): Promise<void> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const chatId = message.chat.id;
  const telegramId = message.from!.id.toString();
  
  try {
    // 1. 檢查用戶是否為 VIP
    const user = await findUserByTelegramId(db, telegramId);
    if (!user || !user.is_vip) {
      await telegram.sendMessage(chatId, '❌ 你不是 VIP 用戶，無法申請退款。');
      return;
    }
    
    // 2. 檢查是否已有待處理的退款請求
    const existingRequest = await db.d1.prepare(`
      SELECT id FROM refund_requests
      WHERE user_id = ? AND status = 'pending'
    `).bind(telegramId).first();
    
    if (existingRequest) {
      await telegram.sendMessage(chatId, '⏳ 你已有待處理的退款請求，請耐心等待管理員審核。');
      return;
    }
    
    // 3. 獲取最近的支付記錄
    const lastPayment = await db.d1.prepare(`
      SELECT 
        p.id,
        p.telegram_payment_id,
        p.amount_stars,
        p.created_at,
        vs.id as subscription_id
      FROM payments p
      LEFT JOIN vip_subscriptions vs ON p.subscription_id = vs.id
      WHERE p.user_id = ? AND p.status = 'completed'
      ORDER BY p.created_at DESC
      LIMIT 1
    `).bind(telegramId).first();
    
    if (!lastPayment) {
      await telegram.sendMessage(chatId, '❌ 找不到支付記錄。');
      return;
    }
    
    // 4. 檢查退款時限（7天內）
    const paymentDate = new Date(lastPayment.created_at);
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
    
    // 5. 請求退款原因
    await telegram.sendMessage(
      chatId,
      `📝 **申請退款**\n\n` +
        `請輸入退款原因（至少 10 個字）：`
    );
    
    // 6. 創建會話等待原因輸入
    await db.d1.prepare(`
      INSERT INTO user_sessions (user_id, session_type, data, expires_at)
      VALUES (?, 'vip_refund_reason', ?, datetime('now', '+1 hour'))
    `).bind(
      telegramId,
      JSON.stringify({ payment_id: lastPayment.telegram_payment_id, subscription_id: lastPayment.subscription_id })
    ).run();
    
  } catch (error) {
    console.error('[handleVipRefund] Error:', error);
    await telegram.sendMessage(chatId, '❌ 發生錯誤，請稍後再試。');
  }
}

/**
 * 處理退款原因輸入
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
  
  // 驗證原因
  if (reason.length < 10) {
    await telegram.sendMessage(chatId, '❌ 退款原因至少需要 10 個字，請重新輸入：');
    return;
  }
  
  try {
    // 1. 創建退款請求
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
    
    // 2. 清除會話
    await db.d1.prepare(`
      DELETE FROM user_sessions
      WHERE user_id = ? AND session_type = 'vip_refund_reason'
    `).bind(telegramId).run();
    
    // 3. 通知用戶
    await telegram.sendMessage(
      chatId,
      `✅ **退款申請已提交**\n\n` +
        `申請編號：#${result.meta.last_row_id}\n` +
        `狀態：待審核\n\n` +
        `我們會在 1-3 個工作日內處理你的申請。\n` +
        `處理結果會通過 Bot 通知你。\n\n` +
        `感謝你的耐心等待！`
    );
    
    // 4. 通知超級管理員
    await notifySuperAdmin(telegram, env, 'refund_request', {
      request_id: result.meta.last_row_id,
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
 * 管理員審核退款（超級管理員專用）
 */
export async function handleAdminRefund(message: TelegramMessage, env: Env): Promise<void> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const chatId = message.chat.id;
  const telegramId = message.from!.id.toString();
  
  // 檢查權限
  if (telegramId !== env.SUPER_ADMIN_USER_ID) {
    await telegram.sendMessage(chatId, '❌ 權限不足');
    return;
  }
  
  try {
    // 查詢待處理的退款請求
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
    
    // 顯示退款請求列表
    let message = `📋 **待處理退款請求** (${requests.results.length})\n\n`;
    
    for (const req of requests.results) {
      message += `**#${req.id}** - ${req.nickname}\n`;
      message += `用戶 ID：\`${req.user_id}\`\n`;
      message += `金額：${req.amount_stars} ⭐\n`;
      message += `原因：${req.reason}\n`;
      message += `申請時間：${new Date(req.requested_at).toLocaleString('zh-TW')}\n`;
      message += `\n`;
    }
    
    message += `💡 使用以下命令處理：\n`;
    message += `• 批准：\`/admin_approve_refund <ID>\`\n`;
    message += `• 拒絕：\`/admin_reject_refund <ID> <原因>\``;
    
    await telegram.sendMessage(chatId, message);
    
  } catch (error) {
    console.error('[handleAdminRefund] Error:', error);
    await telegram.sendMessage(chatId, '❌ 發生錯誤');
  }
}

/**
 * 批准退款
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
    // 1. 獲取退款請求
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
    
    // 2. 執行 Telegram Stars 退款
    const refundResponse = await fetch(
      `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/refundStarPayment`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: parseInt(request.user_id),
          telegram_payment_charge_id: request.telegram_payment_id,
        }),
      }
    );
    
    if (!refundResponse.ok) {
      const error = await refundResponse.json();
      throw new Error(`Refund failed: ${JSON.stringify(error)}`);
    }
    
    // 3. 更新退款請求狀態
    await db.d1.prepare(`
      UPDATE refund_requests
      SET status = 'completed',
          admin_id = ?,
          processed_at = datetime('now')
      WHERE id = ?
    `).bind(adminId, requestId).run();
    
    // 4. 更新支付記錄
    await db.d1.prepare(`
      UPDATE payments
      SET status = 'refunded',
          payment_type = 'refund',
          refunded_at = datetime('now')
      WHERE telegram_payment_id = ?
    `).bind(request.telegram_payment_id).run();
    
    // 5. 取消 VIP
    await db.d1.prepare(`
      UPDATE users
      SET is_vip = 0,
          vip_expire_at = NULL,
          updated_at = datetime('now')
      WHERE telegram_id = ?
    `).bind(request.user_id).run();
    
    // 6. 更新訂閱狀態
    if (request.subscription_id) {
      await db.d1.prepare(`
        UPDATE vip_subscriptions
        SET status = 'cancelled',
            updated_at = datetime('now')
        WHERE id = ?
      `).bind(request.subscription_id).run();
    }
    
    // 7. 通知用戶
    await telegram.sendMessage(
      parseInt(request.user_id),
      `✅ **退款已批准**\n\n` +
        `退款金額：${request.amount_stars} ⭐\n` +
        `退款將在 1-3 個工作日內到帳。\n\n` +
        `你的 VIP 會員已取消。\n\n` +
        `感謝你的理解！`
    );
    
    // 8. 通知管理員
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
```

---

### 3. 超級管理員通知系統

#### 3.1 通知類型

| 事件 | 通知內容 | 優先級 |
|------|----------|--------|
| **VIP 購買成功** | 用戶 ID、金額、到期時間 | 🟢 低 |
| **VIP 續費成功** | 用戶 ID、金額、新到期時間 | 🟢 低 |
| **支付失敗** | 用戶 ID、失敗原因 | 🟡 中 |
| **退款請求** | 用戶 ID、原因、金額 | 🔴 高 |
| **VIP 到期提醒已發送** | 用戶 ID、剩餘天數 | 🟢 低 |
| **VIP 自動降級** | 用戶 ID、到期時間 | 🟢 低 |

#### 3.2 實現代碼

```typescript
// src/services/admin_notification.ts

type NotificationType = 
  | 'vip_purchased'
  | 'vip_renewed'
  | 'payment_failed'
  | 'refund_request'
  | 'vip_reminder_sent'
  | 'vip_downgraded';

interface NotificationData {
  user_id: string;
  [key: string]: any;
}

/**
 * 通知超級管理員
 */
export async function notifySuperAdmin(
  telegram: ReturnType<typeof createTelegramService>,
  env: Env,
  type: NotificationType,
  data: NotificationData
): Promise<void> {
  const adminId = env.SUPER_ADMIN_USER_ID;
  if (!adminId) {
    console.warn('[notifySuperAdmin] SUPER_ADMIN_USER_ID not configured');
    return;
  }
  
  try {
    const message = formatNotificationMessage(type, data);
    await telegram.sendMessage(parseInt(adminId), message);
  } catch (error) {
    console.error('[notifySuperAdmin] Failed to send notification:', error);
  }
}

/**
 * 格式化通知消息
 */
function formatNotificationMessage(type: NotificationType, data: NotificationData): string {
  const timestamp = new Date().toLocaleString('zh-TW');
  
  switch (type) {
    case 'vip_purchased':
      return `🎉 **新 VIP 購買**\n\n` +
        `用戶：\`${data.user_id}\`\n` +
        `金額：${data.amount_stars} ⭐\n` +
        `到期：${new Date(data.expire_date).toLocaleDateString('zh-TW')}\n` +
        `時間：${timestamp}`;
    
    case 'vip_renewed':
      return `🔄 **VIP 續費**\n\n` +
        `用戶：\`${data.user_id}\`\n` +
        `金額：${data.amount_stars} ⭐\n` +
        `新到期：${new Date(data.expire_date).toLocaleDateString('zh-TW')}\n` +
        `時間：${timestamp}`;
    
    case 'payment_failed':
      return `❌ **支付失敗**\n\n` +
        `用戶：\`${data.user_id}\`\n` +
        `原因：${data.error_message}\n` +
        `時間：${timestamp}`;
    
    case 'refund_request':
      return `🔴 **退款請求**\n\n` +
        `請求 ID：#${data.request_id}\n` +
        `用戶：\`${data.user_id}\`\n` +
        `支付 ID：\`${data.payment_id}\`\n` +
        `原因：${data.reason}\n` +
        `時間：${timestamp}\n\n` +
        `💡 使用 /admin_refunds 查看詳情`;
    
    case 'vip_reminder_sent':
      return `⏰ **VIP 到期提醒已發送**\n\n` +
        `用戶：\`${data.user_id}\`\n` +
        `剩餘：${data.days_left} 天\n` +
        `到期：${new Date(data.expire_date).toLocaleDateString('zh-TW')}\n` +
        `時間：${timestamp}`;
    
    case 'vip_downgraded':
      return `⬇️ **VIP 自動降級**\n\n` +
        `用戶：\`${data.user_id}\`\n` +
        `到期：${new Date(data.expire_date).toLocaleDateString('zh-TW')}\n` +
        `時間：${timestamp}`;
    
    default:
      return `📢 **系統通知**\n\n` +
        `類型：${type}\n` +
        `數據：${JSON.stringify(data)}\n` +
        `時間：${timestamp}`;
  }
}
```

---

### 4. Staging 測試價格配置

#### 4.1 環境變數配置

```toml
# wrangler.toml

[env.staging.vars]
VIP_PRICE_STARS = "1"  # Staging: 1 Star 用於測試

[env.production.vars]
VIP_PRICE_STARS = "150"  # Production: 150 Stars (~5 USD)
```

#### 4.2 代碼實現

```typescript
// src/telegram/handlers/vip.ts

// 已實現 ✅
function resolveVipPrice(env: Env): number {
  const value = Number(env.VIP_PRICE_STARS ?? DEFAULT_VIP_PRICE_STARS);
  if (Number.isFinite(value) && value > 0) {
    return value;
  }
  return DEFAULT_VIP_PRICE_STARS;
}

// 在顯示價格時添加環境標識
const priceNote =
  priceStars === DEFAULT_VIP_PRICE_STARS 
    ? '（約 5 USD）' 
    : '（Staging 測試價）';
```

#### 4.3 測試流程

1. **Staging 環境**：
   - 設置 `VIP_PRICE_STARS = 1`
   - 用 1 Star 購買 VIP
   - 測試所有 VIP 功能
   - 測試退款流程

2. **Production 環境**：
   - 設置 `VIP_PRICE_STARS = 150`
   - 正式上線前確認價格正確
   - 監控支付流程

---

## 📋 實現計劃

### Phase 1: 數據庫 Schema（1 小時）

- [ ] 創建 Migration `0036_create_vip_subscriptions.sql`
- [ ] 創建 Migration `0037_create_refund_requests.sql`
- [ ] 創建 Migration `0038_alter_payments_add_refund_fields.sql`
- [ ] 執行 Migrations（Staging + Production）

### Phase 2: 自動續費提醒（2 小時）

- [ ] 實現 `src/services/vip_subscription.ts`
- [ ] 實現 `checkVipExpirations()`
- [ ] 實現 `sendExpirationReminders()`
- [ ] 實現 `autoDowngradeExpiredVips()`
- [ ] 添加 Cron Job 到 `wrangler.toml`

### Phase 3: 退款處理（3 小時）

- [ ] 實現 `src/telegram/handlers/vip_refund.ts`
- [ ] 實現 `/vip_refund` 命令
- [ ] 實現退款原因輸入處理
- [ ] 實現 `/admin_refunds` 命令（超級管理員）
- [ ] 實現 `/admin_approve_refund` 命令
- [ ] 實現 `/admin_reject_refund` 命令
- [ ] 添加路由到 `src/router.ts`

### Phase 4: 超級管理員通知（1 小時）

- [ ] 實現 `src/services/admin_notification.ts`
- [ ] 實現 `notifySuperAdmin()`
- [ ] 整合到所有 VIP 相關事件

### Phase 5: 支付失敗處理（1 小時）

- [ ] 實現 `handlePaymentFailed()`
- [ ] 添加失敗原因記錄
- [ ] 添加失敗通知

### Phase 6: 測試與部署（2 小時）

- [ ] Staging 環境測試（1 Star）
- [ ] 測試完整購買流程
- [ ] 測試續費提醒
- [ ] 測試退款流程
- [ ] 測試自動降級
- [ ] 部署到 Production

---

## 🎯 總結

### 當前狀態
- ✅ 基本 VIP 購買流程已完成
- ✅ Staging 測試價格已支持
- ❌ 缺少自動續費提醒
- ❌ 缺少退款處理
- ❌ 缺少超級管理員通知

### 完成後功能
- ✅ 完整的 VIP 生命週期管理
- ✅ 自動到期提醒（7天、3天、1天、當天）
- ✅ 自動降級（到期 + 3天寬限期）
- ✅ 完整的退款流程（用戶申請 + 管理員審核）
- ✅ 超級管理員實時通知
- ✅ Staging/Production 環境隔離
- ✅ 完整的支付記錄和統計

### 預估工作量
- **總時間**：10 小時
- **優先級**：🔴 P0（商業化必需）
- **建議**：分 2-3 天完成，確保質量

---

**最後更新**: 2025-11-19  
**狀態**: 設計完成，待實現

