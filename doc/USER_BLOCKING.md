# XunNi 使用者封鎖功能設計

## 1. 概述

提供 `/block` 功能，讓使用者可以封鎖不想再聊的對象，不涉及舉報。

---

## 2. 功能設計

### 2.1 /block（封鎖功能）

**功能說明**：
- 封鎖當前對話對象
- 不涉及舉報（與 `/report` 不同）
- 封鎖後不再匹配到該使用者
- 封鎖後該使用者無法再發送訊息

**使用場景**：
- 不想再聊，但不涉及違規
- 個人原因（話題不合、興趣不同等）

### 2.2 封鎖流程

```
使用者 A 在對話中 → 發送 /block
→ 封鎖使用者 B
→ 更新 conversations 表（a_blocked = 1）
→ 建立 user_blocks 記錄
→ 通知使用者 A「已封鎖」
→ 對話狀態改為 'blocked'
```

### 2.3 封鎖後行為

**封鎖方（使用者 A）**：
- 不會再匹配到使用者 B
- 不會收到使用者 B 的訊息
- 可以解除封鎖（如需要）

**被封鎖方（使用者 B）**：
- 無法發送訊息給使用者 A
- 仍可正常使用其他功能
- 不會收到封鎖通知（匿名保護）

---

## 3. 資料庫設計

### 3.1 user_blocks（使用者封鎖記錄）

```sql
CREATE TABLE user_blocks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  blocker_id TEXT,              -- 封鎖者
  blocked_id TEXT,              -- 被封鎖者
  conversation_id INTEGER,      -- 相關對話（可選）
  reason TEXT,                  -- 封鎖原因（可選，個人原因）
  created_at DATETIME,
  
  UNIQUE(blocker_id, blocked_id)
);

CREATE INDEX idx_user_blocks_blocker_id ON user_blocks(blocker_id);
CREATE INDEX idx_user_blocks_blocked_id ON user_blocks(blocked_id);
```

### 3.2 更新 conversations 表

```sql
-- conversations 表已有 a_blocked 和 b_blocked 欄位
-- 當使用者 A 封鎖使用者 B 時：
-- 如果 user_a_id = A，則 a_blocked = 1
-- 如果 user_b_id = A，則 b_blocked = 1
```

---

## 4. 匹配邏輯更新

### 4.1 排除封鎖的使用者

在 `matchBottleForUser` 中，需要排除：

1. **已封鎖的使用者**：使用者曾封鎖過該對象
2. **被封鎖的使用者**：使用者曾被該對象封鎖
3. **被舉報過的使用者**：使用者曾舉報過該對象（嚴重程度較高）

### 4.2 匹配排除邏輯

```typescript
// src/domain/matching.ts

export async function matchBottleForUser(
  user: User,
  db: D1Database
): Promise<Bottle | null> {
  // 1. 取得已封鎖的使用者列表
  const blockedUsers = await db.prepare(`
    SELECT blocked_id
    FROM user_blocks
    WHERE blocker_id = ?
  `).bind(user.telegram_id).all();
  
  const blockedIds = blockedUsers.results.map(row => row.blocked_id);
  
  // 2. 取得被封鎖的使用者列表（封鎖我的使用者）
  const blockedByUsers = await db.prepare(`
    SELECT blocker_id
    FROM user_blocks
    WHERE blocked_id = ?
  `).bind(user.telegram_id).all();
  
  const blockedByIds = blockedByUsers.results.map(row => row.blocker_id);
  
  // 3. 取得曾舉報過的使用者列表
  const reportedUsers = await db.prepare(`
    SELECT DISTINCT target_id
    FROM reports
    WHERE reporter_id = ?
      AND created_at > datetime('now', '-90 days')  -- 90 天內
  `).bind(user.telegram_id).all();
  
  const reportedIds = reportedUsers.results.map(row => row.target_id);
  
  // 4. 合併排除列表
  const excludeIds = [
    ...blockedIds,
    ...blockedByIds,
    ...reportedIds,
    user.telegram_id,  // 排除自己
  ];
  
  // 5. 查詢符合條件的瓶子（排除上述使用者）
  const bottles = await db.prepare(`
    SELECT *
    FROM bottles
    WHERE status = 'pending'
      AND expires_at > datetime('now')
      AND owner_id NOT IN (${excludeIds.map(() => '?').join(',')})
      AND (
        target_gender IS NULL 
        OR target_gender = ?
        OR target_gender = 'all'
      )
    ORDER BY RANDOM()
    LIMIT 1
  `).bind(...excludeIds, user.gender).all();
  
  return bottles.results[0] || null;
}
```

