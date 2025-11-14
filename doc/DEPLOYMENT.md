# XunNi 部署指南

## 1. 部署前準備

### 1.1 環境檢查清單

- [ ] Cloudflare 帳號已註冊
- [ ] Wrangler CLI 已安裝 (`npm install -g wrangler`)
- [ ] Cloudflare API Token 已取得
- [ ] D1 資料庫已建立
- [ ] KV 命名空間已建立（可選）
- [ ] 環境變數已設定（Secrets）
- [ ] Telegram Bot Token 已取得
- [ ] Webhook URL 已配置

---

## 2. 本地開發環境

### 2.1 安裝依賴

```bash
npm install
```

### 2.2 配置本地環境

建立 `.dev.vars` 檔案（參考 `ENV_CONFIG.md`）

### 2.3 初始化資料庫

```bash
# 建立本地 D1 資料庫
wrangler d1 create xunni-db-dev

# 執行遷移
wrangler d1 execute xunni-db-dev --file=./src/db/schema.sql --local
```

### 2.4 啟動開發伺服器

```bash
wrangler dev
```

---

## 3. Staging 環境部署

### 3.1 建立 Staging 資源

```bash
# 建立 D1 資料庫
wrangler d1 create xunni-db-staging

# 建立 KV 命名空間（可選）
wrangler kv:namespace create "RISK_CACHE" --env staging
```

### 3.2 設定環境變數

```bash
# 設定 Secrets
wrangler secret put TELEGRAM_BOT_TOKEN --env staging
wrangler secret put TELEGRAM_WEBHOOK_SECRET --env staging
wrangler secret put OPENAI_API_KEY --env staging
wrangler secret put EXTERNAL_API_KEY --env staging
```

### 3.3 執行資料庫遷移

```bash
# 執行遷移腳本
wrangler d1 execute xunni-db-staging --file=./src/db/schema.sql
```

### 3.4 部署 Worker

```bash
wrangler deploy --env staging
```

### 3.5 設定 Webhook

```bash
# 取得部署後的 URL
WORKER_URL="https://xunni-bot-staging.your-subdomain.workers.dev"

# 設定 Telegram Webhook
curl -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook" \
  -H "Content-Type: application/json" \
  -d "{\"url\": \"${WORKER_URL}/webhook\"}"
```

---

## 4. Production 環境部署

### 4.1 建立 Production 資源

```bash
# 建立 D1 資料庫
wrangler d1 create xunni-db

# 建立 KV 命名空間
wrangler kv:namespace create "RISK_CACHE"
```

### 4.2 設定環境變數

```bash
# 設定所有 Secrets
wrangler secret put TELEGRAM_BOT_TOKEN --env production
wrangler secret put TELEGRAM_WEBHOOK_SECRET --env production
wrangler secret put OPENAI_API_KEY --env production
wrangler secret put GIGAPUB_API_KEY --env production
wrangler secret put GIGAPUB_PLACEMENT_ID --env production
wrangler secret put EXTERNAL_API_KEY --env production
wrangler secret put HOROSCOPE_SOURCE_URL --env production
```

### 4.3 資料庫遷移

```bash
# 備份現有資料（如有）
wrangler d1 export xunni-db --output=backup.sql

# 執行遷移
wrangler d1 execute xunni-db --file=./src/db/schema.sql
```

### 4.4 部署

```bash
# 部署到 production
wrangler deploy --env production
```

### 4.5 設定 Webhook

```bash
WORKER_URL="https://xunni-bot.your-subdomain.workers.dev"

curl -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook" \
  -H "Content-Type: application/json" \
  -d "{\"url\": \"${WORKER_URL}/webhook\"}"
```

---

## 5. 自動化部署（CI/CD）

### 5.1 GitHub Actions

```yaml
# .github/workflows/deploy.yml

name: Deploy

on:
  push:
    branches:
      - main      # Production
      - staging   # Staging

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Deploy to Staging
        if: github.ref == 'refs/heads/staging'
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: deploy --env staging
      
      - name: Deploy to Production
        if: github.ref == 'refs/heads/main'
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: deploy --env production
```

### 5.2 設定 GitHub Secrets

在 GitHub Repository Settings → Secrets 中設定：
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

---

## 6. 資料庫遷移

### 6.1 遷移腳本結構

```
src/db/migrations/
├── 001_initial.sql
├── 002_add_horoscope_opt_in.sql
└── 003_add_subscription_fields.sql
```

### 6.2 執行遷移

```bash
# 本地
wrangler d1 execute xunni-db-dev --file=./src/db/migrations/002_add_horoscope_opt_in.sql --local

# Staging
wrangler d1 execute xunni-db-staging --file=./src/db/migrations/002_add_horoscope_opt_in.sql

# Production
wrangler d1 execute xunni-db --file=./src/db/migrations/002_add_horoscope_opt_in.sql
```

---

## 7. 監控與日誌

### 7.1 Cloudflare Analytics

在 Cloudflare Dashboard 查看：
- 請求數
- 錯誤率
- 響應時間
- Worker 使用量

### 7.2 日誌

```typescript
// 在 Worker 中使用 console.log
console.log('User action:', { userId, action: 'throw_bottle' });

// 使用 Cloudflare Logs
// 在 Dashboard → Workers → Logs 查看
```

---

## 8. 回滾策略

### 8.1 版本管理

```bash
# 查看部署歷史
wrangler deployments list

# 回滾到指定版本
wrangler rollback <deployment-id>
```

### 8.2 資料庫回滾

```bash
# 從備份恢復
wrangler d1 execute xunni-db --file=backup.sql
```

---

## 9. 健康檢查

### 9.1 健康檢查端點

```typescript
// src/router.ts

router.get('/health', async (request, env) => {
  try {
    // 檢查資料庫連接
    await env.DB.prepare('SELECT 1').first();
    
    return new Response(JSON.stringify({
      status: 'ok',
      timestamp: new Date().toISOString(),
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({
      status: 'error',
      error: String(error),
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
```

---

## 10. 部署檢查清單

### Production 部署前

- [ ] 所有測試通過
- [ ] 代碼審查完成
- [ ] 環境變數已設定
- [ ] 資料庫遷移已測試
- [ ] Webhook URL 已更新
- [ ] 監控已配置
- [ ] 備份策略已確認
- [ ] 回滾計劃已準備

---

## 11. 故障排除

### 11.1 常見問題

**問題**: Worker 部署失敗
- 檢查 `wrangler.toml` 配置
- 確認 API Token 有效
- 查看錯誤日誌

**問題**: Webhook 未收到訊息
- 確認 Webhook URL 正確
- 檢查 Telegram Bot Token
- 驗證 Webhook Secret

**問題**: 資料庫查詢失敗
- 確認 D1 資料庫已建立
- 檢查資料庫綁定名稱
- 驗證 SQL 語法

---

## 12. 參考資源

- [Cloudflare Workers 文檔](https://developers.cloudflare.com/workers/)
- [Wrangler CLI 文檔](https://developers.cloudflare.com/workers/wrangler/)
- [D1 資料庫文檔](https://developers.cloudflare.com/d1/)
- [Telegram Bot API](https://core.telegram.org/bots/api)

