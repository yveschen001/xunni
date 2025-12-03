# 🚀 部署狀態

## ✅ **已完成的配置**

### **1. 法律文檔** ✅
- ✅ `public/privacy.html` - 英文版隱私權政策（17 KB）
- ✅ `public/terms.html` - 英文版使用者條款（21 KB）
- ✅ `public/community.html` - 英文版社群守則（20 KB）

### **2. 代碼配置** ✅
- ✅ `src/config/legal_urls.ts` - URL 和社交媒體配置（可配置）
- ✅ `src/legal/documents.ts` - 嵌入的 HTML 內容（自動生成）
- ✅ `src/worker.ts` - 添加靜態文件路由
- ✅ `src/telegram/handlers/start.ts` - 使用 `LEGAL_URLS`
- ✅ `src/telegram/handlers/onboarding_input.ts` - 使用 `LEGAL_URLS`
- ✅ `src/telegram/handlers/onboarding_callback.ts` - 使用 `LEGAL_URLS`
- ✅ `scripts/generate-legal-docs.js` - HTML 內容生成腳本

### **3. Lint 檢查** ✅
- ✅ 所有文件通過 lint 檢查

---

## 🔧 **部署方案**

我們採用了**嵌入 HTML 內容**的方案：

### **優點** ✅
- ✅ 不依賴 Cloudflare Workers Sites 或 Pages
- ✅ 不需要額外的 API 調用
- ✅ 部署簡單，只需部署 Worker
- ✅ 響應速度快（內容直接在 Worker 中）
- ✅ 可靠性高（不依賴外部服務）

### **缺點** ⚠️
- ⚠️ Worker 大小增加約 58 KB（總計約 60 KB）
- ⚠️ 更新法律文檔需要重新生成和部署

### **如何更新法律文檔**

1. 修改 `public/*.html` 文件
2. 執行：`node scripts/generate-legal-docs.js`
3. 部署：`pnpm deploy:staging` 或 `pnpm deploy:production`

---

## 📊 **文件大小**

```
public/privacy.html:     17.05 KB
public/terms.html:       21.21 KB
public/community.html:   19.82 KB
─────────────────────────────────
Total:                   58.07 KB

src/legal/documents.ts:  ~60 KB (含 TypeScript 代碼)
```

---

## ⏳ **當前狀態**

### **問題：Cloudflare API 超時** ⚠️

```
✘ [ERROR] Received a malformed response from the API
  upstream request timeout
  GET /accounts/.../workers/services/xunni-bot-staging -> 504 Gateway Timeout
```

**可能原因：**
1. Cloudflare API 暫時性問題
2. 網路連接問題
3. Worker 大小過大（但 60 KB 應該沒問題，限制是 1 MB）

**解決方案：**
1. ✅ **等待幾分鐘後重試**（推薦）
2. ✅ **檢查 Cloudflare 狀態頁面**：https://www.cloudflarestatus.com/
3. ✅ **更新 Wrangler**：`pnpm add -D wrangler@latest`
4. ✅ **使用 Cloudflare Dashboard 手動部署**

---

## 🚀 **下一步**

### **選項 A：等待後重試** ⭐ 推薦

```bash
# 等待 5-10 分鐘後重試
pnpm deploy:staging
```

### **選項 B：更新 Wrangler**

```bash
# 更新到最新版本
pnpm add -D wrangler@latest

# 重新部署
pnpm deploy:staging
```

### **選項 C：使用 Cloudflare Dashboard**

1. 登入 Cloudflare Dashboard
2. 進入 Workers & Pages
3. 找到 `xunni-bot-staging`
4. 手動上傳代碼

---

## 📝 **URL 配置**

部署成功後，需要更新 `src/config/legal_urls.ts` 中的 URL：

```typescript
if (env === 'production') {
  return 'https://xunni-bot.你的帳號.workers.dev';
} else if (env === 'staging') {
  return 'https://xunni-bot-staging.你的帳號.workers.dev';
}
```

**部署後會顯示實際的 URL，例如：**

```
✨ Deployment complete!
URL: https://xunni-bot-staging.abc123.workers.dev
```

---

## 🎯 **社交媒體配置**

我已經在 `src/config/legal_urls.ts` 中添加了社交媒體配置：

```typescript
export const SOCIAL_LINKS = {
  SUPPORT_BOT: '@xunni_support',
  OFFICIAL_CHANNEL: null,  // 設置為 '@xunni_official' 或 null
  OFFICIAL_GROUP: null,
  TWITTER: null,           // 設置為 'https://twitter.com/xunni_bot' 或 null
  INSTAGRAM: null,
  FACEBOOK: null,
  DISCORD: null,
  GITHUB: null,
  SUPPORT_EMAIL: 'support@xunni.app',
  PRIVACY_EMAIL: 'privacy@xunni.app',
  WEBSITE: null,           // 設置為 'https://xunni.app' 或 null
} as const;
```

**如何使用：**

```typescript
import { SOCIAL_LINKS, hasSocialLink, getSocialLink } from '~/config/legal_urls';

// 檢查是否配置
if (hasSocialLink('TWITTER')) {
  const url = getSocialLink('TWITTER');
  // 顯示 Twitter 鏈接
}
```

**更新社交媒體鏈接時：**

1. 修改 `src/config/legal_urls.ts` 中的 `SOCIAL_LINKS`
2. 重新部署：`pnpm deploy:staging` 或 `pnpm deploy:production`

---

## 📋 **檢查清單**

### **配置完成** ✅
- [x] ✅ 法律文檔已創建（英文版）
- [x] ✅ HTML 內容已嵌入代碼
- [x] ✅ Worker 路由已配置
- [x] ✅ Handler 文件已更新
- [x] ✅ 社交媒體配置已添加
- [x] ✅ Lint 檢查通過

### **待部署** ⏳
- [ ] ⏳ 部署到 Staging（等待 Cloudflare API 恢復）
- [ ] ⏳ 測試 Staging
- [ ] ⏳ 更新 URL 配置
- [ ] ⏳ 部署到 Production
- [ ] ⏳ 設置 BotFather

---

## 💡 **建議**

1. **等待 5-10 分鐘後重試部署**
   - Cloudflare API 可能暫時性問題
   - 通常會自動恢復

2. **檢查 Cloudflare 狀態**
   - 訪問：https://www.cloudflarestatus.com/
   - 確認是否有服務中斷

3. **更新 Wrangler（可選）**
   - 當前版本：3.114.15
   - 最新版本：4.49.0
   - 命令：`pnpm add -D wrangler@latest`

4. **準備 Workers URL**
   - 部署成功後記下 URL
   - 更新 `legal_urls.ts` 配置
   - 重新部署

---

## 📞 **需要幫助？**

如果持續遇到問題：

1. **檢查網路連接**
2. **檢查 Cloudflare 帳號狀態**
3. **嘗試使用 VPN**
4. **聯繫 Cloudflare 支援**

---

**最後更新**: 2025-11-18 21:12 (台北時間)
**狀態**: 等待 Cloudflare API 恢復
**下一步**: 5-10 分鐘後重試部署

