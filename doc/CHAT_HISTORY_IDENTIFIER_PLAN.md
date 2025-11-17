# 聊天記錄對象標識功能計劃

**狀態：** 待開發  
**優先級：** 高  
**預計工時：** 3-4 小時

---

## 📋 功能概述

在聊天記錄中為每個對話對象添加唯一的 `#` 標識符，方便用戶識別和查詢同一對象的所有對話記錄。

---

## 🎯 功能需求

### 1. 對象標識符設計

**格式：** `#A`, `#B`, `#C`, ..., `#Z`, `#AA`, `#AB`, ...

**規則：**
- 每個對話對象分配一個唯一標識符
- 按照對話開始時間順序分配
- 同一對象在所有對話中使用相同標識符
- 標識符在用戶維度唯一（不同用戶可以有相同標識符指向不同對象）

**示例：**
```
用戶 Alice 的對話對象：
- #A: Bob（第一個對話對象）
- #B: Charlie（第二個對話對象）
- #C: David（第三個對話對象）

用戶 Bob 的對話對象：
- #A: Alice（Bob 的第一個對話對象）
- #B: Eve（Bob 的第二個對話對象）
```

### 2. 顯示位置

#### 2.1 聊天記錄列表

```
💬 **你的聊天記錄**

📨 #A 的對話（3 則訊息）
最後訊息：你好，很高興認識你
時間：2025-01-15 14:30

📨 #B 的對話（5 則訊息）
最後訊息：今天天氣真好
時間：2025-01-15 12:00

📨 #C 的對話（1 則訊息）
最後訊息：謝謝你的分享
時間：2025-01-14 18:45

[🔍 搜尋對話] [🏠 返回主選單]
```

#### 2.2 對話詳情

```
💬 **與 #A 的對話**

📨 2025-01-15 10:00
對方：你好！
你：你好，很高興認識你

📨 2025-01-15 12:30
你：今天過得怎麼樣？
對方：很好，謝謝！

📨 2025-01-15 14:30
對方：你呢？
你：也不錯！

[💬 繼續對話 /reply] [👤 查看資料] [🏠 返回]
```

#### 2.3 收到新訊息

```
💬 **收到新訊息（來自 #A）**

對方說：
「你好，今天天氣真好！」

💬 直接按 /reply 回覆訊息聊天
🏠 返回主選單：/menu
```

### 3. 搜尋功能

**命令：** `/history #A` 或 `/history A`

**功能：**
- 顯示與特定對象的所有對話
- 支援標識符搜尋（`#A` 或 `A`）
- 顯示對話統計（訊息數、最後訊息時間）

**示例：**
```
🔍 **搜尋結果：#A 的對話**

📊 **統計：**
• 總訊息數：15 則
• 你發送：8 則
• 對方發送：7 則
• 對話開始：2025-01-10 09:00
• 最後訊息：2025-01-15 14:30

📨 **最近對話：**
[顯示最近 5 則訊息]

[💬 繼續對話] [👤 查看資料] [🏠 返回]
```

---

## 🛠️ 技術實現

### 1. 資料庫設計

#### 新增表：conversation_identifiers

```sql
CREATE TABLE IF NOT EXISTS conversation_identifiers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_telegram_id TEXT NOT NULL,        -- 用戶 ID
  partner_telegram_id TEXT NOT NULL,     -- 對話對象 ID
  identifier TEXT NOT NULL,              -- 標識符 (A, B, C, ...)
  first_conversation_id INTEGER NOT NULL, -- 第一個對話 ID
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_telegram_id, partner_telegram_id),
  UNIQUE(user_telegram_id, identifier),
  FOREIGN KEY (user_telegram_id) REFERENCES users(telegram_id),
  FOREIGN KEY (partner_telegram_id) REFERENCES users(telegram_id),
  FOREIGN KEY (first_conversation_id) REFERENCES conversations(id)
);

CREATE INDEX idx_conv_identifiers_user ON conversation_identifiers(user_telegram_id);
CREATE INDEX idx_conv_identifiers_partner ON conversation_identifiers(user_telegram_id, partner_telegram_id);
CREATE INDEX idx_conv_identifiers_id ON conversation_identifiers(user_telegram_id, identifier);
```

