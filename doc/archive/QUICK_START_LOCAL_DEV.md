# 🚀 本地開發快速開始

## 💡 **3 種本地開發方式**

### **方式 1: Wrangler Dev + ngrok（最完整）** ⭐⭐⭐⭐⭐

```bash
# 終端 1: 啟動本地 Worker
pnpm dev

# 終端 2: 啟動 ngrok
ngrok http 8787

# 終端 3: 設置 Webhook
curl -X POST "https://api.telegram.org/bot你的TOKEN/setWebhook" \
  -d "url=https://你的ngrok地址.ngrok.io/webhook"
```

### **方式 2: Polling 模式（最簡單）** ⭐⭐⭐⭐

```bash
# 一條命令搞定
pnpm dev:polling
```

### **方式 3: 單元測試（最快）** ⭐⭐⭐

```bash
# 運行測試
pnpm test

# Watch 模式
pnpm test --watch
```

---

## 🎯 **推薦：使用 Wrangler Dev + ngrok**

### **Step 1: 安裝 ngrok**

```bash
brew install ngrok
```

或從官網下載：https://ngrok.com/download

### **Step 2: 啟動開發環境**

```bash
# 啟動本地 Worker
pnpm dev
```

### **Step 3: 啟動 ngrok（新終端）**

```bash
ngrok http 8787
```

複製 ngrok 提供的 URL，例如：`https://abc123.ngrok.io`

### **Step 4: 設置 Telegram Webhook**

```bash
curl -X POST "https://api.telegram.org/bot你的TOKEN/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://abc123.ngrok.io/webhook"
  }'
```

### **Step 5: 測試**

1. 打開 Telegram
2. 給 Bot 發送消息
3. 查看終端日誌

### **Step 6: 開發**

- 修改代碼
- 保存文件（自動重載）
- 測試功能
- 查看日誌

---

## 🔄 **如果不想用 ngrok：使用 Polling 模式**

### **Step 1: 運行 Polling 腳本**

```bash
pnpm dev:polling
```

### **Step 2: 測試**

給 Bot 發送消息，查看終端日誌。

### **Step 3: 開發**

- 修改代碼
- 重啟腳本（Ctrl+C 然後重新運行）
- 測試功能

---

## 🧪 **調試技巧**

### **查看詳細日誌**

```bash
# Wrangler Dev 會自動顯示所有日誌
pnpm dev
```

### **使用 Chrome DevTools 調試**

```bash
# 啟動帶調試器的 Dev 服務器
pnpm dev:inspector

# 然後在 Chrome 打開：
# chrome://inspect
```

### **查看 ngrok 請求**

訪問：http://localhost:4040

### **查看本地數據庫**

```bash
# 查詢用戶
wrangler d1 execute DB --local --command "SELECT * FROM users LIMIT 10"

# 查詢漂流瓶
wrangler d1 execute DB --local --command "SELECT * FROM bottles LIMIT 10"
```

---

## 📊 **常用命令**

```bash
# 本地開發
pnpm dev                    # 啟動本地 Worker
pnpm dev:polling            # Polling 模式
pnpm dev:inspector          # 帶調試器

# 測試
pnpm test                   # 運行測試
pnpm test --watch           # Watch 模式
pnpm test:coverage          # 測試覆蓋率

# 代碼質量
pnpm lint                   # 檢查代碼
pnpm lint:fix               # 自動修復
pnpm typecheck              # 類型檢查

# 數據庫
wrangler d1 execute DB --local --command "SELECT * FROM users"
wrangler d1 migrations apply DB --local

# 部署（當 Cloudflare 恢復後）
pnpm deploy:staging         # 部署到 Staging
pnpm deploy:production      # 部署到 Production
```

---

## ✅ **開發檢查清單**

- [ ] 安裝 ngrok（或使用 Polling 模式）
- [ ] 啟動 `pnpm dev`
- [ ] 設置 Webhook（或運行 Polling）
- [ ] 測試基本功能（/start, /help）
- [ ] 開始開發新功能
- [ ] 運行測試 `pnpm test`
- [ ] 提交代碼 `git commit`

---

## 🎉 **現在就可以開始開發了！**

**不需要等 Cloudflare 恢復，完全可以在本地開發所有功能！**

**詳細指南**: 參考 `LOCAL_DEVELOPMENT_GUIDE.md`

