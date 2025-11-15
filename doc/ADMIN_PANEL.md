# XunNi 管理後台設計

## 1. 概述

管理後台提供給 **god**（上帝）和 **angel**（天使）角色使用，透過 Telegram Bot 指令進行運營管理。

### 1.1 架構設計

**架構原則**：

- **沿用 Cloudflare Workers + D1 Database 設定**：所有管理指令實作成 Worker 端的 webhook handler
- **根據角色權限路由**：根據使用者角色（user / group_admin / angel / god）路由到不同的 domain service
- **指令可見性控制**：一般使用者（user）在 `/help` 中看不到任何管理指令
- **Domain Service 層**：設計 `stats`, `users`, `vip`, `ban`, `broadcast`, `appeal` 等 domain service，負責業務邏輯
- **Handler 層**：Bot 指令只負責調用 domain service 並格式化 Telegram 訊息回應
- **功能開關**：使用 `feature_flags` 表維護前端顯示開關，Worker 處理 Mini App 輸出時查詢旗標決定 UI 顯示
- **跨平台適配**：預留 `NotificationAdapter` 與 `AuthAdapter` 介面，對應 ROADMAP 中 M2/M3 的跨平台擴充，確保後台操作（例如廣播、封禁）可以在多端一致生效

**架構圖**：

```
┌─────────────────────────────────────┐
│   Telegram Bot Handlers (API 層)     │
│   - handleAdminStats()               │
│   - handleAdminUser()                │
│   - handleAdminBan()                 │
│   - handleAdminVip()                 │
│   - handleAdminBroadcast()           │
│   - handleAdminAppeal()              │
├─────────────────────────────────────┤
│   Domain Services (業務邏輯層)        │
│   - admin/stats.ts                   │
│   - admin/users.ts                   │
│   - admin/vip.ts                     │
│   - admin/ban.ts                     │
│   - admin/broadcast.ts               │
│   - admin/appeal.ts                  │
├─────────────────────────────────────┤
│   Database Client (資料層)           │
│   - D1Database                       │
├─────────────────────────────────────┤
│   Adapters (適配層，M2/M3)           │
│   - NotificationAdapter              │
│   - AuthAdapter                      │
└─────────────────────────────────────┘
```

**設計原則**：

1. **Handler 只負責格式化**：Handler 層只負責解析 Telegram 指令、調用 Domain Service、格式化回應訊息
2. **Domain Service 負責業務邏輯**：所有業務邏輯（權限檢查、資料查詢、狀態更新）都在 Domain Service 層
3. **權限檢查在 Domain Service**：權限檢查邏輯統一在 Domain Service 中，Handler 不需要處理
4. **操作記錄統一**：所有管理操作都通過 Domain Service 記錄到 `admin_actions` 表
5. **跨平台一致性**：透過 Adapter 抽象層，確保後台操作在不同平台（Telegram / WeChat / Line / Mobile）都能一致生效

### 1.2 角色權限

**角色定義**：
- **user**（一般使用者）：預設角色，所有新註冊使用者
- **group_admin**（群組管理員）：預留角色，用於未來支援 Telegram 群組功能（當前 M1 階段不使用）
- **angel**（平台管理員）：平台運營管理員，可執行大部分管理操作
- **god**（平台所有者）：最高權限，擁有所有管理權限

**權限對照表**：

| 功能 | user | group_admin | angel | god |
|------|------|-------------|-------|-----|
| **一般功能** |
| 丟瓶/撿瓶 | ✅ | ✅ | ✅ | ✅ |
| 查看個人資料 | ✅ | ✅ | ✅ | ✅ |
| VIP 購買 | ✅ | ✅ | ✅ | ✅ |
| 舉報/封鎖 | ✅ | ✅ | ✅ | ✅ |
| **管理功能** |
| 查看運營數據 | ❌ | ❌ | ✅ | ✅ |
| 手動封禁/解封 | ❌ | ❌ | ✅ | ✅ |
| 手動升級 VIP | ❌ | ❌ | ✅ | ✅ |
| 群發訊息（需篩選） | ❌ | ❌ | ✅ | ✅ |
| 無條件群發 | ❌ | ❌ | ❌ | ✅ |
| 查看申訴 | ❌ | ❌ | ✅ | ✅ |
| 審核申訴 | ❌ | ❌ | ✅ | ✅ |
| 查看所有使用者 | ❌ | ❌ | ❌ | ✅ |
| **指令可見性** |
| 一般指令（/start, /throw 等） | ✅ | ✅ | ✅ | ✅ |
| 管理指令（/admin*） | ❌ | ❌ | ✅ | ✅ |
| 群發指令（/broadcast） | ❌ | ❌ | ✅ | ✅ |

