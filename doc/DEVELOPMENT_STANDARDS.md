# XunNi 開發規範

## 1. 目錄結構規範

### 1.1 標準目錄結構

```
XunNi/
├── src/                          # 源代碼目錄
│   ├── worker.ts                 # Cloudflare Worker 入口點
│   ├── router.ts                 # HTTP 路由處理器
│   ├── config/                   # 配置模組
│   │   ├── env.ts                # 環境變數驗證與讀取
│   │   └── constants.ts           # 常量定義
│   ├── db/                       # 資料庫層
│   │   ├── schema.sql            # D1 資料庫 Schema
│   │   ├── migrations/           # 資料庫遷移腳本
│   │   │   └── 001_initial.sql
│   │   └── client.ts             # D1 客戶端封裝
│   ├── domain/                   # 業務邏輯層（純函數，無副作用）
│   │   ├── user.ts               # 使用者領域邏輯
│   │   ├── usage.ts              # 使用次數限制邏輯
│   │   ├── risk.ts               # 風險分數與封禁邏輯
│   │   ├── matching.ts           # 漂流瓶匹配邏輯
│   │   ├── horoscope.ts          # 星座運勢邏輯
│   │   └── eligibility.ts        # 資格查詢邏輯
│   ├── telegram/                 # Telegram 相關
│   │   ├── types.ts              # Telegram API 型別定義
│   │   ├── client.ts             # Telegram Bot API 客戶端
│   │   ├── handlers/             # 指令處理器
│   │   │   ├── index.ts          # Handler 路由
│   │   │   ├── start.ts
│   │   │   ├── profile.ts
│   │   │   ├── throw.ts
│   │   │   ├── catch.ts
│   │   │   ├── msg_forward.ts
│   │   │   ├── report.ts
│   │   │   ├── appeal.ts
│   │   │   ├── vip.ts
│   │   │   ├── help.ts
│   │   │   ├── broadcast.ts
│   │   │   └── admin.ts
│   │   └── utils/                # Telegram 工具函數
│   │       ├── keyboard.ts       # 鍵盤生成
│   │       ├── validation.ts     # 訊息驗證
│   │       └── translation.ts    # 翻譯處理
│   ├── services/                 # 外部服務整合
│   │   ├── openai.ts             # OpenAI API 封裝
│   │   ├── gigapub.ts            # Gigapub 廣告 API
│   │   └── notification.ts      # 通知推送服務
│   ├── utils/                    # 通用工具函數
│   │   ├── date.ts               # 日期處理
│   │   ├── validation.ts         # 通用驗證
│   │   ├── url-whitelist.ts      # URL 白名單檢查
│   │   └── emoji.ts              # Emoji 處理
│   └── i18n/                     # 國際化
│       ├── index.ts              # i18n 初始化
│       ├── locales/              # 語言包
│       │   ├── zh-TW.ts
│       │   ├── en.ts
│       │   ├── ja.ts
│       │   └── ...
│       └── keys.ts               # 翻譯鍵值定義
├── tests/                        # 測試目錄
│   ├── domain/                   # Domain 層測試
│   │   ├── usage.test.ts
│   │   ├── risk.test.ts
│   │   ├── matching.test.ts
│   │   └── eligibility.test.ts
│   ├── telegram/                 # Telegram Handler 測試
│   │   └── handlers/
│   ├── utils/                    # 工具函數測試
│   └── fixtures/                 # 測試資料
│       └── telegram-updates.json
├── scripts/                      # 腳本目錄
│   ├── migrate.ts                # 資料庫遷移腳本
│   ├── seed.ts                   # 測試資料填充
│   └── backup.ts                 # 備份腳本
├── doc/                          # 文檔目錄
│   ├── SPEC.md                   # 專案規格書
│   ├── DEVELOPMENT_STANDARDS.md  # 本文件
│   ├── ENV_CONFIG.md             # 環境配置
│   ├── I18N_GUIDE.md             # i18n 指南
│   ├── MODULE_DESIGN.md          # 模組化設計
│   ├── TESTING.md                # 測試規範
│   ├── DEPLOYMENT.md             # 部署指南
│   └── BACKUP_STRATEGY.md        # 備份策略
├── .cursorrules                  # Cursor AI 規則
├── .gitignore
├── wrangler.toml                 # Cloudflare Workers 配置
├── package.json
├── tsconfig.json                 # TypeScript 配置
├── vitest.config.ts              # Vitest 配置
└── README.md
```

