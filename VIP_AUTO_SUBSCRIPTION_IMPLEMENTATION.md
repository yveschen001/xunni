# VIP 自動訂閱功能實現計劃

**日期**: 2025-11-20  
**基於**: Telegram Stars `subscription_period` 參數

---

## 📋 實現清單

### ✅ Phase 1: 修改 sendInvoice 支持訂閱
- [x] 添加 `subscriptionPeriod` 參數到 `src/services/telegram.ts`
- [ ] 修改 VIP handler 使用訂閱模式

### Phase 2: 處理續費邏輯
- [ ] 檢測 `is_recurring` 標記
- [ ] 自動延長 VIP 到期時間
- [ ] 記錄續費類型

### Phase 3: 實現過期檢查 Cron Job
- [ ] 創建 `checkExpiredSubscriptions` 函數
- [ ] 每小時檢查過期訂閱
- [ ] 自動降級過期用戶

### Phase 4: 優化用戶體驗
- [ ] 添加「一次性購買」和「訂閱」兩個選項
- [ ] 更新 UI 顯示訂閱狀態
- [ ] 添加取消訂閱說明

---

## 🔧 技術實現

### 1. 訂閱週期常量

```typescript
// 30 天 = 2592000 秒
const SUBSCRIPTION_PERIOD_30_DAYS = 30 * 24 * 60 * 60; // 2592000
```

### 2. 修改 sendVipInvoice

**位置**: `src/telegram/handlers/vip.ts`

```typescript
async function sendVipInvoice(
  telegram: ReturnType<typeof createTelegramService>,
  chatId: number,
  telegramId: string,
  isRenewal: boolean,
  env: Env,
  isSubscription: boolean = true // 默認使用訂閱模式
): Promise<void> {
  const priceStars = resolveVipPrice(env);
  const priceNote = env.ENVIRONMENT === 'staging' ? '（Staging 測試價）' : '（約 5 USD）';
  
  const title = isSubscription ? 'VIP 會員訂閱（月費）' : 'VIP 會員（30天）';
  const description = isSubscription
    ? `訂閱 XunNi VIP 會員，每月自動續費！\n\n` +
      `• 每天 30 個漂流瓶配額\n` +
      `• 可篩選 MBTI 和星座\n` +
      `• 34 種語言自動翻譯\n` +
      `• 無廣告體驗\n\n` +
      `💡 可隨時在 Telegram 設定中取消訂閱`
    : `購買 XunNi VIP 會員 30 天！\n\n` +
      `• 每天 30 個漂流瓶配額\n` +
      `• 可篩選 MBTI 和星座\n` +
      `• 34 種語言自動翻譯\n` +
      `• 無廣告體驗`;

  const payload = JSON.stringify({
    type: 'vip',
    user_id: telegramId,
    duration_days: 30,
    is_subscription: isSubscription,
  });

  await telegram.sendInvoice(
    chatId,
    title,
    description,
    payload,
    'XTR',
    [{ label: isRenewal ? 'VIP 續費' : 'VIP 會員', amount: priceStars }],
    isSubscription ? SUBSCRIPTION_PERIOD_30_DAYS : undefined // 關鍵：添加訂閱週期
  );
}
```

### 3. 處理續費邏輯

**位置**: `src/telegram/handlers/vip.ts` - `handleSuccessfulPayment`

