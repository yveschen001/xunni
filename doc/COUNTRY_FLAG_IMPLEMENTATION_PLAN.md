# 國旗顯示功能實施計劃

**版本**：v1.0 - 完全對齊現有任務系統  
**創建時間**：2025-11-21  
**狀態**：實施計劃

---

## 🎯 核心原則

**⚠️ 重要：完全復用現有實現，不創造新東西**

1. ✅ 使用現有的 `tasks` 表
2. ✅ 使用現有的 `user_tasks` 表
3. ✅ 使用現有的 `isTaskCompleted()` 函數
4. ✅ 使用現有的 `checkAndCompleteTask()` 函數
5. ✅ 使用現有的 `completeTask()` (alias: `completeUserTask`)
6. ✅ 使用現有的任務完成提示格式

---

## 📊 現有任務系統分析

### **1. 任務定義（`tasks` 表）**

```sql
CREATE TABLE tasks (
  id TEXT PRIMARY KEY,                      -- 'task_interests', 'task_bio', etc.
  category TEXT NOT NULL,                   -- 'profile' / 'social' / 'action' / 'invite'
  name TEXT NOT NULL,                       -- '填寫興趣標籤'
  description TEXT NOT NULL,                -- '讓別人更了解你'
  reward_amount INTEGER NOT NULL,           -- 1 (瓶子數量)
  reward_type TEXT NOT NULL,                -- 'daily' (當天有效) / 'permanent' (永久)
  sort_order INTEGER DEFAULT 0,             -- 排序順序
  is_enabled INTEGER DEFAULT 1,             -- 是否啟用
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
```

### **2. 用戶任務（`user_tasks` 表）**

```sql
CREATE TABLE user_tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,                    -- telegram_id
  task_id TEXT NOT NULL,                    -- 'task_interests'
  status TEXT NOT NULL,                     -- 'available' / 'pending_claim' / 'completed'
  completed_at TEXT,                        -- ISO 8601 timestamp
  reward_claimed INTEGER DEFAULT 0,         -- 0 / 1
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE(user_id, task_id)
);
```

### **3. 任務完成檢查（`src/domain/task.ts`）**

```typescript
export function isTaskCompleted(taskId: string, user: User, additionalData?: {
  bottleCount?: number;
  catchCount?: number;
  conversationCount?: number;
}): boolean {
  switch (taskId) {
    case 'task_interests':
      return !!user.interests && user.interests.length > 0;
    
    case 'task_bio':
      return !!user.bio && user.bio.length > 0;
    
    case 'task_city':
      return !!user.city && user.city.length > 0;
    
    // ... 其他任務
    
    default:
      return false;
  }
}
```

### **4. 任務完成流程（`src/telegram/handlers/tasks.ts`）**

```typescript
export async function checkAndCompleteTask(
  db: DatabaseClient,
  telegram: TelegramService,
  user: User,
  taskId: string,
  additionalData?: { ... }
): Promise<boolean> {
  // 1. 檢查是否已完成
  const userTask = await getUserTask(db, user.telegram_id, taskId);
  if (userTask?.status === 'completed') {
    return false;
  }
  
  // 2. 檢查完成條件
  const completed = isTaskCompleted(taskId, user, additionalData);
  if (!completed) {
    return false;
  }
  
  // 3. 標記為完成
  await completeUserTask(db, user.telegram_id, taskId);
  
  // 4. 獲取任務詳情
  const task = await getTaskById(db, taskId);
  
  // 5. 發送完成提示
  await telegram.sendMessage(
    parseInt(user.telegram_id),
    `🎉 恭喜完成任務「${task.name}」！\n\n` +
    `獎勵：+${task.reward_amount} 瓶子（${task.reward_type === 'daily' ? '當天有效' : '永久有效'}）\n\n` +
    `💡 使用 /tasks 查看任務中心`
  );
  
  return true;
}
```

### **5. 完成任務函數（`src/db/queries/user_tasks.ts`）**

```typescript
// 實際函數名稱
export async function completeTask(
  db: DatabaseClient,
  userId: string,
  taskId: string
): Promise<void> {
  await upsertUserTask(db, userId, taskId, 'completed', true);
}

// 在 tasks.ts 中的別名
import { completeTask as completeUserTask } from '~/db/queries/user_tasks';
```

