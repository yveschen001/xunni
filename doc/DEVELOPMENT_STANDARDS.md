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

## 3. Telegram API 使用規範

> **⚠️ 重要**：這是反覆出現錯誤的高風險區域，請務必遵守以下規則

### 3.1 Markdown Parse Mode 使用規則

**黃金規則**：
> **使用者內容 + parse_mode = 💥 潛在錯誤**

#### ✅ 可以使用 `parse_mode` 的情況

**只有系統生成的固定文字**，不包含任何使用者輸入：

```typescript
// ✅ 安全：純系統訊息
await telegram.sendMessage(chatId, 
  '🎉 *恭喜你完成註冊！*\n\n使用 /help 查看指令',
  { parse_mode: 'Markdown' }
);
```

#### ❌ 絕對不可使用 `parse_mode` 的情況

**包含任何使用者輸入的內容**（暱稱、簡介、興趣、城市等）：

```typescript
// ❌ 危險：包含使用者暱稱
await telegram.sendMessage(chatId, 
  `你好，*${user.nickname}*！`,  // user.nickname 可能包含 _ * [ ] 等特殊字符
  { parse_mode: 'Markdown' }  // 💥 會導致 "Can't parse entities" 錯誤
);

// ✅ 安全：不使用 parse_mode
await telegram.sendMessage(chatId, 
  `你好，${user.nickname}！`
);
```

#### 常見錯誤案例

**錯誤 #1**：以為 emoji 需要 Markdown
```typescript
// ❌ 錯誤：emoji 不需要 Markdown
await telegram.sendMessage(chatId, 
  `🇹🇼 ${user.nickname}`,
  { parse_mode: 'Markdown' }  // 不需要！emoji 是 Unicode 字符
);

// ✅ 正確
await telegram.sendMessage(chatId, 
  `🇹🇼 ${user.nickname}`
);
```

**錯誤 #2**：照片 caption 包含使用者內容
```typescript
// ❌ 危險
await telegram.sendPhoto(chatId, photoUrl, {
  caption: `📝 暱稱：${user.nickname}\n📖 簡介：${user.bio}`,
  parse_mode: 'Markdown'  // 💥 如果 bio 包含特殊字符就會失敗
});

// ✅ 安全
await telegram.sendPhoto(chatId, photoUrl, {
  caption: `📝 暱稱：${user.nickname}\n📖 簡介：${user.bio}`
});
```

### 3.2 檢查清單

在發送任何 Telegram 訊息前：

- [ ] 訊息是否包含使用者輸入的內容？
- [ ] 如果包含使用者內容，是否**沒有**使用 `parse_mode`？
- [ ] 如果使用 `parse_mode`，是否確保訊息中**只有**系統固定文字？
- [ ] 是否誤以為 emoji 需要 Markdown？（不需要！）

### 3.3 相關文檔

詳細說明請參考：`@doc/TELEGRAM_API_SAFETY_GUIDE.md`

---

## 4. 資料庫規範

### 4.1 命名規範

- **表名**：小寫，複數形式（如 `users`, `bottles`, `conversations`）
- **欄位名**：小寫 + 下劃線（如 `telegram_id`, `is_vip`, `vip_expire_at`）
- **索引名**：`idx_表名_欄位名`（如 `idx_users_telegram_id`）

### 4.2 遷移腳本

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

## 5. Git 提交規範

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
- 檢查是否有文檔需要更新（見 6.3 節）

---

## 6. 與 AI 協作流程（Working with Cursor / AI changes）

### 6.1 非簡單變更的流程

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
   - **新增/修改功能必須執行 Local Simulation** (`scripts/local-simulation.ts`)
   - 執行 `pnpm lint` 確保代碼風格正確
   - 如有資料庫變更，檢查並更新 `@doc/SPEC.md`

### 6.2 變更後的檢查

**變更完成後，必須執行：**

- ✅ 執行 `pnpm test` 確保所有測試通過
- ✅ **執行 Local Simulation 確保關鍵路徑無誤**
- ✅ 執行 `pnpm lint` 檢查代碼風格
- ✅ 如有資料庫 Schema 變更，檢查 `@doc/SPEC.md` 第 3 節並更新
- ✅ 如有業務邏輯變更，檢查 `@doc/SPEC.md` 相關章節並更新
- ✅ 如有新功能，檢查術語表並添加新術語定義（如需要）

