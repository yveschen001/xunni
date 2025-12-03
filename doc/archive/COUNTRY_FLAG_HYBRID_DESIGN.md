# 國旗顯示功能設計（混合方案）

**版本**：v2.0 - 默認推測 + 任務確認  
**創建時間**：2025-11-21  
**狀態**：設計階段，待實施

---

## 📋 功能概述

在用戶暱稱前顯示國旗 Emoji，採用「默認推測 + 任務確認」的混合方案：
1. 註冊時根據 `language_code` 自動設置默認國旗
2. 通過新手任務讓用戶確認/修正國家
3. 無法判斷時使用 🇺🇳（聯合國旗）
4. 用戶可隨時在設置中修改

---

## 🎯 核心邏輯

```
註冊 → 自動設置默認國旗（基於 language_code）
  ↓
完成基本資料 → 觸發「確認國家」任務
  ↓
用戶選擇：
  - ✅ 正確 → 確認，獲得 +1 瓶子
  - ❌ 不正確 → 選擇正確國家，獲得 +1 瓶子
  - 🌍 聯合國旗 → 不透露國家，獲得 +1 瓶子
  ↓
資料卡顯示確認後的國旗
```

---

## ✅ 方案優勢

### **對比其他方案**

| 方案 | 準確度 | 用戶體驗 | 隱私 | 實施難度 |
|------|--------|----------|------|----------|
| **純 language_code** | ⭐⭐☆☆☆ | ⭐⭐⭐⭐☆ | ✅ | ⭐☆☆☆☆ |
| **用戶主動選擇** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐☆☆ | ✅ | ⭐⭐⭐☆☆ |
| **混合方案（推薦）** | ⭐⭐⭐⭐☆ | ⭐⭐⭐⭐⭐ | ✅ | ⭐⭐⭐☆☆ |

### **核心優勢**

- ✅ **自動化**：註冊時自動設置，無需額外步驟
- ✅ **準確度高**：通過任務讓用戶確認/修正
- ✅ **用戶友好**：所有人都有國旗（默認或確認後）
- ✅ **隱私保護**：可選擇聯合國旗（不透露國家）
- ✅ **激勵機制**：確認國家獲得瓶子獎勵
- ✅ **符合 GDPR**：不收集 IP，用戶可控

### **解決的問題**

- ✅ **語言 ≠ 國家**：用戶可以修正（如中國用戶用英文版）
- ✅ **隱私考量**：可選擇聯合國旗
- ✅ **無法判斷**：默認使用聯合國旗
- ✅ **用戶參與**：通過任務系統引導用戶確認

---

## 📊 數據庫設計

### **Migration: 0045_add_country_to_users.sql**

```sql
-- 添加國家相關欄位到 users 表
ALTER TABLE users 
ADD COLUMN country_code TEXT DEFAULT NULL,           -- 國家代碼 (TW, US, JP, UN, etc.)
ADD COLUMN country_code_source TEXT DEFAULT 'auto',  -- 來源：'auto' 或 'manual'
ADD COLUMN country_confirmed INTEGER DEFAULT 0;      -- 是否已確認：0（未確認）1（已確認）

-- 創建索引
CREATE INDEX idx_users_country_code ON users(country_code);
CREATE INDEX idx_users_country_confirmed ON users(country_confirmed);
```

### **欄位說明**

| 欄位 | 類型 | 說明 | 示例 |
|------|------|------|------|
| `country_code` | TEXT | ISO 3166-1 alpha-2 國家代碼 | `TW`, `US`, `JP`, `UN` |
| `country_code_source` | TEXT | 來源：`auto`（自動推測）或 `manual`（用戶確認） | `auto`, `manual` |
| `country_confirmed` | INTEGER | 是否已確認：`0`（未確認）`1`（已確認） | `0`, `1` |

---

## 🔧 技術實現

### **1. 註冊時自動設置**

**文件**：`src/telegram/handlers/start.ts`

```typescript
import { getCountryCodeFromLanguage } from '~/utils/country_flag';

// 從 language_code 推測國家
const languageCode = message.from!.language_code || null;
const countryCode = getCountryCodeFromLanguage(languageCode) || 'UN'; // 無法判斷用 UN

// 創建用戶
await createUser(db, {
  telegram_id: telegramId,
  language_pref: languageCode || 'zh-TW',
  country_code: countryCode,           // 自動設置
  country_code_source: 'auto',         // 標記為自動
  country_confirmed: 0,                // 未確認
  // ... 其他欄位
});
```

---

### **2. 新手任務：確認國家**

#### **添加任務定義**

**文件**：`src/domain/missions.ts`

