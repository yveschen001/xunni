# XunNi 使用者數據統計功能

## 1. 概述

提供完整的使用者數據統計功能，讓使用者了解自己的使用情況和活躍度排名。

---

## 2. 數據統計內容

### 2.1 漂流瓶統計

- 總丟瓶數：從註冊至今累計
- 最近 7 天丟瓶數
- 最近 30 天丟瓶數
- 今日丟瓶數
- 總撿瓶數
- 成功配對數（撿到瓶後建立對話）

### 2.2 聊天統計

- 總聊天次數：所有對話的訊息總數
- 活躍對話數：當前有活躍對話的數量
- 總對話對象數：曾經聊過的不同使用者數量
- 最近 7 天聊天次數
- 最近 30 天聊天次數

### 2.3 充值記錄

- 總充值金額（Telegram Stars）
- 充值次數
- 充值記錄列表（時間、金額、狀態）
- 當前餘額（如有餘額系統）

### 2.4 活躍度排名

- 全球排名百分比
- 活躍度分數計算
- 排名變化趨勢

---

## 3. 指令設計

### 3.1 /stats（我的統計）

顯示完整的使用者統計數據：

```
📊 我的數據統計

📦 漂流瓶數據
├─ 總丟瓶數：{totalThrows}
├─ 總撿瓶數：{totalCatches}
├─ 成功配對：{successfulMatches}
├─ 今日丟瓶：{throwsToday} / {dailyLimit}
└─ 最近 7 天：{throws7d} 個

💬 聊天數據
├─ 總聊天次數：{totalMessages}
├─ 活躍對話：{activeConversations} 個
├─ 對話對象：{uniquePartners} 人
└─ 最近 7 天：{messages7d} 則

💰 充值記錄
├─ 總充值：{totalRecharged} Stars
├─ 充值次數：{rechargeCount} 次
└─ [查看詳細記錄]

🏆 活躍度排名
├─ 全球排名：前 {percentile}%
├─ 活躍度分數：{activityScore}
└─ [查看排行榜]

[📈 查看趨勢] [🔄 刷新數據]
```

### 3.2 /recharge_history（充值記錄）

顯示詳細的充值記錄：

```
💰 充值記錄

總計：{totalStars} Stars
共 {count} 筆記錄

📅 {date} - {amount} Stars
   狀態：{status}
   訂單號：{payment_id}

📅 {date} - {amount} Stars
   狀態：{status}
   訂單號：{payment_id}

...

[上一頁] [下一頁]
```

---

## 4. 資料庫設計

### 4.1 user_statistics（使用者統計快取）

```sql
CREATE TABLE user_statistics (
  user_id TEXT PRIMARY KEY,
  
  -- 漂流瓶統計
  total_throws INTEGER DEFAULT 0,
  total_catches INTEGER DEFAULT 0,
  successful_matches INTEGER DEFAULT 0,
  
  -- 聊天統計
  total_messages INTEGER DEFAULT 0,
  unique_partners INTEGER DEFAULT 0,
  
  -- 活躍度
  activity_score INTEGER DEFAULT 0,
  last_active_at DATETIME,
  
  -- 時間戳
  updated_at DATETIME,
  last_calculated_at DATETIME
);

CREATE INDEX idx_user_statistics_activity_score ON user_statistics(activity_score DESC);
```

### 4.2 recharge_records（充值記錄）

```sql
CREATE TABLE recharge_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT,
  payment_id INTEGER,           -- FK -> payments.id
  stars_amount INTEGER,          -- 充值金額（Stars）
  recharge_type TEXT,            -- 'vip_subscription' / 'direct_recharge' / 'gift'
  status TEXT,                   -- 'success' / 'pending' / 'failed' / 'refunded'
  created_at DATETIME,
  
  FOREIGN KEY (payment_id) REFERENCES payments(id)
);

CREATE INDEX idx_recharge_records_user_id ON recharge_records(user_id);
CREATE INDEX idx_recharge_records_created_at ON recharge_records(created_at DESC);
```

### 4.3 conversation_messages（聊天記錄）

```sql
CREATE TABLE conversation_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  conversation_id INTEGER,       -- FK -> conversations.id
  sender_id TEXT,                -- FK -> users.telegram_id
  receiver_id TEXT,               -- FK -> users.telegram_id
  message_text TEXT,
  is_translated INTEGER DEFAULT 0, -- 是否經過翻譯
  original_language TEXT,
  translated_language TEXT,
  created_at DATETIME,
  
  FOREIGN KEY (conversation_id) REFERENCES conversations(id)
);

CREATE INDEX idx_conversation_messages_conversation_id ON conversation_messages(conversation_id);
CREATE INDEX idx_conversation_messages_sender_id ON conversation_messages(sender_id);
CREATE INDEX idx_conversation_messages_created_at ON conversation_messages(created_at);
```

### 4.4 bottle_chat_history（漂流瓶聊天記錄）

