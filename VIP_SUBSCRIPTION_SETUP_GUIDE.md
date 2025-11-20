# VIP 訂閱功能設置指南

## ❌ 當前問題

嘗試啟用 `subscription_period` 時遇到錯誤：
```
Bad Request: SUBSCRIPTION_EXPORT_MISSING
```

**原因**：Bot 沒有啟用訂閱功能的權限。

---

## ✅ 解決方案

### 當前狀態（已部署）
- ✅ **一次性購買功能**：正常運作
- ⏸️ **自動訂閱功能**：已實現但暫時禁用
- 🔧 **配置開關**：`ENABLE_VIP_SUBSCRIPTION = "false"`

### 啟用訂閱功能的步驟

#### 1. 連接支付提供商（必須先完成）

在 @BotFather 中：
```
1. 打開 Telegram，搜索 @BotFather
2. 發送 /mybots
3. 選擇您的 Bot
4. 選擇 Bot Settings
5. 選擇 Payments
6. 選擇一個支付提供商（例如 Stripe）
7. 完成提供商的連接設置
```

#### 2. 申請訂閱功能（需要聯繫 Telegram）

**重要**：`subscription_period` 功能可能需要特殊申請。

聯繫 **@BotSupport** 並說明：
```
Hello,

I'm trying to implement recurring subscriptions using the subscription_period 
parameter in sendInvoice, but I'm getting a "SUBSCRIPTION_EXPORT_MISSING" error.

Bot: @your_bot_username
Error: Bad Request: SUBSCRIPTION_EXPORT_MISSING

I have already implemented the Subscription Export endpoint:
https://xunni-bot-staging.yves221.workers.dev/subscription-export

Could you please guide me on how to enable subscription features for my bot?

Thank you!
```

#### 3. 提供 Subscription Export URL

**什麼是 Subscription Export URL？**
- 用於用戶數據導出（GDPR 要求）
- 當用戶請求導出訂閱數據時，Telegram 會調用此 URL

**✅ 已實現的 URL**：

**Staging 環境**：
```
https://xunni-bot-staging.yves221.workers.dev/subscription-export
```

**Production 環境**：
```
https://xunni-bot.yves221.workers.dev/subscription-export
```

**實現詳情**：
- ✅ 接收 POST 請求
- ✅ 驗證 user_id 參數
- ✅ 返回用戶的訂閱記錄
- ✅ 返回用戶的支付記錄
- ✅ JSON 格式響應
- ✅ 錯誤處理和日誌

**請求格式**：
```json
{
  "user_id": "396943893"
}
```

**響應格式**：
```json
{
  "ok": true,
  "result": {
    "user_id": "396943893",
    "subscriptions": [
      {
        "id": 1,
        "start_date": "2025-11-20T00:00:00Z",
        "expire_date": "2025-12-20T00:00:00Z",
        "status": "active",
        "is_auto_renew": true,
        "created_at": "2025-11-20T00:00:00Z"
      }
    ],
    "payments": [
      {
        "id": 1,
        "telegram_payment_id": "xxx",
        "amount_stars": 1,
        "currency": "XTR",
        "status": "completed",
        "payment_type": "initial",
        "is_recurring": false,
        "created_at": "2025-11-20T00:00:00Z"
      }
    ]
  }
}
```

#### 4. 更新配置並部署

**Staging 環境**：
```bash
# 編輯 wrangler.toml
[env.staging.vars]
ENABLE_VIP_SUBSCRIPTION = "true"

# 部署
pnpm deploy:staging
```

**Production 環境**：
```bash
# 編輯 wrangler.toml
[env.production.vars]
ENABLE_VIP_SUBSCRIPTION = "true"

# 部署
pnpm deploy:production
```

---

## 📋 功能對比

### 一次性購買（當前）
- ✅ 立即可用
- ✅ 無需額外設置
- ❌ 需要手動續費
- ❌ 用戶容易忘記續費

### 自動訂閱（需要設置）
- ✅ 自動續費
- ✅ 更好的用戶體驗
- ✅ 更穩定的收入
- ❌ 需要 @BotFather 設置
- ❌ 需要實現 Subscription Export