### 1.2 目錄命名規範

- **小寫字母 + 下劃線**：用於檔案名稱（如 `msg_forward.ts`）
- **小寫字母 + 連字號**：用於目錄名稱（如 `telegram-handlers`，但本專案統一使用 `handlers`）
- **PascalCase**：用於類別和型別定義檔案（如 `types.ts` 內含 `TelegramUpdate`）

---

## 2. 代碼規範

### 2.1 TypeScript 規範

#### 2.1.1 型別定義

```typescript
// ✅ 好的：使用 interface 定義物件結構
interface User {
  telegram_id: string;
  nickname: string;
  is_vip: number; // 0/1，對應 SQLite INTEGER
  vip_expire_at: string | null; // ISO 8601 datetime string
}

// ✅ 好的：使用 type 定義聯合型別或別名
type UserRole = 'user' | 'admin' | 'god' | 'angel';
type BottleStatus = 'pending' | 'matched' | 'expired' | 'deleted';

// ✅ 好的：使用 enum 定義常量集合（僅當需要枚舉值時）
enum ZodiacSign {
  ARIES = 'aries',
  TAURUS = 'taurus',
  // ...
}
```

#### 2.1.2 函數定義

```typescript
// ✅ 好的：純函數，明確的參數和返回值型別
export function getDailyThrowLimit(user: User, today: string): number {
  // ...
}

// ✅ 好的：異步函數使用 async/await
export async function getUser(telegramId: string): Promise<User | null> {
  // ...
}

// ✅ 好的：使用 JSDoc 註釋說明複雜函數
/**
 * 檢查使用者是否可以丟漂流瓶
 * @param user - 使用者物件
 * @param today - 今天的日期字串 (YYYY-MM-DD)
 * @param usage - 今日使用記錄，可能為 null
 * @returns 是否可以丟瓶
 */
export function canThrowBottle(
  user: User,
  today: string,
  usage: DailyUsage | null
): boolean {
  // ...
}
```

#### 2.1.3 錯誤處理

```typescript
// ✅ 好的：定義自定義錯誤類別
export class DatabaseError extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message);
    this.name = 'DatabaseError';
  }
}

// ✅ 好的：使用 Result 模式處理可能失敗的操作
type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

export async function fetchUser(id: string): Promise<Result<User, DatabaseError>> {
  try {
    const user = await db.getUser(id);
    if (!user) {
      return { success: false, error: new DatabaseError('User not found', 'NOT_FOUND') };
    }
    return { success: true, data: user };
  } catch (error) {
    return { success: false, error: new DatabaseError(String(error)) };
  }
}
```

### 2.2 命名規範

#### 2.2.1 變數與函數

```typescript
// ✅ 好的：使用 camelCase
const userTelegramId = '123456789';
const dailyThrowLimit = getDailyThrowLimit(user, today);

// ✅ 好的：布林值使用 is/has/can/should 前綴
const isVipActive = user.is_vip === 1 && user.vip_expire_at > now;
const hasCompletedOnboarding = !!user.mbti_type && user.trust_level >= 1;
const canThrowBottle = dailyThrowLimit > usedCount;

// ✅ 好的：異步函數使用動詞開頭
async function fetchUser(id: string) { }
async function createBottle(ownerId: string, content: string) { }
async function updateUserProfile(userId: string, data: Partial<User>) { }
```

#### 2.2.2 常數

```typescript
// ✅ 好的：使用 UPPER_SNAKE_CASE
const MAX_BOTTLE_CONTENT_LENGTH = 500;
const FREE_DAILY_THROW_BASE = 3;
const VIP_DAILY_THROW_BASE = 30;
const DEFAULT_BAN_HOURS = 24;

// ✅ 好的：相關常數使用物件組織
const THROW_LIMITS = {
  FREE_BASE: 3,
  FREE_MAX: 10,
  VIP_BASE: 30,
  VIP_MAX: 100,
  INVITE_BONUS_MAX_FREE: 7,
  INVITE_BONUS_MAX_VIP: 70,
} as const;
```

#### 2.2.3 檔案與模組

