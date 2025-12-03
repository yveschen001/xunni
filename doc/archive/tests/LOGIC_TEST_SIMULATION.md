# 邏輯測試模擬

**測試時間：** 2025-01-17 02:25 UTC  
**測試版本：** 609b4390-6181-4a6d-be7f-288bd3cf1ed5

---

## 🧪 模擬測試 1: `/dev_skip` SQL 執行

### 輸入
```typescript
telegramId = "123456789"
username = "testuser"
first_name = "Test"
inviteCode = "XUNNI-ABC123"
```

### SQL 語句
```sql
INSERT INTO users (
  telegram_id,        -- 1
  username,           -- 2
  first_name,         -- 3
  nickname,           -- 4
  gender,             -- 5
  birthday,           -- 6
  age,                -- 7
  zodiac_sign,        -- 8
  language_pref,      -- 9
  invite_code,        -- 10
  onboarding_step,    -- 11
  anti_fraud_score,   -- 12
  terms_agreed        -- 13
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
```

### bind 參數
```typescript
.bind(
  telegramId,                    // 1: "123456789"
  message.from!.username || '',  // 2: "testuser"
  message.from!.first_name || '', // 3: "Test"
  '測試用戶',                     // 4
  'male',                        // 5
  '2000-01-01',                  // 6
  25,                            // 7
  'Capricorn',                   // 8
  'zh-TW',                       // 9
  inviteCode,                    // 10: "XUNNI-ABC123"
  'completed',                   // 11
  100,                           // 12
  1                              // 13
)
```

### 驗證
- ✅ 13 個欄位
- ✅ 13 個參數
- ✅ 參數順序正確
- ✅ 包含 `invite_code`

**結論：** SQL 語句正確 ✅

---

## 🧪 模擬測試 2: 每日訊息配額檢查

### 場景：免費用戶發送第 11 則訊息

#### 輸入
```typescript
user = {
  telegram_id: "123456789",
  is_vip: false,
  vip_expire_at: null
}
conversation_id = 1
today = "2025-01-17"
```

#### 步驟 1: 獲取今日日期
```typescript
const { getTodayDate } = await import('~/domain/usage');
const today = getTodayDate();
// today = "2025-01-17"
```
✅ 正確

#### 步驟 2: 查詢今日已發送訊息數
```sql
SELECT COUNT(*) as count FROM conversation_messages 
WHERE conversation_id = 1
AND sender_telegram_id = "123456789"
AND DATE(created_at) = DATE("2025-01-17")
```
假設結果：`{ count: 10 }`

#### 步驟 3: 獲取每日配額
```typescript
const dailyLimit = getConversationDailyLimit(user);
// isVIP(user) = false
// return FREE_DAILY_MESSAGES_PER_CONVERSATION = 10
```
✅ 正確

#### 步驟 4: 檢查配額
```typescript
const usedToday = 10;
const dailyLimit = 10;

if (usedToday >= dailyLimit) {
  // 10 >= 10 → true
  await telegram.sendMessage(
    chatId,
    `❌ 今日對話訊息配額已用完（10/10）\n\n` +
    '💡 升級 VIP 可獲得更多配額（100 則/天）：/vip'
  );
  return true;
}
```
✅ 正確拒絕

**結論：** 配額檢查邏輯正確 ✅

---

## 🧪 模擬測試 3: VIP 用戶配額

### 場景：VIP 用戶發送第 50 則訊息

#### 輸入
```typescript
user = {
  telegram_id: "987654321",
  is_vip: true,
  vip_expire_at: "2025-12-31T23:59:59Z"
}
```

#### 步驟 1: 查詢今日已發送訊息數
假設結果：`{ count: 49 }`

#### 步驟 2: 獲取每日配額
```typescript
const dailyLimit = getConversationDailyLimit(user);
// isVIP(user) = true
// return VIP_DAILY_MESSAGES_PER_CONVERSATION = 100
```
✅ 正確

#### 步驟 3: 檢查配額
```typescript
const usedToday = 49;
const dailyLimit = 100;

if (usedToday >= dailyLimit) {
  // 49 >= 100 → false
  // 繼續發送訊息
}
```
✅ 正確允許