```sql
CREATE TABLE bottle_chat_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bottle_id INTEGER,             -- FK -> bottles.id
  conversation_id INTEGER,       -- FK -> conversations.id
  user_a_id TEXT,               -- 丟瓶者
  user_b_id TEXT,               -- 撿瓶者
  bottle_content TEXT,          -- 瓶子原始內容
  first_message_at DATETIME,    -- 第一條訊息時間
  last_message_at DATETIME,     -- 最後一條訊息時間
  total_messages INTEGER DEFAULT 0,
  status TEXT,                  -- 'active' / 'closed' / 'blocked'
  created_at DATETIME
);

CREATE INDEX idx_bottle_chat_history_bottle_id ON bottle_chat_history(bottle_id);
CREATE INDEX idx_bottle_chat_history_user_a_id ON bottle_chat_history(user_a_id);
CREATE INDEX idx_bottle_chat_history_user_b_id ON bottle_chat_history(user_b_id);
```

---

## 5. 活躍度計算

### 5.1 活躍度分數公式

```typescript
activityScore = 
  (totalThrows * 10) +           // 丟瓶：10 分/個
  (totalCatches * 5) +          // 撿瓶：5 分/個
  (totalMessages * 1) +         // 聊天：1 分/則
  (activeDays7d * 20) +         // 7 天活躍：20 分/天
  (uniquePartners * 15) +       // 對話對象：15 分/人
  (isVip ? 100 : 0)             // VIP 加成：100 分
```

### 5.2 排名計算

```typescript
async function getUserRankPercentile(
  userId: string,
  db: D1Database
): Promise<number> {
  const userStats = await db.getUserStatistics(userId);
  if (!userStats) return 100;
  
  // 計算有多少使用者的活躍度分數低於當前使用者
  const lowerCount = await db.prepare(`
    SELECT COUNT(*) as count
    FROM user_statistics
    WHERE activity_score < ?
  `).bind(userStats.activity_score).first();
  
  // 計算總使用者數
  const totalCount = await db.prepare(`
    SELECT COUNT(*) as count
    FROM user_statistics
  `).first();
  
  const percentile = (lowerCount.count / totalCount.count) * 100;
  return Math.round(percentile * 100) / 100; // 保留兩位小數
}
```

---

## 6. 實作範例

### 6.1 更新使用者統計

```typescript
// src/domain/user_stats.ts

export async function updateUserStatistics(
  userId: string,
  db: D1Database
): Promise<void> {
  // 計算總丟瓶數
  const totalThrows = await db.prepare(`
    SELECT COUNT(*) as count
    FROM bottles
    WHERE owner_id = ?
  `).bind(userId).first();
  
  // 計算總撿瓶數（成功配對）
  const totalCatches = await db.prepare(`
    SELECT COUNT(*) as count
    FROM conversations
    WHERE user_b_id = ? OR (user_a_id = ? AND user_b_id != user_a_id)
  `).bind(userId, userId).first();
  
  // 計算總聊天次數
  const totalMessages = await db.prepare(`
    SELECT COUNT(*) as count
    FROM conversation_messages
    WHERE sender_id = ?
  `).bind(userId).first();
  
  // 計算對話對象數
  const uniquePartners = await db.prepare(`
    SELECT COUNT(DISTINCT CASE 
      WHEN user_a_id = ? THEN user_b_id 
      ELSE user_a_id 
    END) as count
    FROM conversations
    WHERE (user_a_id = ? OR user_b_id = ?)
      AND status = 'active'
  `).bind(userId, userId, userId).first();
  
  // 計算活躍度分數
  const user = await db.getUser(userId);
  const activityScore = calculateActivityScore({
    totalThrows: totalThrows.count,
    totalCatches: totalCatches.count,
    totalMessages: totalMessages.count,
    uniquePartners: uniquePartners.count,
    isVip: user.is_vip === 1,
  });
  
  // 更新統計表
  await db.prepare(`
    INSERT INTO user_statistics (
      user_id, total_throws, total_catches, total_messages,
      unique_partners, activity_score, updated_at, last_calculated_at
    ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    ON CONFLICT(user_id) DO UPDATE SET
      total_throws = excluded.total_throws,
      total_catches = excluded.total_catches,
      total_messages = excluded.total_messages,
      unique_partners = excluded.unique_partners,
      activity_score = excluded.activity_score,
      updated_at = datetime('now'),
      last_calculated_at = datetime('now')
  `).bind(
    userId,
    totalThrows.count,
    totalCatches.count,
    totalMessages.count,
    uniquePartners.count,
    activityScore
  ).run();
}
```

---

## 7. 聊天記錄查看

### 7.1 /chat_history（聊天記錄）

```
💬 我的聊天記錄

當前活躍對話：{activeCount} 個

📦 來自漂流瓶 #{bottle_id}
   對方：匿名使用者
   開始時間：{startTime}
   訊息數：{messageCount}
   [查看詳情] [繼續聊天]

📦 來自漂流瓶 #{bottle_id}
   對方：匿名使用者
   開始時間：{startTime}
   訊息數：{messageCount}
   [查看詳情] [繼續聊天]

[查看歷史對話] [返回]
```

### 7.2 查看對話詳情

```
💬 對話詳情

漂流瓶內容：
"{bottleContent}"

聊天記錄：
[{time}] 你：{message}
[{time}] 對方：{message}
[{time}] 你：{message}
...

[返回] [舉報] [封鎖]
```

---

## 8. 注意事項

1. **性能優化**：統計數據使用快取，避免每次查詢都計算
2. **隱私保護**：聊天記錄中不顯示真實 Telegram ID
3. **數據更新**：統計數據可設定定時更新（如每小時）
4. **排名公平性**：活躍度計算公式需定期檢討，確保公平

