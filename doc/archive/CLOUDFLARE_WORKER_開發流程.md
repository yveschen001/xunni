# 🚀 Cloudflare Worker 開發流程

## ✅ **當前狀態**

- ✅ **Bot 已部署到 Cloudflare Staging**
- ✅ **Webhook 已設置**
- ✅ **D1 數據庫正常運行**
- ✅ **所有功能正常工作**

**部署 URL**: `https://xunni-bot-staging.yves221.workers.dev`

---

## 📋 **標準開發流程**

### **1. 本地開發和測試**

#### **方式 A: 使用 Wrangler Dev（推薦）**

```bash
# 啟動本地開發環境
pnpm dev

# 這會啟動：
# - 本地 Worker (http://localhost:8787)
# - 本地 D1 數據庫
# - 熱重載（修改代碼自動重啟）
```

**優點：**
- ✅ 完整的本地環境
- ✅ 真實的 D1 數據庫
- ✅ 熱重載
- ✅ 可以使用 ngrok 測試 Webhook

**設置 Webhook（需要 ngrok）：**

```bash
# 終端 1: 啟動 Wrangler Dev
pnpm dev

# 終端 2: 啟動 ngrok
ngrok http 8787

# 終端 3: 設置 Webhook
curl -X POST "https://api.telegram.org/bot你的TOKEN/setWebhook" \
  -d "url=https://你的ngrok地址.ngrok.io/webhook"
```

#### **方式 B: 直接部署到 Staging 測試**

```bash
# 修改代碼後，直接部署到 Staging
pnpm deploy:staging

# Webhook 已經設置好，直接在 Telegram 測試
```

**優點：**
- ✅ 最簡單
- ✅ 不需要 ngrok
- ✅ 真實環境測試

**缺點：**
- ❌ 每次修改都需要部署（較慢）
- ❌ 無法即時調試

---

### **2. 開發新功能**

#### **典型工作流程：**

```bash
# 1. 創建新功能分支（可選）
git checkout -b feature/new-feature

# 2. 修改代碼
vim src/telegram/handlers/new_feature.ts

# 3. 編寫測試
vim tests/telegram/handlers/new_feature.test.ts

# 4. 運行測試
pnpm test

# 5. 檢查代碼質量
pnpm lint
pnpm typecheck

# 6. 部署到 Staging 測試
pnpm deploy:staging

# 7. 在 Telegram 測試功能
# 發送消息到 @xunni_dev_bot

# 8. 查看日誌（如果需要）
wrangler tail --env staging

# 9. 如果測試通過，提交代碼
git add .
git commit -m "Add new feature"
git push

# 10. 部署到 Production
pnpm deploy:production
```

---

### **3. 數據庫遷移**

當需要修改數據庫結構時：

```bash
# 1. 創建遷移文件
# 在 src/db/migrations/ 創建新文件
# 例如：0020_add_new_table.sql

# 2. 編寫 SQL
vim src/db/migrations/0020_add_new_table.sql

# 3. 在本地測試遷移
wrangler d1 migrations apply DB --local

# 4. 部署到 Staging 並執行遷移
pnpm deploy:staging
wrangler d1 migrations apply DB --env staging

# 5. 測試功能

# 6. 部署到 Production 並執行遷移
pnpm deploy:production
wrangler d1 migrations apply DB --env production
```

---

### **4. 查看日誌和調試**

#### **實時日誌：**

```bash
# Staging 環境
wrangler tail --env staging

# Production 環境
wrangler tail --env production

# 或使用 npm script
pnpm monitor
```

#### **查看特定請求：**

```bash
# 過濾特定用戶
wrangler tail --env staging | grep "用戶名"

# 只看錯誤
wrangler tail --env staging | grep "Error"
```

---

### **5. 環境管理**

#### **環境變數配置：**

**本地開發（`.dev.vars`）：**
```bash
TELEGRAM_BOT_TOKEN=你的開發BOT_TOKEN
OPENAI_API_KEY=你的KEY
# ... 其他配置
```

**Staging 環境：**
```bash
# 設置 Secret
wrangler secret put TELEGRAM_BOT_TOKEN --env staging
wrangler secret put OPENAI_API_KEY --env staging

# 設置環境變數（在 wrangler.toml 中）
[env.staging.vars]
ENVIRONMENT = "staging"
LOG_LEVEL = "debug"
```

**Production 環境：**
```bash
# 設置 Secret
wrangler secret put TELEGRAM_BOT_TOKEN --env production
wrangler secret put OPENAI_API_KEY --env production

# 設置環境變數（在 wrangler.toml 中）
[env.production.vars]
ENVIRONMENT = "production"
LOG_LEVEL = "info"
```

---

### **6. 部署流程**

#### **部署到 Staging：**

```bash
# 1. 確保代碼已提交
git status

# 2. 運行測試
pnpm test

# 3. 檢查代碼質量
pnpm lint

# 4. 部署
pnpm deploy:staging

# 5. 測試功能
# 在 Telegram 測試 @xunni_dev_bot

# 6. 查看日誌
wrangler tail --env staging
```

#### **部署到 Production：**