**重要原則**：
- **一般使用者（user）**：在 `/help` 指令中**絕對看不到**任何管理指令
- **平台管理員（angel）**：可以看到管理指令，但某些高權限功能受限
- **平台所有者（god）**：可以看到所有指令，擁有最高權限
- **群組管理員（group_admin）**：預留角色，當前不使用，未來可能用於群組管理功能

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

## 3. Domain Service 設計

### 3.1 admin/stats.ts - 運營數據統計

**職責**：
- 聚合運營數據（使用者、收入、使用、VIP、邀請）
- 提供統計查詢介面

**函數**：
```typescript
export interface AdminStatsData {
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

export async function getAdminStats(
  db: D1Database,
  adminId: string
): Promise<AdminStatsData>
```

**權限檢查**：
- 需要 `angel` / `god` 角色（`user` 和 `group_admin` 無權限）

### 3.2 admin/users.ts - 使用者管理

**職責**：
- 搜尋使用者（Telegram ID、暱稱、邀請碼）
- 查詢使用者詳情
- 更新使用者資訊

**函數**：
```typescript
export interface UserSearchResult {
  telegram_id: string;
  nickname: string;
  role: string;
  is_vip: number;
  vip_expire_at: string | null;
  risk_score: number;
  created_at: string;
}

export async function searchUsers(
  db: D1Database,
  query: string
): Promise<UserSearchResult[]>

export async function getUserDetails(
  db: D1Database,
  userId: string
): Promise<UserSearchResult | null>
```

**權限檢查**：
- 搜尋：需要 `angel` / `god` 角色（`user` 和 `group_admin` 無權限）
- 查看詳情：需要 `angel` / `god` 角色（`user` 和 `group_admin` 無權限）
- 查看所有使用者：僅 `god` 角色

### 3.3 admin/ban.ts - 封禁管理

**職責**：
- 手動封禁使用者
- 解封使用者
- 查詢封禁列表

**函數**：
```typescript
export interface BanResult {
  success: boolean;
  message: string;
  banId?: number;
}

export async function banUser(
  db: D1Database,
  adminId: string,
  targetUserId: string,
  hours: number,
  reason: string
): Promise<BanResult>

export async function unbanUser(
  db: D1Database,
  adminId: string,
  targetUserId: string
): Promise<BanResult>

export async function getBanList(
  db: D1Database,
  adminId: string,
  limit?: number
): Promise<Array<{
  user_id: string;
  ban_start: string;
  ban_end: string;
  reason: string;
}>>
```

**權限檢查**：
- 封禁/解封：需要 `angel` / `god` 角色（`user` 和 `group_admin` 無權限）
- 查詢封禁列表：需要 `angel` / `god` 角色（`user` 和 `group_admin` 無權限）

### 3.4 admin/vip.ts - VIP 管理

**職責**：
- 手動升級 VIP
- 取消 VIP
- 查詢 VIP 列表

**函數**：
```typescript
export interface VipResult {
  success: boolean;
  message: string;
  newExpireAt?: string;
}

export async function addVip(
  db: D1Database,
  adminId: string,
  targetUserId: string,
  days: number
): Promise<VipResult>

export async function removeVip(
  db: D1Database,
  adminId: string,
  targetUserId: string
): Promise<VipResult>

export async function getVipList(
  db: D1Database,
  adminId: string,
  filter?: 'all' | 'expiring_soon' | 'expired'
): Promise<Array<{
  telegram_id: string;
  nickname: string;
  vip_expire_at: string;
  days_remaining: number;
}>>
```