---

## ✅ 國旗任務實施計劃

### **Step 1：添加任務到 `tasks` 表**

**Migration: `0046_add_country_confirmation_task.sql`**

```sql
-- Add country confirmation task
INSERT INTO tasks (id, category, name, description, reward_amount, reward_type, sort_order, is_enabled)
VALUES ('task_confirm_country', 'profile', '🌍 確認你的國家/地區', '讓其他用戶更了解你', 1, 'daily', 4, 1);
```

**說明**：
- `id`: `task_confirm_country` - 遵循現有命名規範
- `category`: `'profile'` - 個人資料類別
- `sort_order`: `4` - 在 `task_city` (3) 之後
- `reward_amount`: `1` - 1 個瓶子
- `reward_type`: `'daily'` - 當天有效

---

### **Step 2：添加 `country_code` 到 `users` 表**

**Migration: `0045_add_country_to_users.sql`**

```sql
-- Add country-related columns to users table
ALTER TABLE users 
ADD COLUMN country_code TEXT DEFAULT NULL;           -- ISO 3166-1 alpha-2 (TW, US, JP, UN)

-- Add index for country queries
CREATE INDEX idx_users_country_code ON users(country_code);
```

**說明**：
- 只需要 `country_code` 一個欄位
- 不需要 `country_code_source` 和 `country_confirmed`（過度設計）
- 簡單就好：有值 = 已確認，沒值 = 未確認

---

### **Step 3：註冊時自動設置默認國旗**

**文件**：`src/telegram/handlers/start.ts`

```typescript
import { getCountryCodeFromLanguage } from '~/utils/country_flag';

// 在創建用戶時
const languageCode = message.from!.language_code || null;
const countryCode = getCountryCodeFromLanguage(languageCode) || 'UN';

await createUser(db, {
  telegram_id: telegramId,
  language_pref: languageCode || 'zh-TW',
  country_code: countryCode,  // 自動設置默認國旗
  // ... 其他欄位
});
```

---

### **Step 4：添加任務完成檢查**

**文件**：`src/domain/task.ts`

```typescript
export function isTaskCompleted(taskId: string, user: User, additionalData?: {
  bottleCount?: number;
  catchCount?: number;
  conversationCount?: number;
}): boolean {
  switch (taskId) {
    case 'task_interests':
      return !!user.interests && user.interests.length > 0;
    
    case 'task_bio':
      return !!user.bio && user.bio.length > 0;
    
    case 'task_city':
      return !!user.city && user.city.length > 0;
    
    // 🆕 添加國旗確認檢查
    case 'task_confirm_country':
      return !!user.country_code;  // 有設置 country_code 就算完成
    
    case 'task_first_bottle':
      return (additionalData?.bottleCount || 0) > 0;
    
    // ... 其他任務
    
    default:
      return false;
  }
}
```

---

### **Step 5：創建國旗確認 UI**

**文件**：`src/telegram/handlers/country_confirmation.ts`

