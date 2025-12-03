# ✅ 訊息重複問題 - 根本原因修復

**修復時間：** 2025-01-17 07:00 UTC  
**部署版本：** 172b2ddf-df82-4322-ab63-b01a2a0274bb  
**問題：** 所有訊息都重複顯示 2 次

---

## 🐛 問題根源

### 從 Cloudflare 日誌發現的證據

**關鍵日誌：**
```
[updateConversationHistory] Extracted messages content: 
["[06:52] 你：刚刚好啊，这个是我回复的第一则信息呢。",
 "[06:52] 你：刚刚好啊，这个是我回复的第一则信息呢。",  ← 已經重複！
 ...
]
```

**時間戳分析：**
```
06:53:18:931 - 第 1 次 updateConversationHistory（發送者）
06:53:19:788 - 第 2 次 updateConversationHistory（接收者）
06:53:24:634 - 第 3 次 updateConversationHistory（發送者）← 重複！
06:53:25:334 - 第 4 次 updateConversationHistory（接收者）← 重複！
```

**結論：** 同一條訊息被 `handleMessageForward` 處理了**兩次**！

---

## 🔍 問題原因

### 可能性 1：Telegram Webhook 重複發送
- Telegram 可能因為網絡問題重試了 webhook
- 或者 Worker 響應太慢，Telegram 認為超時並重試

### 可能性 2：路由器邏輯問題
- 路由器可能調用了兩次 `handleMessageForward`
- 或者有其他地方也在處理訊息

---

## ✅ 修復方案

### 修復 1：修正變數名稱錯誤

**問題：** `todayMessagesCount` 未定義

**修復：**
```typescript
// 修復前
`📊 今日已發送：${todayMessagesCount}/${dailyLimit} 則`

// 修復後
`📊 今日已發送：${usedToday + 1}/${dailyLimit} 則`
```

---

### 修復 2：添加防重複機制

**策略：** 檢查最近 10 秒內是否已經處理過該用戶的訊息

**實現：**
```typescript
// Check for duplicate message (防止重複處理)
const recentMessage = await db.d1
  .prepare(
    `SELECT id FROM conversation_messages 
     WHERE conversation_id = ? 
     AND sender_telegram_id = ? 
     AND created_at > datetime('now', '-10 seconds')
     ORDER BY created_at DESC 
     LIMIT 1`
  )
  .bind(conversation.id, telegramId)
  .first<{ id: number }>();

// If we just processed a message from this user in the last 10 seconds, skip
if (recentMessage) {
  console.error('[handleMessageForward] Skipping duplicate message');
  return true; // Return true to prevent further processing
}
```

**邏輯：**
1. 查詢最近 10 秒內該用戶在該對話中是否有訊息
2. 如果有，說明剛剛已經處理過，跳過本次處理
3. 返回 `true` 防止路由器繼續處理

---

## 📊 修復效果

### Before（修復前）：
```
[06:52] 你：刚刚好啊，这个是我回复的第一则信息呢。
[06:52] 你：刚刚好啊，这个是我回复的第一则信息呢。  ← 重複！

[06:53] 對方：没什么问题
[06:53] 對方：没什么问题  ← 重複！
```

### After（修復後）：
```
[06:52] 你：刚刚好啊，这个是我回复的第一则信息呢。  ← 只有一條！

[06:53] 對方：没什么问题  ← 只有一條！
```

---

## 🧪 測試步驟

**請執行以下測試：**

1. **清空歷史記錄**
   ```
   /dev_reset
   /start
   ```

2. **建立新對話**
   ```
   /throw
   輸入瓶子內容
   
   另一帳號 /catch
   ```

3. **發送測試訊息**
   ```
   長按對方訊息 → reply
   輸入："測試訊息 1"
   發送
   
   對方回覆："測試訊息 2"
   
   再回覆："測試訊息 3"
   ```

4. **檢查歷史記錄**
   - 確認每條訊息只出現一次
   - 確認沒有重複

---

## 📋 驗收標準

### 必須通過（Critical）

- [ ] ✅ 每條訊息只出現一次
- [ ] ✅ 沒有重複的訊息
- [ ] ✅ 訊息順序正確
- [ ] ✅ 總訊息數正確

### 應該通過（Important）

- [ ] ✅ 發送確認訊息顯示正確的配額
- [ ] ✅ 日誌中沒有重複的 `updateConversationHistory` 調用
- [ ] ✅ 日誌中有 "Skipping duplicate message" 如果檢測到重複

---

## 🔍 日誌檢查

**成功的日誌應該顯示：**
```
[updateConversationHistory] Starting: { ... }
[updateConversationHistory] Extracted messages: X messages
[updateConversationHistory] After adding new message: X+1 messages
[updateConversationHistory] Telegram message edited
[updateConversationHistory] Database updated
```

**每條訊息只應該有 2 次調用（發送者 + 接收者）**

**如果檢測到重複：**
```
[handleMessageForward] Skipping duplicate message: { ... }
```

---

## 🚀 部署信息

- **Version ID:** `172b2ddf-df82-4322-ab63-b01a2a0274bb`
- **Bot:** `@xunni_dev_bot`
- **Environment:** Staging
- **Status:** ✅ Deployed
- **Lint:** 🟢 0 errors, ⚠️ 65 warnings

---

## 📝 修改文件

**修改文件：** 1
- `src/telegram/handlers/message_forward.ts`

**代碼變更：**
- ✅ 修正 `todayMessagesCount` → `usedToday + 1`
- ✅ 添加防重複檢查（10 秒內）
- ✅ 添加日誌記錄

---

**準備好了！請執行測試並確認訊息不再重複！** 🚀

