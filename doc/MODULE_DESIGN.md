# XunNi 模組化設計指南

> **在閱讀本文檔前，請先閱讀 `@doc/SPEC.md`（包含專案概覽）。**

## 1. 架構原則

### 1.1 分層架構

```
┌─────────────────────────────────────┐
│      Telegram Handlers (API 層)      │
├─────────────────────────────────────┤
│      Domain Logic (業務邏輯層)       │
├─────────────────────────────────────┤
│      Database Client (資料層)        │
├─────────────────────────────────────┤
│      External Services (服務層)      │
└─────────────────────────────────────┘
```

### 1.2 依賴方向

- **Handlers** → **Domain** → **DB Client**
- **Handlers** → **Services** (OpenAI, Gigapub, etc.)
- **Domain** 不依賴 **Handlers** 或 **Services**（保持純函數）

---

## 2. 模組職責

### 2.1 Domain 層（業務邏輯）

#### 2.1.1 usage.ts - 使用次數管理

**職責**：
- 計算每日丟瓶上限
- 檢查是否可以丟瓶
- 記錄使用次數

**函數**：
```typescript
export function getDailyThrowLimit(user: User, today: string): number
export function canThrowBottle(user: User, today: string, usage: DailyUsage | null): boolean
export function getConversationDailyLimit(user: User): number
export async function canSendConversationMessage(user: User, convoId: number, today: string): Promise<boolean>
```

**特點**：
- 純函數（無副作用）
- 易於測試
- 不依賴外部服務

#### 2.1.2 risk.ts - 風險管理

**職責**：
- 累加風險分數
- 執行封禁
- 檢查封禁狀態

**函數**：
```typescript
export async function addRisk(userId: string, reason: string, db: D1Database): Promise<void>
export async function applyBan(userId: string, hours: number, reason: string, db: D1Database): Promise<void>
export async function isBanned(user: User, db: D1Database): Promise<boolean>
export async function checkReportsAndBan(targetId: string, db: D1Database): Promise<void>
```

#### 2.1.3 matching.ts - 匹配邏輯

**職責**：
- 匹配漂流瓶
- 篩選條件檢查

**函數**：
```typescript
export async function matchBottleForUser(user: User, db: D1Database): Promise<Bottle | null>
export function matchesBottleFilters(bottle: Bottle, user: User): boolean
```

#### 2.1.4 eligibility.ts - 資格查詢

**職責**：
- 檢查使用者資格（給 Moonpacket）

**函數**：
```typescript
export async function checkEligibility(telegramId: string, db: D1Database): Promise<EligibilityResult>
```

#### 2.1.5 public_stats.ts - 公開營運統計

**職責**：
- 聚合公開營運統計數據（累積、昨日新增、活躍使用者）
- 提供給行銷頁面使用

**函數**：
```typescript
export interface PublicStats {
  timestamp: string;
  cumulative: {
    total_bottles: number;
    total_users: number;
    total_messages: number;
    total_conversations: number;
  };
  yesterday: {
    bottles: number;
    users: number;
    messages: number;
    conversations: number;
  };
  active: {
    active_users_7d: number;
    active_users_30d: number;
  };
}

export async function getPublicStats(db: D1Database): Promise<PublicStats>
```

**特點**：
- 純函數（無副作用）
- 易於測試
- 不依賴外部服務
- 查詢結果可快取

#### 2.1.6 account-linker.ts - 帳號綁定（預留，M2/M3 階段）

**當前階段（M1）**：
- 僅使用 Telegram `initData` 驗簽
- 無需多平台帳號綁定

**未來擴展（M2/M3）**：
- 處理多平台帳號綁定（Google、Apple、WeChat、Line）
- 管理帳號身份（account_identities）
- 合併同一使用者的多個帳號身份
- 詳細設計請參考：ROADMAP.md

#### 2.1.7 translation-policy.ts - 翻譯策略