```typescript
import type { Env } from '~/types';
import { createTelegramService } from '~/services/telegram';
import { createDatabaseClient } from '~/db/client';
import { getCountryFlagEmoji, getCountryName } from '~/utils/country_flag';
import { checkAndCompleteTask } from './tasks';  // ✅ 復用現有函數
import { findUserByTelegramId } from '~/db/queries/users';

/**
 * Show country confirmation dialog
 */
export async function showCountryConfirmation(
  chatId: number,
  user: User,
  env: Env
): Promise<void> {
  const telegram = createTelegramService(env);
  const currentFlag = getCountryFlagEmoji(user.country_code || 'UN');
  const currentCountry = getCountryName(user.country_code || 'UN');
  
  const message = 
    `🌍 **確認你的國家/地區**\n\n` +
    `我們根據你的語言設置，推測你來自：\n` +
    `${currentFlag} **${currentCountry}**\n\n` +
    `這正確嗎？\n\n` +
    `💡 這將顯示在你的資料卡上，讓其他用戶更了解你。\n` +
    `🎉 確認後可獲得 +1 瓶子獎勵！`;
  
  await telegram.sendMessageWithButtons(chatId, message, [
    [
      { text: '✅ 正確', callback_data: 'country_confirm_yes' },
      { text: '❌ 不正確', callback_data: 'country_select' },
    ],
    [
      { text: '🇺🇳 使用聯合國旗', callback_data: 'country_set_UN' },
    ],
  ]);
}

/**
 * Handle country confirmation (user confirms current country)
 */
export async function handleCountryConfirmYes(
  callbackQuery: any,
  env: Env
): Promise<void> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const telegramId = callbackQuery.from.id.toString();
  const chatId = callbackQuery.message!.chat.id;
  
  // 獲取用戶信息
  const user = await findUserByTelegramId(db, telegramId);
  if (!user) {
    await telegram.answerCallbackQuery(callbackQuery.id, '❌ 用戶不存在');
    return;
  }
  
  // ✅ 使用現有的 checkAndCompleteTask 函數
  // country_code 已經有值，所以 isTaskCompleted 會返回 true
  const completed = await checkAndCompleteTask(
    db,
    telegram,
    user,
    'task_confirm_country'
  );
  
  if (completed) {
    await telegram.answerCallbackQuery(callbackQuery.id, '✅ 已確認！');
    await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);
  } else {
    await telegram.answerCallbackQuery(callbackQuery.id, '❌ 確認失敗');
  }
}

/**
 * Handle country selection
 */
export async function handleCountrySet(
  callbackQuery: any,
  countryCode: string,
  env: Env
): Promise<void> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const telegramId = callbackQuery.from.id.toString();
  const chatId = callbackQuery.message!.chat.id;
  
  // 更新 country_code
  await db.d1
    .prepare(`UPDATE users SET country_code = ? WHERE telegram_id = ?`)
    .bind(countryCode, telegramId)
    .run();
  
  // 重新獲取用戶信息
  const user = await findUserByTelegramId(db, telegramId);
  if (!user) {
    await telegram.answerCallbackQuery(callbackQuery.id, '❌ 用戶不存在');
    return;
  }
  
  // ✅ 使用現有的 checkAndCompleteTask 函數
  const completed = await checkAndCompleteTask(
    db,
    telegram,
    user,
    'task_confirm_country'
  );
  
  if (completed) {
    const flag = getCountryFlagEmoji(countryCode);
    const countryName = getCountryName(countryCode);
    await telegram.answerCallbackQuery(callbackQuery.id, `✅ 已設置為 ${flag} ${countryName}`);
    await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);
  } else {
    await telegram.answerCallbackQuery(callbackQuery.id, '❌ 設置失敗');
  }
}
```

---

### **Step 6：創建國家選擇器**

**文件**：`src/telegram/handlers/country_selection.ts`

```typescript
import type { Env } from '~/types';
import { createTelegramService } from '~/services/telegram';

/**
 * Show country selection menu
 */
export async function showCountrySelection(
  chatId: number,
  env: Env
): Promise<void> {
  const telegram = createTelegramService(env);
  
  const message = 
    `🌍 **請選擇你的國家/地區**\n\n` +
    `💡 這將顯示在你的資料卡上\n` +
    `🇺🇳 如果找不到，可以選擇「聯合國旗」`;
  
  const buttons = [
    [
      { text: '🇹🇼 台灣', callback_data: 'country_set_TW' },
      { text: '🇨🇳 中國', callback_data: 'country_set_CN' },
      { text: '🇭🇰 香港', callback_data: 'country_set_HK' },
    ],
    [
      { text: '🇺🇸 美國', callback_data: 'country_set_US' },
      { text: '🇯🇵 日本', callback_data: 'country_set_JP' },
      { text: '🇰🇷 韓國', callback_data: 'country_set_KR' },
    ],
    [
      { text: '🇬🇧 英國', callback_data: 'country_set_GB' },
      { text: '🇫🇷 法國', callback_data: 'country_set_FR' },
      { text: '🇩🇪 德國', callback_data: 'country_set_DE' },
    ],
    [
      { text: '🇸🇬 新加坡', callback_data: 'country_set_SG' },
      { text: '🇲🇾 馬來西亞', callback_data: 'country_set_MY' },
      { text: '🇹🇭 泰國', callback_data: 'country_set_TH' },
    ],
    [
      { text: '🇦🇺 澳洲', callback_data: 'country_set_AU' },
      { text: '🇨🇦 加拿大', callback_data: 'country_set_CA' },
      { text: '🇳🇿 紐西蘭', callback_data: 'country_set_NZ' },
    ],
    [
      { text: '🇺🇳 聯合國旗', callback_data: 'country_set_UN' },
    ],
  ];
  
  await telegram.sendMessageWithButtons(chatId, message, buttons);
}
```

