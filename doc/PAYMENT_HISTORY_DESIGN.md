# 支付記錄查詢功能設計文檔

## 1. 需求分析

使用者需要查詢自己的歷史支付記錄（VIP 訂閱、Stars 購買等）。

**核心需求**：
- 查詢自己的支付記錄
- 分頁顯示（每頁 12 筆）
- 查詢效率優化
- 盡量利用現有數據結構
- **i18n 支援**：
  - 盡可能復用現有 key，減少新增翻譯成本。
  - 新增的 key 必須覆蓋所有 34 種支援語言（暫時使用英文作為 Fallback，後續需專業翻譯）。

## 2. 數據結構（現有）

利用現有的 `payments` 表（見 `@doc/SPEC.md` 3.11 節）：

```sql
CREATE TABLE payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT,
  telegram_payment_id TEXT UNIQUE,
  stars_amount INTEGER,
  status TEXT,           -- pending / paid / refunded / failed
  product_code TEXT,     -- 'VIP_MONTHLY'
  created_at DATETIME,
  updated_at DATETIME
);

CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);
```

**索引評估**：
- 已有 `idx_payments_user_id`，對於單個使用者的查詢效率已足夠（通常單人支付記錄不會過多）。
- 若數據量巨大，可建立複合索引 `(user_id, created_at DESC)`，但目前階段 `idx_payments_user_id` 已滿足需求。

## 3. 功能設計

### 3.1 入口

1. **指令**：`/payments`
2. **UI 入口**：在 `/vip` 選單中增加「💰 訂閱記錄」按鈕

### 3.2 顯示格式

```text
💳 **支付記錄**（第 1 / 2 頁）

📅 2025-01-20 14:30
💎 VIP 月費訂閱
💰 250 Stars
✅ 支付成功

📅 2025-01-20 14:25
💎 VIP 月費訂閱
💰 250 Stars
❌ 支付失敗（已取消）

━━━━━━━━━━━━━━━━
```

**狀態對照**：
- `paid`: ✅ 支付成功
- `refunded`: ↩️ 已退款
- `failed`: ❌ 支付失敗
- `pending`: ⏳ 處理中

### 3.3 交互設計

**按鈕**：
- `[⬅️ 上一頁]` `[➡️ 下一頁]`（分頁控制）
- `[🏠 返回 VIP]`

**Callback Data**：
- `payments_page_{page}`：跳轉到指定頁碼
- `vip_menu`：返回 VIP 選單

## 4. 技術實作

### 4.1 新增 Handler

位置：`src/telegram/handlers/payments.ts`

**核心邏輯**：

1. **查詢總數**：
   ```typescript
   const total = await db.prepare(
     'SELECT COUNT(*) as count FROM payments WHERE user_id = ?'
   ).bind(userId).first('count');
   ```

2. **分頁查詢**：
   ```typescript
   const pageSize = 12;
   const offset = (page - 1) * pageSize;
   const records = await db.prepare(`
     SELECT * FROM payments 
     WHERE user_id = ? 
     ORDER BY created_at DESC 
     LIMIT ? OFFSET ?
   `).bind(userId, pageSize, offset).all();
   ```

3. **格式化輸出**：
   - 使用 i18n 格式化日期和狀態
   - 構建列表消息

### 4.2 i18n 鍵值需求

**復用現有 Key**：
- `common.back4`: "↩️ 返回"
- `common.prev`: "⬅️ 上一頁" (需確認 key 是否存在，若無則新增 `buttons.prev`)
- `common.next`: "➡️ 下一頁" (需確認 key 是否存在，若無則新增 `buttons.next`)
- `common.back3`: "🏠 返回主選單" (若用於返回 VIP，可能需要新 key `vip.returnToMenu` 或直接用此 key)

**新增 Key** (必須新增以確保語意準確):
- `payments.title`: "💳 支付記錄（第 {page} / {total} 頁）"
- `payments.empty`: "目前沒有支付記錄。"
- `payments.status.paid`: "✅ 支付成功"
- `payments.status.refunded`: "↩️ 已退款"
- `payments.status.failed`: "❌ 支付失敗"
- `payments.status.pending`: "⏳ 處理中"
- `payments.product.VIP_MONTHLY`: "💎 VIP 月費訂閱"
- `buttons.viewPayments`: "💰 訂閱記錄"
- `buttons.backToVip`: "💎 返回 VIP 選單" (建議新增，優於通用 "返回")

## 5. 開發計畫

1.  添加 i18n key 到 CSV 並導入（包括復用確認）。
2.  創建 `src/telegram/handlers/payments.ts`。
3.  在 `src/router.ts` 中註冊 `/payments` 指令。
4.  在 `src/telegram/handlers/vip.ts` 中添加入口按鈕。
