# XunNi 開發環境設置指南

> **在閱讀本文檔前，請先閱讀 `@doc/SPEC.md` 了解專案概覽。**

本文檔涵蓋開發環境設置、環境變數配置和本地開發流程。

## 1. 快速開始

### 1.1 環境需求

**必需工具及版本：**

- **Node.js**: 22.x（建議使用 [nvm](https://github.com/nvm-sh/nvm) 管理版本）
  ```bash
  # 使用 nvm 安裝
  nvm install 22
  nvm use 22
  ```
- **包管理器**: pnpm 9.x（推薦）或 npm
  ```bash
  # 安裝 pnpm
  npm install -g pnpm@9
  ```
- **Cloudflare Workers CLI**: wrangler（最新版本）
  ```bash
  # 安裝 wrangler
  npm install -g wrangler
  ```

**帳號與 API Key：**

- **Cloudflare 帳號**: 需要 API Token
- **Telegram Bot Token**: 從 [@BotFather](https://t.me/botfather) 取得
- **OpenAI API Key**: 從 [OpenAI Platform](https://platform.openai.com/) 取得

### 1.2 安裝依賴

```bash
# 安裝依賴
pnpm install

# 或使用 npm
npm install
```

### 1.3 本地開發

```bash
# 啟動本地開發伺服器
pnpm dev

# 或使用 npm
npm run dev
```

### 1.4 執行測試

```bash
# 執行所有測試
pnpm test

# 或使用 npm
npm test
```

### 1.5 執行 Lint

```bash
# 檢查代碼風格
pnpm lint

# 或使用 npm
npm run lint
```

---

## 2. 環境變數總覽

### 2.1 環境分類

本專案支援三個環境：
- **development**: 本地開發環境
- **staging**: 測試環境（用於預發布測試）
- **production**: 生產環境

### 2.2 環境變數清單

| 變數名 | 說明 | 必需 | 環境 |
|--------|------|------|------|
| `TELEGRAM_BOT_TOKEN` | Telegram Bot Token | ✅ | 全部 |
| `TELEGRAM_WEBHOOK_SECRET` | Webhook 驗證密鑰 | ✅ | 全部 |
| `OPENAI_API_KEY` | OpenAI API 金鑰 | ✅ | 全部 |
| `GIGAPUB_API_KEY` | Gigapub 廣告 API 金鑰 | ⚠️ | staging, production |
| `GIGAPUB_PLACEMENT_ID` | Gigapub 廣告位置 ID | ⚠️ | staging, production |
| `HOROSCOPE_SOURCE_URL` | 星座運勢資料來源 URL | ⚠️ | staging, production |
| `EXTERNAL_API_KEY` | Moonpacket API 驗證金鑰 | ✅ | staging, production |
| `TELEGRAM_BOT_SECRET` | Telegram Bot Secret（WebApp 驗簽） | ✅ | 全部 |
| `GOOGLE_TRANSLATE_API_KEY` | Google Translate API 金鑰 | ✅ | 全部 |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID（預留，M2/M3） | ❌ | 暫不需要 |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret（預留，M2/M3） | ❌ | 暫不需要 |
| `APPLE_CLIENT_ID` | Apple Sign In Client ID（預留，M3） | ❌ | 暫不需要 |
| `APPLE_TEAM_ID` | Apple Team ID（預留，M3） | ❌ | 暫不需要 |
| `APPLE_KEY_ID` | Apple Key ID（預留，M3） | ❌ | 暫不需要 |
| `APPLE_PRIVATE_KEY` | Apple Private Key（預留，M3） | ❌ | 暫不需要 |
| `WECHAT_APP_ID` | WeChat App ID（預留，M2） | ❌ | 暫不需要 |
| `WECHAT_APP_SECRET` | WeChat App Secret（預留，M2） | ❌ | 暫不需要 |
| `LINE_CHANNEL_ID` | Line Channel ID（預留，M2） | ❌ | 暫不需要 |
| `LINE_CHANNEL_SECRET` | Line Channel Secret（預留，M2） | ❌ | 暫不需要 |
| `ENVIRONMENT` | 環境名稱 (dev/staging/prod) | ✅ | 全部 |
| `LOG_LEVEL` | 日誌級別 (debug/info/warn/error) | ❌ | 全部 |
| `BROADCAST_BATCH_SIZE` | 廣播批次大小 | ❌ | 全部 |
| `BROADCAST_MAX_JOBS` | 最大並發廣播任務數 | ❌ | 全部 |

---

## 2. 環境變數配置

### 2.1 開發環境 (development)

#### 2.1.1 `.dev.vars` 檔案（本地開發）

在專案根目錄建立 `.dev.vars`（已加入 `.gitignore`）：

```bash
# .dev.vars
ENVIRONMENT=development
LOG_LEVEL=debug

# Telegram
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_WEBHOOK_SECRET=dev_webhook_secret_key_here

# OpenAI
OPENAI_API_KEY=sk-dev-key-here

# Google Translate
GOOGLE_TRANSLATE_API_KEY=dev-google-translate-key-here

# Telegram WebApp
TELEGRAM_BOT_SECRET=dev_bot_secret_here

# Gigapub (可選，開發環境可留空)
GIGAPUB_API_KEY=
GIGAPUB_PLACEMENT_ID=

# Horoscope (可選)
HOROSCOPE_SOURCE_URL=

# External API (開發環境可留空)
EXTERNAL_API_KEY=dev_api_key_here

# OAuth (預留，M2/M3 階段才需要)
# GOOGLE_CLIENT_ID=
# GOOGLE_CLIENT_SECRET=
# APPLE_CLIENT_ID=
# APPLE_TEAM_ID=
# APPLE_KEY_ID=
# APPLE_PRIVATE_KEY=

# WeChat / Line (預留，M2 階段才需要)
# WECHAT_APP_ID=
# WECHAT_APP_SECRET=
# LINE_CHANNEL_ID=
# LINE_CHANNEL_SECRET=

# Broadcast Settings
BROADCAST_BATCH_SIZE=10
BROADCAST_MAX_JOBS=1
```

#### 2.1.2 wrangler.toml (development)

```toml
name = "xunni-bot-dev"
main = "src/worker.ts"
compatibility_date = "2025-01-01"

# Development D1 Database
[[d1_databases]]
binding = "DB"
database_name = "xunni-db-dev"
database_id = "<DEV_D1_DATABASE_ID>"

# Development KV (可選)
[[kv_namespaces]]
binding = "RISK_CACHE"
id = "<DEV_KV_NAMESPACE_ID>"

# 開發環境變數（敏感資訊使用 .dev.vars）
[vars]
ENVIRONMENT = "development"
LOG_LEVEL = "debug"
BROADCAST_BATCH_SIZE = "10"
BROADCAST_MAX_JOBS = "1"
```

### 2.2 測試環境 (staging)

#### 2.2.1 Cloudflare Workers Secrets

使用 `wrangler secret put` 設定敏感變數：

```bash
# 設定 Telegram Bot Token
wrangler secret put TELEGRAM_BOT_TOKEN --env staging

# 設定 Webhook Secret
wrangler secret put TELEGRAM_WEBHOOK_SECRET --env staging

# 設定 OpenAI API Key
wrangler secret put OPENAI_API_KEY --env staging

# 設定 Gigapub
wrangler secret put GIGAPUB_API_KEY --env staging
wrangler secret put GIGAPUB_PLACEMENT_ID --env staging

# 設定 External API Key
wrangler secret put EXTERNAL_API_KEY --env staging

# 設定 Horoscope Source URL（若非敏感，可放在 vars）
wrangler secret put HOROSCOPE_SOURCE_URL --env staging

# 設定 Telegram Bot Secret（WebApp 驗簽）
wrangler secret put TELEGRAM_BOT_SECRET --env staging

# 設定 Google Translate API Key
wrangler secret put GOOGLE_TRANSLATE_API_KEY --env staging

# 設定 Google OAuth（可選）
wrangler secret put GOOGLE_CLIENT_ID --env staging
wrangler secret put GOOGLE_CLIENT_SECRET --env staging

# 設定 Apple Sign In（預留，M3 階段才需要）
# wrangler secret put APPLE_CLIENT_ID --env staging
# wrangler secret put APPLE_TEAM_ID --env staging
# wrangler secret put APPLE_KEY_ID --env staging
# wrangler secret put APPLE_PRIVATE_KEY --env staging

# 設定 WeChat（預留，M2 階段才需要）
# wrangler secret put WECHAT_APP_ID --env staging
# wrangler secret put WECHAT_APP_SECRET --env staging

# 設定 Line（預留，M2 階段才需要）
# wrangler secret put LINE_CHANNEL_ID --env staging
# wrangler secret put LINE_CHANNEL_SECRET --env staging
```

#### 2.2.2 wrangler.toml (staging)

```toml
[env.staging]
name = "xunni-bot-staging"
main = "src/worker.ts"
compatibility_date = "2025-01-01"

# Staging D1 Database
[[env.staging.d1_databases]]
binding = "DB"
database_name = "xunni-db-staging"
database_id = "<STAGING_D1_DATABASE_ID>"

# Staging KV
[[env.staging.kv_namespaces]]
binding = "RISK_CACHE"
id = "<STAGING_KV_NAMESPACE_ID>"

# Staging 環境變數（非敏感）
[env.staging.vars]
ENVIRONMENT = "staging"
LOG_LEVEL = "info"
BROADCAST_BATCH_SIZE = "25"
BROADCAST_MAX_JOBS = "2"

# Cron Jobs (Staging)
[[env.staging.triggers.crons]]
schedule = "0 9 * * 1"  # 每週一 09:00 UTC
```

### 2.3 生產環境 (production)

#### 2.3.1 Cloudflare Workers Secrets

```bash
# 設定所有敏感變數（與 staging 類似，但使用 production 環境）
wrangler secret put TELEGRAM_BOT_TOKEN --env production
wrangler secret put TELEGRAM_WEBHOOK_SECRET --env production
wrangler secret put OPENAI_API_KEY --env production
wrangler secret put GIGAPUB_API_KEY --env production
wrangler secret put GIGAPUB_PLACEMENT_ID --env production
wrangler secret put EXTERNAL_API_KEY --env production
wrangler secret put HOROSCOPE_SOURCE_URL --env production
```

#### 2.3.2 wrangler.toml (production)

```toml
[env.production]
name = "xunni-bot"
main = "src/worker.ts"
compatibility_date = "2025-01-01"

# Production D1 Database
[[env.production.d1_databases]]
binding = "DB"
database_name = "xunni-db"
database_id = "<PROD_D1_DATABASE_ID>"

# Production KV
[[env.production.kv_namespaces]]
binding = "RISK_CACHE"
id = "<PROD_KV_NAMESPACE_ID>"

# Production 環境變數
[env.production.vars]
ENVIRONMENT = "production"
LOG_LEVEL = "warn"
BROADCAST_BATCH_SIZE = "25"
BROADCAST_MAX_JOBS = "3"

# Cron Jobs (Production)
[[env.production.triggers.crons]]
schedule = "0 9 * * 1"  # 每週一 09:00 UTC
```

---

## 3. 環境變數驗證

### 3.1 src/config/env.ts

建立統一的環境變數驗證模組：

```typescript
// src/config/env.ts
export interface Env {
  // Cloudflare Bindings
  DB: D1Database;
  RISK_CACHE?: KVNamespace;
  
  // Environment
  ENVIRONMENT: 'development' | 'staging' | 'production';
  LOG_LEVEL?: 'debug' | 'info' | 'warn' | 'error';
  
  // Telegram
  TELEGRAM_BOT_TOKEN: string;
  TELEGRAM_WEBHOOK_SECRET: string;
  
  // OpenAI
  OPENAI_API_KEY: string;
  
  // Google Translate
  GOOGLE_TRANSLATE_API_KEY: string;
  
  // Telegram WebApp
  TELEGRAM_BOT_SECRET: string;
  
  // Gigapub
  GIGAPUB_API_KEY?: string;
  GIGAPUB_PLACEMENT_ID?: string;
  
  // Horoscope
  HOROSCOPE_SOURCE_URL?: string;
  
  // External API
  EXTERNAL_API_KEY: string;
  
  // Google OAuth（預留，M2/M3 階段）
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  
  // Apple Sign In（預留，M3 階段）
  APPLE_CLIENT_ID?: string;
  APPLE_TEAM_ID?: string;
  APPLE_KEY_ID?: string;
  APPLE_PRIVATE_KEY?: string;
  
  // WeChat（預留，M2 階段）
  WECHAT_APP_ID?: string;
  WECHAT_APP_SECRET?: string;
  
  // Line（預留，M2 階段）
  LINE_CHANNEL_ID?: string;
  LINE_CHANNEL_SECRET?: string;
  
  // Broadcast
  BROADCAST_BATCH_SIZE?: string;
  BROADCAST_MAX_JOBS?: string;
}

/**
 * 驗證並讀取環境變數
 * @throws {Error} 當必需變數缺失時
 */
export function validateEnv(env: Env): Env {
  const required: (keyof Env)[] = [
    'TELEGRAM_BOT_TOKEN',
    'TELEGRAM_WEBHOOK_SECRET',
    'TELEGRAM_BOT_SECRET',
    'OPENAI_API_KEY',
    'GOOGLE_TRANSLATE_API_KEY',
    'EXTERNAL_API_KEY',
  ];
  
  const missing = required.filter(key => !env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  // 生產環境必須有 Gigapub 配置
  if (env.ENVIRONMENT === 'production' && (!env.GIGAPUB_API_KEY || !env.GIGAPUB_PLACEMENT_ID)) {
    console.warn('Warning: Gigapub configuration missing in production');
  }
  
  return env;
}

/**
 * 取得環境變數（帶預設值）
 */
export function getEnv(env: Env): Env {
  return {
    ...env,
    ENVIRONMENT: env.ENVIRONMENT || 'development',
    LOG_LEVEL: env.LOG_LEVEL || 'info',
    BROADCAST_BATCH_SIZE: env.BROADCAST_BATCH_SIZE || '25',
    BROADCAST_MAX_JOBS: env.BROADCAST_MAX_JOBS || '3',
  };
}
```

### 3.2 使用範例

```typescript
// src/worker.ts
import { validateEnv, getEnv, type Env } from './config/env';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      const validatedEnv = getEnv(validateEnv(env));
      // 使用 validatedEnv...
    } catch (error) {
      return new Response('Configuration error', { status: 500 });
    }
  }
};
```

### 3.3 開發用測試資料與假資料策略

**重要原則：**

- **本地開發專用**：所有測試資料僅用於本地開發環境，絕對不能使用生產環境的認證資訊
- **假資料生成**：使用 `pnpm seed` 命令生成測試資料（如已配置）
- **測試帳號格式**：測試用 Telegram 帳號建議使用測試 Bot，不要使用真實使用者帳號

**測試資料範例：**

```bash
# 生成測試資料（如有配置）
pnpm seed

# 或手動建立測試資料
# 使用測試 Bot Token（非生產環境 Token）
```

**安全注意事項：**

- ❌ **禁止**：在本地使用生產環境的 Telegram Bot Token、OpenAI API Key 或其他敏感資訊
- ✅ **允許**：使用測試環境的 API Key 或模擬數據
- ✅ **建議**：在 `.dev.vars` 中使用測試用的 API Key，並確保該檔案在 `.gitignore` 中

---

## 4. 環境切換

### 4.1 本地開發

```bash
# 使用 .dev.vars 中的變數
wrangler dev
```

### 4.2 部署到 Staging

```bash
# 部署到 staging 環境
wrangler deploy --env staging
```

### 4.3 部署到 Production

```bash
# 部署到 production 環境
wrangler deploy --env production
```

---

## 5. 安全最佳實踐

1. **永遠不要將敏感資訊提交到 Git**
   - 使用 `.dev.vars`（已加入 `.gitignore`）
   - 使用 `wrangler secret put` 設定 Cloudflare Secrets

2. **不同環境使用不同的 Bot Token**
   - Development: 測試 Bot
   - Staging: 預發布 Bot
   - Production: 正式 Bot

3. **定期輪換 API 金鑰**
   - 建議每 90 天輪換一次

4. **使用最小權限原則**
   - 每個環境的資料庫和 KV 命名空間應分離

---

## 6. 開發前檢查清單

**在開始任何新功能開發前，請確認以下事項：**

### 6.1 文檔準備

- [ ] 已閱讀 `@doc/SPEC.md` 第 1–2 節（專案總覽 + 技術棧與專案結構）
- [ ] 已閱讀 `@doc/SPEC.md` 附錄「術語表 / Glossary」，了解核心詞彙定義
- [ ] 已閱讀 `@doc/ENV_CONFIG.md`「快速開始」和「本地開發設置」章節
- [ ] 已閱讀 `@doc/DEVELOPMENT_STANDARDS.md` 了解開發規範
- [ ] 已閱讀 `@doc/SPEC.md` 附錄「受保護的文件/目錄」，了解哪些文件不能隨意修改

### 6.2 本地環境驗證

確認本地環境可以正常執行以下命令：

- [ ] `pnpm install` - 安裝依賴成功
- [ ] `pnpm dev` - 啟動本地開發伺服器成功
- [ ] `pnpm test` - 執行測試通過（或至少沒有報錯）
- [ ] `pnpm lint` - 代碼風格檢查通過

### 6.3 開發流程遵守

對於任何變更，將：

- [ ] 遵循 `.cursorrules` 中的閱讀順序和開發流程
- [ ] 在提交前執行 `pnpm test` 和 `pnpm lint`
- [ ] **修改翻譯後執行 `npx tsx scripts/verify-protected-keys.ts`**
- [ ] 如有資料庫變更，先檢查 `@doc/SPEC.md` 並更新相應章節
- [ ] 使用 `pnpm backup` 和 `pnpm backup:push` 進行備份（如相關）

### 6.4 術語使用

- [ ] 在代碼和註釋中使用 `@doc/SPEC.md` 術語表中定義的標準術語
- [ ] 不會混用 "user"/"member"/"player" 等不同術語
- [ ] 不會發明新的業務術語，如有需要先更新術語表

---

## 7. 環境變數檢查清單

### Development
- [ ] `.dev.vars` 檔案已建立
- [ ] `TELEGRAM_BOT_TOKEN` 已設定（測試 Bot）
- [ ] `TELEGRAM_WEBHOOK_SECRET` 已設定
- [ ] `OPENAI_API_KEY` 已設定
- [ ] D1 資料庫已建立並綁定

### Staging
- [ ] Cloudflare Workers Secrets 已設定
- [ ] D1 資料庫已建立（staging）
- [ ] KV 命名空間已建立（staging）
- [ ] Cron Jobs 已配置
- [ ] Webhook URL 已設定到測試 Bot

### Production
- [ ] 所有 Secrets 已設定（production）
- [ ] D1 資料庫已建立（production）
- [ ] KV 命名空間已建立（production）
- [ ] Cron Jobs 已配置
- [ ] Webhook URL 已設定到正式 Bot
- [ ] 監控和告警已配置

