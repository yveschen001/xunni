# Telegram Stars 訂閱實作指南

## 1. 概述

XunNi 使用 **Telegram Stars** 作為 VIP 訂閱的支付方式。Telegram Stars 是 Telegram 的虛擬貨幣，使用者可以透過 Telegram 購買並用於支付。

### 1.1 訂閱方案

- **價格**: 約 5 USD / 月（對應的 Stars 數量需根據 Telegram 匯率計算）
- **週期**: 每月自動續訂（需實作）
- **權益**: 
  - 每日 30 個漂流瓶（可升級至 100）
  - 34 種語言自動翻譯
  - 星座/MBTI 篩選
  - 無廣告

---

## 2. Telegram Stars 支付流程

### 2.1 建立訂閱連結

使用 `createInvoiceLink` API 建立支付連結：

```typescript
// src/services/telegram/payment.ts

import type { Env } from '../../config/env';

export interface InvoiceParams {
  title: string;
  description: string;
  payload: string; // 唯一識別符
  provider_token?: string; // Stars 支付不需要
  currency: string; // 'XTR' for Telegram Stars
  prices: Array<{ label: string; amount: number }>;
  max_tip_amount?: number;
  suggested_tip_amounts?: number[];
  provider_data?: string;
  photo_url?: string;
  photo_size?: number;
  photo_width?: number;
  photo_height?: number;
  need_name?: boolean;
  need_phone_number?: boolean;
  need_email?: boolean;
  need_shipping_address?: boolean;
  send_phone_number_to_provider?: boolean;
  send_email_to_provider?: boolean;
  is_flexible?: boolean;
}

/**
 * 建立 VIP 訂閱支付連結
 */
export async function createVipInvoiceLink(
  env: Env,
  userId: string
): Promise<string> {
  const botToken = env.TELEGRAM_BOT_TOKEN;
  
  // 計算 Stars 數量（5 USD ≈ 500 Stars，需根據實際匯率調整）
  const starsAmount = 500; // 實際金額需根據 Telegram 匯率計算
  
  const params: InvoiceParams = {
    title: '⭐ XunNi VIP 會員',
    description: '享受更多漂流瓶、自動翻譯、進階篩選等功能',
    payload: `vip_monthly_${userId}_${Date.now()}`,
    currency: 'XTR', // Telegram Stars
    prices: [
      {
        label: 'VIP 會員（1個月）',
        amount: starsAmount, // Stars 數量（以分為單位，所以 500 Stars = 50000）
      },
    ],
  };
  
  const url = `https://api.telegram.org/bot${botToken}/createInvoiceLink`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  
  const data = await response.json();
  
  if (!data.ok) {
    throw new Error(`Failed to create invoice: ${data.description}`);
  }
  
  return data.result;
}
```

### 2.2 發送發票訊息

使用 `sendInvoice` 直接發送發票：

```typescript
/**
 * 發送 VIP 訂閱發票
 */
export async function sendVipInvoice(
  env: Env,
  chatId: string,
  userId: string
): Promise<boolean> {
  const botToken = env.TELEGRAM_BOT_TOKEN;
  const starsAmount = 50000; // 500 Stars（以分為單位）
  
  const url = `https://api.telegram.org/bot${botToken}/sendInvoice`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      title: '⭐ XunNi VIP 會員',
      description: '享受更多漂流瓶、自動翻譯、進階篩選等功能',
      payload: `vip_monthly_${userId}_${Date.now()}`,
      provider_token: '', // Stars 支付不需要
      currency: 'XTR',
      prices: [
        {
          label: 'VIP 會員（1個月）',
          amount: starsAmount,
        },
      ],
    }),
  });
  
  const data = await response.json();
  return data.ok;
}
```

### 2.3 處理支付成功

當使用者完成支付後，Telegram 會發送 `pre_checkout_query` 和 `successful_payment` 事件：

```typescript
// src/telegram/handlers/vip.ts

import type { TelegramUpdate } from '../types';

/**
 * 處理 pre_checkout_query（支付前確認）
 */
export async function handlePreCheckoutQuery(
  update: TelegramUpdate,
  env: Env,
  db: D1Database
): Promise<void> {
  const query = update.pre_checkout_query;
  if (!query) return;
  
  const userId = String(query.from.id);
  const payload = query.invoice_payload;
  
  // 驗證 payload 格式
  if (!payload.startsWith('vip_monthly_')) {
    await answerPreCheckoutQuery(env, query.id, false, 'Invalid payload');
    return;
  }
  
  // 驗證使用者是否存在
  const user = await db.getUser(userId);
  if (!user) {
    await answerPreCheckoutQuery(env, query.id, false, 'User not found');
    return;
  }
  
  // 批准支付
  await answerPreCheckoutQuery(env, query.id, true);
}