### 2. 核心函數

```typescript
// src/domain/conversation_identifier.ts

export function generateNextIdentifier(currentIdentifiers: string[]): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  
  if (currentIdentifiers.length === 0) {
    return 'A';
  }
  
  // 找到最大的標識符
  const maxIdentifier = currentIdentifiers.sort().pop()!;
  
  // 計算下一個標識符
  return incrementIdentifier(maxIdentifier);
}

function incrementIdentifier(identifier: string): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const chars = identifier.split('');
  
  // 從右到左遞增
  for (let i = chars.length - 1; i >= 0; i--) {
    const currentIndex = alphabet.indexOf(chars[i]);
    
    if (currentIndex < 25) {
      // 可以直接遞增
      chars[i] = alphabet[currentIndex + 1];
      return chars.join('');
    } else {
      // 需要進位
      chars[i] = 'A';
      if (i === 0) {
        // 最高位進位，需要添加新位
        return 'A' + chars.join('');
      }
    }
  }
  
  return chars.join('');
}

// 測試
// A -> B -> C -> ... -> Z -> AA -> AB -> ... -> AZ -> BA -> ...
```

### 3. 資料庫查詢

```typescript
// src/db/queries/conversation_identifiers.ts

export async function getOrCreateIdentifier(
  db: DatabaseClient,
  userTelegramId: string,
  partnerTelegramId: string,
  conversationId: number
): Promise<string> {
  // 1. 檢查是否已存在
  const existing = await db.d1
    .prepare(
      'SELECT identifier FROM conversation_identifiers WHERE user_telegram_id = ? AND partner_telegram_id = ?'
    )
    .bind(userTelegramId, partnerTelegramId)
    .first<{ identifier: string }>();
  
  if (existing) {
    return existing.identifier;
  }
  
  // 2. 生成新標識符
  const allIdentifiers = await db.d1
    .prepare('SELECT identifier FROM conversation_identifiers WHERE user_telegram_id = ? ORDER BY identifier')
    .bind(userTelegramId)
    .all<{ identifier: string }>();
  
  const currentIdentifiers = allIdentifiers.results.map(r => r.identifier);
  const newIdentifier = generateNextIdentifier(currentIdentifiers);
  
  // 3. 保存到資料庫
  await db.d1
    .prepare(
      'INSERT INTO conversation_identifiers (user_telegram_id, partner_telegram_id, identifier, first_conversation_id) VALUES (?, ?, ?, ?)'
    )
    .bind(userTelegramId, partnerTelegramId, newIdentifier, conversationId)
    .run();
  
  return newIdentifier;
}

export async function getIdentifierByPartner(
  db: DatabaseClient,
  userTelegramId: string,
  partnerTelegramId: string
): Promise<string | null> {
  const result = await db.d1
    .prepare(
      'SELECT identifier FROM conversation_identifiers WHERE user_telegram_id = ? AND partner_telegram_id = ?'
    )
    .bind(userTelegramId, partnerTelegramId)
    .first<{ identifier: string }>();
  
  return result?.identifier || null;
}

export async function getPartnerByIdentifier(
  db: DatabaseClient,
  userTelegramId: string,
  identifier: string
): Promise<string | null> {
  const result = await db.d1
    .prepare(
      'SELECT partner_telegram_id FROM conversation_identifiers WHERE user_telegram_id = ? AND identifier = ?'
    )
    .bind(userTelegramId, identifier.toUpperCase())
    .first<{ partner_telegram_id: string }>();
  
  return result?.partner_telegram_id || null;
}

export async function getAllConversationsWithIdentifiers(
  db: DatabaseClient,
  userTelegramId: string
): Promise<Array<{
  identifier: string;
  partnerTelegramId: string;
  messageCount: number;
  lastMessageTime: string;
  lastMessagePreview: string;
}>> {
  // 複雜查詢，結合 conversations 和 conversation_messages
  const query = `
    SELECT 
      ci.identifier,
      ci.partner_telegram_id,
      COUNT(cm.id) as message_count,
      MAX(cm.created_at) as last_message_time,
      (SELECT content FROM conversation_messages 
       WHERE conversation_id IN (
         SELECT id FROM conversations 
         WHERE (user1_telegram_id = ? AND user2_telegram_id = ci.partner_telegram_id)
            OR (user2_telegram_id = ? AND user1_telegram_id = ci.partner_telegram_id)
       )
       ORDER BY created_at DESC LIMIT 1
      ) as last_message_preview
    FROM conversation_identifiers ci
    LEFT JOIN conversations c ON (
      (c.user1_telegram_id = ? AND c.user2_telegram_id = ci.partner_telegram_id)
      OR (c.user2_telegram_id = ? AND c.user1_telegram_id = ci.partner_telegram_id)
    )
    LEFT JOIN conversation_messages cm ON cm.conversation_id = c.id
    WHERE ci.user_telegram_id = ?
    GROUP BY ci.identifier, ci.partner_telegram_id
    ORDER BY last_message_time DESC
  `;
  
  const { results } = await db.d1
    .prepare(query)
    .bind(userTelegramId, userTelegramId, userTelegramId, userTelegramId, userTelegramId)
    .all();
  
  return results as any;
}
```