---

## 🔧 技術實現狀態

### ✅ 已完成
1. **數據庫 Migration**
   - `is_recurring` 欄位已添加
   - 支持記錄自動續費

2. **訂閱檢查服務**
   - `subscription_checker.ts` 已實現
   - 每小時檢查過期訂閱
   - 1 天寬限期

3. **VIP Handler**
   - 支持訂閱和一次性購買
   - 通過 `ENABLE_VIP_SUBSCRIPTION` 切換
   - 自動檢測 `is_recurring` 標記

4. **支付處理**
   - 區分首次購買、續費、自動續費
   - 不同的確認消息

5. **Cron Job**
   - 已添加到 `worker.ts`
   - 每小時執行過期檢查

### ✅ 已完成（等待 BotFather 設置）
1. **Subscription Export Endpoint**
   - ✅ 實現 `/subscription-export` API
   - ✅ 返回用戶訂閱數據
   - ✅ GDPR 合規
   - ✅ 錯誤處理和日誌

### ⏸️ 待完成（需要 BotFather 設置後）
1. **測試自動續費**
   - 模擬 `is_recurring = true` 的 webhook
   - 驗證自動延長 VIP 時間

---

## 🧪 測試步驟

### 當前（一次性購買）
1. 發送 `/vip`
2. 點擊「💳 購買 VIP (1 ⭐)」
3. 完成支付
4. 確認收到「🎉 支付成功！」

### 啟用訂閱後
1. 發送 `/vip`
2. 點擊「💳 訂閱 VIP (1 ⭐)」
3. 完成支付
4. 確認收到「🎉 訂閱成功！」
5. 檢查發票標題：「XunNi VIP 訂閱（月費）」
6. 等待 30 天後自動續費

---

## 📝 注意事項

1. **@BotFather 設置是必須的**
   - 沒有設置會返回 `SUBSCRIPTION_EXPORT_MISSING`
   - 無法繞過此限制

2. **Subscription Export 是 GDPR 要求**
   - 必須提供用戶數據導出功能
   - 建議實現簡單的 JSON 返回

3. **測試建議**
   - 先在 Staging 環境測試
   - 確認訂閱功能正常後再部署到 Production

4. **價格設置**
   - Staging: 1 Star（測試用）
   - Production: 根據實際定價（建議 50-100 Stars）

---

## 🚀 下一步

1. ✅ **當前**：一次性購買功能已可用
2. ✅ **已完成**：Subscription Export Endpoint 已實現
3. ⏸️ **待申請**：聯繫 @BotSupport 申請訂閱功能
4. ⏸️ **待確認**：等待 Telegram 啟用訂閱權限
5. ✅ **準備就緒**：設置 `ENABLE_VIP_SUBSCRIPTION = "true"`
6. 🧪 **最後測試**：驗證自動訂閱功能

## 📞 聯繫 Telegram 支持

如果您想啟用訂閱功能，請聯繫 **@BotSupport**：

**消息範本**：
```
Hello,

I'm trying to implement recurring subscriptions for my Telegram bot using 
the subscription_period parameter in sendInvoice API.

Bot Username: @your_bot_username
Current Error: Bad Request: SUBSCRIPTION_EXPORT_MISSING

I have already implemented the required Subscription Export endpoint for 
GDPR compliance:

Staging: https://xunni-bot-staging.yves221.workers.dev/subscription-export
Production: https://xunni-bot.yves221.workers.dev/subscription-export

The endpoint accepts POST requests with user_id and returns subscription 
and payment data in JSON format.

Could you please guide me on how to enable subscription features and 
register the Subscription Export URL for my bot?

Thank you for your assistance!
```

---

## 📞 需要幫助？

如果在 @BotFather 設置過程中遇到問題：
1. 查看 Telegram Bot API 文檔：https://core.telegram.org/bots/payments-stars
2. 聯繫 Telegram 支持
3. 或暫時使用一次性購買功能

---

**最後更新**：2025-11-20  
**當前版本**：6f72ea64-f6cf-4159-8f79-babba46d6dea  
**狀態**：一次性購買功能已部署並可用

