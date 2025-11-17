# 對話歷史記錄帖子系統設計

**設計時間：** 2025-01-17 03:45 UTC  
**目標：** 為每個對話對象創建歷史記錄帖子和新訊息帖子

---

## 📋 需求概述

### 用戶需求

> 同一個對象的漂流瓶的信息，都應該有一個歷史記錄的帖子來維護會更新信息，所有新的信息進來，和我們的回復，都會被編輯進同一個帖子，做為歷史記錄，由於telegram有4000的限制，超過文字，就再生成新帖子。

**關鍵點：**
1. ✅ 每個對話對象有唯一的 `#` 編號
2. ✅ 歷史記錄帖子：顯示所有歷史訊息，可編輯更新
3. ✅ 新訊息帖子：顯示最新訊息，可直接回覆
4. ✅ 歷史記錄超過 4000 字符時，創建新帖子

---

## 🎯 設計方案

### 方案 A：`#MMDDHHHH` + 歷史記錄帖子系統（推薦）

#### 標識符格式

```
#1117ABCD           ← 對象的唯一標識符（月日 + 4位隨機字母）
#1117ABCD-H1        ← 第 1 個歷史記錄帖子
#1117ABCD-H2        ← 第 2 個歷史記錄帖子
#1117ABCD-NEW       ← 新訊息帖子
```

#### 帖子類型

**1. 歷史記錄帖子（History Post）**
- **用途：** 顯示所有歷史訊息
- **更新方式：** 每次有新訊息時，編輯這個帖子
- **字符限制：** 4000 字符
- **超過限制：** 創建新的歷史記錄帖子（H2, H3, ...）
- **顯示內容：**
  ```
  💬 與 #1117ABCD 的對話記錄（第 1 頁）

  ━━━━━━━━━━━━━━━━

  [11:30] 對方：你好
  [11:32] 你：你好！
  [11:35] 對方：喜歡音樂嗎？
  [11:36] 你：喜歡！

  ━━━━━━━━━━━━━━━━

  💡 這是對話的歷史記錄
  📊 總訊息數：4 則
  📅 最後更新：2025-01-17 11:36

  💬 直接按 /reply 回覆訊息聊天
  📜 查看下一頁：#1117ABCD-H2
  🏠 返回主選單：/menu
  ```

**2. 新訊息帖子（New Message Post）**
- **用途：** 顯示最新的一條訊息
- **更新方式：** 每次有新訊息時，刪除舊帖子，創建新帖子
- **顯示內容：**
  ```
  💬 來自 #1117ABCD 的新訊息：

  [11:36] 對方：
  喜歡音樂嗎？

  ━━━━━━━━━━━━━━━━

  💬 直接按 /reply 回覆訊息聊天
  📜 查看歷史記錄：#1117ABCD-H1
  👤 查看對方資料卡：[按鈕]
  🏠 返回主選單：/menu
  ```

---

## 🗄️ 資料庫設計

### 新增表：`conversation_history_posts`

**用途：** 追蹤每個對話的歷史記錄帖子

```sql
CREATE TABLE IF NOT EXISTS conversation_history_posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  conversation_id INTEGER NOT NULL,
  user_telegram_id TEXT NOT NULL,
  identifier TEXT NOT NULL,                -- 例如：1117ABCD
  post_number INTEGER NOT NULL,            -- 帖子編號：1, 2, 3...
  telegram_message_id INTEGER NOT NULL,    -- Telegram 帖子 ID
  content TEXT NOT NULL,                   -- 歷史記錄內容
  char_count INTEGER NOT NULL DEFAULT 0,   -- 字符數
  message_count INTEGER NOT NULL DEFAULT 0, -- 訊息數量
  is_latest BOOLEAN NOT NULL DEFAULT 1,    -- 是否為最新的歷史記錄帖子
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (conversation_id) REFERENCES conversations(id),
  FOREIGN KEY (user_telegram_id) REFERENCES users(telegram_id)
);

CREATE INDEX IF NOT EXISTS idx_history_posts_conversation ON conversation_history_posts(conversation_id, user_telegram_id);
CREATE INDEX IF NOT EXISTS idx_history_posts_latest ON conversation_history_posts(user_telegram_id, is_latest);
```

### 新增表：`conversation_new_message_posts`

**用途：** 追蹤每個對話的新訊息帖子