```typescript
export const MISSION_DEFINITIONS = [
  // ... 現有任務 ...
  
  {
    id: 'task_confirm_country',
    category: 'profile',
    name: '🌍 確認你的國家/地區',
    description: '讓其他用戶更了解你',
    reward_amount: 1,          // 獎勵 1 個瓶子
    reward_type: 'daily',      // 當天有效（一次性追加）
    sort_order: 4,             // 在「設定地區」之後
  },
];
```

#### **觸發確認流程**

**文件**：`src/telegram/handlers/onboarding_complete.ts`

```typescript
// 完成基本資料後
if (!user.country_confirmed) {
  await showCountryConfirmation(telegram, chatId, user);
}
```

---

### **3. 確認 UI**

**文件**：`src/telegram/handlers/country_confirmation.ts`

```typescript
import type { Env } from '~/types';
import { createTelegramService } from '~/services/telegram';
import { createDatabaseClient } from '~/db/client';
import { getCountryFlagEmoji, getCountryName } from '~/utils/country_flag';
import { completeMission } from '~/domain/missions';

/**
 * Show country confirmation dialog
 */
export async function showCountryConfirmation(
  telegram: TelegramService,
  chatId: number,
  user: User
): Promise<void> {
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
      { text: '🇺🇳 使用聯合國旗', callback_data: 'country_confirm_un' },
    ],
  ]);
}

/**
 * Handle country confirmation
 */
export async function handleCountryConfirm(
  callbackQuery: any,
  action: string,
  env: Env
): Promise<void> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const telegramId = callbackQuery.from.id.toString();
  const chatId = callbackQuery.message!.chat.id;
  
  if (action === 'yes') {
    // 確認當前國家
    await db.d1
      .prepare(`
        UPDATE users 
        SET country_confirmed = 1,
            country_code_source = 'manual'
        WHERE telegram_id = ?
      `)
      .bind(telegramId)
      .run();
    
    // 完成任務，獲得獎勵
    await completeUserTask(db, telegramId, 'task_confirm_country');
    
    await telegram.answerCallbackQuery(callbackQuery.id, '✅ 已確認！獲得 1 個瓶子');
    await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);
    await telegram.sendMessage(
      chatId,
      '✅ **國家已確認！**\n\n🎉 獲得 +1 瓶子（當天有效）\n\n繼續探索更多功能吧！'
    );
  } else if (action === 'un') {
    // 使用聯合國旗
    await db.d1
      .prepare(`
        UPDATE users 
        SET country_code = 'UN',
            country_confirmed = 1,
            country_code_source = 'manual'
        WHERE telegram_id = ?
      `)
      .bind(telegramId)
      .run();
    
    await completeUserTask(db, telegramId, 'task_confirm_country');
    
    await telegram.answerCallbackQuery(callbackQuery.id, '✅ 已設置為聯合國旗');
    await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);
    await telegram.sendMessage(
      chatId,
      '🇺🇳 **已設置為聯合國旗**\n\n🎉 獲得 +1 瓶子（當天有效）'
    );
  }
}
```

---

### **4. 國家選擇器**

**文件**：`src/telegram/handlers/country_selection.ts`

```typescript
/**
 * Show country selection menu
 */
export async function showCountrySelection(
  telegram: TelegramService,
  chatId: number
): Promise<void> {
  const message = 
    `🌍 **請選擇你的國家/地區**\n\n` +
    `💡 這將顯示在你的資料卡上\n` +
    `🇺🇳 如果找不到，可以選擇「聯合國旗」`;
  
  // 常用國家
  const popularCountries = [
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
      { text: '🌍 查看更多', callback_data: 'country_show_all' },
      { text: '🇺🇳 聯合國旗', callback_data: 'country_set_UN' },
    ],
  ];
  
  await telegram.sendMessageWithButtons(chatId, message, popularCountries);
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
  
  // 設置國家
  await db.d1
    .prepare(`
      UPDATE users 
      SET country_code = ?,
          country_confirmed = 1,
          country_code_source = 'manual'
      WHERE telegram_id = ?
    `)
    .bind(countryCode, telegramId)
    .run();
  
  // 完成任務
  await completeUserTask(db, telegramId, 'task_confirm_country');
  
  const flag = getCountryFlagEmoji(countryCode);
  const countryName = getCountryName(countryCode);
  
  await telegram.answerCallbackQuery(callbackQuery.id, `✅ 已設置為 ${flag} ${countryName}`);
  await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);
  await telegram.sendMessage(
    chatId,
    `${flag} **已設置為 ${countryName}**\n\n🎉 獲得 +1 瓶子（當天有效）`
  );
}
```

---

### **5. 工具函數更新**

**文件**：`src/utils/country_flag.ts`