**職責**：
- 翻譯供應商調度（OpenAI vs Google）
- 成本記錄（translation_costs）
- 降級處理（fallback）

**函數**：
```typescript
export enum TranslationProvider {
  OPENAI = 'openai',
  GOOGLE = 'google',
}

export interface TranslationResult {
  text: string;
  provider: TranslationProvider;
  sourceLanguage: string;
  targetLanguage: string;
  fallback: boolean;
  cost?: number;
}

export async function translateText(
  text: string,
  targetLanguage: string,
  sourceLanguage: string | undefined,
  user: User,
  env: Env,
  db: D1Database
): Promise<TranslationResult>

export async function recordTranslationCost(
  userId: string,
  provider: TranslationProvider,
  cost: number,
  db: D1Database
): Promise<void>

export async function recordTranslationFallback(
  userId: string,
  fromProvider: TranslationProvider,
  error: Error | null,
  db: D1Database
): Promise<void>

export async function getTranslationCosts(
  db: D1Database,
  startDate: string,
  endDate: string
): Promise<{
  openai: { count: number; totalCost: number };
  google: { count: number; totalCost: number };
  fallbacks: number;
}>
```

**特點**：
- VIP 優先使用 OpenAI，失敗降級到 Google
- 免費使用者僅使用 Google
- 記錄所有翻譯成本（用於監控）
- 記錄降級事件（用於告警）

**資料庫表**：
- `translation_costs`：翻譯成本記錄
- `translation_fallbacks`：翻譯降級記錄

#### 2.1.8 admin/stats.ts - 運營數據統計（管理後台）

**職責**：
- 聚合運營數據（使用者、收入、使用、VIP、邀請）
- 提供統計查詢介面

**函數**：
```typescript
export interface AdminStatsData {
  users: { total: number; active7d: number; active30d: number; completedOnboarding: number };
  revenue: { monthlyRevenue: number; totalRevenue: number; activeSubscriptions: number; newSubscriptionsThisMonth: number; refundsThisMonth: number };
  usage: { throwsToday: number; catchesToday: number; activeConversations: number; avgThrowsPerDay: number };
  vip: { totalVips: number; activeVips: number; vipConversionRate: number; avgVipDuration: number };
  invites: { totalInvites: number; activatedInvites: number; inviteActivationRate: number };
}

export async function getAdminStats(
  db: D1Database,
  adminId: string
): Promise<AdminStatsData>
```

**特點**：
- 權限檢查：需要 `admin` / `angel` / `god` 角色
- 詳細設計見 `@doc/ADMIN_PANEL.md` 第 3.1 節

#### 2.1.9 admin/users.ts - 使用者管理（管理後台）

**職責**：
- 搜尋使用者（Telegram ID、暱稱、邀請碼）
- 查詢使用者詳情
- 更新使用者資訊

**函數**：
```typescript
export async function searchUsers(
  db: D1Database,
  query: string
): Promise<UserSearchResult[]>

export async function getUserDetails(
  db: D1Database,
  userId: string
): Promise<UserSearchResult | null>
```

**特點**：
- 權限檢查：搜尋需要 `admin` / `angel` / `god` 角色
- 查看所有使用者：僅 `god` 角色
- 詳細設計見 `@doc/ADMIN_PANEL.md` 第 3.2 節

#### 2.1.10 admin/vip.ts - VIP 管理（管理後台）

**職責**：
- 手動升級 VIP
- 取消 VIP
- 查詢 VIP 列表

**函數**：
```typescript
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
): Promise<VipListItem[]>
```

**特點**：
- 權限檢查：升級/取消 VIP 僅 `angel` / `god` 角色
- 詳細設計見 `@doc/ADMIN_PANEL.md` 第 3.4 節

#### 2.1.11 admin/ban.ts - 封禁管理（管理後台）

**職責**：
- 手動封禁使用者
- 解封使用者
- 查詢封禁列表

**函數**：
```typescript
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
): Promise<BanListItem[]>
```