---

## 5. 指令實作

### 5.1 /block（封鎖指令）

```
使用者 A 在對話中發送 /block

Bot 回應：
🚫 確定要封鎖這位使用者嗎？

封鎖後：
- 不會再匹配到這位使用者
- 不會收到對方的訊息
- 可以解除封鎖（如需要）

[✅ 確定封鎖] [❌ 取消]
```

### 5.2 封鎖確認

```
使用者點擊「確定封鎖」

Bot 回應：
✅ 已封鎖

這位使用者將不會再出現在你的配對中。

[返回對話列表]
```

### 5.3 /unblock（解除封鎖，可選）

```
使用者 A 發送 /unblock {user_id}

Bot 回應：
🔓 確定要解除封鎖嗎？

解除封鎖後：
- 可能會再次匹配到這位使用者
- 可以正常聊天

[✅ 確定解除] [❌ 取消]
```

---

## 6. 實作範例

### 6.1 封鎖功能

```typescript
// src/telegram/handlers/block.ts

export async function handleBlock(
  userId: string,
  conversationId: number,
  env: Env,
  db: D1Database
): Promise<void> {
  // 1. 取得對話資訊
  const conversation = await db.prepare(`
    SELECT * FROM conversations
    WHERE id = ? AND status = 'active'
  `).bind(conversationId).first();
  
  if (!conversation) {
    await sendMessage(env, userId, '❌ 對話不存在');
    return;
  }
  
  // 2. 確定被封鎖的使用者
  const blockedUserId = conversation.user_a_id === userId
    ? conversation.user_b_id
    : conversation.user_a_id;
  
  // 3. 檢查是否已經封鎖
  const existingBlock = await db.prepare(`
    SELECT * FROM user_blocks
    WHERE blocker_id = ? AND blocked_id = ?
  `).bind(userId, blockedUserId).first();
  
  if (existingBlock) {
    await sendMessage(env, userId, '⚠️ 你已經封鎖了這位使用者');
    return;
  }
  
  // 4. 建立封鎖記錄
  await db.prepare(`
    INSERT INTO user_blocks (blocker_id, blocked_id, conversation_id, created_at)
    VALUES (?, ?, ?, datetime('now'))
  `).bind(userId, blockedUserId, conversationId).run();
  
  // 5. 更新對話狀態
  if (conversation.user_a_id === userId) {
    await db.prepare(`
      UPDATE conversations
      SET a_blocked = 1, status = 'blocked'
      WHERE id = ?
    `).bind(conversationId).run();
  } else {
    await db.prepare(`
      UPDATE conversations
      SET b_blocked = 1, status = 'blocked'
      WHERE id = ?
    `).bind(conversationId).run();
  }
  
  // 6. 通知使用者
  await sendMessage(env, userId, '✅ 已封鎖\n\n這位使用者將不會再出現在你的配對中。');
}
```

---

## 7. 注意事項

1. **匿名保護**：被封鎖方不會收到封鎖通知
2. **匹配排除**：封鎖後永久排除（除非解除封鎖）
3. **與舉報區別**：封鎖不涉及違規，不會累加風險分數
4. **解除封鎖**：可選功能，使用者可以解除封鎖

---

## 8. 測試要點

1. **封鎖功能測試**：
   - 封鎖後無法匹配到該使用者
   - 封鎖後無法收到該使用者的訊息
   - 封鎖後對話狀態更新

2. **匹配排除測試**：
   - 已封鎖的使用者不會出現在匹配結果中
   - 被封鎖的使用者不會出現在匹配結果中
   - 被舉報過的使用者不會出現在匹配結果中