### 6.3 文檔更新原則

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

## 7. 安全開發與防止改壞（Critical: Prevent Breaking Changes）

### 7.1 部署前必須檢查清單（Deployment Checklist）

**在部署到 Staging 或 Production 前，必須完成以下所有檢查：**

#### 資料庫檢查
- [ ] **確認 remote 資料庫 schema 是否最新**
  - 檢查所有 migration 是否已在 remote 執行
  - 執行 `npx wrangler d1 execute <db-name> --command="SELECT name FROM sqlite_master WHERE type='table';" --remote` 確認表存在
  - 特別檢查新增的表和欄位

#### 代碼檢查
- [ ] **執行 `pnpm format`** - 自動格式化代碼，確保縮進和格式一致
- [ ] **執行 `pnpm lint`** - 確保 0 錯誤，警告數量未增加
- [ ] **執行 `pnpm test`** - 確保所有測試通過
- [ ] **執行 Schema 一致性檢查** - 確保代碼中使用的欄位存在於資料庫中
  ```bash
  # 檢查是否使用了不存在的欄位
  grep -r "\.is_super_admin" src/telegram/handlers/
  grep -r "\.is_admin" src/telegram/handlers/ | grep -v "function isAdmin"
  ```
  - 正確：使用 `user.role === 'god'` 檢查超級管理員
  - 錯誤：使用 `user.is_super_admin`（欄位不存在）
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
- [ ] **執行完整的 Local Simulation (強制)**
  - 執行 `./scripts/run-local-sim.sh user/admin/super_admin`
  - 確保覆蓋新增功能的 Create/Read/Edit/Delete 完整流程
  - 確保所有測試通過且無報錯
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

#### 新功能檢查（New Feature Checklist）
**如果新增了命令或功能，必須完成以下檢查：**

- [ ] **路由配置**
  - 在 `src/router.ts` 中註冊新命令
  - 檢查權限控制（一般用戶/管理員/超級管理員）
  - 測試命令是否正確路由到處理器

- [ ] **命令文檔更新**
  - 更新 `src/telegram/handlers/help.ts` 中的 `/help` 命令
  - 更新 `src/telegram/handlers/help.ts` 中的 `/rules` 命令（如需要）
  - 確保不同角色看到正確的命令列表

- [ ] **Smoke Test 更新**
  - 在 `SMOKE_TEST_COVERAGE_REPORT.md` 中添加新功能測試項
  - 更新 `scripts/e2e-test.sh` 添加路由檢查
  - 確保新命令在測試覆蓋範圍內

- [ ] **i18n 翻譯**
  - 添加新的翻譯 key 到 `src/i18n/keys.ts`
  - 更新所有語言的翻譯文件
  - 測試不同語言下的顯示

- [ ] **部署後驗證**
  - 真實測試所有新命令
  - 檢查 Worker 日誌無錯誤
  - 測試不同角色的權限

### 7.2 常見錯誤與預防（Common Mistakes & Prevention）

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

#### 錯誤 6：Telegram sendPhoto 使用 parse_mode 導致解析錯誤
**症狀：** `Bad Request: can't parse entities: Can't find end of the entity starting at byte offset XXX`

**根本原因：**
- 在 `sendPhoto` 的 `caption` 中使用了 `parse_mode: 'Markdown'`
- 但 caption 文字中的 Markdown 符號（如 `**`、`_`、`[`）沒有正確配對
- Telegram 無法解析這些不完整的 Markdown 標記

**預防措施：**
1. **避免在 caption 中使用 `parse_mode`**，除非確定文字完全符合 Markdown 格式
2. 如果文字中有特殊符號（`**`、`_`、`[`、`]`、`(`、`)`），要麼：
   - 不使用 `parse_mode`（推薦）
   - 或正確轉義所有特殊符號
3. 優先使用純文字 + Emoji，避免複雜的格式化

**錯誤示例：**
```typescript
// ❌ 錯誤：caption 中有不配對的 ** 符號
await telegram.sendPhoto(chatId, photoUrl, {
  caption: '👤 **對方的資料卡**\n\n📝 暱稱：張**\n',
  parse_mode: 'Markdown'  // 會導致解析錯誤！
});
```

