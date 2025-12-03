# 🛠️ 本地開發指南

當 Cloudflare 連接有問題時，你可以完全在本地開發和測試。

---

## 🎯 **本地開發方案對比**

| 方案 | 優點 | 缺點 | 推薦度 |
|------|------|------|--------|
| **Wrangler Dev + ngrok** | 完整模擬生產環境 | 需要 ngrok | ⭐⭐⭐⭐⭐ |
| **Polling 模式** | 不需要 Webhook | 無法測試 Webhook | ⭐⭐⭐⭐ |
| **Mock 測試** | 最快速 | 無法測試真實交互 | ⭐⭐⭐ |

---

## 🚀 **方案 1: Wrangler Dev + ngrok（推薦）**

### **優點**
- ✅ 完整模擬 Cloudflare Workers 環境
- ✅ 使用本地 D1 數據庫（SQLite）
- ✅ 支持熱重載
- ✅ 完整的日誌輸出
- ✅ 可以測試真實的 Telegram 交互

### **設置步驟**

#### **Step 1: 啟動本地 Worker**

```bash
cd XunNi
pnpm dev
```

這會啟動本地服務器在 `http://localhost:8787`

#### **Step 2: 安裝並啟動 ngrok**

```bash
# 安裝 ngrok（如果還沒有）
brew install ngrok

# 或者從官網下載：https://ngrok.com/download

# 啟動 ngrok
ngrok http 8787
```

你會看到類似的輸出：

```
Forwarding  https://abc123.ngrok.io -> http://localhost:8787
```

#### **Step 3: 設置 Telegram Webhook**

```bash
# 使用 ngrok 提供的 URL 設置 Webhook
curl -X POST "https://api.telegram.org/bot你的TOKEN/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://abc123.ngrok.io/webhook",
    "secret_token": "你的SECRET"
  }'
```

#### **Step 4: 測試**

1. 打開 Telegram
2. 給你的 Bot 發送消息
3. 查看終端日誌

### **調試技巧**

```bash
# 查看 ngrok 請求日誌
# 訪問：http://localhost:4040

# 查看 Wrangler 日誌
# 終端會實時顯示所有請求和錯誤
```

---

## 🔄 **方案 2: Polling 模式（無需 ngrok）**

### **優點**
- ✅ 不需要公網 URL
- ✅ 不需要 ngrok
- ✅ 簡單直接
- ✅ 適合快速開發

### **缺點**
- ❌ 無法完全模擬生產環境
- ❌ 需要單獨處理數據庫連接

### **使用方法**

#### **Step 1: 設置環境變量**

創建 `.dev.vars.local`（如果還沒有）：

```bash
cp .dev.vars .dev.vars.local
```

#### **Step 2: 設置本地數據庫**

```bash
# 創建本地 D1 數據庫
wrangler d1 create xunni-db-local

# 運行 migrations
wrangler d1 migrations apply xunni-db-local --local
```

#### **Step 3: 運行 Polling 腳本**

```bash
# 安裝 tsx（如果還沒有）
pnpm add -D tsx

# 運行 polling 腳本
pnpm tsx scripts/dev-polling.ts
```

#### **Step 4: 測試**

給 Bot 發送消息，查看終端日誌。

---

## 🧪 **方案 3: 單元測試（最快）**

### **優點**
- ✅ 最快速
- ✅ 不需要網絡
- ✅ 可以測試邊界情況
- ✅ 可重複執行

### **使用方法**

#### **創建測試文件**

```typescript
// tests/handlers/start.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { handleStart } from '~/telegram/handlers/start';

describe('Start Handler', () => {
  let mockEnv: any;
  let mockMessage: any;
  
  beforeEach(() => {
    // Setup mock environment
    mockEnv = {
      TELEGRAM_BOT_TOKEN: 'test-token',
      DB: mockDB,
      // ... other env vars
    };
    
    mockMessage = {
      chat: { id: 123456 },
      from: { id: 123456, first_name: 'Test' },
      text: '/start',
    };
  });
  
  it('should handle new user registration', async () => {
    await handleStart(mockMessage, mockEnv);
    
    // Assert expected behavior
    expect(mockDB.query).toHaveBeenCalled();
  });
});
```

#### **運行測試**

```bash
pnpm test
```

---

## 📊 **本地數據庫設置**

### **使用本地 D1 數據庫**

```bash
# 1. 創建本地數據庫
wrangler d1 create xunni-db-local

# 2. 更新 wrangler.toml（添加本地數據庫）
# [[ d1_databases ]]
# binding = "DB"
# database_name = "xunni-db-local"
# database_id = "local"

# 3. 運行 migrations
wrangler d1 migrations apply xunni-db-local --local

# 4. 查看數據
wrangler d1 execute xunni-db-local --local --command "SELECT * FROM users LIMIT 10"
```

### **使用 SQLite 直接操作**

