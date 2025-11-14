# XunNi 主動推送與召回機制

## 1. 概述

設計智能的主動推送機制，在合適的時機提醒使用者，提高活躍度，同時避免打擾使用者。

---

## 2. 推送策略

### 2.1 核心原則

- **不打擾**：避免過度推送
- **有價值**：推送內容對使用者有意義
- **個性化**：根據使用者行為調整推送時機
- **可控制**：使用者可選擇關閉推送

### 2.2 推送時機判斷

#### 2.2.1 丟瓶提醒

**觸發條件**：
- 使用者超過 24 小時未丟瓶
- 使用者今日還有剩餘配額
- 使用者未在封禁狀態
- 使用者已完成 onboarding

**推送頻率**：
- 每天最多 1 次
- 如果使用者連續 3 天未回應，暫停推送 2 天

**推送內容**：
```
🌊 嗨～今天還沒丟漂流瓶呢！

你還有 {remaining} 個配額可以用
說不定有人在等你哦～ 💫

[📦 現在就丟一個] [稍後提醒我]
```

#### 2.2.2 撿瓶提醒

**觸發條件**：
- 使用者超過 12 小時未撿瓶
- 系統中有符合條件的瓶子
- 使用者未在封禁狀態

**推送頻率**：
- 每天最多 2 次（上午、下午各一次）

**推送內容**：
```
🔍 發現新的漂流瓶！

有 {count} 個瓶子在等你撿起
說不定會遇到有趣的人哦～ ✨

[🔍 去撿瓶子] [稍後提醒我]
```

#### 2.2.3 對話提醒

**觸發條件**：
- 使用者有未讀訊息的對話
- 超過 2 小時未回覆

**推送頻率**：
- 每 4 小時最多 1 次
- 同一對話最多提醒 2 次

**推送內容**：
```
💬 有人回覆你了！

你有 {count} 個未讀訊息
快去看看是誰吧～ 👀

[💬 查看對話] [稍後提醒我]
```

---

## 3. 智能推送算法

### 3.1 使用者活躍度分級

```typescript
enum UserActivityLevel {
  VERY_ACTIVE = 'very_active',    // 每天使用
  ACTIVE = 'active',              // 每週使用 3+ 次
  MODERATE = 'moderate',          // 每週使用 1-2 次
  INACTIVE = 'inactive',         // 超過 7 天未使用
  DORMANT = 'dormant'            // 超過 30 天未使用
}
```

### 3.2 推送頻率調整

| 活躍度 | 丟瓶提醒 | 撿瓶提醒 | 對話提醒 |
|--------|---------|---------|---------|
| VERY_ACTIVE | 不推送 | 不推送 | 僅未讀提醒 |
| ACTIVE | 48 小時 | 24 小時 | 4 小時 |
| MODERATE | 24 小時 | 12 小時 | 2 小時 |
| INACTIVE | 12 小時 | 6 小時 | 1 小時 |
| DORMANT | 不推送 | 不推送 | 不推送 |

### 3.3 使用者偏好設定

```sql
CREATE TABLE user_push_preferences (
  user_id TEXT PRIMARY KEY,
  throw_reminder_enabled INTEGER DEFAULT 1,
  catch_reminder_enabled INTEGER DEFAULT 1,
  message_reminder_enabled INTEGER DEFAULT 1,
  quiet_hours_start INTEGER DEFAULT 22,  -- 22:00
  quiet_hours_end INTEGER DEFAULT 8,    -- 08:00
  timezone TEXT DEFAULT 'UTC',
  updated_at DATETIME
);
```

---

## 4. 資料庫設計

### 4.1 push_notifications（推送記錄）

```sql
CREATE TABLE push_notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT,
  notification_type TEXT,         -- 'throw_reminder' / 'catch_reminder' / 'message_reminder'
  content TEXT,
  status TEXT,                   -- 'sent' / 'dismissed' / 'clicked'
  sent_at DATETIME,
  clicked_at DATETIME,
  dismissed_at DATETIME
);

CREATE INDEX idx_push_notifications_user_id ON push_notifications(user_id);
CREATE INDEX idx_push_notifications_sent_at ON push_notifications(sent_at);
```

### 4.2 push_schedule（推送排程）

```sql
CREATE TABLE push_schedule (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT,
  notification_type TEXT,
  scheduled_at DATETIME,
  status TEXT,                   -- 'pending' / 'sent' / 'cancelled'
  created_at DATETIME
);

CREATE INDEX idx_push_schedule_user_id ON push_schedule(user_id);
CREATE INDEX idx_push_schedule_scheduled_at ON push_schedule(scheduled_at);
```

---

## 5. Cron 任務設計