**正確做法：**
```typescript
// ✅ 方案 1：不使用 parse_mode（推薦）
await telegram.sendPhoto(chatId, photoUrl, {
  caption: '👤 **對方的資料卡**\n\n📝 暱稱：張**\n'
  // 不使用 parse_mode，** 符號作為普通文字顯示
});

// ✅ 方案 2：使用純文字 + Emoji
await telegram.sendPhoto(chatId, photoUrl, {
  caption: '👤 對方的資料卡\n\n📝 暱稱：張**\n'
});

// ✅ 方案 3：正確轉義（複雜，不推薦）
await telegram.sendPhoto(chatId, photoUrl, {
  caption: '👤 \\*\\*對方的資料卡\\*\\*\n\n📝 暱稱：張\\*\\*\n',
  parse_mode: 'Markdown'
});
```

**檢查位置：**
- 所有使用 `sendPhoto`、`sendMessage`、`editMessageText` 的地方
- 特別注意帶有用戶輸入內容的 caption/text

**相關案例：**
- `src/telegram/handlers/conversation_actions.ts` - 資料卡頭像顯示
- `src/services/conversation_history.ts` - 對話歷史帖子

#### 錯誤 7：誤刪 Session 邏輯導致狀態追蹤失效
**症狀：** 用戶操作無法正確識別，系統無法記住用戶正在進行的操作

**為什麼需要 Session？**
1. **存儲配置信息**：`target_gender`、`target_mbti_filter`、`target_zodiac_filter` 等用戶選擇
2. **追蹤用戶狀態**：知道用戶正在進行什麼操作（丟瓶子、編輯資料、回覆訊息等）
3. **防止操作衝突**：確保不會誤判用戶輸入的意圖
4. **支持多步驟流程**：允許用戶在多個步驟中完成複雜操作

**⚠️ 絕對不要刪除以下 Session 相關邏輯：**

```typescript
// ❌ 錯誤：刪除 session 創建邏輯
// 這會導致無法追蹤用戶狀態！
export async function handleThrow(message: TelegramMessage, env: Env): Promise<void> {
  // ... 省略前面的代碼 ...
  
  // ❌ 錯誤：沒有創建 session
  await telegram.sendMessage(chatId, '請輸入瓶子內容');
}

// ✅ 正確：必須創建 session
export async function handleThrow(message: TelegramMessage, env: Env): Promise<void> {
  // ... 省略前面的代碼 ...
  
  const targetGender = getTargetGender(user);
  
  // ✅ 必須創建 session 來存儲配置和狀態
  const { createSession } = await import('~/db/queries/sessions');
  await createSession(db, telegramId, 'throw_bottle', {
    target_gender: targetGender,
  });
  
  await telegram.sendMessage(chatId, '請輸入瓶子內容 #THROW');
}
```

```typescript
// ❌ 錯誤：刪除 router 中的 session 檢查
// 這會導致無法提示用戶正確操作！
export async function routeUpdate(update: TelegramUpdate, env: Env): Promise<void> {
  // ... 省略前面的代碼 ...
  
  // ❌ 錯誤：沒有檢查 session
  await telegram.sendMessage(chatId, '未知命令');
}

// ✅ 正確：必須檢查 session
export async function routeUpdate(update: TelegramUpdate, env: Env): Promise<void> {
  // ... 省略前面的代碼 ...
  
  // ✅ 必須檢查 throw_bottle session
  const { getActiveSession } = await import('./db/queries/sessions');
  const throwSession = await getActiveSession(db, user.telegram_id, 'throw_bottle');
  
  if (throwSession) {
    // 提示用戶使用正確的操作方式
    await telegram.sendMessage(
      chatId,
      '❓ 要丟漂流瓶？\n\n' +
        '請長按上一則訊息，或本訊息，\n' +
        '選單上選擇「回覆」後，\n' +
        '輸入要發送的漂流瓶內容\n\n' +
        '#THROW'
    );
    return;
  }
  
  // 其他未知命令處理...
}
```