### 4. Handler 修改

#### 修改：message_forward.ts

```typescript
// 在發送訊息時添加標識符
const identifier = await getOrCreateIdentifier(
  db,
  receiverTelegramId,
  senderTelegramId,
  conversationId
);

await telegram.sendMessage(
  receiverTelegramId,
  `💬 **收到新訊息（來自 #${identifier}）**\n\n` +
    `對方說：\n「${translatedContent}」\n\n` +
    `💬 直接按 /reply 回覆訊息聊天\n` +
    `🏠 返回主選單：/menu`
);
```

#### 新增：history.ts

```typescript
// src/telegram/handlers/history.ts

export async function handleHistory(
  message: TelegramMessage,
  env: Env
): Promise<void> {
  const db = createDatabaseClient(env);
  const telegram = createTelegramService(env);
  const telegramId = message.from.id.toString();
  
  // 解析命令參數
  const args = message.text?.split(' ');
  const searchIdentifier = args?.[1]?.replace('#', '').toUpperCase();
  
  if (searchIdentifier) {
    // 搜尋特定對象的對話
    await showConversationByIdentifier(db, telegram, telegramId, searchIdentifier);
  } else {
    // 顯示所有對話
    await showAllConversations(db, telegram, telegramId);
  }
}

async function showAllConversations(
  db: DatabaseClient,
  telegram: TelegramService,
  telegramId: string
): Promise<void> {
  const conversations = await getAllConversationsWithIdentifiers(db, telegramId);
  
  if (conversations.length === 0) {
    await telegram.sendMessage(
      telegramId,
      '💬 你還沒有任何對話記錄\n\n' +
        '快去丟瓶子認識新朋友吧！ /throw'
    );
    return;
  }
  
  let message = '💬 **你的聊天記錄**\n\n';
  
  for (const conv of conversations) {
    message += `📨 #${conv.identifier} 的對話（${conv.messageCount} 則訊息）\n`;
    message += `最後訊息：${conv.lastMessagePreview.substring(0, 30)}...\n`;
    message += `時間：${formatDate(conv.lastMessageTime)}\n\n`;
  }
  
  await telegram.sendMessageWithButtons(
    telegramId,
    message,
    [
      [{ text: '🏠 返回主選單', callback_data: 'menu' }],
    ]
  );
}

