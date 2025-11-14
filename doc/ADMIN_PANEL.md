# XunNi 管理後台設計

## 1. 概述

管理後台提供給 **god**（上帝）和 **angel**（天使）角色使用，透過 Telegram Bot 指令進行運營管理。

### 1.1 角色權限

| 功能 | user | admin | angel | god |
|------|------|-------|-------|-----|
| 查看運營數據 | ❌ | ✅ | ✅ | ✅ |
| 手動封禁/解封 | ❌ | ✅ | ✅ | ✅ |
| 手動升級 VIP | ❌ | ❌ | ✅ | ✅ |
| 群發訊息 | ❌ | ❌ | ✅ | ✅ |
| 查看申訴 | ❌ | ✅ | ✅ | ✅ |
| 審核申訴 | ❌ | ✅ | ✅ | ✅ |
| 查看所有使用者 | ❌ | ❌ | ❌ | ✅ |
| 無條件群發 | ❌ | ❌ | ❌ | ✅ |

---

## 2. 管理指令

### 2.1 /admin（管理主選單）

顯示管理功能選單：

```
🔧 管理後台

📊 運營數據
👤 使用者管理
🚫 封禁管理
⭐ VIP 管理
📢 群發訊息
📝 申訴審核
```

### 2.2 /admin_stats（運營數據統計）

顯示關鍵運營指標：

```
📊 運營數據統計

👥 使用者數據
├─ 總註冊數：{totalUsers}
├─ 活躍使用者（7天）：{activeUsers7d}
├─ 活躍使用者（30天）：{activeUsers30d}
└─ 完成 Onboarding：{completedOnboarding}

💰 收入數據
├─ 本月收入：{monthlyRevenue} Stars (≈ ${usdAmount})
├─ 總收入：{totalRevenue} Stars
├─ 當前訂閱數：{activeSubscriptions}
├─ 本月新增訂閱：{newSubscriptionsThisMonth}
└─ 本月退款：{refundsThisMonth} Stars

📦 使用數據
├─ 今日丟瓶數：{throwsToday}
├─ 今日撿瓶數：{catchesToday}
├─ 活躍對話數：{activeConversations}
└─ 平均每日丟瓶：{avgThrowsPerDay}

🎯 VIP 數據
├─ VIP 總數：{totalVips}
├─ 有效 VIP：{activeVips}
├─ VIP 轉化率：{vipConversionRate}%
└─ 平均 VIP 時長：{avgVipDuration} 天

📈 邀請數據
├─ 總邀請數：{totalInvites}
├─ 已激活邀請：{activatedInvites}
└─ 邀請激活率：{inviteActivationRate}%
```

**數據來源**：

```typescript
// src/domain/stats.ts

export interface StatsData {
  users: {
    total: number;
    active7d: number;
    active30d: number;
    completedOnboarding: number;
  };
  revenue: {
    monthlyRevenue: number; // Stars
    totalRevenue: number; // Stars
    activeSubscriptions: number;
    newSubscriptionsThisMonth: number;
    refundsThisMonth: number; // Stars
  };
  usage: {
    throwsToday: number;
    catchesToday: number;
    activeConversations: number;
    avgThrowsPerDay: number;
  };
  vip: {
    totalVips: number;
    activeVips: number;
    vipConversionRate: number; // %
    avgVipDuration: number; // days
  };
  invites: {
    totalInvites: number;
    activatedInvites: number;
    inviteActivationRate: number; // %
  };
}

export async function getStatsData(db: D1Database): Promise<StatsData> {
  // 實作統計查詢
}
```

### 2.3 /admin_user（使用者管理）

#### 2.3.1 搜尋使用者

```
👤 使用者管理

請輸入：
1. Telegram ID
2. 暱稱（部分匹配）
3. 邀請碼

或使用指令：
/admin_user_search {query}
```

#### 2.3.2 使用者詳情