```typescript
// ❌ 錯誤：刪除 processBottleContent 中的 session 讀取
// 這會導致無法獲取用戶的配置信息！
export async function processBottleContent(user: User, content: string, env: Env): Promise<void> {
  // ❌ 錯誤：沒有讀取 session
  const target_gender = 'any'; // 硬編碼，無法使用用戶選擇
}

// ✅ 正確：必須從 session 讀取配置
export async function processBottleContent(user: User, content: string, env: Env): Promise<void> {
  // ✅ 必須讀取 session 獲取用戶配置
  const { getActiveSession } = await import('~/db/queries/sessions');
  const { parseSessionData } = await import('~/domain/session');
  const session = await getActiveSession(db, user.telegram_id, 'throw_bottle');
  
  let target_gender: 'male' | 'female' | 'any' = 'any';
  let target_mbti_filter: string[] = [];
  let target_zodiac_filter: string[] = [];
  
  if (session) {
    const sessionData = parseSessionData(session);
    target_gender = sessionData.data?.target_gender || 'any';
    target_mbti_filter = sessionData.data?.target_mbti || [];
    target_zodiac_filter = sessionData.data?.target_zodiac || [];
  }
  
  // 使用這些配置創建瓶子...
}
```

```typescript
// ❌ 錯誤：忘記清除 session
// 這會導致用戶下次操作時還處於舊狀態！
export async function processBottleContent(user: User, content: string, env: Env): Promise<void> {
  // ... 創建瓶子 ...
  
  // ❌ 錯誤：沒有清除 session
  await telegram.sendMessage(chatId, '瓶子已丟出！');
}

// ✅ 正確：操作完成後必須清除 session
export async function processBottleContent(user: User, content: string, env: Env): Promise<void> {
  // ... 創建瓶子 ...
  
  // ✅ 必須清除 session
  const { clearSession } = await import('~/db/queries/sessions');
  await clearSession(db, user.telegram_id, 'throw_bottle');
  
  await telegram.sendMessage(chatId, '瓶子已丟出！');
}
```

**完整的 Session 生命週期：**
1. **創建 Session**：在 `handleThrow` 等命令處理器中創建
2. **檢查 Session**：在 `router.ts` 中檢查用戶狀態，提供正確提示
3. **讀取 Session**：在 `processBottleContent` 等處理函數中讀取配置
4. **清除 Session**：操作完成後立即清除，避免狀態殘留

**預防措施：**
1. ✅ 修改代碼前先搜索 `createSession`、`getActiveSession`、`clearSession`
2. ✅ 確認這些調用是否必要（通常都是必要的！）
3. ✅ 不要因為「簡化代碼」而刪除 session 邏輯
4. ✅ 如果不確定，先詢問或查看 Git 歷史記錄

**修復方法：**
- 恢復 Git 歷史中的 session 相關代碼
- 參考 `src/telegram/handlers/throw.ts` 的完整實現
- 參考 `src/router.ts` 中的 session 檢查邏輯

#### 錯誤 7：SQL 查詢缺少必要欄位導致數據不完整
**症狀：** 配對通知中顯示「匿名*********」或其他數據缺失

**為什麼會發生？**
在編寫 SQL 查詢時，只選取了用於計算的欄位，忽略了顯示所需的欄位。

**⚠️ 常見缺失欄位：**

```typescript
// ❌ 錯誤：只選取計算所需欄位，缺少 nickname 和 username
const users = await db
  .prepare(`
    SELECT 
      telegram_id, language_pref, mbti_result, zodiac_sign,
      blood_type, birthday, last_active_at, is_vip, gender
    FROM users
    WHERE ...
  `)
  .all();

// 使用時會出錯
const nickname = maskNickname(user.nickname || user.username || '匿名');
// ❌ user.nickname 和 user.username 都是 undefined！

// ✅ 正確：選取所有需要的欄位
const users = await db
  .prepare(`
    SELECT 
      telegram_id, nickname, username,  -- ← 添加這些欄位
      language_pref, mbti_result, zodiac_sign,
      blood_type, birthday, last_active_at, is_vip, gender
    FROM users
    WHERE ...
  `)
  .all();
```

**檢查清單：**
1. ✅ **計算欄位**：用於邏輯判斷的欄位（如 `mbti_result`, `zodiac_sign`）
2. ✅ **顯示欄位**：用於 UI 顯示的欄位（如 `nickname`, `username`）
3. ✅ **識別欄位**：用於唯一標識的欄位（如 `telegram_id`, `id`）
4. ✅ **關聯欄位**：用於關聯其他表的欄位（如外鍵）

