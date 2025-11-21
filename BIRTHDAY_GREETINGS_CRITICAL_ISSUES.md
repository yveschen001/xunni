# 生日祝福功能 - 關鍵問題分析

> **日期**：2025-11-21  
> **狀態**：❌ 發現 4 個關鍵問題需要解決

---

## 🚨 問題總覽

| # | 問題 | 當前狀態 | 影響 | 優先級 |
|---|------|---------|------|--------|
| 1 | i18n 多語言支持 | ⚠️ 部分實現 | 中 | P1 |
| 2 | 用戶時區處理 | ❌ 未實現 | 高 | P0 |
| 3 | 24小時隊列限制 | ❌ 未實現 | 高 | P0 |
| 4 | 瓶子推送優先級 | ❌ 未實現 | 高 | P0 |

---

## 📋 問題詳情

### 問題 1: i18n 多語言支持

**當前狀態：** ⚠️ 部分實現
- ✅ 資料庫有 `language_pref` 欄位
- ✅ i18n 系統已建立（20 種語言）
- ❌ 生日祝福訊息寫死為中文

**問題：**
```typescript
// 當前實現（寫死中文）
const message = `🎂 生日快樂，${nickname}！

今天是你的特別日子！
${zodiacText}你，在這個美好的日子裡，
願你的每一天都充滿陽光和歡笑！
...`;
```

**解決方案：**
```typescript
// 使用 i18n 系統
import { createI18n } from '~/i18n';

const i18n = createI18n(user.language_pref);
const message = i18n.t('birthday.greeting', {
  nickname: user.nickname,
  zodiac: zodiacText,
  pronoun: pronoun
});
```

**工作量：** 2 小時
- 新增 i18n keys（20 種語言）
- 修改 `generateBirthdayMessage()`
- 測試多語言

---

### 問題 2: 用戶時區處理 ⚠️ **最關鍵**

**當前狀態：** ❌ 未實現
- ❌ 資料庫沒有 `timezone` 欄位
- ❌ 生日判斷使用 UTC 時間
- ❌ 無法判斷用戶當地時間的生日

**問題場景：**
```
用戶 A（台灣，UTC+8）：
- 生日：2000-01-01
- 當地時間：2025-01-01 09:00（生日當天）
- UTC 時間：2025-01-01 01:00
- Cron 執行時間：01:00 UTC（09:00 台灣時間）
- ✅ 正確發送

用戶 B（美國西岸，UTC-8）：
- 生日：2000-01-01
- 當地時間：2024-12-31 17:00（生日前一天）
- UTC 時間：2025-01-01 01:00
- Cron 執行時間：01:00 UTC
- ❌ 錯誤：提前 7 小時發送

用戶 C（日本，UTC+9）：
- 生日：2000-01-01
- 當地時間：2025-01-01 10:00（生日當天）
- UTC 時間：2025-01-01 01:00
- Cron 執行時間：01:00 UTC
- ✅ 正確發送（但時間太早）
```

**當前 SQL 查詢（錯誤）：**
```sql
-- 使用 UTC 日期判斷（不考慮時區）
WHERE strftime('%m-%d', birthday) = strftime('%m-%d', 'now')
```

**正確做法：**

**選項 A：存儲時區 + 動態計算（推薦）**
```sql
-- 1. 添加 timezone 欄位
ALTER TABLE users ADD COLUMN timezone TEXT DEFAULT 'UTC';

-- 2. 根據時區計算當地日期
WHERE strftime('%m-%d', birthday) = strftime('%m-%d', datetime('now', timezone_offset))
```

**選項 B：多次 Cron 執行（簡單但不精確）**
```yaml
# 每 3 小時執行一次，覆蓋所有時區
crons:
  - "0 0,3,6,9,12,15,18,21 * * *"
```

**選項 C：從 country_code 推測時區（不準確）**
```typescript
// 從國家代碼推測主要時區
const timezone = getTimezoneFromCountry(user.country_code);
```

**推薦方案：** 選項 A（存儲時區）
- ✅ 最準確
- ✅ 用戶可自行設置
- ❌ 需要 Migration
- ❌ 需要收集時區信息