```
👤 使用者詳情

ID: {telegram_id}
暱稱: {nickname}
角色: {role}
VIP: {isVip ? '✅ 是' : '❌ 否'}
VIP 到期: {vip_expire_at || '無'}

📊 數據
├─ 註冊時間: {created_at}
├─ 丟瓶總數: {totalThrows}
├─ 撿瓶總數: {totalCatches}
├─ 邀請數: {activated_invites}
└─ 風險分數: {risk_score}

[封禁] [解封] [升級 VIP] [查看對話]
```

### 2.4 /admin_ban（封禁管理）

#### 2.4.1 手動封禁

```
🚫 手動封禁使用者

請輸入：
1. Telegram ID: {telegram_id}
2. 封禁時長（小時）: {hours}
3. 原因: {reason}

指令格式：
/admin_ban {telegram_id} {hours} {reason}

範例：
/admin_ban 123456789 24 違規行為
```

#### 2.4.2 解封

```
🔓 解封使用者

請輸入 Telegram ID 或使用：
/admin_unban {telegram_id}
```

#### 2.4.3 封禁列表

```
🚫 當前封禁列表

{user_id} - 到期時間: {ban_end} - 原因: {reason}
[解封] [延長] [查看詳情]
```

### 2.5 /admin_vip（VIP 管理）

#### 2.5.1 手動升級 VIP

```
⭐ 手動升級 VIP

請輸入：
1. Telegram ID: {telegram_id}
2. 時長（天數）: {days}

指令格式：
/admin_vip_add {telegram_id} {days}

範例：
/admin_vip_add 123456789 30
```

#### 2.5.2 取消 VIP

```
❌ 取消 VIP

指令：
/admin_vip_remove {telegram_id}
```

#### 2.5.3 VIP 列表

```
⭐ VIP 使用者列表

總數: {count}
即將到期（7天內）: {expiringSoon}

[查看全部] [即將到期] [已過期]
```

### 2.6 /admin_appeal（申訴審核）

```
📝 待審核申訴

申訴 ID: {appeal_id}
使用者: {user_id} (@{nickname})
封禁時間: {ban_start} - {ban_end}
申訴內容:
{message}

[通過] [拒絕] [查看詳情]
```

---

## 3. 資料庫擴充

### 3.1 admin_actions（管理操作記錄）

```sql
CREATE TABLE admin_actions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  admin_id TEXT,              -- 執行操作的管理員
  action_type TEXT,           -- ban / unban / vip_add / vip_remove / etc.
  target_user_id TEXT,        -- 目標使用者
  details_json TEXT,          -- JSON 格式的操作詳情
  created_at DATETIME
);

CREATE INDEX idx_admin_actions_admin_id ON admin_actions(admin_id);
CREATE INDEX idx_admin_actions_target_user_id ON admin_actions(target_user_id);
CREATE INDEX idx_admin_actions_created_at ON admin_actions(created_at);
```

### 3.2 stats_cache（統計快取）

```sql
CREATE TABLE stats_cache (
  cache_key TEXT PRIMARY KEY, -- 如 'daily_stats_2025-01-15'
  cache_data TEXT,            -- JSON 格式的統計數據
  expires_at DATETIME,
  created_at DATETIME
);
```

---

## 4. 實作範例

### 4.1 運營數據查詢

```typescript
// src/domain/stats.ts

export async function getMonthlyRevenue(
  db: D1Database,
  year: number,
  month: number
): Promise<number> {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = `${year}-${String(month).padStart(2, '0')}-31`;
  
  const result = await db.prepare(`
    SELECT COALESCE(SUM(stars_amount), 0) as total
    FROM payments
    WHERE status = 'paid'
      AND DATE(created_at) >= ?
      AND DATE(created_at) <= ?
  `)
    .bind(startDate, endDate)
    .first<{ total: number }>();
  
  return result?.total || 0;
}

export async function getActiveSubscriptions(db: D1Database): Promise<number> {
  const result = await db.prepare(`
    SELECT COUNT(*) as count
    FROM users
    WHERE is_vip = 1
      AND (vip_expire_at IS NULL OR vip_expire_at > datetime('now'))
  `).first<{ count: number }>();
  
  return result?.count || 0;
}

export async function getRefundsThisMonth(
  db: D1Database,
  year: number,
  month: number
): Promise<number> {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = `${year}-${String(month).padStart(2, '0')}-31`;
  
  const result = await db.prepare(`
    SELECT COALESCE(SUM(stars_amount), 0) as total
    FROM payments
    WHERE status = 'refunded'
      AND DATE(updated_at) >= ?
      AND DATE(updated_at) <= ?
  `)
    .bind(startDate, endDate)
    .first<{ total: number }>();
  
  return result?.total || 0;
}
```