**預防措施：**
1. 在編寫查詢前，先列出所有使用該數據的地方
2. 檢查每個使用點需要哪些欄位
3. 確保 TypeScript 類型定義包含所有欄位
4. 添加單元測試驗證數據完整性

**修復方法：**
```typescript
// 1. 檢查類型定義
export interface UserMatchData {
  telegram_id: string;
  nickname: string | null;      // ← 確保包含
  username: string | null;       // ← 確保包含
  language: string;
  mbti_result: string | null;
  // ... 其他欄位
}

// 2. 更新 SQL 查詢
SELECT 
  telegram_id, nickname, username,  -- ← 添加缺失欄位
  language_pref as language, 
  mbti_result, zodiac_sign as zodiac,
  blood_type, birthday, last_active_at, is_vip, gender
FROM users
WHERE ...
```

**常見影響範圍：**
- `src/services/smart_matching.ts` - Smart Matching 查詢
- `src/db/queries/bottles.ts` - 瓶子查詢
- `src/db/queries/conversations.ts` - 對話查詢
- 任何需要顯示用戶信息的查詢

#### 錯誤 8：SQL NOT IN (NULL) 導致查詢失敗
**症狀：** 查詢返回 0 結果，即使數據庫中有符合條件的記錄

**為什麼會發生？**
在 SQL 中，`NOT IN (NULL)` 會導致所有行都被過濾掉，因為 `NULL` 的比較結果是 `UNKNOWN`。

**⚠️ 錯誤示例：**

```typescript
// ❌ 錯誤：當 existingIds 為空時，placeholders 變成 'NULL'
const existingIds = allCandidates.map(u => u.telegram_id);  // 可能為 []
const placeholders = existingIds.length > 0 
  ? existingIds.map(() => '?').join(',') 
  : 'NULL';  // ❌ 錯誤！

const query = `
  SELECT * FROM users
  WHERE telegram_id NOT IN (${placeholders})  -- ← NOT IN (NULL) 會過濾掉所有行
`;

// ✅ 正確：只在有值時添加 NOT IN 條件
const existingIds = allCandidates.map(u => u.telegram_id);
const excludeClause = existingIds.length > 0 
  ? `AND telegram_id NOT IN (${existingIds.map(() => '?').join(',')})` 
  : '';  // ← 空字符串，不添加條件

const query = `
  SELECT * FROM users
  WHERE telegram_id != ?
    ${excludeClause}  -- ← 只在有值時添加
`;
```

**預防措施：**
1. 在構建動態 SQL 時，先檢查數組是否為空
2. 使用條件字符串而不是硬編碼 `NULL`
3. 添加日誌記錄查詢條件和結果數量
4. 手動測試空數組情況

**修復方法：**
- 檢查所有使用 `NOT IN` 的查詢
- 確保在數組為空時不添加 `NOT IN` 條件
- 參考 `src/services/smart_matching.ts` 的修復實現

#### 錯誤 9：age_range 未初始化導致查詢失敗
**症狀：** Smart Matching 找不到候選用戶，即使有活躍用戶

**為什麼會發生？**
`age_range` 欄位在用戶註冊時未自動計算，導致查詢條件 `WHERE age_range IN (...)` 無法匹配。

**預防措施：**
1. 確保所有計算欄位在創建記錄時自動填充
2. 添加數據庫遷移腳本來填充現有記錄
3. 定期檢查關鍵欄位是否有 `NULL` 值

**修復方法：**
```sql
-- 手動更新現有用戶的 age_range
UPDATE users 
SET age_range = CASE 
  WHEN (CAST(strftime('%Y', 'now') AS INTEGER) - CAST(strftime('%Y', birthday) AS INTEGER)) BETWEEN 18 AND 24 THEN '18-24'
  WHEN (CAST(strftime('%Y', 'now') AS INTEGER) - CAST(strftime('%Y', birthday) AS INTEGER)) BETWEEN 25 AND 29 THEN '25-29'
  WHEN (CAST(strftime('%Y', 'now') AS INTEGER) - CAST(strftime('%Y', birthday) AS INTEGER)) BETWEEN 30 AND 34 THEN '30-34'
  WHEN (CAST(strftime('%Y', 'now') AS INTEGER) - CAST(strftime('%Y', birthday) AS INTEGER)) BETWEEN 35 AND 39 THEN '35-39'
  WHEN (CAST(strftime('%Y', 'now') AS INTEGER) - CAST(strftime('%Y', birthday) AS INTEGER)) >= 40 THEN '40+'
END
WHERE birthday IS NOT NULL;
```

