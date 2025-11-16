# XunNi Bot - 版本快照
**生成時間**: 2025-11-16 16:06 (UTC+8)

## 當前版本資訊
- **Staging Version ID**: `66457035-2088-402a-9ace-0e79425996e7`
- **Worker URL**: https://xunni-bot-staging.yves221.workers.dev
- **資料庫**: xunni-db-staging (7b77ad82-ba26-489f-995f-8256b32379df)

## 主要功能狀態

### ✅ 已完成
1. **Gemini 翻譯整合**
   - 免費用戶使用 Gemini API
   - VIP 用戶使用 OpenAI，Gemini 作為 fallback
   - 支援多 model fallback (gemini-2.0-flash-exp, gemini-2.5-flash-lite)

2. **對話翻譯**
   - 自動檢測語言並翻譯
   - 記錄原文和翻譯語言
   - 顯示翻譯來源和狀態

3. **漂流瓶通知優化**
   - 顯示撿瓶者詳細資訊（暱稱、MBTI、星座、性別、年齡）
   - 移除通用的「有人撿到你的漂流瓶了」訊息

4. **資料庫 Schema**
   - conversation_messages 表新增語言追蹤欄位
   - 所有 migrations 已應用

### 🔧 環境配置

#### Staging Secrets
```bash
# 敏感資訊已設置在 Cloudflare Workers Secrets
# 使用 wrangler secret list --env staging 查看已設置的 secrets
TELEGRAM_BOT_TOKEN=<已設置>
OPENAI_API_KEY=<已設置>
GOOGLE_GEMINI_API_KEY=<已設置>
```

#### Staging Environment Variables (wrangler.toml)
```toml
ENVIRONMENT = "staging"
LOG_LEVEL = "info"
BROADCAST_BATCH_SIZE = "25"
BROADCAST_MAX_JOBS = "3"
ENABLE_AI_MODERATION = "true"
ENABLE_TRANSLATION = "true"
GEMINI_PROJECT_ID = "gen-lang-client-0526946218"
GEMINI_LOCATION = "us-central1"
GEMINI_MODELS = "gemini-2.0-flash-exp,gemini-2.5-flash-lite"
GEMINI_API_VERSION = "v1beta"
OPENAI_MODEL = "gpt-4o-mini"
```

## 關鍵文件清單

### 新增文件
- `src/services/gemini.ts` - Gemini 翻譯服務
- `src/services/translation/index.ts` - 統一翻譯介面
- `src/db/migrations/0009_add_language_columns_to_conversation_messages.sql`
- `scripts/test-gemini-models.ts` - Model 測試腳本
- `scripts/check-gemini-translation.ts` - 翻譯驗證腳本
- `scripts/test-catch-translation.ts` - /catch 流程測試
- `CHANGELOG.md` - 變更日誌
- `VERSION_SNAPSHOT.md` - 本文件

### 修改文件
- `src/telegram/handlers/catch.ts` - 更新通知訊息格式
- `src/db/queries/conversations.ts` - 修復 SQL INSERT 參數
- `wrangler.toml` - 添加 Gemini 環境變數
- `.dev.vars` - 添加 Gemini 配置
- `.dev.vars.example` - 更新配置範例

## 測試狀態

### Smoke Test Results (28/28 ✅)
- Infrastructure: 2/2 passed
- User Commands: 4/4 passed
- Onboarding: 2/2 passed
- Error Handling: 3/3 passed
- Database: 1/1 passed
- Performance: 2/2 passed
- Command Coverage: 14/14 passed

### 翻譯功能測試
- ✅ 本地測試：中文 → 英文翻譯成功
- ✅ Staging 測試：英文 → 中文翻譯成功
- ✅ 對話訊息翻譯正常
- ✅ 語言追蹤記錄正常

## 已知問題
- 無

## 下次啟動檢查清單

### 1. 環境驗證
```bash
# 檢查 Staging 環境
pnpm wrangler secret list --env staging

# 檢查資料庫狀態
pnpm wrangler d1 execute xunni-db-staging --remote --command="SELECT name FROM sqlite_master WHERE type='table';"

# 查看最新部署版本
pnpm wrangler deployments list --env staging
```

### 2. 功能測試
```bash
# 執行 smoke test
pnpm smoke-test

# 測試翻譯功能
pnpm tsx scripts/check-gemini-translation.ts

# 測試 Gemini models
pnpm tsx scripts/test-gemini-models.ts
```

### 3. 日誌監控
```bash
# 查看即時日誌
pnpm wrangler tail --env staging --format pretty
```

### 4. 部署到 Production（當準備好時）
```bash
# 1. 設置 Production secrets
echo "YOUR_TELEGRAM_BOT_TOKEN" | pnpm wrangler secret put TELEGRAM_BOT_TOKEN --env production
echo "YOUR_OPENAI_API_KEY" | pnpm wrangler secret put OPENAI_API_KEY --env production
echo "YOUR_GEMINI_API_KEY" | pnpm wrangler secret put GOOGLE_GEMINI_API_KEY --env production

# 2. 創建 Production 資料庫
pnpm wrangler d1 create xunni-db-production

# 3. 更新 wrangler.toml 中的 Production 資料庫 ID

# 4. 應用 migrations
pnpm wrangler d1 migrations apply xunni-db-production --env production --remote

# 5. 部署
pnpm deploy:production
```

## 備份資訊
- **本地備份**: 使用 `pnpm backup`
- **GitHub 備份**: 使用 `pnpm backup:push`
- **備份策略**: 詳見 `doc/BACKUP_STRATEGY.md`

## 聯絡資訊
- **開發者**: Yichen
- **Telegram Bot**: @xunni_dev_bot (Staging)
- **Worker URL**: https://xunni-bot-staging.yves221.workers.dev

---
**注意**: 此文件包含敏感資訊（API Keys），已在 .gitignore 中排除。

