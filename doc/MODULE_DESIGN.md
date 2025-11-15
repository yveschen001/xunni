# XunNi 模組化設計指南

## 1. 架構原則

### 1.1 分層架構

```
┌─────────────────────────────────────┐
│      Telegram Handlers (API 層)      │
├─────────────────────────────────────┤
│      Domain Logic (業務邏輯層)       │
├─────────────────────────────────────┤
│      Database Client (數據層)        │
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

#### 2.1.5 account-linker.ts - 帳號綁定（預留，M2/M3 階段）

**當前階段（M1）**：
- 僅使用 Telegram `initData` 驗簽
- 無需多平台帳號綁定

**未來擴展（M2/M3）**：
- 處理多平台帳號綁定（Google、Apple、WeChat、Line）
- 管理帳號身份（account_identities）
- 合併同一使用者的多個帳號身份
- 詳細設計請參考：ROADMAP.md

#### 2.1.6 translation-policy.ts - 翻譯策略

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

### 2.4 Handlers 層

#### 2.4.1 handlers/*.ts - 指令處理器

**職責**：
- 處理 Telegram 指令
- 調用 Domain 層邏輯
- 格式化回應訊息

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

## 3. 模組間通信

### 3.1 依賴注入

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

### 3.2 錯誤處理

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

## 4. 模組測試

### 4.1 Domain 層測試

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

### 4.2 Handler 層測試

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

## 5. 模組擴展

### 5.1 新增功能模組

1. 在 `domain/` 建立新檔案
2. 實作純函數邏輯
3. 編寫單元測試
4. 在 Handler 中調用

### 5.2 新增外部服務

1. 在 `services/` 建立新檔案
2. 封裝 API 調用
3. 處理錯誤和重試
4. 提供型別定義

---

## 6. 最佳實踐

1. **單一職責**：每個模組只負責一個明確的功能
2. **依賴注入**：通過參數傳遞依賴，不使用全局變數
3. **純函數優先**：Domain 層保持純函數，易於測試
4. **型別安全**：使用 TypeScript 嚴格模式
5. **錯誤處理**：明確的錯誤類型和處理流程
6. **文檔註釋**：複雜邏輯使用 JSDoc 註釋

