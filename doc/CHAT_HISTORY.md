# XunNi 聊天記錄功能設計

## 1. 概述

提供完整的聊天記錄功能，讓使用者可以查看歷史對話，同時保護匿名性。

---

## 2. 功能需求

### 2.1 聊天記錄查看

- 查看所有對話列表
- 查看單個對話的完整記錄
- 查看漂流瓶原始內容
- 按時間排序
- 搜尋功能（可選）

### 2.2 匿名保護

- 不顯示真實 Telegram ID
- 使用「對方」或「匿名使用者」稱呼
- 對話記錄僅對參與者可見

---

## 3. 資料庫設計

### 3.1 conversation_messages（已在前文定義）

儲存每條訊息的詳細資訊。

### 3.2 bottle_chat_history（已在前文定義）

關聯漂流瓶和對話的記錄。

---

## 4. 指令設計

### 4.1 /chats（我的對話）

顯示所有對話列表：

```
💬 我的對話

當前活躍：{activeCount} 個
歷史對話：{historyCount} 個

━━━━━━━━━━━━━━━━━━━

📦 對話 #{id}
   來自：漂流瓶 #{bottle_id}
   開始：{startTime}
   訊息：{messageCount} 則
   狀態：{status === 'active' ? '💚 活躍' : '💤 已結束'}
   
   [查看詳情] [繼續聊天]

━━━━━━━━━━━━━━━━━━━

📦 對話 #{id}
   來自：漂流瓶 #{bottle_id}
   開始：{startTime}
   訊息：{messageCount} 則
   狀態：💤 已結束
   
   [查看詳情]

[上一頁] [下一頁] [返回]
```

### 4.2 /chat {id}（查看對話詳情）

顯示完整對話記錄：

```
💬 對話詳情 #{id}

━━━━━━━━━━━━━━━━━━━

📦 原始漂流瓶

"{bottleContent}"

丟出時間：{bottleTime}

━━━━━━━━━━━━━━━━━━━

💬 聊天記錄

[{time1}] 你：
{message1}

[{time2}] 對方：
{message2}

[{time3}] 你：
{message3}

...

━━━━━━━━━━━━━━━━━━━

[返回列表] [繼續聊天] [舉報] [封鎖]
```

---

## 5. 實作範例

### 5.1 獲取對話列表

```typescript
// src/domain/chat_history.ts

export async function getUserConversations(
  userId: string,
  db: D1Database,
  page: number = 1,
  pageSize: number = 10
): Promise<ConversationListItem[]> {
  const offset = (page - 1) * pageSize;
  
  const conversations = await db.prepare(`
    SELECT 
      c.id,
      c.bottle_id,
      c.created_at,
      c.last_message_at,
      c.status,
      b.content as bottle_content,
      COUNT(cm.id) as message_count
    FROM conversations c
    JOIN bottles b ON c.bottle_id = b.id
    LEFT JOIN conversation_messages cm ON c.id = cm.conversation_id
    WHERE c.user_a_id = ? OR c.user_b_id = ?
    GROUP BY c.id
    ORDER BY c.last_message_at DESC
    LIMIT ? OFFSET ?
  `).bind(userId, userId, pageSize, offset).all();
  
  return conversations.results.map(conv => ({
    id: conv.id,
    bottleId: conv.bottle_id,
    bottleContent: conv.bottle_content.substring(0, 50) + '...',
    startTime: conv.created_at,
    lastMessageTime: conv.last_message_at,
    messageCount: conv.message_count,
    status: conv.status,
  }));
}
```

### 5.2 獲取對話詳情

```typescript
export async function getConversationDetails(
  conversationId: number,
  userId: string,
  db: D1Database
): Promise<ConversationDetails | null> {
  // 驗證使用者是否有權限查看
  const conversation = await db.prepare(`
    SELECT * FROM conversations
    WHERE id = ? AND (user_a_id = ? OR user_b_id = ?)
  `).bind(conversationId, userId, userId).first();
  
  if (!conversation) {
    return null;
  }
  
  // 獲取漂流瓶內容
  const bottle = await db.prepare(`
    SELECT content, created_at
    FROM bottles
    WHERE id = ?
  `).bind(conversation.bottle_id).first();
  
  // 獲取所有訊息
  const messages = await db.prepare(`
    SELECT 
      sender_id,
      message_text,
      is_translated,
      created_at
    FROM conversation_messages
    WHERE conversation_id = ?
    ORDER BY created_at ASC
  `).bind(conversationId).all();
  
  return {
    conversationId,
    bottleContent: bottle.content,
    bottleTime: bottle.created_at,
    messages: messages.results.map(msg => ({
      isFromMe: msg.sender_id === userId,
      text: msg.message_text,
      isTranslated: msg.is_translated === 1,
      time: msg.created_at,
    })),
    status: conversation.status,
  };
}
```

---

## 6. 訊息儲存

### 6.1 儲存訊息時機

每次轉發訊息時，同時儲存到 `conversation_messages`：

```typescript
// src/telegram/handlers/msg_forward.ts

export async function forwardMessage(
  conversationId: number,
  senderId: string,
  messageText: string,
  env: Env,
  db: D1Database
): Promise<void> {
  // ... 轉發邏輯 ...
  
  // 儲存訊息記錄
  await db.prepare(`
    INSERT INTO conversation_messages (
      conversation_id,
      sender_id,
      receiver_id,
      message_text,
      is_translated,
      created_at
    ) VALUES (?, ?, ?, ?, ?, datetime('now'))
  `).bind(
    conversationId,
    senderId,
    receiverId,
    messageText,
    isTranslated ? 1 : 0
  ).run();
  
  // 更新對話最後訊息時間
  await db.prepare(`
    UPDATE conversations
    SET last_message_at = datetime('now')
    WHERE id = ?
  `).bind(conversationId).run();
}
```

---

## 7. 隱私保護

### 7.1 匿名顯示

- 所有對話記錄中，對方顯示為「匿名使用者」或「對方」
- 不顯示任何可識別資訊
- 僅參與對話的雙方可以查看

### 7.2 資料保留

- 對話記錄永久保存（除非使用者刪除）
- 使用者可要求刪除自己的對話記錄
- 封禁使用者的對話記錄保留用於審核

---

## 8. 功能擴展

### 8.1 搜尋功能（可選）

```
🔍 搜尋對話

輸入關鍵字搜尋聊天記錄：

[輸入關鍵字]

或按時間篩選：
[今天] [本週] [本月] [全部]
```

### 8.2 匯出功能（可選）

```
📥 匯出對話記錄

選擇要匯出的對話：
[全選] [選擇多個]

格式：文字檔（TXT）

[開始匯出]
```

---

## 9. 注意事項

1. **性能優化**：大量訊息時使用分頁載入
2. **儲存成本**：控制訊息儲存大小，避免過度儲存
3. **隱私合規**：確保符合隱私權政策要求
4. **使用者體驗**：提供清晰的導航和操作

