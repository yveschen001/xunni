# 系統廣播優化方案 - 不影響瓶子推送

> **日期**：2025-11-21  
> **基於**：`doc/PUSH_NOTIFICATIONS.md` + `doc/BROADCAST_SYSTEM_DESIGN.md` + `doc/archive/BROADCAST_SYSTEM_REDESIGN.md`  
> **目標**：確保所有官方廣播（生日祝福、系統通知）不影響正常瓶子推送

---

## 📋 問題總覽

### 當前狀況

| 類型 | 當前速率 | 問題 | 影響 |
|------|---------|------|------|
| **瓶子通知** | 25 msg/batch, 1s delay | ✅ 正常 | 無 |
| **廣播** | 25 msg/batch, 1s delay | ❌ 共用配額 | **阻塞瓶子** |
| **生日祝福** | 25 msg/batch, 1s delay | ❌ 共用配額 | **阻塞瓶子** |

### Telegram API 限制

- **總配額**：30 messages/second
- **當前使用**：所有訊息共用配額
- **問題**：廣播時會佔用瓶子通知的配額

---

## 🎯 優化目標

1. ✅ **瓶子通知優先**：確保瓶子匹配通知不被延遲
2. ✅ **廣播不阻塞**：廣播使用剩餘配額
3. ✅ **錯峰發送**：在用戶活躍度低的時間發送
4. ✅ **速率限制**：降低廣播速率
5. ✅ **i18n 支持**：所有廣播使用多語言
6. ✅ **時區處理**：簡化方案（多次 Cron）
7. ✅ **隊列限制**：設置最大發送數量

---

## 🏗️ 優化方案

### 方案 A：降低廣播速率 + 錯峰發送（推薦）✅

**基於現有架構，無需重構**

#### 1. 降低廣播速率

```typescript
// src/domain/broadcast.ts

export function calculateBatchSize(
  totalUsers: number,
  priority: 'high' | 'low' = 'high' // 新增優先級參數
): {
  batchSize: number;
  batchCount: number;
  delayMs: number;
} {
  // 高優先級（瓶子通知）：25 msg/batch, 1s delay = 25 msg/sec
  if (priority === 'high') {
    const batchSize = Math.min(25, totalUsers);
    const batchCount = Math.ceil(totalUsers / batchSize);
    const delayMs = 1000;
    return { batchSize, batchCount, delayMs };
  }
  
  // 低優先級（廣播、生日祝福）：10 msg/batch, 2s delay = 5 msg/sec
  const batchSize = Math.min(10, totalUsers);
  const batchCount = Math.ceil(totalUsers / batchSize);
  const delayMs = 2000;
  return { batchSize, batchCount, delayMs };
}
```

**效果：**
- 瓶子通知：25 msg/sec（保持不變）
- 廣播：5 msg/sec（降低 80%）
- 總配額：30 msg/sec（符合 Telegram 限制）

#### 2. 錯峰發送

```yaml
# wrangler.toml

# 生日祝福：在用戶活躍度低的時間發送
[[env.production.triggers.crons]]
cron = "0 3 * * *"  # 03:00 UTC（11:00 台灣時間，活躍度低）

# 多次執行覆蓋全球時區
[[env.production.triggers.crons]]
cron = "0 11 * * *"  # 11:00 UTC（19:00 台灣時間）

[[env.production.triggers.crons]]
cron = "0 19 * * *"  # 19:00 UTC（03:00 台灣時間）
```

**效果：**
- 避開用戶活躍時段（09:00-22:00 台灣時間）
- 覆蓋全球主要時區（±8 小時誤差）
- 防止重複發送（`birthday_greetings_log` 表）

#### 3. 設置最大發送數量