**特點**：
- 權限檢查：封禁/解封需要 `admin` / `angel` / `god` 角色
- 所有操作記錄到 `admin_actions` 表
- 詳細設計見 `@doc/ADMIN_PANEL.md` 第 3.3 節

#### 2.1.12 admin/broadcast.ts - 廣播管理（管理後台）

**職責**：
- 創建廣播任務
- 查詢廣播狀態
- 取消廣播任務

**函數**：
```typescript
export async function createBroadcast(
  db: D1Database,
  adminId: string,
  message: string,
  filters?: BroadcastFilters,
  notificationAdapter?: NotificationAdapter
): Promise<BroadcastResult>

export async function getBroadcastStatus(
  db: D1Database,
  adminId: string,
  jobId: number
): Promise<BroadcastStatus>

export async function cancelBroadcast(
  db: D1Database,
  adminId: string,
  jobId: number
): Promise<BroadcastResult>
```

**特點**：
- 權限檢查：創建廣播僅 `angel` / `god` 角色
- 無條件廣播：僅 `god` 角色
- 跨平台支援：透過 `NotificationAdapter` 抽象層，確保廣播在不同平台都能一致生效
- 詳細設計見 `@doc/ADMIN_PANEL.md` 第 3.5 節

#### 2.1.13 admin/appeal.ts - 申訴審核（管理後台）

**職責**：
- 查詢待審核申訴
- 審核申訴（通過/拒絕）
- 查詢申訴歷史

**函數**：
```typescript
export async function getPendingAppeals(
  db: D1Database,
  adminId: string
): Promise<AppealListItem[]>

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

**特點**：
- 權限檢查：查詢/審核申訴需要 `admin` / `angel` / `god` 角色
- 詳細設計見 `@doc/ADMIN_PANEL.md` 第 3.6 節

### 2.2 Database Client 層

#### 2.2.1 client.ts - 資料庫封裝

**職責**：
- 封裝所有資料庫操作
- 提供型別安全的查詢介面

**結構**：
```typescript
export class DatabaseClient {
  constructor(private db: D1Database) {}
  
  // Users
  async getUser(telegramId: string): Promise<User | null>
  async createUser(data: CreateUserData): Promise<void>
  async updateUser(telegramId: string, data: Partial<User>): Promise<void>
  
  // Bottles
  async createBottle(data: CreateBottleData): Promise<number>
  async getBottle(id: number): Promise<Bottle | null>
  async getAvailableBottles(filters: BottleFilters): Promise<Bottle[]>
  
  // Conversations
  async createConversation(data: CreateConversationData): Promise<number>
  async getConversation(id: number): Promise<Conversation | null>
  async getUserConversations(userId: string): Promise<Conversation[]>
  
  // ... 其他表的操作
}
```

### 2.3 Services 層

#### 2.3.1 openai.ts - OpenAI 服務

**職責**：
- 翻譯文字
- 生成暱稱建議
- AI 內容審核（可選）

**函數**：
```typescript
export async function translateText(text: string, targetLang: string, sourceLang?: string, env: Env): Promise<string>
export async function generateNicknameSuggestions(userId: string, language: string, env: Env): Promise<string[]>
export async function moderateContent(text: string, env: Env): Promise<ModerationResult>
```

#### 2.3.2 gigapub.ts - 廣告服務

**職責**：
- 獲取廣告內容

**函數**：
```typescript
export async function fetchAd(env: Env): Promise<AdContent | null>
```

#### 2.3.3 telegram/client.ts - Telegram API 封裝

**職責**：
- 封裝 Telegram Bot API 調用

**函數**：
```typescript
export async function sendMessage(env: Env, chatId: string, text: string, options?: SendMessageOptions): Promise<void>
export async function sendPhoto(env: Env, chatId: string, photo: string, caption?: string): Promise<void>
export async function answerCallbackQuery(env: Env, queryId: string, text?: string): Promise<void>
```

### 2.5 Handlers 層

#### 2.5.1 handlers/*.ts - 指令處理器

**職責**：
- 處理 Telegram 指令
- 調用 Domain 層邏輯
- 格式化回應訊息

**管理後台 Handler 設計原則**：

- **Handler 只負責格式化**：Handler 層只負責解析 Telegram 指令、調用 Domain Service、格式化回應訊息
- **Domain Service 負責業務邏輯**：所有業務邏輯（權限檢查、資料查詢、狀態更新）都在 Domain Service 層
- **權限檢查在 Domain Service**：權限檢查邏輯統一在 Domain Service 中，Handler 不需要處理
- **操作記錄統一**：所有管理操作都通過 Domain Service 記錄到 `admin_actions` 表

**範例**：
```typescript
// src/telegram/handlers/admin.ts