**權限檢查**：
- 升級/取消 VIP：僅 `angel` / `god` 角色（`user` 和 `group_admin` 無權限）
- 查詢 VIP 列表：需要 `angel` / `god` 角色（`user` 和 `group_admin` 無權限）

### 3.5 admin/broadcast.ts - 廣播管理

**職責**：
- 創建廣播任務
- 查詢廣播狀態
- 取消廣播任務

**函數**：
```typescript
export interface BroadcastResult {
  success: boolean;
  message: string;
  jobId?: number;
}

export async function createBroadcast(
  db: D1Database,
  adminId: string,
  message: string,
  filters?: {
    role?: string;
    isVip?: boolean;
    country?: string;
  },
  notificationAdapter?: NotificationAdapter
): Promise<BroadcastResult>

export async function getBroadcastStatus(
  db: D1Database,
  adminId: string,
  jobId: number
): Promise<{
  status: string;
  total: number;
  sent: number;
  failed: number;
}>

export async function cancelBroadcast(
  db: D1Database,
  adminId: string,
  jobId: number
): Promise<BroadcastResult>
```

**權限檢查**：
- 創建廣播：僅 `angel` / `god` 角色（`user` 和 `group_admin` 無權限）
- 無條件廣播：僅 `god` 角色
- 查詢/取消廣播：需要 `angel` / `god` 角色（`user` 和 `group_admin` 無權限）

**跨平台支援**：
- 透過 `NotificationAdapter` 抽象層，確保廣播在不同平台（Telegram / WeChat / Line / Mobile）都能一致生效
- `NotificationAdapter` 介面定義見 `doc/MODULE_DESIGN.md` 第 2.5 節

### 3.6 admin/appeal.ts - 申訴審核

**職責**：
- 查詢待審核申訴
- 審核申訴（通過/拒絕）
- 查詢申訴歷史

**函數**：
```typescript
export interface AppealResult {
  success: boolean;
  message: string;
}

export async function getPendingAppeals(
  db: D1Database,
  adminId: string
): Promise<Array<{
  appeal_id: number;
  user_id: string;
  nickname: string;
  ban_start: string;
  ban_end: string;
  message: string;
  created_at: string;
}>>

export async function approveAppeal(
  db: D1Database,
  adminId: string,
  appealId: number
): Promise<AppealResult>

export async function rejectAppeal(
  db: D1Database,
  adminId: string,
  appealId: number,
  reason?: string
): Promise<AppealResult>
```

**權限檢查**：
- 查詢/審核申訴：需要 `angel` / `god` 角色（`user` 和 `group_admin` 無權限）

## 4. Handler 實作範例

### 4.1 Handler 只負責格式化

**原則**：Handler 層只負責解析 Telegram 指令、調用 Domain Service、格式化回應訊息

```typescript
// src/telegram/handlers/admin.ts

import { getAdminStats } from '../../domain/admin/stats';
import { banUser } from '../../domain/admin/ban';
import { addVip } from '../../domain/admin/vip';

export async function handleAdminStats(
  update: TelegramUpdate,
  env: Env,
  db: D1Database
): Promise<void> {
  const adminId = String(update.message.from.id);
  
  // 調用 Domain Service
  const stats = await getAdminStats(db, adminId);
  
  // 格式化 Telegram 訊息
  const message = formatStatsMessage(stats);
  
  // 發送訊息
  await sendMessage(env, adminId, message);
}

export async function handleAdminBan(
  update: TelegramUpdate,
  env: Env,
  db: D1Database
): Promise<void> {
  const adminId = String(update.message.from.id);
  const args = update.message.text.split(' ');
  const targetUserId = args[1];
  const hours = parseInt(args[2]);
  const reason = args.slice(3).join(' ');
  
  // 調用 Domain Service（權限檢查在 Domain Service 中）
  const result = await banUser(db, adminId, targetUserId, hours, reason);
  
  // 格式化回應
  const message = result.success
    ? `✅ ${result.message}`
    : `❌ ${result.message}`;
  
  await sendMessage(env, adminId, message);
}

function formatStatsMessage(stats: AdminStatsData): string {
  return `📊 運營數據統計