```typescript
// src/cron/birthday_greetings.ts

const MAX_BIRTHDAY_GREETINGS_PER_DAY = 10000;

// 優先級排序：VIP > 活躍用戶 > 新用戶
async function prioritizeUsers(
  db: ReturnType<typeof createDatabaseClient>,
  userIds: string[]
): Promise<string[]> {
  const users = await db.d1
    .prepare(
      `SELECT telegram_id, is_vip, last_active_at, created_at
       FROM users
       WHERE telegram_id IN (${userIds.map(() => '?').join(', ')})
       ORDER BY 
         is_vip DESC,                                    -- VIP 優先
         last_active_at DESC,                            -- 活躍用戶優先
         created_at ASC                                  -- 老用戶優先
       LIMIT ?`
    )
    .bind(...userIds, MAX_BIRTHDAY_GREETINGS_PER_DAY)
    .all<{ telegram_id: string }>();
  
  return users.results?.map(u => u.telegram_id) || [];
}
```

**效果：**
- 最多發送 10,000 條/天
- VIP 用戶優先收到
- 預估時間：10,000 / 5 msg/sec = 2,000s ≈ 33 分鐘

#### 4. i18n 多語言支持

```typescript
// src/i18n/locales/zh-TW.ts

export const zhTW = {
  // ... 現有 keys ...
  
  birthday: {
    greeting: `🎂 **生日快樂，{{nickname}}！**

今天是你的特別日子！
{{zodiac}}你，在這個美好的日子裡，
願你的每一天都充滿陽光和歡笑！

🎁 **生日驚喜**
作為生日禮物，我們為你準備了特別的祝福！

💌 **給自己的禮物**
不如丟個漂流瓶給遠方的{{pronoun}}，
祝自己生日快樂，也許會收到意外的驚喜哦！

願你在 XunNi 找到更多有趣的靈魂，
遇見更多美好的緣分！

再次祝你生日快樂！🎉`,
  },
};
```

```typescript
// src/cron/birthday_greetings.ts

function generateBirthdayMessage(
  user: { nickname: string; zodiac: string | null; gender: string; language_pref: string }
): string {
  const i18n = createI18n(user.language_pref);
  const pronoun = user.gender === 'female' ? i18n.t('common.she') : i18n.t('common.he');
  const zodiacText = user.zodiac && ZODIAC_MAP[user.zodiac] 
    ? `${ZODIAC_MAP[user.zodiac]}的` 
    : '';
  
  return i18n.t('birthday.greeting', {
    nickname: user.nickname,
    zodiac: zodiacText,
    pronoun: pronoun
  });
}
```

---

### 方案 B：優先級隊列系統（未來升級）⏳

**需要重構，參考 `BROADCAST_SYSTEM_REDESIGN.md`**

#### 架構

```
┌─────────────────────────────────────────────────────────┐
│                     Telegram Bot API                     │
│                  (30 messages/second)                    │
└─────────────────────────────────────────────────────────┘
                            ▲
                            │
        ┌───────────────────┴───────────────────┐
        │                                       │
┌───────┴────────┐                   ┌─────────┴────────┐
│  High Priority │                   │  Low Priority    │
│  Queue (瓶子)  │                   │  Queue (廣播)    │
│  Max: 20/sec   │                   │  Max: 10/sec     │
└────────────────┘                   └──────────────────┘
```

#### 優先級

| 優先級 | 類型 | 配額 | 說明 |
|--------|------|------|------|
| **High** | 瓶子通知 | 20 msg/sec | 用戶互動，需要即時 |
| **Medium** | 系統通知 | 5 msg/sec | VIP 到期、配額重置 |
| **Low** | 廣播訊息 | 5 msg/sec | 管理員廣播、生日祝福 |

**優點：**
- ✅ 完全隔離
- ✅ 動態調整
- ✅ 可擴展到百萬級

**缺點：**
- ❌ 需要重構
- ❌ 需要 Cloudflare Queue（額外成本）
- ❌ 開發時間長（2-3 週）

---

## 📊 性能對比

### 方案 A（推薦）