**工作量：** 8 小時
- Migration（添加 timezone 欄位）
- 收集時區邏輯（從 Telegram 或 country_code）
- 修改生日判斷 SQL
- 測試多時區場景

---

### 問題 3: 24小時隊列限制

**當前狀態：** ❌ 未實現
- ❌ 沒有隊列超時檢查
- ❌ 沒有放棄機制

**問題場景：**
```
假設：
- 今天有 10,000 個用戶生日
- 發送速度：25 msg/batch, 1s delay
- 預估時間：10,000 / 25 * 1s = 400 秒 = 6.7 分鐘

實際情況：
- 如果有 100,000 個用戶生日
- 預估時間：100,000 / 25 * 1s = 4,000 秒 = 66 分鐘

極端情況：
- 如果有 1,000,000 個用戶生日
- 預估時間：1,000,000 / 25 * 1s = 40,000 秒 = 11 小時
- ❌ 問題：24 小時內發不完
```

**解決方案：**

**選項 A：設置最大發送數量（推薦）**
```typescript
const MAX_BIRTHDAY_GREETINGS_PER_DAY = 10000;

if (userIds.length > MAX_BIRTHDAY_GREETINGS_PER_DAY) {
  console.log(`[BirthdayGreetings] Too many users (${userIds.length}), limiting to ${MAX_BIRTHDAY_GREETINGS_PER_DAY}`);
  
  // 優先級排序：VIP > 活躍用戶 > 新用戶
  const prioritizedUsers = await prioritizeUsers(userIds);
  userIds = prioritizedUsers.slice(0, MAX_BIRTHDAY_GREETINGS_PER_DAY);
}
```

**選項 B：設置超時時間**
```typescript
const MAX_EXECUTION_TIME_MS = 10 * 60 * 1000; // 10 分鐘
const startTime = Date.now();

for (let i = 0; i < usersToSend.length; i += batchSize) {
  // 檢查超時
  if (Date.now() - startTime > MAX_EXECUTION_TIME_MS) {
    console.log('[BirthdayGreetings] Timeout reached, stopping...');
    break;
  }
  
  // ... 發送邏輯 ...
}
```

**選項 C：使用 Cloudflare Queue（最佳但複雜）**
```typescript
// 將所有生日用戶推入 Queue
for (const user of users) {
  await env.BIRTHDAY_QUEUE.send({
    telegramId: user.telegram_id,
    message: generateBirthdayMessage(user)
  });
}

// Queue Consumer 慢慢處理（24 小時內）
```

**推薦方案：** 選項 A（設置最大數量）
- ✅ 簡單實現
- ✅ 可控制成本
- ✅ 優先級排序
- ❌ 部分用戶收不到

**工作量：** 4 小時
- 實現優先級排序
- 添加最大數量限制
- 記錄未發送用戶
- 測試大量用戶場景

---

### 問題 4: 瓶子推送優先級

**當前狀態：** ❌ 未實現
- ❌ 生日祝福和瓶子推送使用相同速率限制
- ❌ 沒有優先級機制
- ❌ 可能影響核心功能

**問題場景：**
```
時間線：
09:00 - Cron 觸發生日祝福（開始發送 10,000 條）
09:05 - 用戶 A 丟瓶子（需要通知匹配用戶）
09:05 - ❌ 問題：生日祝福佔用了 Telegram API 配額
09:05 - ❌ 結果：瓶子通知延遲或失敗

影響：
- 核心功能（瓶子匹配）被次要功能（生日祝福）阻塞
- 用戶體驗下降（匹配通知延遲）
- 可能導致 429 錯誤（速率限制）
```

**解決方案：**

**選項 A：降低生日祝福速率（推薦）**
```typescript
// 生日祝福使用更保守的速率
const BIRTHDAY_BATCH_SIZE = 10; // 降低批次大小（原 25）
const BIRTHDAY_DELAY_MS = 2000; // 增加延遲（原 1000ms）

// 預估：10,000 用戶 = 10,000 / 10 * 2s = 2,000s = 33 分鐘
```

**選項 B：錯峰發送（推薦）**
```yaml
# 在用戶活躍度低的時間發送
crons:
  - "0 3 * * *"  # 03:00 UTC（11:00 台灣時間，活躍度低）
```