/**
 * 處理 successful_payment（支付成功）
 */
export async function handleSuccessfulPayment(
  update: TelegramUpdate,
  env: Env,
  db: D1Database
): Promise<void> {
  const message = update.message;
  if (!message?.successful_payment) return;
  
  const userId = String(message.from.id);
  const payment = message.successful_payment;
  const payload = payment.invoice_payload;
  
  // 解析 payload
  const match = payload.match(/^vip_monthly_(\d+)_(\d+)$/);
  if (!match) {
    console.error('Invalid payment payload:', payload);
    return;
  }
  
  const targetUserId = match[1];
  
  // 驗證使用者
  if (targetUserId !== userId) {
    console.error('User ID mismatch');
    return;
  }
  
  // 記錄付款
  await db.prepare(`
    INSERT INTO payments (
      user_id,
      telegram_payment_id,
      stars_amount,
      status,
      product_code,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, 'paid', 'VIP_MONTHLY', datetime('now'), datetime('now'))
  `).bind(
    userId,
    payment.telegram_payment_charge_id,
    payment.total_amount // Stars 數量（以分為單位）
  ).run();
  
  // 啟用 VIP
  await activateVip(userId, 30, db); // 30 天
  
  // 發送確認訊息
  await sendMessage(env, userId, '🎉 恭喜成為 VIP 會員！\n\n有效期至：{expireDate}');
}

/**
 * 啟用 VIP
 */
async function activateVip(
  userId: string,
  days: number,
  db: D1Database
): Promise<void> {
  const now = new Date();
  const expireDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  
  // 檢查是否已有 VIP
  const user = await db.getUser(userId);
  const currentExpire = user?.vip_expire_at 
    ? new Date(user.vip_expire_at)
    : null;
  
  // 如果當前 VIP 尚未過期，延長到期時間
  const newExpire = currentExpire && currentExpire > now
    ? new Date(currentExpire.getTime() + days * 24 * 60 * 60 * 1000)
    : expireDate;
  
  await db.prepare(`
    UPDATE users
    SET is_vip = 1,
        vip_expire_at = ?,
        updated_at = datetime('now')
    WHERE telegram_id = ?
  `).bind(newExpire.toISOString(), userId).run();
}

/**
 * 回答 pre_checkout_query
 */