```typescript
/**
 * Get country name from country code
 */
export function getCountryName(countryCode: string): string {
  const countryNames: Record<string, string> = {
    'TW': '台灣',
    'CN': '中國',
    'HK': '香港',
    'MO': '澳門',
    'SG': '新加坡',
    'US': '美國',
    'GB': '英國',
    'JP': '日本',
    'KR': '韓國',
    'FR': '法國',
    'DE': '德國',
    'IT': '意大利',
    'ES': '西班牙',
    'PT': '葡萄牙',
    'BR': '巴西',
    'MX': '墨西哥',
    'AR': '阿根廷',
    'CL': '智利',
    'CO': '哥倫比亞',
    'RU': '俄羅斯',
    'UA': '烏克蘭',
    'PL': '波蘭',
    'TR': '土耳其',
    'SA': '沙特阿拉伯',
    'AE': '阿聯酋',
    'EG': '埃及',
    'TH': '泰國',
    'VN': '越南',
    'ID': '印尼',
    'MY': '馬來西亞',
    'PH': '菲律賓',
    'IN': '印度',
    'PK': '巴基斯坦',
    'BD': '孟加拉',
    'AU': '澳洲',
    'NZ': '紐西蘭',
    'CA': '加拿大',
    'ZA': '南非',
    'IL': '以色列',
    'IR': '伊朗',
    'IQ': '伊拉克',
    'UN': '聯合國',
  };
  
  return countryNames[countryCode] || countryCode;
}

/**
 * Format nickname with country flag prefix
 */
export function formatNicknameWithFlag(
  nickname: string,
  countryCode: string | null | undefined
): string {
  if (!countryCode) {
    return `🇺🇳 ${nickname}`; // 默認聯合國旗
  }
  
  const flag = getCountryFlagEmoji(countryCode);
  return `${flag} ${nickname}`;
}
```

---

## 🎮 用戶體驗流程

### **場景 1：台灣用戶（語言設置正確）**

```
1. 註冊：language_code = 'zh-TW' → country_code = 'TW' 🇹🇼
2. 完成基本資料後：

   🌍 確認你的國家/地區
   
   我們根據你的語言設置，推測你來自：
   🇹🇼 台灣
   
   這正確嗎？
   
   [✅ 正確]  [❌ 不正確]
   [🇺🇳 使用聯合國旗]

3. 點擊「✅ 正確」
4. ✅ 已確認！獲得 +1 瓶子
5. 資料卡顯示：🇹🇼 張**
```

---

### **場景 2：中國用戶使用英文版**

```
1. 註冊：language_code = 'en-US' → country_code = 'US' 🇺🇸
2. 完成基本資料後：

   🌍 確認你的國家/地區
   
   我們根據你的語言設置，推測你來自：
   🇺🇸 美國
   
   這正確嗎？
   
   [✅ 正確]  [❌ 不正確]
   [🇺🇳 使用聯合國旗]

3. 點擊「❌ 不正確」
4. 顯示國家選擇器：

   🌍 請選擇你的國家/地區
   
   [🇹🇼 台灣]  [🇨🇳 中國]  [🇭🇰 香港]
   [🇺🇸 美國]  [🇯🇵 日本]  [🇰🇷 韓國]
   ...

5. 選擇「🇨🇳 中國」
6. 🇨🇳 已設置為中國！獲得 +1 瓶子
7. 資料卡顯示：🇨🇳 李**
```

---

### **場景 3：不想透露國家的用戶**

```
1. 註冊：language_code = 'ja' → country_code = 'JP' 🇯🇵
2. 完成基本資料後：

   🌍 確認你的國家/地區
   
   我們根據你的語言設置，推測你來自：
   🇯🇵 日本
   
   這正確嗎？
   
   [✅ 正確]  [❌ 不正確]
   [🇺🇳 使用聯合國旗]

3. 點擊「🇺🇳 使用聯合國旗」
4. 🇺🇳 已設置為聯合國旗！獲得 +1 瓶子
5. 資料卡顯示：🇺🇳 田中**
```

---

## 📋 實施步驟

### **Phase 1：基礎功能**
1. [ ] 更新 `src/utils/country_flag.ts` 工具函數
   - 添加 `getCountryName()` 函數
   - 更新 `formatNicknameWithFlag()` 邏輯
2. [ ] 創建數據庫 Migration（`0045_add_country_to_users.sql`）
3. [ ] 更新用戶註冊邏輯（`src/telegram/handlers/start.ts`）
   - 自動設置 `country_code`
   - 設置 `country_code_source = 'auto'`
   - 設置 `country_confirmed = 0`