```bash
# 本地 D1 數據庫實際上是 SQLite
# 文件位置：.wrangler/state/v3/d1/miniflare-D1DatabaseObject/...

# 使用 SQLite CLI
sqlite3 .wrangler/state/v3/d1/miniflare-D1DatabaseObject/xxxx.sqlite

# 查詢數據
sqlite> SELECT * FROM users LIMIT 10;
```

---

## 🔍 **調試技巧**

### **1. 使用 Console 日誌**

```typescript
// 在代碼中添加詳細日誌
console.log('[Handler] Processing message:', message);
console.log('[DB] Query result:', result);
console.error('[Error] Something went wrong:', error);
```

### **2. 使用 Wrangler Tail（查看生產日誌）**

即使無法部署，也可以查看現有的生產日誌：

```bash
# 查看 Staging 日誌
wrangler tail --env staging

# 查看 Production 日誌
wrangler tail --env production
```

### **3. 使用 Chrome DevTools**

```bash
# 啟動 Wrangler Dev 時添加 --inspector
pnpm dev --inspector

# 然後在 Chrome 打開：
# chrome://inspect
```

### **4. 使用 VS Code 調試器**

創建 `.vscode/launch.json`：

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Wrangler Dev",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "pnpm",
      "runtimeArgs": ["dev", "--inspector"],
      "console": "integratedTerminal",
      "skipFiles": ["<node_internals>/**"]
    }
  ]
}
```

---

## 🛠️ **常用開發命令**

```bash
# 啟動本地開發服務器
pnpm dev

# 運行測試
pnpm test

# 運行測試（watch 模式）
pnpm test --watch

# 運行 lint
pnpm lint

# 查看本地數據庫
wrangler d1 execute DB --local --command "SELECT * FROM users"

# 重置本地數據庫
rm -rf .wrangler/state
wrangler d1 migrations apply DB --local

# 查看遠程日誌（如果可以連接）
wrangler tail --env staging
```

---

## 📝 **開發工作流程**

### **典型的開發流程**

```bash
# 1. 啟動本地服務器
pnpm dev

# 2. 在另一個終端啟動 ngrok
ngrok http 8787

# 3. 設置 Webhook
curl -X POST "https://api.telegram.org/bot你的TOKEN/setWebhook" \
  -d "url=https://abc123.ngrok.io/webhook"

# 4. 開始開發
# - 修改代碼
# - 保存文件（自動重載）
# - 測試功能
# - 查看日誌

# 5. 運行測試
pnpm test

# 6. 提交代碼
git add .
git commit -m "Add new feature"
git push
```

### **無需 Cloudflare 的開發流程**

```bash
# 1. 運行 Polling 模式
pnpm tsx scripts/dev-polling.ts

# 2. 開始開發
# - 修改代碼
# - 重啟腳本
# - 測試功能

# 3. 運行測試
pnpm test

# 4. 提交代碼
git add .
git commit -m "Add new feature"
git push

# 5. 等 Cloudflare 恢復後再部署
```

---

## 🎯 **推薦的開發方案**

### **如果 Cloudflare 暫時連不上**

**短期（今天）：**
1. 使用 **Wrangler Dev + ngrok** 進行開發
2. 所有功能都可以正常測試
3. 代碼提交到 Git

**中期（明天）：**
1. 嘗試重新連接 Cloudflare
2. 如果還是不行，繼續用本地開發
3. 考慮使用 VPN

**長期（如果持續有問題）：**
1. 考慮遷移到 Railway 或其他平台
2. 但本地開發完全不受影響

---

## ✅ **本地開發檢查清單**

- [ ] 安裝 ngrok 或 cloudflared
- [ ] 設置本地 D1 數據庫
- [ ] 配置 `.dev.vars.local`
- [ ] 啟動 `pnpm dev`
- [ ] 設置 Telegram Webhook
- [ ] 測試基本功能
- [ ] 設置 VS Code 調試器（可選）
- [ ] 運行測試確保一切正常

---

## 🆘 **常見問題**

### **Q: ngrok 連接不穩定怎麼辦？**

**A:** 使用 Cloudflare Tunnel 或 Polling 模式

### **Q: 本地數據庫數據丟失了？**

**A:** 本地 D1 數據在 `.wrangler/state/` 目錄，可以備份

### **Q: 無法連接到 Telegram API？**

**A:** 檢查網絡連接，或使用代理

### **Q: 熱重載不工作？**

**A:** 重啟 `pnpm dev`，或檢查文件監聽

---

## 💡 **總結**

**你完全可以在本地開發，不受 Cloudflare 連接問題影響！**

**推薦方案：**
1. **日常開發**：Wrangler Dev + ngrok
2. **快速測試**：Polling 模式
3. **單元測試**：Vitest

**現在就可以開始開發廣告系統或其他功能！** 🚀

---

**需要我幫你設置本地開發環境嗎？** 🛠️