import { getAdminStats } from '../../domain/admin/stats';
import { banUser } from '../../domain/admin/ban';

export async function handleAdminStats(
  update: TelegramUpdate,
  env: Env,
  db: D1Database
): Promise<void> {
  const adminId = String(update.message.from.id);
  
  // 調用 Domain Service（權限檢查在 Domain Service 中）
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
```

**詳細設計見 `@doc/ADMIN_PANEL.md` 第 4 節**

**結構**：
```typescript
// src/telegram/handlers/throw.ts

export async function handleThrow(
  update: TelegramUpdate,
  env: Env,
  db: D1Database
): Promise<void> {
  const userId = String(update.message.from.id);
  
  // 1. 取得使用者
  const user = await db.getUser(userId);
  if (!user) {
    await sendMessage(env, userId, '請先使用 /start 註冊');
    return;
  }
  
  // 2. 檢查權限（使用 Domain 層）
  const today = new Date().toISOString().split('T')[0];
  const usage = await db.getDailyUsage(userId, today);
  
  if (!canThrowBottle(user, today, usage)) {
    const message = tForUser('bottle.throw.quota_exceeded', user.language_pref);
    await sendMessage(env, userId, message);
    return;
  }
  
  // 3. 處理業務邏輯
  // ...
}
```

---

## 3. 功能開關（Feature Flags）

### 3.1 feature_flags 表

**用途**：維護前端顯示開關，Worker 在處理 Mini App 輸出時查詢旗標來決定 UI 是否顯示（也方便未來擴平台）

**資料庫表**：見 `@doc/SPEC.md` 第 3.15 節

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

**管理功能開關**：
- 運營人員可透過管理後台動態開關功能
- 支援按平台（`telegram` / `wechat` / `line` / `mobile`）設定不同的開關狀態
- 未來擴展到其他平台時，可根據 `platform` 欄位過濾

---

## 4. Adapters 層（預留，M2/M3 階段）

### 4.1 NotificationAdapter - 通知適配器

**職責**：
- 統一通知推送介面，支援多平台（Telegram / WeChat / Line / Mobile）
- 確保後台操作（例如廣播、封禁通知）可以在多端一致生效

**介面定義**：
```typescript
export interface NotificationAdapter {
  /**
   * 發送通知給指定使用者
   * @param userId 使用者 ID（平台相關）
   * @param message 通知訊息
   * @param options 通知選項（可選）
   */
  sendNotification(
    userId: string,
    message: string,
    options?: NotificationOptions
  ): Promise<NotificationResult>;
  
  /**
   * 批量發送通知
   * @param userIds 使用者 ID 列表
   * @param message 通知訊息
   * @param options 通知選項（可選）
   */
  sendBatchNotifications(
    userIds: string[],
    message: string,
    options?: NotificationOptions
  ): Promise<NotificationResult[]>;
}

export interface NotificationOptions {
  platform?: 'telegram' | 'wechat' | 'line' | 'mobile';
  priority?: 'low' | 'normal' | 'high';
  silent?: boolean;
  deepLink?: string;
}

export interface NotificationResult {
  success: boolean;
  messageId?: string;
  error?: string;
}
```

**實作範例**：

```typescript
// src/adapters/telegram-notification.ts
export class TelegramNotificationAdapter implements NotificationAdapter {
  constructor(private env: Env) {}
  
  async sendNotification(
    userId: string,
    message: string,
    options?: NotificationOptions
  ): Promise<NotificationResult> {
    try {
      await sendMessage(this.env, userId, message);
      return { success: true, messageId: userId };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }
  
  async sendBatchNotifications(
    userIds: string[],
    message: string,
    options?: NotificationOptions
  ): Promise<NotificationResult[]> {
    const results: NotificationResult[] = [];
    for (const userId of userIds) {
      const result = await this.sendNotification(userId, message, options);
      results.push(result);
    }
    return results;
  }
}

// src/adapters/wechat-notification.ts（M2 階段）
export class WeChatNotificationAdapter implements NotificationAdapter {
  // WeChat 實作
}

// src/adapters/line-notification.ts（M2 階段）
export class LineNotificationAdapter implements NotificationAdapter {
  // Line 實作
}

// src/adapters/mobile-notification.ts（M3 階段）
export class MobileNotificationAdapter implements NotificationAdapter {
  // Mobile (APNs / FCM) 實作
}
```

**使用場景**：
- 廣播訊息：透過 `NotificationAdapter` 發送到不同平台
- 封禁通知：封禁使用者時，透過 `NotificationAdapter` 發送通知
- VIP 升級通知：VIP 升級時，透過 `NotificationAdapter` 發送通知
- 詳細設計見 `@doc/ROADMAP.md` M2/M3 階段

### 4.2 AuthAdapter - 認證適配器

**職責**：
- 統一認證介面，支援多平台（Telegram / Google / Apple / WeChat / Line）
- 處理帳號綁定和身份驗證

**介面定義**：
```typescript
export interface AuthAdapter {
  /**
   * 驗證使用者身份
   * @param authData 認證數據（平台相關）
   * @returns 使用者身份資訊
   */
  verifyIdentity(authData: AuthData): Promise<IdentityResult>;
  
  /**
   * 綁定帳號
   * @param userId 現有使用者 ID
   * @param authData 認證數據
   * @returns 綁定結果
   */
  bindAccount(userId: string, authData: AuthData): Promise<BindResult>;
}

export interface AuthData {
  platform: 'telegram' | 'google' | 'apple' | 'wechat' | 'line';
  token: string;
  initData?: string; // Telegram Mini App initData
  // 其他平台特定的認證數據
}

export interface IdentityResult {
  success: boolean;
  userId?: string;
  platformId?: string; // 平台特定的使用者 ID
  error?: string;
}

export interface BindResult {
  success: boolean;
  message?: string;
  error?: string;
}
```

**實作範例**：

```typescript
// src/adapters/telegram-auth.ts
export class TelegramAuthAdapter implements AuthAdapter {
  constructor(private env: Env) {}
  
  async verifyIdentity(authData: AuthData): Promise<IdentityResult> {
    // 驗證 Telegram initData
    const isValid = await verifyInitData(authData.initData, this.env.TELEGRAM_BOT_SECRET);
    if (!isValid) {
      return { success: false, error: 'Invalid initData' };
    }
    
    const userData = parseInitData(authData.initData);
    return {
      success: true,
      userId: userData.user.id.toString(),
      platformId: userData.user.id.toString(),
    };
  }
  
  async bindAccount(userId: string, authData: AuthData): Promise<BindResult> {
    // 綁定 Telegram 帳號（M1 階段可能不需要）
    return { success: true, message: 'Account bound' };
  }
}

// src/adapters/google-auth.ts（M2/M3 階段）
export class GoogleAuthAdapter implements AuthAdapter {
  // Google OAuth 實作
}

// src/adapters/apple-auth.ts（M3 階段）
export class AppleAuthAdapter implements AuthAdapter {
  // Apple Sign In 實作
}
```

**使用場景**：
- Mini App 登入：透過 `AuthAdapter` 驗證 Telegram `initData`
- 多平台帳號綁定：透過 `AuthAdapter` 綁定 Google / Apple / WeChat / Line 帳號
- 詳細設計見 `@doc/ROADMAP.md` M2/M3 階段和 `@doc/ONBOARDING_FLOW.md`

---

## 5. 模組間通信

### 5.1 依賴注入

```typescript
// ✅ 好的：通過參數傳遞依賴
export async function handleThrow(
  update: TelegramUpdate,
  env: Env,
  db: D1Database
): Promise<void> {
  // ...
}

// ❌ 不好的：使用全局變數
// const db = getDB(); // 不要這樣做
```

### 5.2 錯誤處理

```typescript
// Domain 層拋出業務錯誤
export class BusinessError extends Error {
  constructor(
    message: string,
    public readonly code: string
  ) {
    super(message);
  }
}

// Handler 層捕獲並處理
try {
  await handleThrow(update, env, db);
} catch (error) {
  if (error instanceof BusinessError) {
    await sendMessage(env, userId, error.message);
  } else {
    console.error('Unexpected error:', error);
    await sendMessage(env, userId, '發生錯誤，請稍後再試');
  }
}
```

---

## 6. 模組測試

### 6.1 Domain 層測試

```typescript
// tests/domain/usage.test.ts

import { describe, it, expect } from 'vitest';
import { getDailyThrowLimit, canThrowBottle } from '../../src/domain/usage';

describe('getDailyThrowLimit', () => {
  it('should return 3 for free user with no invites', () => {
    const user = {
      is_vip: 0,
      vip_expire_at: null,
      activated_invites: 0,
    };
    expect(getDailyThrowLimit(user, '2025-01-15')).toBe(3);
  });
  
  it('should return 10 for free user with 10 invites', () => {
    const user = {
      is_vip: 0,
      vip_expire_at: null,
      activated_invites: 10,
    };
    expect(getDailyThrowLimit(user, '2025-01-15')).toBe(10);
  });
  
  it('should return 30 for VIP user with no invites', () => {
    const user = {
      is_vip: 1,
      vip_expire_at: '2025-12-31T23:59:59Z',
      activated_invites: 0,
    };
    expect(getDailyThrowLimit(user, '2025-01-15')).toBe(30);
  });
});
```

### 6.2 Handler 層測試

```typescript
// tests/telegram/handlers/throw.test.ts

import { describe, it, expect, vi } from 'vitest';
import { handleThrow } from '../../src/telegram/handlers/throw';

describe('handleThrow', () => {
  it('should reject if user not found', async () => {
    const mockDb = {
      getUser: vi.fn().mockResolvedValue(null),
    };
    const mockEnv = {};
    const mockUpdate = {
      message: { from: { id: 123456789 } },
    };
    
    await handleThrow(mockUpdate, mockEnv, mockDb);
    
    expect(mockDb.getUser).toHaveBeenCalledWith('123456789');
    // 驗證 sendMessage 被調用
  });
});
```

---

## 7. 模組擴展

### 7.1 新增功能模組

1. 在 `domain/` 建立新檔案
2. 實作純函數邏輯
3. 編寫單元測試
4. 在 Handler 中調用

### 7.2 新增外部服務

1. 在 `services/` 建立新檔案
2. 封裝 API 調用
3. 處理錯誤和重試
4. 提供型別定義

---

## 8. 最佳實踐

1. **單一職責**：每個模組只負責一個明確的功能
2. **依賴注入**：通過參數傳遞依賴，不使用全局變數
3. **純函數優先**：Domain 層保持純函數，易於測試
4. **型別安全**：使用 TypeScript 嚴格模式
5. **錯誤處理**：明確的錯誤類型和處理流程
6. **文檔註釋**：複雜邏輯使用 JSDoc 註釋

