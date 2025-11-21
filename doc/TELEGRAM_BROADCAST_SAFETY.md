# Telegram 廣播安全規範

> **最後更新**：2025-11-21  
> **重要性**：🔴 **必須遵守**  
> **違反後果**：Bot 可能被 Telegram 限制或封禁

---

## ⚠️ 核心原則

**絕對禁止向以下用戶發送訊息**：
1. ❌ 已封鎖 Bot 的用戶（`bot_status = 'blocked'`）
2. ❌ 已刪除帳號的用戶（`bot_status = 'deleted'`）
3. ❌ 已停用帳號的用戶（`bot_status = 'deactivated'`）
4. ❌ 無效用戶 ID（`bot_status = 'invalid'`）
5. ❌ 已刪除帳號的用戶（`deleted_at IS NOT NULL`）

---

## 📊 用戶狀態說明

### `users.bot_status` 欄位

| 狀態 | 說明 | 是否可發送 | Telegram 錯誤碼 |
|------|------|-----------|---------------|
| `active` | 正常用戶 | ✅ **可以** | - |
| `blocked` | 用戶已封鎖 Bot | ❌ **禁止** | 403 Forbidden |
| `deleted` | 用戶帳號已刪除 | ❌ **禁止** | 400 "user not found" |
| `deactivated` | 用戶帳號已停用 | ❌ **禁止** | 400 "deactivated" |
| `invalid` | 無效用戶 ID | ❌ **禁止** | 400 其他錯誤 |

### 資料庫 Schema

```sql
CREATE TABLE users (
  telegram_id TEXT PRIMARY KEY,
  -- ... 其他欄位 ...
  
  -- 活躍度追蹤
  last_active_at TEXT DEFAULT CURRENT_TIMESTAMP,
  
  -- Bot 狀態追蹤（關鍵欄位）
  bot_status TEXT DEFAULT 'active' 
    CHECK(bot_status IN ('active', 'blocked', 'deleted', 'deactivated', 'invalid')),
  bot_status_updated_at TEXT,
  failed_delivery_count INTEGER DEFAULT 0,
  
  -- 軟刪除
  deleted_at TEXT
);

-- 索引（提升查詢效能）
CREATE INDEX idx_users_bot_status ON users(bot_status);
CREATE INDEX idx_users_activity_status ON users(last_active_at, bot_status);
```

---

## 🔒 強制過濾條件

### 所有廣播查詢必須包含

```sql
SELECT telegram_id 
FROM users 
WHERE bot_status = 'active'              -- ⚠️ 關鍵：只查詢正常用戶
  AND deleted_at IS NULL                 -- 排除已刪除帳號
  AND onboarding_step = 'completed'      -- 排除未完成註冊
  AND last_active_at >= datetime('now', '-30 days')  -- 只推送給活躍用戶
```

### ✅ 正確範例

```typescript
// ✅ 正確：包含 bot_status 過濾
async function getActiveUsers(db: D1Database) {
  return await db.prepare(`
    SELECT telegram_id FROM users 
    WHERE bot_status = 'active' 
      AND deleted_at IS NULL
  `).all();
}
```

### ❌ 錯誤範例

```typescript
// ❌ 錯誤：沒有過濾 bot_status
async function getAllUsers(db: D1Database) {
  return await db.prepare(`
    SELECT telegram_id FROM users 
    WHERE deleted_at IS NULL
  `).all();  // 可能包含已封鎖 Bot 的用戶！
}
```

---

## 🤖 自動錯誤處理機制

### 實現位置

**檔案**：`src/services/telegram_error_handler.ts`

### 工作流程

```
發送訊息
    ↓
Telegram API 返回錯誤
    ↓
parseErrorType() 解析錯誤類型
    ↓
handleBroadcastError() 標記用戶狀態
    ↓
UPDATE users SET bot_status = ?
```

### 錯誤碼對應

| Telegram 錯誤 | 錯誤碼 | 描述 | 標記為 |
|--------------|-------|------|--------|
| Bot was blocked | 403 | 用戶封鎖了 Bot | `blocked` |
| User not found | 400 | 用戶帳號已刪除 | `deleted` |
| User is deactivated | 400 | 用戶帳號已停用 | `deactivated` |
| Invalid user_id | 400 | 無效的用戶 ID | `invalid` |

### 自動標記邏輯