async function showConversationByIdentifier(
  db: DatabaseClient,
  telegram: TelegramService,
  telegramId: string,
  identifier: string
): Promise<void> {
  // 獲取對話對象
  const partnerTelegramId = await getPartnerByIdentifier(db, telegramId, identifier);
  
  if (!partnerTelegramId) {
    await telegram.sendMessage(
      telegramId,
      `❌ 找不到標識符 #${identifier} 的對話\n\n` +
        '使用 /history 查看所有對話'
    );
    return;
  }
  
  // 獲取對話記錄
  const messages = await getConversationMessages(db, telegramId, partnerTelegramId);
  
  // 顯示對話
  let message = `💬 **與 #${identifier} 的對話**\n\n`;
  message += `📊 **統計：**\n`;
  message += `• 總訊息數：${messages.length} 則\n\n`;
  
  // 顯示最近 10 則訊息
  const recentMessages = messages.slice(-10);
  for (const msg of recentMessages) {
    const time = formatTime(msg.created_at);
    const sender = msg.sender_telegram_id === telegramId ? '你' : '對方';
    message += `📨 ${time}\n${sender}：${msg.content}\n\n`;
  }
  
  await telegram.sendMessageWithButtons(
    telegramId,
    message,
    [
      [{ text: '💬 繼續對話', callback_data: `reply_${partnerTelegramId}` }],
      [{ text: '🏠 返回', callback_data: 'menu' }],
    ]
  );
}
```

---

## 🎨 UI 設計細節

### 聊天記錄列表

```
💬 **你的聊天記錄**

📨 #A 的對話（15 則訊息）
最後訊息：你好，今天天氣真好！
時間：2025-01-15 14:30

📨 #B 的對話（8 則訊息）
最後訊息：謝謝你的分享
時間：2025-01-15 10:00

📨 #C 的對話（3 則訊息）
最後訊息：很高興認識你
時間：2025-01-14 18:00

💡 使用 /history #A 查看與 #A 的完整對話

[🏠 返回主選單]
```

### 對話詳情

```
💬 **與 #A 的對話**

📊 **統計：**
• 總訊息數：15 則
• 你發送：8 則
• 對方發送：7 則
• 對話開始：2025-01-10 09:00
• 最後訊息：2025-01-15 14:30

📨 **最近對話：**

📨 2025-01-15 10:00
對方：你好！

📨 2025-01-15 10:05
你：你好，很高興認識你

📨 2025-01-15 14:30
對方：今天天氣真好！

[💬 繼續對話] [👤 查看資料] [🏠 返回]
```

---

## 🧪 測試計劃

### 單元測試
- [ ] 測試標識符生成邏輯（A -> B -> ... -> Z -> AA）
- [ ] 測試標識符唯一性
- [ ] 測試標識符查詢

### 集成測試
- [ ] 測試首次對話創建標識符
- [ ] 測試同一對象使用相同標識符
- [ ] 測試多個對象使用不同標識符
- [ ] 測試 `/history` 命令
- [ ] 測試 `/history #A` 搜尋

### 手動測試
- [ ] 與多個用戶對話，驗證標識符分配
- [ ] 查看聊天記錄列表
- [ ] 搜尋特定對象的對話
- [ ] 驗證標識符在訊息中正確顯示

---

## 📅 開發時程

### Phase 1: 資料庫和核心邏輯（1 小時）
- [ ] 創建 migration
- [ ] 實現標識符生成邏輯
- [ ] 實現資料庫查詢函數
- [ ] 單元測試

### Phase 2: Handler 修改（1 小時）
- [ ] 修改 message_forward.ts 添加標識符
- [ ] 實現 /history 命令
- [ ] 實現搜尋功能

### Phase 3: UI 優化（1 小時）
- [ ] 優化聊天記錄列表顯示
- [ ] 優化對話詳情顯示
- [ ] 添加統計資訊

### Phase 4: 測試和文檔（1 小時）
- [ ] 完整測試
- [ ] 更新文檔
- [ ] 部署驗證

---

## ✅ 驗收標準

- [ ] 每個對話對象有唯一標識符
- [ ] 標識符按順序分配（A, B, C, ...）
- [ ] 同一對象在所有對話中使用相同標識符
- [ ] `/history` 顯示所有對話
- [ ] `/history #A` 顯示特定對話
- [ ] 新訊息顯示對象標識符
- [ ] 聊天記錄顯示統計資訊
- [ ] 所有測試通過

---

**建立時間：** 2025-01-16  
**維護者：** 開發團隊  
**狀態：** 待開發