```bash
# 1. 確保 Staging 測試通過
# 2. 確保代碼已合併到 main 分支

# 3. 部署
pnpm deploy:production

# 4. 設置 Webhook（如果需要）
curl -X POST "https://api.telegram.org/bot生產TOKEN/setWebhook" \
  -d "url=https://xunni-bot.yves221.workers.dev/webhook"

# 5. 測試功能
# 在 Telegram 測試生產 Bot

# 6. 監控日誌
wrangler tail --env production
```

---

### **7. 回滾（如果需要）**

如果部署後發現問題：

```bash
# 1. 查看部署歷史
wrangler deployments list --env production

# 2. 回滾到之前的版本
wrangler rollback --env production --version-id <VERSION_ID>

# 3. 或者重新部署之前的代碼
git checkout <之前的commit>
pnpm deploy:production
git checkout main
```

---

## 🎯 **推薦的開發流程**

### **小改動（Bug 修復、小優化）：**

```bash
1. 修改代碼
2. pnpm test
3. pnpm deploy:staging
4. 在 Telegram 測試
5. pnpm deploy:production
```

### **大改動（新功能、重構）：**

```bash
1. 創建功能分支
2. 修改代碼
3. 編寫測試
4. pnpm test
5. pnpm lint
6. pnpm deploy:staging
7. 完整測試
8. 提交代碼
9. 合併到 main
10. pnpm deploy:production
```

---

## 📊 **環境對比**

| 環境 | URL | Bot | 數據庫 | 用途 |
|------|-----|-----|--------|------|
| **Local** | localhost:8787 | @xunni_dev_bot | 本地 D1 | 開發和調試 |
| **Staging** | xunni-bot-staging.yves221.workers.dev | @xunni_dev_bot | xunni-db-staging | 測試 |
| **Production** | xunni-bot.yves221.workers.dev | @xunni_bot | xunni-db-production | 生產 |

---

## 🔧 **常用命令**

```bash
# 開發
pnpm dev                    # 本地開發
pnpm test                   # 運行測試
pnpm lint                   # 檢查代碼
pnpm typecheck              # 類型檢查

# 部署
pnpm deploy:staging         # 部署到 Staging
pnpm deploy:production      # 部署到 Production

# 數據庫
wrangler d1 execute DB --env staging --command "SELECT * FROM users LIMIT 10"
wrangler d1 migrations apply DB --env staging

# 日誌
wrangler tail --env staging
pnpm monitor

# 備份
pnpm backup                 # 本地備份
pnpm backup:push            # 推送到 GitHub
pnpm backup:db              # 備份數據庫
```

---

## 💡 **最佳實踐**

### **1. 開發流程：**

- ✅ 先在 Staging 測試
- ✅ 測試通過後再部署到 Production
- ✅ 每次部署前運行測試
- ✅ 使用有意義的 commit 訊息

### **2. 測試：**

- ✅ Domain 層：90%+ 覆蓋率
- ✅ Utils：80%+ 覆蓋率
- ✅ Handlers：60%+ 覆蓋率
- ✅ 每個新功能都要有測試

### **3. 代碼質量：**

- ✅ 運行 `pnpm lint` 確保無錯誤
- ✅ 運行 `pnpm typecheck` 確保類型正確
- ✅ 遵循 `@doc/DEVELOPMENT_STANDARDS.md` 規範

### **4. 數據庫：**

- ✅ 所有數據庫變更都要通過遷移腳本
- ✅ 先在 Staging 測試遷移
- ✅ 備份數據庫後再執行遷移

### **5. 監控：**

- ✅ 部署後查看日誌
- ✅ 監控錯誤率
- ✅ 定期檢查性能指標

---

## 🆘 **故障排除**

### **問題 1: 部署失敗**

```bash
# 檢查 Wrangler 版本
wrangler --version

# 更新 Wrangler
pnpm add -D wrangler@latest

# 重新登錄
wrangler login

# 重試部署
pnpm deploy:staging
```

### **問題 2: Webhook 不工作**

```bash
# 檢查 Webhook 狀態
curl "https://api.telegram.org/bot你的TOKEN/getWebhookInfo"

# 重新設置 Webhook
curl -X POST "https://api.telegram.org/bot你的TOKEN/setWebhook" \
  -d "url=https://你的worker地址/webhook" \
  -d "drop_pending_updates=true"
```

### **問題 3: 數據庫錯誤**

```bash
# 檢查遷移狀態
wrangler d1 migrations list DB --env staging

# 重新執行遷移
wrangler d1 migrations apply DB --env staging

# 查看數據庫內容
wrangler d1 execute DB --env staging --command "SELECT * FROM users LIMIT 10"
```

---

## 📚 **相關文檔**

- `doc/DEPLOYMENT.md` - 部署指南
- `doc/ENV_CONFIG.md` - 環境配置
- `doc/DEVELOPMENT_STANDARDS.md` - 開發規範
- `doc/TESTING.md` - 測試指南

---

## 🎉 **總結**

**現在你已經回到正常的 Cloudflare Worker 開發流程了！**

**標準流程：**
1. 修改代碼
2. 運行測試
3. 部署到 Staging
4. 測試功能
5. 部署到 Production

**快速命令：**
```bash
pnpm deploy:staging    # 部署測試
pnpm deploy:production # 部署生產
wrangler tail          # 查看日誌
```

**Happy Coding! 🚀**

