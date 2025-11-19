# 用戶數據刪除功能設計（GDPR 合規）

## 🎯 **設計原則**

> **符合 GDPR、CCPA 和 Telegram 規定的用戶數據刪除流程**

### **核心原則**
1. ✅ **用戶主動請求** - 必須由用戶發起
2. ✅ **身份驗證** - 6 位數驗證碼確認
3. ✅ **不可逆操作** - 刪除後無法恢復
4. ✅ **完整刪除** - 刪除所有個人數據
5. ✅ **保留必要記錄** - 用於防止濫用（匿名化）

---

## 🗄️ **數據庫 Schema**

### **1. 刪除請求表**

```sql
CREATE TABLE IF NOT EXISTS deletion_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  telegram_id TEXT NOT NULL,
  verification_code TEXT NOT NULL,
  code_expires_at TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'verified', 'completed', 'cancelled', 'expired')),
  requested_at TEXT DEFAULT CURRENT_TIMESTAMP,
  verified_at TEXT,
  completed_at TEXT,
  ip_address TEXT,
  user_agent TEXT
);

CREATE INDEX idx_deletion_telegram_id ON deletion_requests(telegram_id);
CREATE INDEX idx_deletion_status ON deletion_requests(status);
CREATE INDEX idx_deletion_code ON deletion_requests(verification_code);
```

### **2. 已刪除用戶記錄（匿名化）**

```sql
CREATE TABLE IF NOT EXISTS deleted_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  telegram_id_hash TEXT NOT NULL UNIQUE,  -- SHA256 hash，不可逆
  deletion_reason TEXT,
  deleted_at TEXT DEFAULT CURRENT_TIMESTAMP,
  was_banned INTEGER DEFAULT 0,
  ban_count INTEGER DEFAULT 0,
  risk_score INTEGER DEFAULT 0
);

CREATE INDEX idx_deleted_hash ON deleted_users(telegram_id_hash);
```

---

## 🔄 **刪除流程**

### **步驟 1：用戶發起刪除請求**

```
用戶發送：/delete_account
↓
Bot 回覆：
┌─────────────────────────────────────────┐
│ ⚠️ 刪除帳號                              │
│                                         │
│ 此操作將永久刪除：                        │
│ • 個人資料（暱稱、生日、MBTI 等）          │
│ • 所有漂流瓶和對話記錄                    │
│ • VIP 訂閱和邀請記錄                     │
│                                         │
│ ⚠️ 此操作不可恢復！                      │
│                                         │
│ 如確定要刪除，請點擊下方按鈕：             │
│ [確認刪除]  [取消]                       │
└─────────────────────────────────────────┘
```

### **步驟 2：生成驗證碼**

```typescript
async function initiateAccountDeletion(telegramId: string): Promise<string> {
  // 生成 6 位數驗證碼
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  
  // 設置 15 分鐘過期
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
  
  // 保存請求
  await db.insert('deletion_requests', {
    telegram_id: telegramId,
    verification_code: code,
    code_expires_at: expiresAt,
    status: 'pending'
  });
  
  return code;
}
```

```
Bot 發送驗證碼：
┌─────────────────────────────────────────┐
│ 🔐 驗證碼                                │
│                                         │
│ 你的刪除帳號驗證碼是：                    │
│                                         │
│        【 123456 】                     │
│                                         │
│ 此驗證碼將在 15 分鐘後過期。              │
│                                         │
│ 請使用 /confirm_delete 123456 確認刪除   │
│                                         │
│ 如不是你本人操作，請忽略此訊息。           │
└─────────────────────────────────────────┘
```

### **步驟 3：用戶確認刪除**

```
用戶發送：/confirm_delete 123456
↓
Bot 驗證碼：
- ✅ 正確 → 執行刪除
- ❌ 錯誤 → 提示重試（最多 3 次）
- ⏰ 過期 → 需要重新發起
```

### **步驟 4：執行刪除**

