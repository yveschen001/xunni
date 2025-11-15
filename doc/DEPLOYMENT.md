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

## 7. 監控與日誌（運維觀測）

### 7.1 Cloudflare Analytics

在 Cloudflare Dashboard 查看：
- 請求數（總請求數、成功/失敗數）
- 錯誤率（4xx、5xx 錯誤占比）
- 響應時間（P50、P95、P99 延遲）
- Worker 使用量（CPU 時間、請求次數）

### 7.2 日誌策略

**日誌等級**：
- `debug`：開發環境詳細日誌
- `info`：正常操作日誌（使用者註冊、丟瓶、撿瓶）
- `warn`：警告日誌（邀請碼異常、翻譯降級）
- `error`：錯誤日誌（API 失敗、資料庫錯誤）

**日誌格式**：
```typescript
// src/utils/logger.ts
export function log(
  level: 'debug' | 'info' | 'warn' | 'error',
  message: string,
  metadata?: Record<string, any>
): void {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...metadata,
  };
  
  console.log(JSON.stringify(logEntry));
}

// 使用範例
log('info', 'User threw bottle', { userId, bottleId, language });
log('warn', 'Translation fallback', { userId, from: 'openai', to: 'google' });
log('error', 'Database query failed', { error: error.message, query });
```

**日誌保留策略**：
- Cloudflare Workers 日誌：保留 7 天（免費版）
- 重要日誌（錯誤、警告）寫入 `behavior_logs` 表，永久保留
- 定期匯出日誌到外部儲存（可選，使用 Cloudflare Logpush）

### 7.3 告警機制

**告警條件**：
- 錯誤率 > 5%（1 小時內）
- Worker CPU 時間超過配額 80%
- 翻譯降級次數 > 100/天
- OpenAI API 失敗率 > 10%（1 小時內）
- 資料庫查詢失敗率 > 1%（1 小時內）

**告警方式**：
- Cloudflare Dashboard 通知
- Slack Webhook（可選）
- Email 通知（可選）

**實作範例**：
```typescript
// src/utils/alert.ts
export async function sendAlert(
  env: Env,
  level: 'warning' | 'critical',
  message: string,
  metadata?: Record<string, any>
): Promise<void> {
  // 發送到 Slack（如果配置了 SLACK_WEBHOOK_URL）
  if (env.SLACK_WEBHOOK_URL) {
    await fetch(env.SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `[${level.toUpperCase()}] ${message}`,
        attachments: [{ fields: Object.entries(metadata || {}).map(([k, v]) => ({ title: k, value: String(v) })) }],
      }),
    });
  }
  
  // 記錄到資料庫
  await env.DB.prepare(`
    INSERT INTO alerts (level, message, metadata, created_at)
    VALUES (?, ?, ?, datetime('now'))
  `).bind(level, message, JSON.stringify(metadata || {})).run();
}
```

### 7.4 性能監控

**關鍵指標**：
- API 響應時間（P50、P95、P99）
- 資料庫查詢時間
- 翻譯 API 響應時間
- Mini App 載入時間

**監控端點**：
- `/health`：健康檢查（資料庫連接、API 可用性）
- `/metrics`：性能指標（可選，使用 Prometheus 格式）

---

## 8. Mini App 靜態資產部署

### 8.1 Cloudflare Pages 部署

**部署流程**：
1. 將 Mini App 前端代碼推送到 GitHub
2. 在 Cloudflare Dashboard 建立 Pages 專案
3. 連接 GitHub Repository
4. 設定構建命令：
   ```bash
   npm run build
   ```
5. 設定輸出目錄：`dist`

**版本號管理**：
- 在 `package.json` 中維護版本號
- 每次部署時更新版本號
- 在 Mini App 中顯示版本號（用於除錯）

**WebApp.share Deep Link**：
- 確保 Deep Link 正確指向 Bot：`https://t.me/xunni_bot?startapp=...`
- 測試分享功能是否正常運作

### 8.2 靜態資源 CDN

**CDN 配置**：
- 使用 Cloudflare Pages 自帶 CDN
- 設定適當的 Cache-Control Header
- 啟用 Gzip/Brotli 壓縮

---

## 9. 回滾策略

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

## 10. 健康檢查

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

## 11. 部署檢查清單

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

## 12. 故障排除

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

## 13. 參考資源

- [Cloudflare Workers 文檔](https://developers.cloudflare.com/workers/)
- [Wrangler CLI 文檔](https://developers.cloudflare.com/workers/wrangler/)
- [D1 資料庫文檔](https://developers.cloudflare.com/d1/)
- [Telegram Bot API](https://core.telegram.org/bots/api)