### 4.2 手動封禁

```typescript
// src/telegram/handlers/admin.ts

export async function handleAdminBan(
  adminId: string,
  targetUserId: string,
  hours: number,
  reason: string,
  db: D1Database
): Promise<string> {
  // 檢查權限
  const admin = await db.getUser(adminId);
  if (!admin || !['admin', 'angel', 'god'].includes(admin.role)) {
    return '❌ 無權限執行此操作';
  }
  
  // 執行封禁
  const banEnd = new Date(Date.now() + hours * 60 * 60 * 1000);
  await db.prepare(`
    INSERT INTO bans (user_id, reason, ban_start, ban_end, created_at)
    VALUES (?, ?, datetime('now'), ?, datetime('now'))
  `).bind(targetUserId, reason, banEnd.toISOString()).run();
  
  // 記錄管理操作
  await db.prepare(`
    INSERT INTO admin_actions (admin_id, action_type, target_user_id, details_json, created_at)
    VALUES (?, 'ban', ?, ?, datetime('now'))
  `).bind(
    adminId,
    targetUserId,
    JSON.stringify({ hours, reason })
  ).run();
  
  return `✅ 已封禁使用者 ${targetUserId}，時長 ${hours} 小時`;
}
```

### 4.3 手動升級 VIP

```typescript
export async function handleAdminVipAdd(
  adminId: string,
  targetUserId: string,
  days: number,
  db: D1Database
): Promise<string> {
  // 檢查權限（僅 angel 和 god）
  const admin = await db.getUser(adminId);
  if (!admin || !['angel', 'god'].includes(admin.role)) {
    return '❌ 無權限執行此操作';
  }
  
  const user = await db.getUser(targetUserId);
  if (!user) {
    return '❌ 使用者不存在';
  }
  
  // 計算新的到期時間
  const now = new Date();
  const currentExpire = user.vip_expire_at 
    ? new Date(user.vip_expire_at)
    : null;
  
  const newExpire = currentExpire && currentExpire > now
    ? new Date(currentExpire.getTime() + days * 24 * 60 * 60 * 1000)
    : new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  
  // 更新使用者
  await db.prepare(`
    UPDATE users
    SET is_vip = 1,
        vip_expire_at = ?,
        updated_at = datetime('now')
    WHERE telegram_id = ?
  `).bind(newExpire.toISOString(), targetUserId).run();
  
  // 記錄操作
  await db.prepare(`
    INSERT INTO admin_actions (admin_id, action_type, target_user_id, details_json, created_at)
    VALUES (?, 'vip_add', ?, ?, datetime('now'))
  `).bind(
    adminId,
    targetUserId,
    JSON.stringify({ days, newExpire: newExpire.toISOString() })
  ).run();
  
  return `✅ 已為使用者 ${targetUserId} 升級 VIP，到期時間：${newExpire.toISOString()}`;
}
```

---

## 5. 數據導出功能

### 5.1 匯出 CSV

```
/admin_export {type} {format}

範例：
/admin_export users csv
/admin_export payments csv
/admin_export stats json
```

支援的匯出類型：
- `users`: 使用者列表
- `payments`: 付款記錄
- `stats`: 統計數據
- `bans`: 封禁記錄

---

## 6. 安全考量

1. **操作記錄**：所有管理操作都記錄在 `admin_actions` 表
2. **權限檢查**：每次操作前都檢查角色權限
3. **審計日誌**：定期匯出管理操作記錄
4. **敏感操作確認**：重要操作（如封禁、VIP 升級）需要二次確認

