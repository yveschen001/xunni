# XunNi 快速開始指南 🚀

> 本指南幫助您在 5 分鐘內啟動 XunNi 開發環境

## 📋 前置檢查

在開始前，請確認您已經：

- ✅ 安裝 Node.js 22.x
- ✅ 安裝 pnpm 9.x
- ✅ 獲取 Telegram Bot Token（Staging）
- ✅ 獲取 OpenAI API Key

## 🎯 5 分鐘快速啟動

### 1. 克隆專案（1 分鐘）

```bash
git clone https://github.com/yveschen001/xunni.git
cd xunni
```

### 2. 安裝依賴（2 分鐘）

```bash
pnpm install
```

### 3. 配置環境變數（1 分鐘）

環境變數已經配置在 `.dev.vars` 文件中。

**注意**：`.dev.vars` 文件包含敏感信息，已在 `.gitignore` 中排除，不会提交到 Git。

如果您需要重新配置，請參考 `.dev.vars.example` 文件。

### 4. 初始化資料庫（1 分鐘）

```bash
# 創建本地 D1 資料庫
wrangler d1 create xunni-db-dev

# 執行 Schema
wrangler d1 execute xunni-db-dev --file=src/db/schema.sql
```

### 5. 啟動開發服務器（立即）

```bash
pnpm dev
```

## ✅ 驗證安裝

開發服務器啟動後，您應該看到：

```
⛅️ wrangler 3.19.0
-------------------
⎔ Starting local server...
✨ Listening on http://localhost:8787
```

## 🎮 測試 Bot

1. 打開 Telegram
2. 搜索您的 Bot（Staging）
3. 發送 `/start` 指令
4. 查看 Worker 日誌確認收到請求

## 📚 下一步

- 📖 閱讀 [doc/SPEC.md](./doc/SPEC.md) 了解專案規格
- 🛠️ 閱讀 [doc/DEVELOPMENT_STANDARDS.md](./doc/DEVELOPMENT_STANDARDS.md) 了解開發規範
- 🧪 運行 `pnpm test` 執行測試
- 📊 查看 [DEVELOPMENT_PROGRESS.md](./DEVELOPMENT_PROGRESS.md) 了解開發進度

## 🆘 常見問題

### Q: `wrangler` 命令找不到？

A: 確保已安裝依賴：`pnpm install`

### Q: 資料庫連接失敗？

A: 確保已創建 D1 資料庫並執行 Schema

### Q: Telegram Webhook 無法接收？

A: 本地開發階段，需要使用 `ngrok` 或 `cloudflared` 將本地服務暴露到公網

## 🔧 開發命令速查

```bash
# 本地開發
pnpm dev

# 執行測試
pnpm test

# 執行 Lint
pnpm lint

# 格式化代碼
pnpm format

# 類型檢查
pnpm typecheck

# 本地備份
pnpm backup

# 推送到 GitHub
pnpm backup:push
```

## 🚢 部署到 Staging

準備好後，可以部署到 Staging 環境：

```bash
# 創建 Staging D1 資料庫
wrangler d1 create xunni-db-staging

# 設置 Secrets
wrangler secret put TELEGRAM_BOT_TOKEN --env staging
wrangler secret put OPENAI_API_KEY --env staging

# 執行 Schema
wrangler d1 execute xunni-db-staging --env staging --file=src/db/schema.sql

# 部署
pnpm deploy:staging
```

詳細部署指南請參考 [doc/DEPLOYMENT.md](./doc/DEPLOYMENT.md)

---

**需要幫助？** 查看完整文檔：[doc/README.md](./doc/README.md)