```typescript
// src/services/telegram_error_handler.ts

export async function handleBroadcastError(
  db: ReturnType<typeof createDatabaseClient>,
  telegramId: string,
  error: any
): Promise<{
  errorType: 'blocked' | 'deleted' | 'deactivated' | 'invalid' | 'other';
  shouldRetry: boolean;
}> {
  const errorType = parseErrorType(error);

  // 自動標記不可達用戶
  if (
    errorType === 'blocked' ||
    errorType === 'deleted' ||
    errorType === 'deactivated' ||
    errorType === 'invalid'
  ) {
    await markUserBotStatus(db, telegramId, errorType);
    console.log(`[handleBroadcastError] User ${telegramId} marked as ${errorType}`);
  }

  return {
    errorType,
    shouldRetry: errorType === 'other' || error.error_code === 429,
  };
}
```

---

## 📝 開發檢查清單

### 在實現任何推送功能前，確認：

- [ ] ✅ SQL 查詢包含 `bot_status = 'active'`
- [ ] ✅ SQL 查詢包含 `deleted_at IS NULL`
- [ ] ✅ 使用 `getFilteredUserIds()` 或類似的安全函數
- [ ] ✅ 發送失敗時調用 `handleBroadcastError()`
- [ ] ✅ 記錄 `failed_delivery_count`
- [ ] ✅ 測試時驗證不會發送給已封鎖用戶

---

## 🧪 測試驗證

### 手動測試步驟

1. **創建測試用戶**：註冊一個測試帳號
2. **封鎖 Bot**：在 Telegram 中封鎖測試 Bot
3. **觸發廣播**：執行廣播功能
4. **驗證結果**：
   - ✅ 測試用戶的 `bot_status` 應被標記為 `blocked`
   - ✅ 下次廣播時，該用戶應被自動排除
   - ✅ Logs 中應顯示 "User marked as blocked"

### 單元測試範例

```typescript
// tests/services/telegram_error_handler.test.ts

describe('handleBroadcastError', () => {
  it('should mark user as blocked on 403 error', async () => {
    const error = {
      error_code: 403,
      description: 'Forbidden: bot was blocked by the user'
    };
    
    const result = await handleBroadcastError(db, 'test_user_id', error);
    
    expect(result.errorType).toBe('blocked');
    expect(result.shouldRetry).toBe(false);
    
    // 驗證資料庫已更新
    const user = await db.getUserByTelegramId('test_user_id');
    expect(user.bot_status).toBe('blocked');
  });
});
```

---

## 🚨 常見錯誤與修正

### 錯誤 1：忘記過濾 bot_status

```typescript
// ❌ 錯誤
const users = await db.prepare(`
  SELECT telegram_id FROM users 
  WHERE onboarding_step = 'completed'
`).all();

// ✅ 正確
const users = await db.prepare(`
  SELECT telegram_id FROM users 
  WHERE onboarding_step = 'completed'
    AND bot_status = 'active'
    AND deleted_at IS NULL
`).all();
```

### 錯誤 2：沒有處理發送錯誤

```typescript
// ❌ 錯誤
for (const user of users) {
  await telegram.sendMessage(user.telegram_id, message);
}

// ✅ 正確
for (const user of users) {
  try {
    await telegram.sendMessage(user.telegram_id, message);
  } catch (error) {
    await handleBroadcastError(db, user.telegram_id, error);
  }
}
```

### 錯誤 3：使用過時的用戶列表

```typescript
// ❌ 錯誤：快取用戶列表，可能包含已封鎖的用戶
const cachedUsers = await getCachedUserList();

// ✅ 正確：每次廣播前重新查詢
const activeUsers = await getActiveUsers(db);
```

---

## 📚 相關文檔

- [`doc/BROADCAST_SYSTEM_DESIGN.md`](./BROADCAST_SYSTEM_DESIGN.md) - 廣播系統完整設計
- [`doc/PUSH_NOTIFICATIONS.md`](./PUSH_NOTIFICATIONS.md) - 自動化推送設計
- [`src/services/telegram_error_handler.ts`](../src/services/telegram_error_handler.ts) - 錯誤處理實現
- [`src/services/broadcast.ts`](../src/services/broadcast.ts) - 廣播服務實現

---

## 🎯 總結

### 記住三個關鍵點

1. **查詢時過濾**：`bot_status = 'active' AND deleted_at IS NULL`
2. **錯誤時標記**：調用 `handleBroadcastError()`
3. **測試時驗證**：確認不會發送給已封鎖用戶

### 違反規範的後果

- ⚠️ Bot 可能被 Telegram 限制發送速率
- ⚠️ Bot 可能被暫時封禁
- ⚠️ Bot 可能被永久封禁
- ⚠️ 影響所有用戶的服務品質

---

**文檔維護者**：開發團隊  
**文檔位置**：`doc/TELEGRAM_BROADCAST_SAFETY.md`  
**最後更新**：2025-11-21