### 7.3 修改代碼的安全流程（Safe Code Modification Process）

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

### 7.4 代碼審查重點（Code Review Checklist）

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
- [ ] **絕對禁止** `console.log`（只允許 `console.error` 或 `console.warn`）
- [ ] **絕對禁止** `any` 類型（必須定義 Interface 或 Type）
- [ ] **絕對禁止** 未使用的變量和導入（必須刪除）

---

## 8. AI 協作強制規範 (AI Co-pilot Mandatory Rules)

**⚠️ 這是給 AI 代理的強制指令，必須嚴格執行：**

### 8.1 寫入後立即檢查 (Write-then-Check)
**規則**：每次調用 `write` 或 `search_replace` 修改代碼後，**必須** 在同一個回合或下一個回合立即調用 `read_lints` 檢查該文件。

**流程**：
1. `write` (修改代碼)
2. `read_lints` (檢查該文件)
3. **如果有錯** -> 立即修復 (Fix immediately)
4. **如果沒錯** -> 繼續下一個任務

**禁止行為**：
- ❌ 修改了文件卻不檢查 Lint。
- ❌ 發現 Lint 錯誤卻說「稍後再修」。
- ❌ 一次性修改 5 個文件，最後才統一檢查（必須改一個查一個）。

### 8.2 類型安全優先 (Type Safety First)
**規則**：在編寫函數前，先定義好 Interface。
- **禁止** 使用 `any` 作為逃生艙。
- 如果類型複雜，先在 `src/types/` 或 `src/domain/` 定義類型，再寫邏輯。

### 8.3 乾淨代碼 (Clean Code)
**規則**：
- **Console Log**：提交前必須刪除所有調試用的 `console.log`。
- **Unused Vars**：不使用的變量必須刪除，不要留著「以後可能用到」。
- **Imports**：刪除所有未使用的 import。

### 8.4 文檔同步 (Doc Sync)
**規則**：修改邏輯後，**必須** 檢查 `SPEC.md` 或相關設計文檔，確保文檔與代碼一致。如果代碼變更導致文檔過時，必須更新文檔。

#### i18n 規範（⚠️ 必須檢查）
- [ ] **所有用戶可見文字都使用 `i18n.t()`**（禁止硬編碼中文）
- [ ] 已添加 `import { createI18n } from '~/i18n'`
- [ ] 已初始化 `const i18n = createI18n(user.language_pref || 'zh-TW')`
- [ ] 所有 `sendMessage`、`editMessageText` 等調用都使用 `i18n.t()`
- [ ] 所有按鈕文字都使用 `i18n.t()`
- [ ] 所有錯誤消息都使用 `i18n.t()`
- [ ] **⚠️ i18n 同步（必須執行）**：
  - [ ] 新增或修改 i18n key 後，執行 `pnpm i18n:sync` 同步到所有語言
  - [ ] 執行 `pnpm i18n:check` 檢查是否有問題
  - [ ] 執行 `pnpm i18n:fix-templates` 修復模板字符串問題
  - [ ] 確認所有 34 種語言都有對應的 key（或占位符）
- [ ] **沒有硬編碼的中文字符串**（除了技術標識符、callback_data 等）

#### 測試覆蓋
- [ ] 新功能有單元測試
- [ ] **關鍵功能有 Local Simulation 測試**
- [ ] 修改的功能測試已更新
- [ ] Smoke Test 已更新（如需要）
- [ ] 所有測試通過

#### 文檔同步
- [ ] SPEC.md 已更新（如需要）
- [ ] 相關文檔已更新
- [ ] 註釋清晰，解釋了關鍵邏輯

### 7.5 緊急修復流程（Hotfix Process）

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

## 8. 參考資源

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