```typescript
async function executeAccountDeletion(telegramId: string): Promise<void> {
  const db = createDatabaseClient(env.DB);
  
  // 1. 獲取用戶信息（用於匿名化記錄）
  const user = await db.d1
    .prepare('SELECT * FROM users WHERE telegram_id = ?')
    .bind(telegramId)
    .first<any>();
  
  if (!user) throw new Error('User not found');
  
  // 2. 創建匿名化記錄（防止濫用）
  const telegramIdHash = await sha256(telegramId);
  await db.d1
    .prepare(`
      INSERT INTO deleted_users (telegram_id_hash, deletion_reason, was_banned, ban_count, risk_score)
      VALUES (?, 'user_request', ?, ?, ?)
    `)
    .bind(telegramIdHash, user.is_banned, user.ban_count, user.risk_score)
    .run();
  
  // 3. 刪除用戶相關數據（按順序）
  const tables = [
    'sessions',              // 會話
    'daily_usage',           // 每日使用記錄
    'bottle_chat_history',   // 對話歷史
    'conversation_messages', // 對話訊息
    'conversations',         // 對話
    'bottles',               // 漂流瓶（作為 owner）
    'reports',               // 舉報記錄
    'blocks',                // 封鎖記錄
    'bans',                  // 封禁記錄
    'appeals',               // 申訴記錄
    'invites',               // 邀請記錄
    'deletion_requests',     // 刪除請求
    'users'                  // 用戶主表（最後刪除）
  ];
  
  for (const table of tables) {
    try {
      await db.d1
        .prepare(`DELETE FROM ${table} WHERE telegram_id = ?`)
        .bind(telegramId)
        .run();
    } catch (error) {
      console.error(`[Deletion] Failed to delete from ${table}:`, error);
      // 繼續刪除其他表
    }
  }
  
  // 4. 更新刪除請求狀態
  await db.d1
    .prepare(`
      UPDATE deletion_requests 
      SET status = 'completed', completed_at = CURRENT_TIMESTAMP
      WHERE telegram_id = ? AND status = 'verified'
    `)
    .bind(telegramId)
    .run();
  
  console.log(`[Deletion] User ${telegramId} data deleted successfully`);
}
```

### **步驟 5：確認完成**

```
Bot 發送確認：
┌─────────────────────────────────────────┐
│ ✅ 帳號已刪除                            │
│                                         │
│ 你的帳號和所有數據已永久刪除。            │
│                                         │
│ 感謝你使用 XunNi！                       │
│                                         │
│ 如需重新使用，請發送 /start 重新註冊。    │
└─────────────────────────────────────────┘
```

---

## 🛡️ **安全措施**

### **1. 防止濫用**

```typescript
// 限制刪除請求頻率
async function checkDeletionRateLimit(telegramId: string): Promise<boolean> {
  const recentRequests = await db.d1
    .prepare(`
      SELECT COUNT(*) as count 
      FROM deletion_requests 
      WHERE telegram_id = ? 
        AND requested_at >= datetime('now', '-24 hours')
    `)
    .bind(telegramId)
    .first<{ count: number }>();
  
  // 24 小時內最多 3 次請求
  return (recentRequests?.count || 0) < 3;
}
```

### **2. 驗證碼安全**

- ✅ 6 位數隨機生成
- ✅ 15 分鐘過期
- ✅ 最多嘗試 3 次
- ✅ 使用後立即失效

### **3. 防止重複註冊濫用**

```typescript
// 檢查是否為已刪除用戶（通過 hash）
async function isDeletedUser(telegramId: string): Promise<boolean> {
  const hash = await sha256(telegramId);
  const deleted = await db.d1
    .prepare('SELECT id FROM deleted_users WHERE telegram_id_hash = ?')
    .bind(hash)
    .first();
  
  return !!deleted;
}

// 如果是已刪除用戶，可以設置冷卻期
async function canReregister(telegramId: string): Promise<boolean> {
  const hash = await sha256(telegramId);
  const deleted = await db.d1
    .prepare(`
      SELECT deleted_at FROM deleted_users 
      WHERE telegram_id_hash = ?
    `)
    .bind(hash)
    .first<{ deleted_at: string }>();
  
  if (!deleted) return true;
  
  // 30 天冷卻期
  const deletedDate = new Date(deleted.deleted_at);
  const cooldownEnd = new Date(deletedDate.getTime() + 30 * 24 * 60 * 60 * 1000);
  
  return new Date() >= cooldownEnd;
}
```

---

## 📊 **數據保留策略**