**結論：** VIP 配額檢查正確 ✅

---

## 🧪 模擬測試 4: 不同對象獨立配額

### 場景：用戶 A 與用戶 B 已發送 10 則，與用戶 C 開始新對話

#### 對話 1（用戶 A ↔ 用戶 B）
```typescript
conversation_id = 1
sender_telegram_id = "123456789" (用戶 A)
```

查詢：
```sql
SELECT COUNT(*) as count FROM conversation_messages 
WHERE conversation_id = 1
AND sender_telegram_id = "123456789"
AND DATE(created_at) = DATE("2025-01-17")
```
結果：`{ count: 10 }` → 配額已用完

#### 對話 2（用戶 A ↔ 用戶 C）
```typescript
conversation_id = 2
sender_telegram_id = "123456789" (用戶 A)
```

查詢：
```sql
SELECT COUNT(*) as count FROM conversation_messages 
WHERE conversation_id = 2
AND sender_telegram_id = "123456789"
AND DATE(created_at) = DATE("2025-01-17")
```
結果：`{ count: 0 }` → 配額可用

✅ 正確：不同 `conversation_id` 的配額獨立計算

**結論：** 配額獨立性正確 ✅

---

## 🧪 模擬測試 5: 訊息格式檢查

### `/dev_reset` 訊息
```typescript
'✅ 開發模式：數據已重置\n\n' +
'你的所有數據已被刪除。\n\n' +
'💡 現在可以重新開始測試註冊流程。\n\n' +
'⚠️ 注意：此功能僅在 Staging 環境可用。'
```
- ✅ 無 `**`
- ✅ 無 `` ` ``
- ✅ 純文字格式

### `/dev_skip` 訊息
```typescript
'✅ 開發模式：跳過註冊\n\n' +
'已自動完成註冊流程。\n\n' +
'💡 現在可以直接測試核心功能：\n' +
'• /throw - 丟漂流瓶\n' +
'• /catch - 撿漂流瓶\n' +
'• /stats - 查看統計\n\n' +
'⚠️ 此功能僅在 Staging 環境可用。'
```
- ✅ 無 `**`
- ✅ 無 `` ` ``
- ✅ 純文字格式

**結論：** 訊息格式正確 ✅

---

## 📊 總結

### 代碼審查結果
| 項目 | 狀態 | 說明 |
|------|------|------|
| SQL 語句欄位數量 | ✅ | 13 個欄位 |
| bind 參數數量 | ✅ | 13 個參數 |
| 訊息格式 | ✅ | 無 Markdown |
| 配額常數定義 | ✅ | FREE=10, VIP=100 |
| `getConversationDailyLimit` | ✅ | 正確實現 |
| `getTodayDate` | ✅ | 正確導出 |
| `message_forward.ts` 導入 | ✅ | 使用 `getTodayDate` |
| SQL 查詢邏輯 | ✅ | 正確 |

### 邏輯測試結果
| 測試場景 | 狀態 | 說明 |
|---------|------|------|
| `/dev_skip` SQL 執行 | ✅ | 參數匹配正確 |
| 免費用戶配額檢查 | ✅ | 10 則/天 |
| VIP 用戶配額檢查 | ✅ | 100 則/天 |
| 不同對象獨立配額 | ✅ | 按 conversation_id 獨立 |
| 訊息格式 | ✅ | 純文字 |

---

## ✅ 驗收結論

### 所有檢查項目通過
1. ✅ SQL 語法正確
2. ✅ 函數名稱正確（`getTodayDate`）
3. ✅ 配額邏輯正確
4. ✅ 訊息格式正確
5. ✅ 配額獨立性正確

### 部署狀態
- ✅ Version: 609b4390-6181-4a6d-be7f-288bd3cf1ed5
- ✅ Bot: @xunni_dev_bot
- ✅ 環境: Staging

---

**測試完成時間：** 2025-01-17 02:30 UTC  
**測試結果：** ✅ 所有邏輯測試通過，代碼審查通過

**建議：** 可以進行真實用戶測試