### **Phase 2：任務系統**
4. [ ] 添加「確認國家」任務到 `src/domain/missions.ts`
5. [ ] 創建 `src/telegram/handlers/country_confirmation.ts`
   - `showCountryConfirmation()` - 顯示確認對話框
   - `handleCountryConfirm()` - 處理確認操作
6. [ ] 創建 `src/telegram/handlers/country_selection.ts`
   - `showCountrySelection()` - 顯示國家選擇器
   - `handleCountrySet()` - 處理國家設置
7. [ ] 在 `src/router.ts` 添加路由
   - `country_confirm_yes`
   - `country_confirm_un`
   - `country_select`
   - `country_set_XX`

### **Phase 3：UI 集成**
8. [ ] 修改資料卡顯示（`src/telegram/handlers/conversation_actions.ts`）
9. [ ] 修改對話歷史（`src/services/conversation_history.ts`）
10. [ ] 修改統計頁面（`src/telegram/handlers/stats.ts`）
11. [ ] 修改邀請列表（`src/telegram/handlers/invite.ts`）

### **Phase 4：設置頁面**
12. [ ] 在設置中添加「修改國家」選項
13. [ ] 允許用戶隨時修改國家設置

### **Phase 5：測試和部署**
14. [ ] 編寫單元測試（`tests/country_flag.test.ts`）
15. [ ] Staging 環境測試
16. [ ] Production 部署

---

## 🧪 測試計劃

### **單元測試**

```typescript
// tests/country_flag.test.ts

describe('Country Flag - Hybrid Approach', () => {
  it('should auto-set country from language_code on registration', () => {
    const countryCode = getCountryCodeFromLanguage('zh-TW');
    expect(countryCode).toBe('TW');
  });
  
  it('should use UN flag for unknown languages', () => {
    const countryCode = getCountryCodeFromLanguage('unknown');
    expect(countryCode).toBeNull();
    
    const flag = getCountryFlagEmoji(countryCode || 'UN');
    expect(flag).toBe('🇺🇳');
  });
  
  it('should format nickname with flag', () => {
    expect(formatNicknameWithFlag('張三', 'TW')).toBe('🇹🇼 張三');
    expect(formatNicknameWithFlag('John', 'US')).toBe('🇺🇸 John');
    expect(formatNicknameWithFlag('匿名', null)).toBe('🇺🇳 匿名');
  });
});
```

---

## 🎉 預期效果

### **資料卡**
```
👤 對方的資料卡

━━━━━━━━━━━━━━━━
📝 暱稱：🇹🇼 張**
🗣️ 語言：繁體中文
🧠 MBTI：INFP
⭐ 星座：處女座
━━━━━━━━━━━━━━━━

💡 這是匿名資料卡
```

### **對話歷史**
```
💬 與 🇯🇵 田中** 的對話記錄

[10:30] 你：你好！
[10:31] 對方：こんにちは！
```

### **統計頁面**
```
📊 你的統計數據

👥 邀請的用戶：
1. 🇺🇸 John** (已激活)
2. 🇰🇷 김** (已激活)
3. 🇺🇳 匿名** (未激活)
```

---

## 🔒 隱私和安全

### **隱私保護**
- ✅ 不收集 IP 地址
- ✅ 用戶可選擇聯合國旗（不透露國家）
- ✅ 用戶可隨時修改國家設置
- ✅ 符合 GDPR 規範

### **數據安全**
- ✅ 國家代碼存儲在數據庫中
- ✅ 不與第三方分享
- ✅ 用戶可以刪除或修改

---

## 📝 文檔更新

### **需要更新的文檔**
1. `doc/SPEC.md` - 添加國旗顯示功能說明
2. `doc/DEVELOPMENT_STANDARDS.md` - 添加國旗工具函數使用規範
3. `doc/ONBOARDING_TUTORIAL_AND_MISSION_SYSTEM.md` - 添加「確認國家」任務

---

## 🎯 總結

### **方案特點**
- ✅ **自動化 + 用戶確認**：最佳平衡
- ✅ **高準確度**：用戶主動確認
- ✅ **用戶友好**：所有人都有國旗
- ✅ **隱私保護**：可選擇聯合國旗
- ✅ **激勵機制**：確認獲得瓶子

### **實施難度**
- ⭐⭐⭐☆☆（中等）
- 需要數據庫 Migration
- 需要集成任務系統
- 需要修改多個顯示邏輯

### **預計時間**
- 開發：4-5 小時
- 測試：1-2 小時
- 部署：30 分鐘
- **總計：5-7 小時**

---

**創建時間**：2025-11-21  
**狀態**：設計階段，待實施  
**推薦度**：⭐⭐⭐⭐⭐