👥 使用者數據
├─ 總註冊數：${stats.users.total}
├─ 活躍使用者（7天）：${stats.users.active7d}
├─ 活躍使用者（30天）：${stats.users.active30d}
└─ 完成 Onboarding：${stats.users.completedOnboarding}

💰 收入數據
├─ 本月收入：${stats.revenue.monthlyRevenue} Stars
├─ 總收入：${stats.revenue.totalRevenue} Stars
├─ 當前訂閱數：${stats.revenue.activeSubscriptions}
├─ 本月新增訂閱：${stats.revenue.newSubscriptionsThisMonth}
└─ 本月退款：${stats.revenue.refundsThisMonth} Stars

...`;
}
```

### 4.2 Domain Service 負責業務邏輯

**原則**：所有業務邏輯（權限檢查、資料查詢、狀態更新）都在 Domain Service 層

```typescript
// src/domain/admin/ban.ts

export async function banUser(
  db: D1Database,
  adminId: string,
  targetUserId: string,
  hours: number,
  reason: string
): Promise<BanResult> {
  // 1. 權限檢查
  const admin = await db.prepare(`
    SELECT role FROM users WHERE telegram_id = ?
  `).bind(adminId).first<{ role: string }>();
  
  if (!admin || !['angel', 'god'].includes(admin.role)) {
    return {
      success: false,
      message: '無權限執行此操作',
    };
  }
  
  // 2. 執行封禁
  const banEnd = new Date(Date.now() + hours * 60 * 60 * 1000);
  await db.prepare(`
    INSERT INTO bans (user_id, reason, ban_start, ban_end, created_at)
    VALUES (?, ?, datetime('now'), ?, datetime('now'))
  `).bind(targetUserId, reason, banEnd.toISOString()).run();
  
  // 3. 記錄管理操作
  await db.prepare(`
    INSERT INTO admin_actions (admin_id, action_type, target_user_id, details_json, created_at)
    VALUES (?, 'ban', ?, ?, datetime('now'))
  `).bind(
    adminId,
    targetUserId,
    JSON.stringify({ hours, reason })
  ).run();
  
  return {
    success: true,
    message: `已封禁使用者 ${targetUserId}，時長 ${hours} 小時`,
  };
}
```

## 5. 資料庫擴充

### 5.1 admin_actions（管理操作記錄）

**定義**：見 `doc/SPEC.md` 第 3.16 節

### 5.2 stats_cache（統計快取）

**定義**：見 `doc/SPEC.md` 第 3.14 節

### 5.3 feature_flags（功能開關）

**定義**：見 `doc/SPEC.md` 第 3.15 節

**使用範例**：
```typescript
// 查詢功能開關（Mini App 載入時）
const flags = await db.prepare(`
  SELECT flag_key, flag_value
  FROM feature_flags
  WHERE platform IN ('all', 'telegram')
    AND flag_value = 1
`).all<{ flag_key: string; flag_value: number }>();

// 轉換為前端可用的物件
const featureFlags: Record<string, boolean> = {};
for (const flag of flags.results) {
  featureFlags[flag.flag_key] = flag.flag_value === 1;
}

// 在 Mini App 中使用
// if (featureFlags.show_vip_badge) {
//   // 顯示 VIP 徽章
// }
```

---

## 6. 實作範例（舊版，僅供參考）

> **注意**：以下實作範例是舊版設計，新的設計應該遵循「Handler 只負責格式化，Domain Service 負責業務邏輯」的原則。新的實作範例見第 4 節。

### 6.1 運營數據查詢

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

### 6.2 手動封禁

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
  if (!admin || !['angel', 'god'].includes(admin.role)) {
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

### 6.3 手動升級 VIP

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

## 7. 數據導出功能

### 7.1 匯出 CSV

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

## 8. 安全考量

1. **操作記錄**：所有管理操作都記錄在 `admin_actions` 表
2. **權限檢查**：每次操作前都檢查角色權限
3. **審計日誌**：定期匯出管理操作記錄
4. **敏感操作確認**：重要操作（如封禁、VIP 升級）需要二次確認