**選項 C：使用獨立 API Token（最佳但需額外成本）**
```typescript
// 生日祝福使用獨立 Bot Token
const birthdayBot = createTelegramService({
  botToken: env.BIRTHDAY_BOT_TOKEN // 獨立 Token
});

// 核心功能使用主 Bot Token
const mainBot = createTelegramService({
  botToken: env.BOT_TOKEN
});
```

**選項 D：使用 Cloudflare Queue（最佳但複雜）**
```typescript
// 生日祝福推入低優先級 Queue
await env.BIRTHDAY_QUEUE.send(message, {
  priority: 'low'
});

// 瓶子通知推入高優先級 Queue
await env.NOTIFICATION_QUEUE.send(message, {
  priority: 'high'
});
```

**推薦方案：** 選項 A + B（降低速率 + 錯峰發送）
- ✅ 簡單實現
- ✅ 不影響核心功能
- ✅ 無額外成本
- ❌ 發送時間較長

**工作量：** 2 小時
- 調整批次大小和延遲
- 修改 Cron 時間
- 測試不同時段

---

## 🎯 建議實施順序

### Phase 1: 緊急修復（必須）
1. **問題 4：瓶子推送優先級**（2 小時）
   - 降低生日祝福速率
   - 錯峰發送（改為 03:00 UTC）

2. **問題 3：24小時隊列限制**（4 小時）
   - 設置最大發送數量（10,000）
   - 優先級排序（VIP > 活躍 > 新用戶）

### Phase 2: 重要改進（建議）
3. **問題 1：i18n 多語言支持**（2 小時）
   - 新增 i18n keys
   - 修改訊息生成邏輯

### Phase 3: 長期優化（可選）
4. **問題 2：用戶時區處理**（8 小時）
   - Migration（添加 timezone 欄位）
   - 收集時區邏輯
   - 修改生日判斷 SQL

---

## 📊 風險評估

| 問題 | 不修復的風險 | 修復成本 | 建議 |
|------|-------------|---------|------|
| 問題 1 (i18n) | 中 - 非中文用戶體驗差 | 低 | ✅ 建議修復 |
| 問題 2 (時區) | 高 - 發送時間不準確 | 高 | ⚠️ 暫緩，先用簡化方案 |
| 問題 3 (隊列) | 高 - 大量用戶時崩潰 | 中 | ✅ 必須修復 |
| 問題 4 (優先級) | 高 - 影響核心功能 | 低 | ✅ 必須修復 |

---

## 🚀 簡化方案（推薦）

### 時區問題的簡化方案

**不添加 timezone 欄位，使用以下策略：**

1. **多次 Cron 執行**（覆蓋主要時區）
```yaml
# 每 8 小時執行一次，覆蓋全球主要時區
crons:
  - "0 0 * * *"   # 00:00 UTC (08:00 台灣)
  - "0 8 * * *"   # 08:00 UTC (16:00 台灣)
  - "0 16 * * *"  # 16:00 UTC (00:00 台灣)
```

2. **防止重複發送**（已實現）
```typescript
// 使用 birthday_greetings_log 表
// sent_at >= date('now') 確保一天只發送一次
```

3. **用戶可接受的誤差**
- 最大誤差：±8 小時
- 大部分用戶：±4 小時內
- 可接受度：高（生日祝福不需要精確到小時）

**優點：**
- ✅ 無需 Migration
- ✅ 無需收集時區
- ✅ 簡單實現
- ✅ 覆蓋全球用戶

**缺點：**
- ❌ 時間不精確
- ❌ 增加 Cron 執行次數

---

## ✅ 最終建議

### 立即實施（Phase 1）
1. ✅ 降低生日祝福速率（BATCH_SIZE = 10, DELAY = 2s）
2. ✅ 錯峰發送（改為 03:00 UTC）
3. ✅ 設置最大發送數量（10,000）
4. ✅ 優先級排序（VIP > 活躍 > 新用戶）
5. ✅ 新增 i18n 支持（20 種語言）

### 暫緩實施（Phase 3）
6. ⏳ 時區處理（使用簡化方案：多次 Cron）

---

**預估總工作量：** 8 小時（Phase 1）

**狀態：** ⚠️ 需要用戶確認是否繼續實施

---

**報告者**：AI Assistant  
**日期**：2025-11-21