### 5.1 /cron/push_reminders（推送提醒）

每小時執行一次：

```typescript
// src/telegram/handlers/cron_push.ts

export async function handlePushReminders(
  env: Env,
  db: D1Database
): Promise<void> {
  const now = new Date();
  
  // 1. 找出需要推送的使用者
  const usersToNotify = await db.prepare(`
    SELECT u.*, p.throw_reminder_enabled, p.catch_reminder_enabled
    FROM users u
    LEFT JOIN user_push_preferences p ON u.telegram_id = p.user_id
    WHERE u.onboarding_completed_at IS NOT NULL
      AND u.risk_score < 50
      AND NOT EXISTS (
        SELECT 1 FROM bans b
        WHERE b.user_id = u.telegram_id
          AND b.ban_end > datetime('now')
      )
  `).all();
  
  for (const user of usersToNotify.results) {
    const activityLevel = await getUserActivityLevel(user.telegram_id, db);
    const preferences = await getUserPushPreferences(user.telegram_id, db);
    
    // 檢查安靜時段
    if (isQuietHours(now, preferences)) {
      continue;
    }
    
    // 丟瓶提醒
    if (shouldSendThrowReminder(user, activityLevel, db)) {
      await sendThrowReminder(env, user, db);
    }
    
    // 撿瓶提醒
    if (shouldSendCatchReminder(user, activityLevel, db)) {
      await sendCatchReminder(env, user, db);
    }
    
    // 對話提醒
    if (shouldSendMessageReminder(user, activityLevel, db)) {
      await sendMessageReminder(env, user, db);
    }
  }
}
```

---

## 6. 推送內容設計

### 6.1 丟瓶提醒（多種版本）

**版本 1（溫和）**：
```
🌊 今天還沒丟漂流瓶呢～

你還有 {remaining} 個配額
說不定有人在等你哦 💫

[📦 現在就丟] [稍後提醒]
```

**版本 2（鼓勵）**：
```
✨ 新的開始，新的相遇

今天還沒丟漂流瓶？
也許會遇到特別的人哦～

[📦 丟一個試試] [稍後提醒]
```

**版本 3（數據驅動）**：
```
📊 你的數據

總共丟了 {total} 個瓶子
配對成功 {matches} 次

今天要不要再試試？ 🎯

[📦 丟瓶子] [稍後提醒]
```

### 6.2 互動按鈕

所有推送都包含：
- **主要行動按鈕**：直接執行操作（丟瓶/撿瓶/查看對話）
- **稍後提醒**：設定 2 小時後再提醒
- **關閉提醒**：今天不再提醒

---

## 7. 避免打擾機制

### 7.1 推送限制規則

1. **每日上限**：每個使用者每天最多收到 3 條推送
2. **間隔限制**：同一類型推送間隔至少 4 小時
3. **回應追蹤**：如果使用者連續 3 次點擊「稍後提醒」，暫停該類型推送 24 小時
4. **關閉選項**：使用者可完全關閉某類推送

### 7.2 安靜時段

- 預設：22:00 - 08:00（使用者當地時間）
- 使用者可自訂
- 安靜時段內不發送非緊急推送

### 7.3 推送效果追蹤

```typescript
// 追蹤推送效果
interface PushNotificationMetrics {
  sent: number;
  clicked: number;
  dismissed: number;
  conversionRate: number; // 點擊後實際完成操作的比例
}

// 根據效果調整策略
if (metrics.conversionRate < 0.1) {
  // 轉化率低於 10%，減少該類型推送頻率
  adjustPushFrequency(type, -20);
}
```

---

## 8. 使用者控制

### 8.1 /settings（設定）

```
⚙️ 推送設定

📦 丟瓶提醒：{enabled ? '✅ 開啟' : '❌ 關閉'}
🔍 撿瓶提醒：{enabled ? '✅ 開啟' : '❌ 關閉'}
💬 對話提醒：{enabled ? '✅ 開啟' : '❌ 關閉'}

🌙 安靜時段：{start} - {end}
   在此時段內不會收到推送

[修改設定] [返回]
```

---

## 9. 最佳實踐

1. **A/B 測試**：測試不同推送內容的效果
2. **個性化**：根據使用者行為調整推送內容
3. **數據驅動**：根據推送效果持續優化
4. **使用者反饋**：收集使用者對推送的意見
5. **尊重選擇**：提供簡單的關閉選項

---

## 10. 注意事項

1. **成本控制**：推送會消耗 Telegram API 配額，需控制頻率
2. **隱私保護**：推送內容不包含敏感資訊
3. **錯誤處理**：處理使用者已封鎖 Bot 的情況
4. **監控告警**：監控推送失敗率，及時處理問題

