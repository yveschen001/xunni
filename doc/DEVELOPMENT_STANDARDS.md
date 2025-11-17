# XunNi 開發規範

> **在閱讀本文檔前，請先閱讀 `@doc/SPEC.md`（包含專案概覽和結構）。**

## 1. 目錄結構規範

### 1.1 標準目錄結構

```
XunNi/
├── src/                          # 源代碼目錄（@src/）
│   ├── worker.ts                 # Cloudflare Worker 入口點（@src/worker.ts）
│   ├── router.ts                 # HTTP 路由處理器（@src/router.ts）
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

> **所有命名規範必須嚴格遵守，不一致的命名將導致代碼審查失敗。**

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

**提交前檢查**：
- 執行 `pnpm test` 確保測試通過
- 執行 `pnpm lint` 確保代碼風格正確
- 檢查是否有文檔需要更新（見 5.3 節）

---

## 5. 與 AI 協作流程（Working with Cursor / AI changes）

### 5.1 非簡單變更的流程

**對於任何非簡單的變更（例如修改業務邏輯、資料庫結構、核心功能），請遵循以下流程：**

1. **總結當前行為**：
   - 請 AI 先總結當前的行為（涉及的文件和邏輯）
   - 確認理解現有實現

2. **規劃變更**：
   - 用 3–5 個要點規劃變更方案
   - 明確變更的範圍和影響
   - 確認是否需要更新文檔

3. **執行變更**：
   - 在規劃確認後，再讓 AI 編輯代碼
   - 一次只處理一個變更點，避免一次性修改過多

4. **驗證變更**：
   - 執行 `pnpm test` 確保測試通過
   - 執行 `pnpm lint` 確保代碼風格正確
   - 如有資料庫變更，檢查並更新 `@doc/SPEC.md`

### 5.2 變更後的檢查

**變更完成後，必須執行：**

- ✅ 執行 `pnpm test` 確保所有測試通過
- ✅ 執行 `pnpm lint` 檢查代碼風格
- ✅ 如有資料庫 Schema 變更，檢查 `@doc/SPEC.md` 第 3 節並更新
- ✅ 如有業務邏輯變更，檢查 `@doc/SPEC.md` 相關章節並更新
- ✅ 如有新功能，檢查術語表並添加新術語定義（如需要）

### 5.3 文檔更新原則

**變更代碼時，同步更新文檔：**

- **資料庫變更**：更新 `@doc/SPEC.md` 第 3 節「資料庫 Schema」
- **業務邏輯變更**：更新 `@doc/SPEC.md` 相關業務邏輯章節
- **新增功能**：更新 `@doc/SPEC.md` 相應章節和術語表（如需要）
- **環境變數變更**：更新 `@doc/ENV_CONFIG.md`

**不要**：
- ❌ 僅更新代碼而不更新文檔
- ❌ 發明新的業務規則而不記錄在 `@doc/SPEC.md` 中
- ❌ 使用未在術語表中定義的新術語

---

## 6. 安全開發與防止改壞（Critical: Prevent Breaking Changes）

### 6.1 部署前必須檢查清單（Deployment Checklist）

**在部署到 Staging 或 Production 前，必須完成以下所有檢查：**

#### 資料庫檢查
- [ ] **確認 remote 資料庫 schema 是否最新**
  - 檢查所有 migration 是否已在 remote 執行
  - 執行 `npx wrangler d1 execute <db-name> --command="SELECT name FROM sqlite_master WHERE type='table';" --remote` 確認表存在
  - 特別檢查新增的表和欄位

#### 代碼檢查
- [ ] **執行 `pnpm lint`** - 確保 0 錯誤，警告數量未增加
- [ ] **執行 `pnpm test`** - 確保所有測試通過
- [ ] **檢查是否使用了正確的工具函數**
  - 例如：暱稱擾碼使用 `maskNickname` 而不是 `maskSensitiveValue`
  - 確認函數名稱和用途一致

#### 業務邏輯檢查
- [ ] **確認計算邏輯符合業務定義**
  - 百分比數據必須在 0-100% 之間
  - 匹配成功率 = `(對話數 / 丟出瓶子數) * 100`，上限 100%
  - 所有比率計算都要加上 `Math.min(100, ...)` 限制
- [ ] **核對 SPEC.md 確認完整需求**
  - 例如：確認支援 34 種語言，不是 20 種
  - 確認欄位定義（如 `zh-TW` 應該是 "Traditional Chinese (Taiwan)"）

#### 功能完整性檢查
- [ ] **執行完整的 Smoke Test**
  - 測試所有核心命令（`/start`, `/profile`, `/throw`, `/catch`, `/stats` 等）
  - 測試對話流程（發送訊息、查看資料卡片）
  - 測試新增功能的完整流程
- [ ] **檢查 UI 顯示**
  - 暱稱擾碼格式正確（`張小明` → `張**`，不是 `****`）
  - 統計數據合理（百分比 0-100%）
  - 按鈕和提示文字正確顯示

#### 文檔檢查
- [ ] **確認 SPEC.md 已更新**（如有業務邏輯或資料庫變更）
- [ ] **確認相關文檔已同步更新**

### 6.2 常見錯誤與預防（Common Mistakes & Prevention）

#### 錯誤 1：資料庫 Migration 未在 Remote 執行
**症狀：** 部署後出現 `no such table` 或 `no such column` 錯誤

**預防措施：**
1. Migration 寫完後，立即在 remote 執行：
   ```bash
   npx wrangler d1 execute <db-name> --file=src/db/migrations/XXXX.sql --env staging --remote
   ```
2. 部署前確認表存在：
   ```bash
   npx wrangler d1 execute <db-name> --command="SELECT name FROM sqlite_master WHERE type='table';" --env staging --remote
   ```
3. 在部署檢查清單中加入此項

**修復方法：**
- 手動執行 migration SQL
- 或使用 `--command` 直接執行 CREATE TABLE

#### 錯誤 2：使用了錯誤的工具函數
**症狀：** 暱稱顯示為 `****` 而不是 `張**`

**預防措施：**
1. 統一使用 `maskNickname` 函數處理暱稱擾碼
2. 代碼審查時檢查函數名稱和用途是否一致
3. 添加單元測試驗證擾碼格式

**修復方法：**
```typescript
// 錯誤
import { maskSensitiveValue } from '~/utils/mask';
const nickname = maskSensitiveValue(user.nickname);