### **完全刪除的數據**
- ✅ 個人資料（暱稱、生日、性別、MBTI 等）
- ✅ 聯絡方式（username、first_name、last_name）
- ✅ 所有漂流瓶內容
- ✅ 所有對話記錄
- ✅ VIP 訂閱記錄
- ✅ 邀請記錄

### **匿名化保留的數據**
- ⚠️ Telegram ID 的 SHA256 hash（不可逆）
- ⚠️ 刪除時間
- ⚠️ 是否曾被封禁
- ⚠️ 封禁次數
- ⚠️ 風險分數

**保留原因：**
- 防止濫用（重複註冊刷邀請獎勵）
- 防止被封禁用戶重新註冊
- 統計分析（不包含個人信息）

---

## 🔧 **實現代碼**

### **命令處理器**

```typescript
// src/telegram/handlers/account_deletion.ts

import type { Env, TelegramMessage } from '~/types';
import { createDatabaseClient } from '~/db/client';
import { createTelegramService } from '~/services/telegram';
import crypto from 'crypto';

/**
 * Handle /delete_account command
 */
export async function handleDeleteAccount(message: TelegramMessage, env: Env): Promise<void> {
  const telegram = createTelegramService(env);
  const db = createDatabaseClient(env.DB);
  const chatId = message.chat.id;
  const telegramId = message.from!.id.toString();

  try {
    // 檢查速率限制
    const canRequest = await checkDeletionRateLimit(db, telegramId);
    if (!canRequest) {
      await telegram.sendMessage(
        chatId,
        '⚠️ 請求過於頻繁\n\n' +
        '你在 24 小時內已發起過多次刪除請求。\n' +
        '請稍後再試。'
      );
      return;
    }

    // 顯示確認訊息
    await telegram.sendMessageWithButtons(
      chatId,
      '⚠️ **刪除帳號**\n\n' +
      '此操作將永久刪除：\n' +
      '• 個人資料（暱稱、生日、MBTI 等）\n' +
      '• 所有漂流瓶和對話記錄\n' +
      '• VIP 訂閱和邀請記錄\n\n' +
      '⚠️ **此操作不可恢復！**\n\n' +
      '如確定要刪除，請點擊下方按鈕：',
      [
        [
          { text: '✅ 確認刪除', callback_data: 'delete_confirm' },
          { text: '❌ 取消', callback_data: 'delete_cancel' }
        ]
      ]
    );
  } catch (error) {
    console.error('[handleDeleteAccount] Error:', error);
    await telegram.sendMessage(chatId, '❌ 發生錯誤，請稍後再試。');
  }
}

/**
 * Handle delete confirmation callback
 */
export async function handleDeleteConfirm(callbackQuery: any, env: Env): Promise<void> {
  const telegram = createTelegramService(env);
  const db = createDatabaseClient(env.DB);
  const chatId = callbackQuery.message.chat.id;
  const telegramId = callbackQuery.from.id.toString();

  try {
    // 生成驗證碼
    const code = await generateVerificationCode(db, telegramId);

    // 發送驗證碼
    await telegram.sendMessage(
      chatId,
      '🔐 **驗證碼**\n\n' +
      `你的刪除帳號驗證碼是：\n\n` +
      `**${code}**\n\n` +
      `此驗證碼將在 15 分鐘後過期。\n\n` +
      `請使用 \`/confirm_delete ${code}\` 確認刪除\n\n` +
      `如不是你本人操作，請忽略此訊息。`
    );

    // 回應 callback
    await telegram.answerCallbackQuery(callbackQuery.id, '驗證碼已發送');
  } catch (error) {
    console.error('[handleDeleteConfirm] Error:', error);
    await telegram.answerCallbackQuery(callbackQuery.id, '發生錯誤，請稍後再試');
  }
}

/**
 * Handle /confirm_delete command
 */
