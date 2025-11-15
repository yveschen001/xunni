# XunNi 資料保留與清理策略

## 1. 概述

設計資料保留與清理策略，確保資料安全、合規，同時控制儲存成本。

---

## 2. 資料保留策略

### 2.1 漂流瓶保留策略

**保留期限**：
- 正常狀態：24 小時（過期後不再被撿起）
- 軟刪除：90 天後標記為 'deleted'，內容匿名化
- 硬刪除：365 天後完全刪除（可選）

**清理流程**：
```
漂流瓶建立 → 24 小時內可被撿起
→ 24 小時後 expires_at 過期，status = 'expired'
→ 90 天後標記為 'deleted'，content 匿名化（保留統計用）
→ 365 天後完全刪除（可選）
```

### 2.2 聊天記錄保留策略

**保留限制**：
- 每個對話對象最多保留 3650 筆訊息
- 超過 3650 筆時，刪除最舊的訊息（FIFO）
- 永久保留最後 100 筆訊息（用於上下文）

**清理邏輯**：
```typescript
// src/domain/chat_history.ts

export async function cleanupConversationMessages(
  conversationId: number,
  db: D1Database
): Promise<void> {
  // 1. 計算訊息總數
  const count = await db.prepare(`
    SELECT COUNT(*) as count
    FROM conversation_messages
    WHERE conversation_id = ?
  `).bind(conversationId).first();
  
  if (count.count <= 3650) {
    return; // 不需要清理
  }
  
  // 2. 保留最後 100 筆，刪除最舊的
  const toDelete = count.count - 3650;
  
  await db.prepare(`
    DELETE FROM conversation_messages
    WHERE conversation_id = ?
      AND id NOT IN (
        SELECT id FROM conversation_messages
        WHERE conversation_id = ?
        ORDER BY created_at DESC
        LIMIT 100
      )
      AND id IN (
        SELECT id FROM conversation_messages
        WHERE conversation_id = ?
        ORDER BY created_at ASC
        LIMIT ?
      )
  `).bind(conversationId, conversationId, conversationId, toDelete).run();
}
```

### 2.3 使用者資料保留策略

**正常使用者**：
- 個人資料永久保留（除非使用者刪除）
- 統計資料永久保留

**已刪除使用者**：
- 標記為 'deleted'
- 清除個人資料欄位（nickname, avatar_url, 等）
- 保留安全審計記錄（reports, bans, risk_score）
- 資料脫敏處理

---

## 3. 資料清理 Cron 任務

### 3.1 /cron/cleanup_bottles（漂流瓶清理）

每日執行一次：

```typescript
// src/telegram/handlers/cron_cleanup.ts

export async function handleCleanupBottles(
  env: Env,
  db: D1Database
): Promise<void> {
  const now = new Date();
  
  // 1. 標記 90 天前過期的漂流瓶為 'deleted'，內容匿名化
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  
  await db.prepare(`
    UPDATE bottles
    SET status = 'deleted',
        content = '[內容已刪除]',
        updated_at = datetime('now')
    WHERE status = 'expired'
      AND expires_at < ?
      AND expires_at > datetime('now', '-365 days')
  `).bind(ninetyDaysAgo.toISOString()).run();
  
  // 2. 完全刪除 365 天前的漂流瓶（可選）
  const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
  
  await db.prepare(`
    DELETE FROM bottles
    WHERE status = 'deleted'
      AND expires_at < ?
  `).bind(oneYearAgo.toISOString()).run();
}
```

### 3.2 /cron/cleanup_messages（聊天記錄清理）

每日執行一次：

```typescript
export async function handleCleanupMessages(
  env: Env,
  db: D1Database
): Promise<void> {
  // 清理所有對話的過多訊息
  const conversations = await db.prepare(`
    SELECT id
    FROM conversations
    WHERE status = 'active'
  `).all();
  
  for (const conv of conversations.results) {
    await cleanupConversationMessages(conv.id, db);
  }
}
```

---

## 4. 資料匿名化

### 4.1 漂流瓶匿名化

當漂流瓶超過 90 天後：
- `content` → '[內容已刪除]'
- `mood_tag` → NULL
- `owner_id` → 保留（用於統計，但不顯示）

### 4.2 使用者資料匿名化

當使用者刪除帳號後：
- `nickname` → '[已刪除]'
- `avatar_url` → NULL
- `gender` → 保留（用於統計）
- `birthday` → 保留（用於統計）
- `mbti_type` → 保留（用於統計）
- 其他個人資料欄位 → NULL

---

## 5. 資料庫 Schema 更新

### 5.1 bottles 表更新

```sql
-- 新增欄位
ALTER TABLE bottles ADD COLUMN deleted_at DATETIME;
ALTER TABLE bottles ADD COLUMN anonymized_at DATETIME;
```

### 5.2 users 表更新

```sql
-- 新增欄位
ALTER TABLE users ADD COLUMN deleted_at DATETIME;
ALTER TABLE users ADD COLUMN anonymized_at DATETIME;
ALTER TABLE users ADD COLUMN deletion_requested_at DATETIME;
```

---

## 6. 清理任務配置

### 6.1 wrangler.toml Cron 配置

```toml
# 每日清理任務
[[triggers.crons]]
schedule = "0 2 * * *"  # 每天 02:00 UTC
```

### 6.2 清理任務路由

```typescript
// src/router.ts

router.post('/cron/cleanup_bottles', async (request, env) => {
  await handleCleanupBottles(env, env.DB);
  return new Response('OK');
});

router.post('/cron/cleanup_messages', async (request, env) => {
  await handleCleanupMessages(env, env.DB);
  return new Response('OK');
});
```

---

## 7. 注意事項

1. **資料保留**：永久保留安全審計記錄（reports, bans）
2. **統計資料**：保留統計資料（user_statistics）
3. **匿名化**：確保匿名化後無法識別使用者
4. **清理頻率**：每日清理一次，避免頻繁操作
5. **備份**：清理前可選備份（如需）

---

## 8. 測試要點

1. **清理測試**：
   - 90 天後漂流瓶是否標記為 'deleted'
   - 內容是否匿名化
   - 365 天後是否完全刪除

2. **聊天記錄測試**：
   - 超過 3650 筆時是否清理
   - 最後 100 筆是否保留
   - 清理後對話是否正常

3. **使用者刪除測試**：
   - 個人資料是否清除
   - 安全審計記錄是否保留
   - 統計資料是否保留