async function answerPreCheckoutQuery(
  env: Env,
  queryId: string,
  ok: boolean,
  errorMessage?: string
): Promise<void> {
  const url = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/answerPreCheckoutQuery`;
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      pre_checkout_query_id: queryId,
      ok,
      error_message: errorMessage,
    }),
  });
}
```

---

## 3. 自動續訂機制

### 3.1 訂閱記錄表

擴充 `payments` 表以支援訂閱：

```sql
-- 新增欄位到 payments 表
ALTER TABLE payments ADD COLUMN is_subscription INTEGER DEFAULT 0;
ALTER TABLE payments ADD COLUMN subscription_id TEXT; -- 訂閱 ID
ALTER TABLE payments ADD COLUMN next_billing_date DATETIME;
ALTER TABLE payments ADD COLUMN auto_renew INTEGER DEFAULT 1; -- 是否自動續訂
```

### 3.2 訂閱管理表

```sql
CREATE TABLE subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT,
  status TEXT,              -- active / cancelled / expired
  product_code TEXT,        -- 'VIP_MONTHLY'
  stars_amount INTEGER,
  billing_cycle_days INTEGER, -- 30
  next_billing_date DATETIME,
  auto_renew INTEGER DEFAULT 1,
  created_at DATETIME,
  updated_at DATETIME,
  cancelled_at DATETIME
);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_next_billing ON subscriptions(next_billing_date);
```

### 3.3 自動續訂 Cron Job

```typescript
// src/telegram/handlers/cron_subscription.ts

/**
 * 處理訂閱續訂（每日執行）
 */
export async function handleSubscriptionRenewal(
  env: Env,
  db: D1Database
): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  
  // 找出今天需要續訂的訂閱
  const subscriptions = await db.prepare(`
    SELECT *
    FROM subscriptions
    WHERE status = 'active'
      AND auto_renew = 1
      AND DATE(next_billing_date) = ?
  `).bind(today).all();
  
  for (const sub of subscriptions.results as any[]) {
    try {
      // 發送續訂發票
      await sendVipInvoice(env, sub.user_id, sub.user_id);
      
      // 更新下次續訂日期
      const nextBilling = new Date(sub.next_billing_date);
      nextBilling.setDate(nextBilling.getDate() + sub.billing_cycle_days);
      
      await db.prepare(`
        UPDATE subscriptions
        SET next_billing_date = ?,
            updated_at = datetime('now')
        WHERE id = ?
      `).bind(nextBilling.toISOString(), sub.id).run();
      
    } catch (error) {
      console.error(`Failed to renew subscription ${sub.id}:`, error);
      
      // 標記為失敗，可能需要人工處理
      await db.prepare(`
        UPDATE subscriptions
        SET status = 'expired',
            updated_at = datetime('now')
        WHERE id = ?
      `).bind(sub.id).run();
    }
  }
}
```

---

## 4. 退款處理

### 4.1 處理退款請求

```typescript
/**
 * 處理退款
 */
export async function processRefund(
  paymentId: number,
  reason: string,
  db: D1Database
): Promise<void> {
  const payment = await db.prepare(`
    SELECT * FROM payments WHERE id = ?
  `).bind(paymentId).first();
  
  if (!payment) {
    throw new Error('Payment not found');
  }
  
  // 更新付款狀態
  await db.prepare(`
    UPDATE payments
    SET status = 'refunded',
        updated_at = datetime('now')
    WHERE id = ?
  `).bind(paymentId).run();
  
  // 如果訂閱尚未過期，取消 VIP
  const user = await db.getUser(payment.user_id);
  if (user && user.is_vip === 1) {
    const expireDate = user.vip_expire_at 
      ? new Date(user.vip_expire_at)
      : null;
    
    if (!expireDate || expireDate > new Date()) {
      // 取消 VIP
      await db.prepare(`
        UPDATE users
        SET is_vip = 0,
            vip_expire_at = NULL,
            updated_at = datetime('now')
        WHERE telegram_id = ?
      `).bind(payment.user_id).run();
      
      // 取消訂閱
      await db.prepare(`
        UPDATE subscriptions
        SET status = 'cancelled',
            cancelled_at = datetime('now'),
            updated_at = datetime('now')
        WHERE user_id = ?
          AND status = 'active'
      `).bind(payment.user_id).run();
    }
  }
}
```

---

## 5. 價格計算

### 5.1 Stars 匯率

Telegram Stars 的匯率可能會變動，建議：

1. **固定 Stars 數量**：使用固定的 Stars 數量（如 500 Stars）
2. **動態計算**：根據當前 USD 匯率計算（需定期更新）

```typescript
// src/config/pricing.ts

export const VIP_PRICING = {
  USD_PER_MONTH: 5,
  STARS_PER_MONTH: 500, // 固定數量，或根據匯率計算
} as const;

/**
 * 計算 Stars 數量（根據 USD 價格）
 * 注意：實際匯率需從 Telegram API 或官方文檔獲取
 */
export function calculateStarsAmount(usdAmount: number): number {
  // 假設 1 USD = 100 Stars（實際需確認）
  return Math.round(usdAmount * 100);
}
```

---

## 6. 測試

### 6.1 測試環境

在測試環境中使用測試 Bot 和測試 Stars：

```typescript
// 測試環境配置
const TEST_STARS_AMOUNT = 1; // 測試環境使用 1 Star
```

### 6.2 測試流程

1. 建立測試發票
2. 使用測試 Stars 支付
3. 驗證付款記錄
4. 驗證 VIP 狀態更新

---

## 7. 參考資源

- [Telegram Bot API - Payments](https://core.telegram.org/bots/api#payments)
- [Telegram Stars Documentation](https://core.telegram.org/bots/api#stars)
- [Telegram Stars FAQ](https://telegram.org/faq#stars)

---

## 8. 注意事項

1. **匯率變動**：Stars 對 USD 的匯率可能會變動，需定期檢查
2. **退款政策**：制定明確的退款政策並實作退款流程
3. **訂閱管理**：提供使用者取消訂閱的功能
4. **支付安全**：所有支付操作都應記錄在 `payments` 表中
5. **錯誤處理**：妥善處理支付失敗、網路錯誤等情況

