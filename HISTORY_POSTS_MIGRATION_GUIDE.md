# 歷史記錄帖子系統 - 遷移指南

**創建時間：** 2025-01-17 04:30 UTC  
**部署版本：** a3ae74be-fe29-4608-aafe-0843af22eed9  
**Bot：** @xunni_dev_bot

---

## ⚠️ 重要：需要執行資料庫遷移

**新功能已部署，但需要先執行資料庫遷移才能使用！**

---

## 📋 遷移步驟

### 步驟 1：登入 Cloudflare Dashboard

1. 前往 https://dash.cloudflare.com/
2. 選擇你的帳號
3. 進入 **Workers & Pages**
4. 選擇 **D1** 資料庫

---

### 步驟 2：選擇 Staging 資料庫

1. 找到 `xunni-db-staging` 資料庫
2. 點擊進入

---

### 步驟 3：執行遷移 SQL

1. 點擊 **Console** 標籤
2. 複製以下 SQL 並執行：

```sql
-- Migration 0015: Add conversation history posts tables

-- Table: conversation_history_posts
CREATE TABLE IF NOT EXISTS conversation_history_posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  conversation_id INTEGER NOT NULL,
  user_telegram_id TEXT NOT NULL,
  identifier TEXT NOT NULL,
  post_number INTEGER NOT NULL DEFAULT 1,
  telegram_message_id INTEGER NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  char_count INTEGER NOT NULL DEFAULT 0,
  message_count INTEGER NOT NULL DEFAULT 0,
  is_latest BOOLEAN NOT NULL DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(conversation_id, user_telegram_id, post_number),
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  FOREIGN KEY (user_telegram_id) REFERENCES users(telegram_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_history_posts_conversation ON conversation_history_posts(conversation_id, user_telegram_id);
CREATE INDEX IF NOT EXISTS idx_history_posts_latest ON conversation_history_posts(user_telegram_id, is_latest);
CREATE INDEX IF NOT EXISTS idx_history_posts_identifier ON conversation_history_posts(identifier);

-- Table: conversation_new_message_posts
CREATE TABLE IF NOT EXISTS conversation_new_message_posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  conversation_id INTEGER NOT NULL,
  user_telegram_id TEXT NOT NULL,
  identifier TEXT NOT NULL,
  telegram_message_id INTEGER NOT NULL,
  last_message_content TEXT,
  last_message_time DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(conversation_id, user_telegram_id),
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  FOREIGN KEY (user_telegram_id) REFERENCES users(telegram_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_new_message_posts_conversation ON conversation_new_message_posts(conversation_id, user_telegram_id);
CREATE INDEX IF NOT EXISTS idx_new_message_posts_identifier ON conversation_new_message_posts(identifier);
```

3. 點擊 **Execute** 執行
4. 確認顯示 **Success**

---

### 步驟 4：驗證遷移成功

執行以下 SQL 驗證表已創建：

```sql
SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'conversation_%_posts';
```

**預期結果：**
```
conversation_history_posts
conversation_new_message_posts
```

---

## 🧪 測試新功能

### 測試步驟

**兩個測試帳號：**

```
用戶 A 和 B：
1. /dev_restart
2. 完成註冊

用戶 A：
3. /throw
4. 輸入瓶子內容：你好，我是 A

用戶 B：
5. /catch
6. 應該會收到：
   - 歷史記錄帖子 1（顯示 A 的瓶子內容）
   
7. 回覆：你好，我是 B

用戶 A：
8. 應該會收到：
   - 歷史記錄帖子（更新，顯示兩條訊息）
   - 新訊息帖子（顯示 B 的最新訊息）

9. 回覆：很高興認識你

用戶 B：
10. 應該會收到：
   - 歷史記錄帖子（更新，顯示三條訊息）
   - 新訊息帖子（更新，顯示 A 的最新訊息）
```

---

### 預期結果

**歷史記錄帖子：**
```
💬 與 #1117ABCD 的對話記錄（第 1 頁）

━━━━━━━━━━━━━━━━

[11:30] 對方：你好，我是 A
[11:32] 你：你好，我是 B
[11:35] 對方：很高興認識你

━━━━━━━━━━━━━━━━

💡 這是對話的歷史記錄
📊 總訊息數：3 則
📅 最後更新：2025-01-17 11:35

💬 直接按 /reply 回覆訊息聊天
```

**新訊息帖子：**
```
💬 來自 #1117ABCD 的新訊息：

[11:35] 對方：
很高興認識你

━━━━━━━━━━━━━━━━

💬 直接按 /reply 回覆訊息聊天
📜 查看歷史記錄：#1117ABCD
🏠 返回主選單：/menu

[查看對方資料卡]
```

---

## 📊 新功能說明

### 歷史記錄帖子（History Post）

**特點：**
- ✅ 顯示所有歷史訊息
- ✅ 每次有新訊息時自動更新
- ✅ 超過 3800 字符時創建新帖子
- ✅ 帶有對話統計信息

**更新方式：** 編輯現有帖子

---

### 新訊息帖子（New Message Post）

**特點：**
- ✅ 顯示最新一條訊息
- ✅ 可以直接回覆
- ✅ 每次有新訊息時更新

**更新方式：** 刪除舊帖子，創建新帖子

---

## 🎯 測試檢查點

- [ ] 遷移 SQL 執行成功
- [ ] 兩個表都已創建
- [ ] 索引都已創建
- [ ] 撿瓶子後收到歷史記錄帖子
- [ ] 發送訊息後歷史記錄帖子更新
- [ ] 收到訊息後顯示新訊息帖子
- [ ] 新訊息帖子有 "查看對方資料卡" 按鈕
- [ ] 多次對話後歷史記錄正確累積
- [ ] 標識符格式正確（#MMDDHHHH）

---

## 🚀 部署狀態

**Version ID：** a3ae74be-fe29-4608-aafe-0843af22eed9  
**Bot：** @xunni_dev_bot  
**環境：** Staging  
**狀態：** ✅ 已部署，等待遷移

---

## ⚠️ 注意事項

1. **必須先執行遷移** - 否則會出錯
2. **測試前先 `/dev_restart`** - 確保使用新標識符格式
3. **兩個帳號都要測試** - 確保雙向功能正常
4. **多發幾條訊息** - 測試歷史記錄累積

---

## 📝 遷移文件位置

**SQL 遷移文件：** `src/db/migrations/0015_add_conversation_history_posts.sql`

**相關文件：**
- `src/db/queries/conversation_history_posts.ts` - 資料庫查詢
- `src/domain/conversation_history.ts` - Domain 邏輯
- `src/services/conversation_history.ts` - 服務層
- `src/telegram/handlers/message_forward.ts` - 訊息轉發整合
- `src/telegram/handlers/catch.ts` - 撿瓶子整合

---

**準備好測試了嗎？** 🚀

**第一步：執行遷移 SQL！**