```typescript
// ✅ 好的：檔案名稱使用小寫 + 下劃線
// src/domain/usage.ts
// src/telegram/handlers/msg_forward.ts

// ✅ 好的：模組導出使用 named export
export function getDailyThrowLimit() { }
export function canThrowBottle() { }
export type { User, DailyUsage };

// ✅ 好的：預設導出僅用於主要入口或單一類別
// src/worker.ts
export default { fetch: handleRequest };
```

### 2.3 模組化設計原則

#### 2.3.1 單一職責原則

每個模組只負責一個明確的功能：

```typescript
// ✅ 好的：usage.ts 只處理使用次數相關邏輯
// src/domain/usage.ts
export function getDailyThrowLimit() { }
export function canThrowBottle() { }
export function recordThrow() { }

// ❌ 不好的：混雜多種職責
// export function getDailyThrowLimit() { }
// export function applyBan() { } // 應該在 risk.ts
// export function matchBottle() { } // 應該在 matching.ts
```

#### 2.3.2 依賴注入

```typescript
// ✅ 好的：通過參數注入依賴
export async function getUser(
  db: D1Database,
  telegramId: string
): Promise<User | null> {
  // ...
}

// ❌ 不好的：直接使用全局變數
// const db = getDB(); // 不要這樣做
```

#### 2.3.3 純函數優先

Domain 層函數應盡量保持純函數（無副作用）：

```typescript
// ✅ 好的：純函數，易於測試
export function getDailyThrowLimit(user: User, today: string): number {
  const invites = user.activated_invites || 0;
  const now = new Date();
  
  if (isVipActive(user, now)) {
    return Math.min(30 + Math.min(invites, 70), 100);
  }
  return Math.min(3 + Math.min(invites, 7), 10);
}

// ❌ 不好的：有副作用，難以測試
// export function getDailyThrowLimit(user: User): number {
//   const invites = await db.getInvites(user.telegram_id); // 副作用
//   // ...
// }
```

### 2.4 註釋規範

```typescript
// ✅ 好的：使用 JSDoc 註釋複雜邏輯
/**
 * 計算使用者的每日漂流瓶上限
 * 
 * 規則：
 * - 免費使用者：基礎 3 個，每邀請 1 人 +1，上限 10
 * - VIP 使用者：基礎 30 個，每邀請 1 人 +1，上限 100
 * 
 * @param user - 使用者物件，需包含 is_vip、vip_expire_at、activated_invites
 * @param today - 今天的日期字串 (YYYY-MM-DD)，目前未使用但保留以備未來擴展
 * @returns 每日可丟瓶數上限
 */
export function getDailyThrowLimit(user: User, today: string): number {
  // ...
}

// ✅ 好的：行內註釋解釋「為什麼」而非「做什麼」
// 使用 Math.min 確保不超過上限，避免邀請數異常導致計算錯誤
const bonus = Math.min(invites, 70);

// ❌ 不好的：註釋只是重複代碼
// const limit = getDailyThrowLimit(user, today); // 獲取每日丟瓶上限
```

---

## 3. 資料庫規範

### 3.1 命名規範

- **表名**：小寫，複數形式（如 `users`, `bottles`, `conversations`）
- **欄位名**：小寫 + 下劃線（如 `telegram_id`, `is_vip`, `vip_expire_at`）
- **索引名**：`idx_表名_欄位名`（如 `idx_users_telegram_id`）

### 3.2 遷移腳本

所有資料庫變更必須通過遷移腳本：

```sql
-- migrations/001_initial.sql
CREATE TABLE users (
  -- ...
);

-- migrations/002_add_horoscope_opt_in.sql
ALTER TABLE users ADD COLUMN horoscope_opt_in INTEGER DEFAULT 0;
```

---

## 4. Git 提交規範

使用 [Conventional Commits](https://www.conventionalcommits.org/)：

```
feat: 新增 VIP 翻譯功能
fix: 修復每日次數計算錯誤
docs: 更新 API 文檔
test: 新增 usage.test.ts
refactor: 重構 matching.ts 匹配邏輯
chore: 更新依賴版本
```

---

## 5. 參考資源

- [TypeScript 官方文檔](https://www.typescriptlang.org/docs/)
- [Cloudflare Workers 文檔](https://developers.cloudflare.com/workers/)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Vitest 文檔](https://vitest.dev/)
- [Conventional Commits](https://www.conventionalcommits.org/)