```typescript
export async function handleSuccessfulPayment(
  message: TelegramMessage,
  payment: SuccessfulPayment,
  env: Env
): Promise<void> {
  // ... 現有代碼 ...

  try {
    // Parse payload
    const payload = JSON.parse(payment.invoice_payload);
    
    // 檢查是否是自動續費
    const isRecurring = (payment as any).is_recurring === true;
    
    console.error('[handleSuccessfulPayment] Payment type:', {
      isRecurring,
      isSubscription: payload.is_subscription,
    });

    // ... 更新 VIP 狀態 ...

    // 創建支付記錄時標記續費類型
    await db.d1.prepare(`
      INSERT INTO payments (
        user_id,
        telegram_payment_id,
        amount_stars,
        currency,
        status,
        payload,
        payment_type,
        is_recurring,
        created_at
      ) VALUES (?, ?, ?, ?, 'completed', ?, ?, ?, datetime('now'))
    `).bind(
      telegramId,
      payment.telegram_payment_charge_id,
      priceStars,
      'XTR',
      payment.invoice_payload,
      isRecurring ? 'auto_renewal' : (isRenewal ? 'renewal' : 'initial'),
      isRecurring ? 1 : 0
    ).run();

    // 發送確認消息
    const confirmMessage = isRecurring
      ? `🎉 **自動續費成功！**\n\n` +
        `你的 VIP 會員已自動續費！\n` +
        `新到期時間：${newExpire.toLocaleDateString('zh-TW')}\n\n` +
        `💡 如需取消訂閱，請前往 Telegram 設定 > 訂閱管理`
      : `🎉 **支付成功！**\n\n` +
        `你已成為 VIP 會員！\n` +
        `到期時間：${newExpire.toLocaleDateString('zh-TW')}\n\n` +
        `✨ VIP 權益已啟用：\n` +
        `• 每天 30 個漂流瓶配額\n` +
        `• 可篩選 MBTI 和星座\n` +
        `• 34 種語言自動翻譯\n` +
        `• 無廣告體驗\n\n` +
        `💡 立即開始使用：/throw`;

    await telegram.sendMessage(chatId, confirmMessage);
    
    // 通知超級管理員
    await notifySuperAdmin(
      env,
      isRecurring ? 'vip_auto_renewed' : (isRenewal ? 'vip_renewed' : 'vip_purchased'),
      {
        user_id: telegramId,
        amount_stars: priceStars,
        expire_date: newExpire.toISOString(),
        is_recurring: isRecurring,
      }
    );
  } catch (error) {
    console.error('[handleSuccessfulPayment] Error:', error);
    // ... 錯誤處理 ...
  }
}
```

### 4. 過期檢查 Cron Job

**新文件**: `src/services/subscription_checker.ts`

```typescript
/**
 * Subscription Checker Service
 * 
 * Checks for expired VIP subscriptions and downgrades users.
 * Runs hourly via Cron Job.
 */

import type { Env } from '~/types';
import { createDatabaseClient } from '~/db/client';
import { createTelegramService } from './telegram';
import { notifySuperAdmin } from './admin_notification';

/**
 * Check and process expired subscriptions
 * 
 * Grace Period: 1 day (to handle payment delays)
 */
export async function checkExpiredSubscriptions(env: Env): Promise<void> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  
  // Calculate grace period (1 day ago)
  const gracePeriodEnd = new Date();
  gracePeriodEnd.setDate(gracePeriodEnd.getDate() - 1);
  
  console.error('[checkExpiredSubscriptions] Checking for expired subscriptions...');
  console.error('[checkExpiredSubscriptions] Grace period end:', gracePeriodEnd.toISOString());
  
  try {
    // Find expired VIP users (with 1-day grace period)
    const expiredUsers = await db.d1.prepare(`
      SELECT 
        u.telegram_id,
        u.nickname,
        u.vip_expire_at,
        vs.id as subscription_id
      FROM users u
      LEFT JOIN vip_subscriptions vs ON u.telegram_id = vs.user_id AND vs.status = 'active'
      WHERE u.is_vip = 1
        AND u.vip_expire_at IS NOT NULL
        AND datetime(u.vip_expire_at) < datetime(?)
    `).bind(gracePeriodEnd.toISOString()).all();
    
    console.error(`[checkExpiredSubscriptions] Found ${expiredUsers.results.length} expired users`);
    
    for (const user of expiredUsers.results as any[]) {
      try {
        console.error(`[checkExpiredSubscriptions] Processing user ${user.telegram_id}`);
        
        // 1. Update user VIP status
        await db.d1.prepare(`
          UPDATE users
          SET is_vip = 0,
              vip_expire_at = NULL,
              updated_at = datetime('now')
          WHERE telegram_id = ?
        `).bind(user.telegram_id).run();
        
        // 2. Update subscription status
        if (user.subscription_id) {
          await db.d1.prepare(`
            UPDATE vip_subscriptions
            SET status = 'expired',
                updated_at = datetime('now')
            WHERE id = ?
          `).bind(user.subscription_id).run();
        }
        
        // 3. Notify user
        await telegram.sendMessage(
          parseInt(user.telegram_id),
          `😢 **VIP 會員已到期**\n\n` +
            `你的 VIP 會員已於 ${new Date(user.vip_expire_at).toLocaleDateString('zh-TW')} 到期。\n\n` +
            `你的帳號已恢復為免費會員。\n\n` +
            `💡 隨時可以重新訂閱 VIP：/vip\n\n` +
            `感謝你的支持！❤️`
        );
        
        // 4. Notify super admin
        await notifySuperAdmin(env, 'vip_downgraded', {
          user_id: user.telegram_id,
          expire_date: user.vip_expire_at,
        });
        
        console.error(`[checkExpiredSubscriptions] Successfully processed user ${user.telegram_id}`);
      } catch (error) {
        console.error(`[checkExpiredSubscriptions] Failed to process user ${user.telegram_id}:`, error);
      }
    }
    
    console.error('[checkExpiredSubscriptions] Completed');
  } catch (error) {
    console.error('[checkExpiredSubscriptions] Error:', error);
  }
}
```