// 正確
import { maskNickname } from '~/domain/invite';
const nickname = maskNickname(user.nickname || '匿名');
```

#### 錯誤 3：計算邏輯錯誤導致數據超出合理範圍
**症狀：** 匹配成功率顯示 200%

**預防措施：**
1. 所有百分比計算都要加上 `Math.min(100, ...)` 限制
2. 確認計算邏輯符合業務定義
3. 添加單元測試驗證數據範圍

**修復方法：**
```typescript
// 錯誤：可能超過 100%
const matchRate = thrown > 0 ? Math.round((caught / thrown) * 100) : 0;

// 正確：限制在 100% 以內
const matchRate = thrown > 0 ? Math.min(100, Math.round((conversations / thrown) * 100)) : 0;
```

#### 錯誤 4：語言映射不完整
**症狀：** 部分語言無法正確翻譯或顯示

**預防措施：**
1. 修改前先查看 SPEC.md 確認完整需求（34 種語言）
2. 確保所有語言服務使用相同的語言列表
3. 添加測試驗證所有語言都有映射

**檢查位置：**
- `src/i18n/languages.ts` - 語言列表（應該有 34 種）
- `src/services/gemini.ts` - Gemini 翻譯語言映射
- `src/services/translation/openai.ts` - OpenAI 翻譯語言映射

#### 錯誤 5：Smoke Test 不完整
**症狀：** 部署後才發現功能損壞

**預防措施：**
1. Smoke Test 必須覆蓋所有核心功能
2. 每次新增功能都要更新 Smoke Test
3. 部署前必須執行完整的 Smoke Test

**Smoke Test 必須包含：**
- [ ] 所有核心命令（`/start`, `/profile`, `/throw`, `/catch`, `/stats`, `/vip`, `/menu`）
- [ ] 對話流程（發送訊息、查看資料卡片、回覆）
- [ ] 邀請流程（生成邀請碼、使用邀請碼、激活邀請）
- [ ] 統計數據合理性（百分比 0-100%）
- [ ] UI 顯示正確性（暱稱擾碼、按鈕、提示）

### 6.3 修改代碼的安全流程（Safe Code Modification Process）

**遵循以下流程，避免改壞已有功能：**

#### Step 1: 理解現有實現
1. **閱讀相關代碼**
   - 找出所有相關文件
   - 理解現有邏輯和數據流
2. **查看 SPEC.md**
   - 確認業務規則和定義
   - 檢查術語表確保理解正確
3. **查看測試**
   - 了解現有測試覆蓋了什麼
   - 確認預期行為

#### Step 2: 規劃變更
1. **列出變更範圍**
   - 需要修改哪些文件
   - 會影響哪些功能
2. **確認依賴關係**
   - 哪些函數會調用這個函數
   - 修改後會影響哪些地方
3. **規劃測試**
   - 需要新增哪些測試
   - 需要更新哪些測試

#### Step 3: 執行變更
1. **一次只改一個地方**
   - 避免同時修改多個文件
   - 每次修改後立即測試
2. **保持一致性**
   - 如果修改了函數簽名，確保所有調用處都更新
   - 如果修改了資料庫 schema，確保所有查詢都更新
3. **添加註釋**
   - 解釋為什麼這樣修改
   - 標註業務邏輯的關鍵點

#### Step 4: 驗證變更
1. **執行測試**
   ```bash
   pnpm test        # 單元測試
   pnpm lint        # 代碼檢查
   ```
2. **執行 Smoke Test**
   ```bash
   npx tsx scripts/smoke-test.ts
   ```
3. **手動測試**
   - 測試修改的功能
   - 測試相關的功能（確保沒有改壞）

#### Step 5: 更新文檔
1. **更新 SPEC.md**（如有業務邏輯或資料庫變更）
2. **更新相關文檔**（ENV_CONFIG.md, TESTING.md 等）
3. **記錄變更**（CHANGELOG.md）

### 6.4 代碼審查重點（Code Review Checklist）

**在提交代碼前，自我審查以下項目：**

#### 功能正確性
- [ ] 業務邏輯符合 SPEC.md 定義
- [ ] 計算公式正確（特別是百分比、比率）
- [ ] 數據範圍合理（百分比 0-100%）
- [ ] 錯誤處理完整

#### 代碼品質
- [ ] 使用正確的工具函數
- [ ] 函數命名清晰，用途明確
- [ ] 沒有重複代碼
- [ ] 沒有 `console.log`（只允許 `console.error`）
- [ ] 沒有 `any` 類型（除非必要）

#### 測試覆蓋
- [ ] 新功能有單元測試
- [ ] 修改的功能測試已更新
- [ ] Smoke Test 已更新（如需要）
- [ ] 所有測試通過

#### 文檔同步
- [ ] SPEC.md 已更新（如需要）
- [ ] 相關文檔已更新
- [ ] 註釋清晰，解釋了關鍵邏輯

### 6.5 緊急修復流程（Hotfix Process）

**如果發現 Production 有嚴重問題，遵循以下流程：**

1. **立即回滾**（如果可能）
   ```bash
   # 回滾到上一個版本
   npx wrangler rollback --env production
   ```

2. **在 Staging 修復並測試**
   - 不要直接在 Production 修復
   - 在 Staging 完整測試後再部署

3. **記錄問題和修復**
   - 在 `doc/HOTFIX_LOG.md` 記錄問題
   - 分析根本原因
   - 更新預防措施到本文檔

4. **更新檢查清單**
   - 將新的檢查項目加入部署檢查清單
   - 更新 Smoke Test 覆蓋此問題

---

## 7. 參考資源

### 內部文檔

- `@doc/SPEC.md` - 專案規格書（**必讀**，包含專案概覽、完整規格、**術語表**和**開發前準備**）
- `@doc/ENV_CONFIG.md` - 開發環境設置指南（包含**開發前檢查清單**和**假資料策略**）
- `@doc/DEVELOPMENT_STANDARDS.md` - 開發規範（包含**AI 協作流程**和**安全開發流程**）
- `@doc/MODULE_DESIGN.md` - 模組化設計
- `@doc/I18N_GUIDE.md` - 國際化指南
- `@doc/TESTING.md` - 測試規範
- `@doc/UI_GUIDELINE.md` - UI 設計指南（Mini App 開發時必讀，包含動畫規範、Loading 狀態、配對動畫等）

### 外部資源

- [TypeScript 官方文檔](https://www.typescriptlang.org/docs/)
- [Cloudflare Workers 文檔](https://developers.cloudflare.com/workers/)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Vitest 文檔](https://vitest.dev/)
- [Conventional Commits](https://www.conventionalcommits.org/)

---

**最後更新**: 2025-01-15

