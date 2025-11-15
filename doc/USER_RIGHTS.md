# XunNi 使用者權利與資料刪除

## 1. 概述

提供使用者資料刪除功能，符合資料保護要求，同時保留必要的安全審計記錄。

---

## 2. 使用者權利

### 2.1 資料刪除權

**功能**：
- 使用者可以要求刪除自己的資料
- 提供 `/delete_me` 指令
- 標記使用者為刪除狀態
- 清除個人資料欄位
- 保留安全審計記錄（脫敏）

### 2.2 資料存取權（可選）

**功能**：
- 使用者可以要求匯出自己的資料
- 提供 `/export_data` 指令（可選）
- 匯出格式：JSON

---

## 3. /delete_me 功能設計

### 3.1 刪除流程

```
使用者發送 /delete_me
→ Bot 提示刪除後果
→ 使用者確認刪除
→ 標記使用者為 'deleted'
→ 清除個人資料欄位
→ 保留安全審計記錄（脫敏）
→ 通知使用者「已刪除」
```

### 3.2 刪除提示

```
Bot：⚠️ 確定要刪除帳號嗎？

刪除後：
- 所有個人資料將被清除
- 無法恢復帳號
- 無法使用任何功能
- 安全審計記錄將保留（用於安全目的）

[✅ 確定刪除] [❌ 取消]
```

### 3.3 深度確認

```
使用者點擊「確定刪除」

Bot：⚠️ 最後確認

刪除帳號是不可逆的操作！
請輸入「刪除」確認：

[輸入「刪除」]
```

### 3.4 刪除完成

```
使用者輸入「刪除」

Bot：✅ 帳號已刪除

你的個人資料已被清除。
感謝使用 XunNi！
```

---

## 4. 資料刪除邏輯

### 4.1 刪除範圍

**清除的資料**：
- nickname → '[已刪除]'
- avatar_url → NULL
- language_pref → NULL
- prefer_gender → NULL
- onboarding_state → NULL
- 其他個人資料欄位

**保留的資料**：
- telegram_id（用於識別）
- role（管理員角色）
- risk_score（安全審計）
- created_at（註冊時間）
- deleted_at（刪除時間）

**安全審計記錄**：
- reports（舉報記錄，脫敏）
- bans（封禁記錄）
- admin_actions（管理操作記錄）

### 4.2 資料脫敏

**脫敏規則**：
- 個人資料欄位清除
- 安全審計記錄保留，但不顯示個人資訊
- 統計資料保留（用於統計，不顯示個人資訊）

---

## 5. 實作範例

### 5.1 刪除功能

```typescript
// src/telegram/handlers/delete_me.ts

export async function handleDeleteMe(
  userId: string,
  env: Env,
  db: D1Database
): Promise<void> {
  // 1. 檢查使用者是否存在
  const user = await db.getUser(userId);
  if (!user) {
    await sendMessage(env, userId, '❌ 使用者不存在');
    return;
  }
  
  // 2. 檢查是否已刪除
  if (user.deleted_at) {
    await sendMessage(env, userId, '⚠️ 帳號已刪除');
    return;
  }
  
  // 3. 標記為刪除
  await db.prepare(`
    UPDATE users
    SET 
      nickname = '[已刪除]',
      avatar_url = NULL,
      language_pref = NULL,
      prefer_gender = NULL,
      onboarding_state = NULL,
      deleted_at = datetime('now'),
      updated_at = datetime('now')
    WHERE telegram_id = ?
  `).bind(userId).run();
  
  // 4. 清除相關資料（可選）
  // - 清除對話記錄（可選）
  // - 清除漂流瓶（可選）
  // - 保留安全審計記錄
  
  // 5. 通知使用者
  await sendMessage(env, userId, '✅ 帳號已刪除\n\n你的個人資料已被清除。感謝使用 XunNi！');
}
```

---

## 6. 資料庫 Schema 更新

### 6.1 users 表更新

```sql
-- 新增欄位
ALTER TABLE users ADD COLUMN deleted_at DATETIME;
ALTER TABLE users ADD COLUMN deletion_requested_at DATETIME;
ALTER TABLE users ADD COLUMN anonymized_at DATETIME;
```

### 6.2 刪除記錄表（可選）

```sql
CREATE TABLE user_deletions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT,
  deleted_at DATETIME,
  reason TEXT,              -- 刪除原因（可選）
  retention_period INTEGER, -- 保留期限（天數）
  created_at DATETIME
);
```

---

## 7. 管理員功能

### 7.1 手動刪除（管理員）

**功能**：
- 管理員可以手動刪除使用者資料
- 記錄刪除操作（admin_actions）
- 保留安全審計記錄

**指令**：
```
/admin_delete_user {user_id}
```

---

## 8. 注意事項

1. **不可逆操作**：刪除後無法恢復
2. **安全審計**：保留安全審計記錄（reports, bans）
3. **統計資料**：保留統計資料（用於統計，不顯示個人資訊）
4. **匿名化**：確保匿名化後無法識別使用者
5. **合規要求**：符合資料保護要求（GDPR、CCPA 等）

---

## 9. 測試要點

1. **刪除功能測試**：
   - 刪除後個人資料是否清除
   - 安全審計記錄是否保留
   - 統計資料是否保留

2. **匿名化測試**：
   - 匿名化後是否無法識別使用者
   - 安全審計記錄是否脫敏

3. **恢復測試**：
   - 刪除後是否無法恢復
   - 刪除後是否無法使用功能

---

## 10. 法律合規

### 10.1 GDPR 合規（如適用）

- 資料刪除權
- 資料可攜權（可選）
- 資料存取權（可選）

### 10.2 CCPA 合規（如適用）

- 資料刪除權
- 資料存取權（可選）

### 10.3 其他地區

- 根據當地法律要求實作
- 保留必要的安全審計記錄