| 場景 | 瓶子通知 | 廣播 | 總配額 | 是否阻塞 |
|------|---------|------|--------|---------|
| 無廣播 | 25 msg/sec | 0 | 25 msg/sec | ❌ 否 |
| 有廣播 | 25 msg/sec | 5 msg/sec | 30 msg/sec | ❌ 否 |
| 高峰期 | 25 msg/sec | 0 msg/sec | 25 msg/sec | ❌ 否（錯峰） |

### 方案 B（未來）

| 場景 | 瓶子通知 | 廣播 | 總配額 | 是否阻塞 |
|------|---------|------|--------|---------|
| 無廣播 | 20 msg/sec | 0 | 20 msg/sec | ❌ 否 |
| 有廣播 | 20 msg/sec | 10 msg/sec | 30 msg/sec | ❌ 否 |
| 高峰期 | 20 msg/sec | 10 msg/sec | 30 msg/sec | ❌ 否（動態調整） |

---

## 🚀 實施計劃

### Phase 1: 緊急優化（立即實施）- 8 小時

#### 1.1 修改 `calculateBatchSize()` - 2 小時

**文件：** `src/domain/broadcast.ts`

```typescript
export function calculateBatchSize(
  totalUsers: number,
  priority: 'high' | 'low' = 'high'
): {
  batchSize: number;
  batchCount: number;
  delayMs: number;
} {
  if (priority === 'high') {
    // 瓶子通知：25 msg/batch, 1s delay
    const batchSize = Math.min(25, totalUsers);
    const batchCount = Math.ceil(totalUsers / batchSize);
    const delayMs = 1000;
    return { batchSize, batchCount, delayMs };
  }
  
  // 廣播：10 msg/batch, 2s delay
  const batchSize = Math.min(10, totalUsers);
  const batchCount = Math.ceil(totalUsers / batchSize);
  const delayMs = 2000;
  return { batchSize, batchCount, delayMs };
}
```

#### 1.2 修改廣播服務 - 1 小時

**文件：** `src/services/broadcast.ts`

```typescript
async function processBroadcast(env: Env, broadcastId: number): Promise<void> {
  // ... 現有代碼 ...
  
  // 使用低優先級速率
  const { batchSize, delayMs } = calculateBatchSize(userIds.length, 'low');
  
  // ... 其餘代碼不變 ...
}
```

#### 1.3 修改生日祝福 - 3 小時

**文件：** `src/cron/birthday_greetings.ts`

```typescript
// 1. 添加優先級排序
async function prioritizeUsers(
  db: ReturnType<typeof createDatabaseClient>,
  userIds: string[]
): Promise<string[]> {
  // ... 實現優先級排序 ...
}

// 2. 設置最大數量
const MAX_BIRTHDAY_GREETINGS_PER_DAY = 10000;

if (userIds.length > MAX_BIRTHDAY_GREETINGS_PER_DAY) {
  userIds = await prioritizeUsers(db, userIds);
}

// 3. 使用低優先級速率
const { batchSize, delayMs } = calculateBatchSize(usersToSend.length, 'low');

// 4. 添加 i18n 支持
const message = generateBirthdayMessage(user);
```

#### 1.4 修改 Cron 時間 - 1 小時

**文件：** `wrangler.toml`

```toml
# 生日祝福：錯峰發送（3 次/天，覆蓋全球時區）
[[env.production.triggers.crons]]
cron = "0 3 * * *"  # 03:00 UTC

[[env.production.triggers.crons]]
cron = "0 11 * * *"  # 11:00 UTC

[[env.production.triggers.crons]]
cron = "0 19 * * *"  # 19:00 UTC
```

#### 1.5 添加 i18n keys - 1 小時

**文件：** `src/i18n/locales/zh-TW.ts`, `src/i18n/locales/en.ts`, etc.

```typescript
// 為 20 種語言添加生日祝福 keys
birthday: {
  greeting: `...`,
}
```

---

### Phase 2: 測試和部署 - 4 小時

#### 2.1 單元測試 - 2 小時