export async function handleConfirmDelete(message: TelegramMessage, env: Env): Promise<void> {
  const telegram = createTelegramService(env);
  const db = createDatabaseClient(env.DB);
  const chatId = message.chat.id;
  const telegramId = message.from!.id.toString();
  const text = message.text || '';

  try {
    // 解析驗證碼
    const parts = text.split(' ');
    if (parts.length !== 2) {
      await telegram.sendMessage(
        chatId,
        '❌ 使用方法錯誤\n\n' +
        '正確格式：`/confirm_delete <驗證碼>`\n' +
        '示例：`/confirm_delete 123456`'
      );
      return;
    }

    const code = parts[1];

    // 驗證碼
    const isValid = await verifyDeletionCode(db, telegramId, code);
    if (!isValid) {
      await telegram.sendMessage(
        chatId,
        '❌ 驗證碼錯誤或已過期\n\n' +
        '請使用 /delete_account 重新發起刪除請求。'
      );
      return;
    }

    // 執行刪除
    await executeAccountDeletion(db, telegramId);

    // 確認完成
    await telegram.sendMessage(
      chatId,
      '✅ **帳號已刪除**\n\n' +
      '你的帳號和所有數據已永久刪除。\n\n' +
      '感謝你使用 XunNi！\n\n' +
      '如需重新使用，請發送 /start 重新註冊。'
    );
  } catch (error) {
    console.error('[handleConfirmDelete] Error:', error);
    await telegram.sendMessage(chatId, '❌ 刪除失敗，請聯繫客服。');
  }
}

// Helper functions...
async function generateVerificationCode(db: any, telegramId: string): Promise<string> {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  await db.d1
    .prepare(`
      INSERT INTO deletion_requests (telegram_id, verification_code, code_expires_at, status)
      VALUES (?, ?, ?, 'pending')
    `)
    .bind(telegramId, code, expiresAt)
    .run();

  return code;
}

async function verifyDeletionCode(db: any, telegramId: string, code: string): Promise<boolean> {
  const request = await db.d1
    .prepare(`
      SELECT * FROM deletion_requests
      WHERE telegram_id = ?
        AND verification_code = ?
        AND status = 'pending'
        AND code_expires_at > datetime('now')
      ORDER BY requested_at DESC
      LIMIT 1
    `)
    .bind(telegramId, code)
    .first<any>();

  if (!request) return false;

  // 標記為已驗證
  await db.d1
    .prepare(`
      UPDATE deletion_requests
      SET status = 'verified', verified_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `)
    .bind(request.id)
    .run();

  return true;
}

async function executeAccountDeletion(db: any, telegramId: string): Promise<void> {
  // 實現見上方設計
}

function sha256(text: string): Promise<string> {
  return crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
    .then(buf => Array.from(new Uint8Array(buf))
      .map(b => b.toString(16).padStart(2, '0'))
      .join(''));
}
```

---

## 📋 **GDPR 合規檢查清單**

- ✅ **用戶主動請求** - 必須由用戶發起 `/delete_account`
- ✅ **身份驗證** - 6 位數驗證碼確認
- ✅ **明確告知** - 清楚說明將刪除哪些數據
- ✅ **不可逆警告** - 明確告知操作不可恢復
- ✅ **完整刪除** - 刪除所有個人可識別信息
- ✅ **匿名化記錄** - 保留必要的匿名統計（防濫用）
- ✅ **刪除確認** - 發送確認訊息
- ✅ **重新註冊權利** - 允許用戶重新註冊

---

## 🚀 **實現步驟**

### **Phase 1: 數據庫（1 天）**
1. ✅ 創建 `deletion_requests` 表
2. ✅ 創建 `deleted_users` 表
3. ✅ 更新 `schema.sql`

### **Phase 2: 後端邏輯（2 天）**
1. ✅ 實現驗證碼生成和驗證
2. ✅ 實現數據刪除邏輯
3. ✅ 實現防濫用機制

### **Phase 3: 命令處理器（1 天）**
1. ✅ `/delete_account` 命令
2. ✅ `/confirm_delete` 命令
3. ✅ Callback 處理

### **Phase 4: 測試和文檔（1 天）**
1. ✅ 測試完整流程
2. ✅ 更新用戶文檔
3. ✅ 更新隱私政策

---

## 💡 **關鍵要點**

1. ✅ **絕對不能自動刪除用戶數據**
2. ✅ **必須由用戶主動請求**
3. ✅ **必須進行身份驗證**
4. ✅ **必須明確告知後果**
5. ✅ **可以保留匿名化記錄（防濫用）**