### 5. 添加 Cron Job 到 worker.ts

```typescript
// Check expired subscriptions (Every hour)
if (event.cron === '0 * * * *') {
  console.log('[Worker] Checking expired subscriptions...');
  const { checkExpiredSubscriptions } = await import('./services/subscription_checker');
  await checkExpiredSubscriptions(env);
}
```

### 6. 數據庫 Migration

**新文件**: `src/db/migrations/0039_alter_payments_add_is_recurring.sql`

```sql
-- Migration: 0039_alter_payments_add_is_recurring.sql
-- Purpose: Add is_recurring field to track auto-renewal payments
-- Date: 2025-11-20

ALTER TABLE payments ADD COLUMN is_recurring INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_payments_is_recurring ON payments(is_recurring);
```

---

## 🎨 UI 更新

### VIP 購買頁面

```
✨ **XunNi VIP 訂閱**

升級 VIP 會員，享受以下權益：
• 每天 30 個漂流瓶配額（最高 100 個/天）
• 可篩選配對對象的 MBTI 和星座
• 34 種語言自動翻譯（OpenAI GPT 優先）
• 無廣告體驗

💰 價格：150 ⭐/月（約 5 USD）

🔄 **訂閱模式**：每月自動續費
💡 可隨時在 Telegram 設定中取消訂閱

[💳 訂閱 VIP (150 ⭐/月)] [💰 單次購買 (150 ⭐/30天)]
[❌ 取消]
```

---

## 📊 數據庫 Schema 更新

### payments 表新增欄位

```sql
is_recurring INTEGER DEFAULT 0  -- 0: 手動支付, 1: 自動續費
```

### payment_type 新增類型

- `initial`: 首次購買
- `renewal`: 手動續費
- `auto_renewal`: 自動續費
- `refund`: 退款

---

## 🧪 測試計劃

### 1. 訂閱功能測試
- [ ] 用戶訂閱 VIP（使用 subscription_period）
- [ ] 檢查 VIP 狀態更新
- [ ] 檢查訂閱記錄創建

### 2. 自動續費測試
- [ ] 模擬 Telegram 發送續費 webhook
- [ ] 檢查 is_recurring 標記
- [ ] 檢查 VIP 到期時間延長
- [ ] 檢查支付記錄標記為 auto_renewal

### 3. 過期檢查測試
- [ ] 手動設置過期時間
- [ ] 觸發 Cron Job
- [ ] 檢查用戶降級
- [ ] 檢查通知發送

### 4. 取消訂閱測試
- [ ] 用戶在 Telegram 取消訂閱
- [ ] 檢查不再收到續費 webhook
- [ ] 檢查 Cron Job 自動降級

---

## 🚀 部署步驟

1. ✅ 修改 `sendInvoice` 添加 `subscription_period` 參數
2. [ ] 執行數據庫 Migration (0039)
3. [ ] 修改 VIP handler 使用訂閱模式
4. [ ] 創建 `subscription_checker.ts`
5. [ ] 更新 `worker.ts` 添加 Cron Job
6. [ ] 部署到 Staging 測試
7. [ ] 驗證自動續費功能
8. [ ] 部署到 Production

---

## 📝 注意事項

### 關於 subscription_period

- **單位**: 秒（seconds）
- **30 天**: 2592000 秒
- **限制**: 只能設定特定週期（週、月、年）
- **平台**: 依賴 Apple/Google 的訂閱機制

### 關於取消訂閱

- **用戶操作**: 在 Telegram 設定中取消
- **系統行為**: 不會立即收到通知
- **處理方式**: Cron Job 檢查到期時間，沒收到續費就降級
- **寬限期**: 1 天（防止支付延遲）

### 關於退款

- 訂閱模式下的退款需要特別處理
- 需要取消訂閱 + 退還當前週期費用
- 建議在退款時同時取消訂閱狀態

---

**準備開始實現？** ✅