```sql
CREATE TABLE IF NOT EXISTS conversation_new_message_posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  conversation_id INTEGER NOT NULL,
  user_telegram_id TEXT NOT NULL,
  identifier TEXT NOT NULL,                -- 例如：1117ABCD
  telegram_message_id INTEGER NOT NULL,    -- Telegram 帖子 ID（會被更新）
  last_message_content TEXT,               -- 最後一條訊息內容
  last_message_time DATETIME,              -- 最後一條訊息時間
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(conversation_id, user_telegram_id),
  FOREIGN KEY (conversation_id) REFERENCES conversations(id),
  FOREIGN KEY (user_telegram_id) REFERENCES users(telegram_id)
);

CREATE INDEX IF NOT EXISTS idx_new_message_posts_conversation ON conversation_new_message_posts(conversation_id, user_telegram_id);
```

---

## 📝 核心邏輯

### 1. 收到新訊息時的處理流程

```typescript
async function handleNewConversationMessage(
  conversationId: number,
  senderTelegramId: string,
  receiverTelegramId: string,
  messageContent: string,
  messageTime: Date
) {
  // 1. 獲取標識符
  const identifier = await getOrCreateIdentifier(db, receiverTelegramId, senderTelegramId, conversationId);
  
  // 2. 更新歷史記錄帖子
  await updateHistoryPost(
    conversationId,
    receiverTelegramId,
    identifier,
    messageContent,
    messageTime,
    'received' // 收到的訊息
  );
  
  // 3. 更新新訊息帖子
  await updateNewMessagePost(
    conversationId,
    receiverTelegramId,
    identifier,
    messageContent,
    messageTime
  );
}
```

### 2. 更新歷史記錄帖子

```typescript
async function updateHistoryPost(
  conversationId: number,
  userTelegramId: string,
  identifier: string,
  messageContent: string,
  messageTime: Date,
  direction: 'sent' | 'received'
) {
  // 1. 獲取最新的歷史記錄帖子
  let historyPost = await getLatestHistoryPost(conversationId, userTelegramId);
  
  // 2. 格式化新訊息
  const timeStr = formatTime(messageTime); // 例如：11:36
  const directionLabel = direction === 'sent' ? '你' : '對方';
  const newMessage = `[${timeStr}] ${directionLabel}：${messageContent}`;
  
  // 3. 檢查是否超過字符限制
  const newContent = historyPost 
    ? `${historyPost.content}\n${newMessage}`
    : `💬 與 #${identifier} 的對話記錄（第 1 頁）\n\n━━━━━━━━━━━━━━━━\n\n${newMessage}`;
  
  if (newContent.length > 3800) { // 留 200 字符的緩衝
    // 創建新的歷史記錄帖子
    await createNewHistoryPost(conversationId, userTelegramId, identifier, newMessage);
  } else {
    // 更新現有帖子
    if (historyPost) {
      await updateExistingHistoryPost(historyPost, newContent);
    } else {
      await createNewHistoryPost(conversationId, userTelegramId, identifier, newMessage);
    }
  }
}
```

### 3. 更新新訊息帖子

```typescript
async function updateNewMessagePost(
  conversationId: number,
  userTelegramId: string,
  identifier: string,
  messageContent: string,
  messageTime: Date
) {
  // 1. 獲取現有的新訊息帖子
  const existingPost = await getNewMessagePost(conversationId, userTelegramId);
  
  // 2. 刪除舊帖子（如果存在）
  if (existingPost) {
    await telegram.deleteMessage(userTelegramId, existingPost.telegram_message_id);
  }
  
  // 3. 創建新帖子
  const timeStr = formatTime(messageTime);
  const messageText = 
    `💬 來自 #${identifier} 的新訊息：\n\n` +
    `[${timeStr}] 對方：\n${messageContent}\n\n` +
    `━━━━━━━━━━━━━━━━\n\n` +
    `💬 直接按 /reply 回覆訊息聊天\n` +
    `📜 查看歷史記錄：#${identifier}-H1\n` +
    `🏠 返回主選單：/menu`;
  
  const sentMessage = await telegram.sendMessageWithButtons(
    parseInt(userTelegramId),
    messageText,
    [
      [{ text: '👤 查看對方資料卡', callback_data: `conv_profile_${conversationId}` }],
    ]
  );
  
  // 4. 保存新帖子 ID
  await saveNewMessagePost(
    conversationId,
    userTelegramId,
    identifier,
    sentMessage.message_id,
    messageContent,
    messageTime
  );
}
```

---

## 🔄 用戶體驗流程

### 場景 1：收到第一條訊息

```
1. 用戶 A 丟瓶子
2. 用戶 B 撿瓶子
3. 用戶 B 回覆