---

### **Step 7：添加路由**

**文件**：`src/router.ts`

```typescript
// 在 callback_query 處理中添加
if (data === 'country_confirm_yes') {
  const { handleCountryConfirmYes } = await import('./telegram/handlers/country_confirmation');
  await handleCountryConfirmYes(callbackQuery, env);
  return;
}

if (data === 'country_select') {
  const { showCountrySelection } = await import('./telegram/handlers/country_selection');
  await showCountrySelection(callbackQuery.message!.chat.id, env);
  await telegram.answerCallbackQuery(callbackQuery.id);
  return;
}

if (data.startsWith('country_set_')) {
  const countryCode = data.replace('country_set_', '');
  const { handleCountrySet } = await import('./telegram/handlers/country_confirmation');
  await handleCountrySet(callbackQuery, countryCode, env);
  return;
}
```

---

### **Step 8：觸發確認流程**

**在完成基本資料後觸發**

**選項 1：在 `/tasks` 命令中自動顯示**

用戶打開任務中心時，如果 `task_confirm_country` 未完成，自動顯示確認對話框。

**選項 2：在完成其他資料任務後提示**

當用戶完成 `task_city` 後，自動提示確認國家。

**推薦：選項 1**（更簡單，用戶主動）

---

## 📋 實施步驟總結

### **Phase 1：數據庫和工具函數**
1. [ ] 創建 Migration `0045_add_country_to_users.sql`
2. [ ] 創建 Migration `0046_add_country_confirmation_task.sql`
3. [ ] 確保 `src/utils/country_flag.ts` 已完成（已有）

### **Phase 2：任務系統集成**
4. [ ] 修改 `src/domain/task.ts` - 添加 `task_confirm_country` 檢查
5. [ ] 修改 `src/telegram/handlers/start.ts` - 註冊時設置默認國旗
6. [ ] 創建 `src/telegram/handlers/country_confirmation.ts`
7. [ ] 創建 `src/telegram/handlers/country_selection.ts`
8. [ ] 修改 `src/router.ts` - 添加路由

### **Phase 3：UI 集成**
9. [ ] 修改資料卡顯示（`src/telegram/handlers/conversation_actions.ts`）
10. [ ] 修改對話歷史（`src/services/conversation_history.ts`）
11. [ ] 修改統計頁面（`src/telegram/handlers/stats.ts`）

### **Phase 4：測試和部署**
12. [ ] 執行 Migration（staging）
13. [ ] 測試任務完成流程
14. [ ] 測試國旗顯示
15. [ ] Production 部署

---

## ✅ 關鍵點檢查

- [x] ✅ 使用現有的 `tasks` 表
- [x] ✅ 使用現有的 `user_tasks` 表
- [x] ✅ 使用現有的 `isTaskCompleted()` 函數
- [x] ✅ 使用現有的 `checkAndCompleteTask()` 函數
- [x] ✅ 使用現有的 `completeTask()` 函數
- [x] ✅ 使用現有的任務完成提示格式
- [x] ✅ 不創造新的數據結構
- [x] ✅ 不創造新的完成邏輯
- [x] ✅ 完全對齊現有實現

---

## 🎉 總結

**核心原則**：
1. ✅ **復用現有系統**：不創造新東西
2. ✅ **簡單設計**：只添加必要的欄位和邏輯
3. ✅ **保持一致**：完全遵循現有模式

**預計時間**：
- 開發：3-4 小時
- 測試：1 小時
- 部署：30 分鐘
- **總計：4-5 小時**

---

**創建時間**：2025-11-21  
**狀態**：實施計劃，完全對齊現有系統

