# XunNi Bot - 快速啟動指南

**最後更新**: 2025-11-16 16:12 (UTC+8)

## 📋 當前狀態總覽

### ✅ 已完成功能
- Gemini AI 翻譯整合（免費用戶）
- OpenAI 翻譯（VIP 用戶）
- 對話訊息自動翻譯
- 漂流瓶通知優化（顯示撿瓶者詳細資訊）
- 多 model fallback 機制

### 📊 測試狀態
- Smoke Test: 28/28 ✅
- 翻譯功能: ✅ 正常
- Staging 環境: ✅ 運行中

### 🔗 重要連結
- **Staging Bot**: @xunni_dev_bot
- **Worker URL**: https://xunni-bot-staging.yves221.workers.dev
- **GitHub**: https://github.com/crealizellc/XunNi
- **最新 Commit**: e2ee9b4

---

## 🚀 快速啟動步驟

### 1. 環境檢查
```bash
# 進入專案目錄
cd /Users/yichen/Downloads/cursor/XunNi

# 檢查依賴
pnpm install

# 檢查環境變數
cat .dev.vars

# 驗證 Staging secrets
pnpm wrangler secret list --env staging
```

### 2. 本地開發
```bash
# 啟動本地開發環境
pnpm dev

# 在另一個終端執行測試
pnpm test

# 執行 smoke test
pnpm smoke-test
```

### 3. 測試翻譯功能
```bash
# 測試 Gemini 翻譯
pnpm tsx scripts/check-gemini-translation.ts

# 測試可用的 models
pnpm tsx scripts/test-gemini-models.ts
```

### 4. 部署到 Staging
```bash
# 部署
pnpm deploy:staging

# 查看即時日誌
pnpm wrangler tail --env staging --format pretty
```

### 5. 備份
```bash
# 本地備份（如有變更）
pnpm backup

# 推送到 GitHub
pnpm backup:push
```

---

## 🔧 常用命令

### 開發相關
```bash
pnpm dev              # 本地開發
pnpm test             # 執行測試
pnpm lint             # 代碼檢查
pnpm smoke-test       # 完整功能測試
```

### 部署相關
```bash
pnpm deploy:staging   # 部署到 Staging
pnpm deploy:production # 部署到 Production
```

### 資料庫相關
```bash
# 查看資料庫列表
pnpm wrangler d1 list

# 執行 SQL
pnpm wrangler d1 execute xunni-db-staging --remote --command="SELECT * FROM users LIMIT 5;"

# 查看 migrations
pnpm wrangler d1 migrations list xunni-db-staging --remote
```

### Secrets 管理
```bash
# 查看 secrets
pnpm wrangler secret list --env staging

# 設置 secret
echo "YOUR_VALUE" | pnpm wrangler secret put SECRET_NAME --env staging

# 刪除 secret
pnpm wrangler secret delete SECRET_NAME --env staging
```

### 日誌查看
```bash
# 即時日誌
pnpm wrangler tail --env staging --format pretty

# 查看部署歷史
pnpm wrangler deployments list --env staging
```

---

## 🐛 故障排除

### 翻譯失敗
```bash
# 1. 檢查 API Key
pnpm wrangler secret list --env staging

# 2. 測試翻譯功能
pnpm tsx scripts/check-gemini-translation.ts

# 3. 查看日誌
pnpm wrangler tail --env staging --format pretty
```

### 資料庫錯誤
```bash
# 檢查表結構
pnpm wrangler d1 execute xunni-db-staging --remote --command="PRAGMA table_info(conversation_messages);"

# 查看最近的 migrations
pnpm wrangler d1 migrations list xunni-db-staging --remote
```

### 部署失敗
```bash
# 檢查 wrangler.toml 配置
cat wrangler.toml

# 驗證環境變數
pnpm wrangler deployments list --env staging

# 重新部署
pnpm deploy:staging
```

---

## 📝 重要文件位置

### 配置文件
- `wrangler.toml` - Cloudflare Workers 配置
- `.dev.vars` - 本地環境變數（不提交）
- `.dev.vars.example` - 環境變數範例

### 文檔
- `CHANGELOG.md` - 變更日誌
- `VERSION_SNAPSHOT.md` - 版本快照
- `QUICK_START.md` - 本文件
- `doc/` - 完整文檔目錄

### 核心代碼
- `src/services/gemini.ts` - Gemini 翻譯服務
- `src/services/translation/index.ts` - 統一翻譯介面
- `src/telegram/handlers/catch.ts` - /catch 命令處理
- `src/db/queries/conversations.ts` - 對話相關查詢

### 測試腳本
- `scripts/smoke-test.ts` - 完整功能測試
- `scripts/check-gemini-translation.ts` - 翻譯驗證
- `scripts/test-gemini-models.ts` - Model 測試

---

## 🎯 下次開發檢查清單

### 開始前
- [ ] 拉取最新代碼：`git pull origin main`
- [ ] 安裝依賴：`pnpm install`
- [ ] 檢查環境變數：`cat .dev.vars`
- [ ] 執行測試：`pnpm test`

### 開發中
- [ ] 遵循 `@doc/DEVELOPMENT_STANDARDS.md` 規範
- [ ] 參考 `@doc/SPEC.md` 了解業務邏輯
- [ ] 使用 i18n 系統處理用戶可見文字
- [ ] 為新功能編寫測試

### 完成後
- [ ] 執行 `pnpm lint` 檢查代碼
- [ ] 執行 `pnpm test` 確保測試通過
- [ ] 執行 `pnpm smoke-test` 驗證功能
- [ ] 更新 `CHANGELOG.md`
- [ ] 提交代碼：`git commit -m "描述"`
- [ ] 推送到 GitHub：`git push origin main`
- [ ] 部署到 Staging：`pnpm deploy:staging`
- [ ] 驗證 Staging 環境功能正常

---

## 📞 聯絡資訊

- **開發者**: Yichen
- **Staging Bot**: @xunni_dev_bot
- **GitHub**: https://github.com/crealizellc/XunNi

---

## 🔐 安全提醒

⚠️ **重要**：
- 永遠不要提交 `.dev.vars` 到 git
- 不要在代碼中硬編碼 API Keys
- 使用 `wrangler secret` 管理敏感資訊
- 定期更新依賴套件以修復安全漏洞

---

**祝開發順利！** 🚀