用戶 A 收到：
- 歷史記錄帖子 #1117ABCD-H1
  [11:30] 對方：你好
  
- 新訊息帖子
  💬 來自 #1117ABCD 的新訊息：
  [11:30] 對方：你好
```

### 場景 2：持續對話

```
4. 用戶 A 回覆
5. 用戶 B 回覆
6. 用戶 A 回覆

用戶 B 收到：
- 歷史記錄帖子 #1117ABCD-H1（編輯更新）
  [11:30] 對方：你好
  [11:32] 你：你好！
  [11:35] 對方：喜歡音樂嗎？
  [11:36] 你：喜歡！
  
- 新訊息帖子（刪除舊的，創建新的）
  💬 來自 #1117ABCD 的新訊息：
  [11:36] 對方：喜歡音樂嗎？
```

### 場景 3：歷史記錄超過 4000 字符

```
... 多次對話後 ...

用戶收到：
- 歷史記錄帖子 #1117ABCD-H1（已滿，不再編輯）
  [11:30] 對方：你好
  [11:32] 你：你好！
  ... (共 50 條訊息)
  
  💡 繼續查看：#1117ABCD-H2

- 歷史記錄帖子 #1117ABCD-H2（新創建，繼續編輯）
  [12:30] 對方：還在嗎？
  [12:32] 你：在！
  
- 新訊息帖子
  💬 來自 #1117ABCD 的新訊息：
  [12:32] 對方：還在嗎？
```

---

## 📊 優點和挑戰

### 優點

1. ✅ **完整的對話歷史**
   - 用戶可以查看所有歷史訊息
   - 不會遺失任何對話內容

2. ✅ **清晰的對話結構**
   - 歷史記錄和新訊息分開
   - 易於查看和管理

3. ✅ **唯一的對象標識符**
   - 每個對話對象有固定的 `#` 編號
   - 易於記憶和查找

4. ✅ **自動擴展**
   - 超過 4000 字符自動創建新帖子
   - 無限制的對話長度

### 挑戰

1. ⚠️ **Telegram API 限制**
   - 編輯訊息有頻率限制
   - 需要處理編輯失敗的情況

2. ⚠️ **資料庫複雜度**
   - 需要追蹤多個帖子
   - 需要同步更新

3. ⚠️ **性能考慮**
   - 每次訊息都要編輯歷史記錄帖子
   - 可能影響性能

### 解決方案

**對於 Telegram API 限制：**
- 使用批處理更新（每 5 秒更新一次，而不是每條訊息都更新）
- 錯誤處理：如果編輯失敗，創建新帖子

**對於資料庫複雜度：**
- 使用事務確保資料一致性
- 添加索引提高查詢性能

**對於性能：**
- 使用緩存減少資料庫查詢
- 異步更新歷史記錄帖子

---

## 🚀 實現步驟

### 階段 1：資料庫遷移（30 分鐘）

1. ✅ 創建 `conversation_history_posts` 表
2. ✅ 創建 `conversation_new_message_posts` 表
3. ✅ 創建索引
4. ✅ 測試遷移

### 階段 2：核心邏輯（1 小時）

1. ✅ 實現 `updateHistoryPost` 函數
2. ✅ 實現 `updateNewMessagePost` 函數
3. ✅ 實現字符限制檢查
4. ✅ 實現帖子創建邏輯

### 階段 3：整合（30 分鐘）

1. ✅ 修改 `handleMessageForward` 整合新邏輯
2. ✅ 修改 `handleCatch` 整合新邏輯
3. ✅ 測試完整流程

### 階段 4：測試和部署（30 分鐘）

1. ✅ 單元測試
2. ✅ 整合測試
3. ✅ Smoke 測試
4. ✅ 部署到 Staging
5. ✅ 用戶驗收測試

**預計總時間：** 2.5 - 3 小時

---

## 📝 待辦事項

- [ ] 創建資料庫遷移腳本
- [ ] 實現核心邏輯函數
- [ ] 整合到現有流程
- [ ] 編寫測試
- [ ] 部署和驗收

---

## 🎯 下一步

**用戶需要做的：**
1. 使用 `/dev_restart` 清空資料
2. 驗證 `#MMDDHHHH` 格式正確
3. 確認後，我開始實現歷史記錄帖子系統

**時間線：**
- 驗證標識符格式：5 分鐘
- 實現新功能：2.5 - 3 小時
- 測試和部署：30 分鐘

**準備好了嗎？** 🚀