```typescript
// tests/domain/broadcast.test.ts

describe('calculateBatchSize', () => {
  it('should use high priority for bottle notifications', () => {
    const result = calculateBatchSize(1000, 'high');
    expect(result.batchSize).toBe(25);
    expect(result.delayMs).toBe(1000);
  });
  
  it('should use low priority for broadcasts', () => {
    const result = calculateBatchSize(1000, 'low');
    expect(result.batchSize).toBe(10);
    expect(result.delayMs).toBe(2000);
  });
});
```

#### 2.2 手動測試 - 1 小時

- [ ] 測試瓶子通知（確保速率不變）
- [ ] 測試廣播（確認降低速率）
- [ ] 測試生日祝福（確認錯峰發送）
- [ ] 測試 i18n（確認多語言）

#### 2.3 部署 - 1 小時

```bash
# 1. 執行 Migration
npx wrangler d1 execute DB --env=staging --remote --file=src/db/migrations/0051_create_birthday_greetings_log.sql

# 2. 部署到 Staging
pnpm deploy:staging

# 3. 監控 Logs
# 4. 部署到 Production
pnpm deploy:production
```

---

## 📊 預期效果

### 性能提升

| 指標 | 優化前 | 優化後 | 改善 |
|------|--------|--------|------|
| **瓶子通知延遲** | 0-10s（廣播時） | 0-1s | ✅ 90% |
| **廣播速率** | 25 msg/sec | 5 msg/sec | ⚠️ -80% |
| **生日祝福時間** | 隨機 | 錯峰（03:00/11:00/19:00 UTC） | ✅ 避開高峰 |
| **最大發送數** | 無限制 | 10,000/天 | ✅ 可控 |

### 用戶體驗

| 場景 | 優化前 | 優化後 |
|------|--------|--------|
| **丟瓶子後收到通知** | 0-10s | 0-1s |
| **生日祝福** | 中文固定 | 多語言個性化 |
| **生日祝福時間** | 隨機 | 當地時間±8小時 |

---

## ✅ 總結

### 立即實施（Phase 1）

1. ✅ 修改 `calculateBatchSize()`（添加優先級）
2. ✅ 修改廣播服務（使用低優先級）
3. ✅ 修改生日祝福（優先級排序 + 最大數量 + i18n）
4. ✅ 修改 Cron 時間（錯峰發送）
5. ✅ 添加 i18n keys（20 種語言）

### 未來升級（Phase 2）

6. ⏳ 實施優先級隊列系統（參考 `BROADCAST_SYSTEM_REDESIGN.md`）
7. ⏳ 使用 Cloudflare Queue
8. ⏳ 動態速率調整

---

## 📝 檢查清單

### 開發

- [ ] 修改 `src/domain/broadcast.ts`（添加 priority 參數）
- [ ] 修改 `src/services/broadcast.ts`（使用 'low' priority）
- [ ] 修改 `src/cron/birthday_greetings.ts`（優先級排序 + 最大數量 + i18n）
- [ ] 修改 `wrangler.toml`（錯峰 Cron）
- [ ] 添加 i18n keys（20 種語言）
- [ ] 編寫單元測試

### 測試

- [ ] 測試瓶子通知（確保速率不變）
- [ ] 測試廣播（確認降低速率）
- [ ] 測試生日祝福（確認錯峰發送）
- [ ] 測試 i18n（確認多語言）
- [ ] 測試優先級排序
- [ ] 測試最大數量限制

### 部署

- [ ] 執行 Migration（Staging）
- [ ] 部署到 Staging
- [ ] 手動測試
- [ ] 監控 Logs
- [ ] 執行 Migration（Production）
- [ ] 部署到 Production
- [ ] 監控 Logs

---

**預估總工作量**：12 小時（Phase 1 + Phase 2）

**狀態**：✅ 準備實施

---

**報告者**：AI Assistant  
**日期**：2025-11-21  
**基於**：現有規劃文檔 + 用戶需求

