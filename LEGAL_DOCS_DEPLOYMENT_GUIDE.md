# 🚀 XunNi 法律文檔部署指南

## ✅ **已完成的配置**

我們已經完成了所有必要的代碼配置，現在可以部署了！

### **1. 配置文件** ✅

- ✅ **`wrangler.toml`**: 已添加 `[site]` 配置，支持靜態文件
- ✅ **`src/config/legal_urls.ts`**: 已創建 URL 配置文件
- ✅ **`src/telegram/handlers/start.ts`**: 已更新，使用 `LEGAL_URLS`
- ✅ **`src/telegram/handlers/onboarding_input.ts`**: 已更新，使用 `LEGAL_URLS`
- ✅ **`src/telegram/handlers/onboarding_callback.ts`**: 已更新，使用 `LEGAL_URLS`

### **2. 法律文檔** ✅

- ✅ **`public/privacy.html`**: 英文版隱私權政策（約 5,000 字）
- ✅ **`public/terms.html`**: 英文版使用者條款（約 6,000 字）
- ✅ **`public/community.html`**: 英文版社群守則（約 4,500 字）

### **3. Lint 檢查** ✅

- ✅ 所有文件通過 lint 檢查，無錯誤

---

## 🔧 **部署前準備**

### **Step 1: 更新 URL 配置**

打開 `src/config/legal_urls.ts`，找到以下部分：

```typescript
if (env === 'production') {
  // TODO: Replace with your production domain or Workers URL
  return 'https://xunni-bot.your-subdomain.workers.dev';
} else if (env === 'staging') {
  // TODO: Replace with your staging Workers URL
  return 'https://xunni-bot-staging.your-subdomain.workers.dev';
}
```

**請替換為你的實際 Workers URL：**

#### **選項 A：使用 Workers 自帶域名（推薦）** ⭐

1. **查看你的 Workers URL**

```bash
# 部署後會顯示 URL，例如：
# https://xunni-bot-staging.your-account.workers.dev
```

2. **更新配置**

```typescript
if (env === 'production') {
  return 'https://xunni-bot.your-account.workers.dev';
} else if (env === 'staging') {
  return 'https://xunni-bot-staging.your-account.workers.dev';
}
```

#### **選項 B：使用自定義域名（如果有）**

```typescript
if (env === 'production') {
  return 'https://xunni.app';
} else if (env === 'staging') {
  return 'https://staging.xunni.app';
}
```

**注意：** 如果使用自定義域名，需要在 Cloudflare Dashboard 中綁定域名。

---

## 🚀 **部署步驟**

### **Step 1: 本地測試（可選）**

```bash
# 啟動本地開發服務器
pnpm dev

# 在瀏覽器中訪問
# http://localhost:8787/privacy.html
# http://localhost:8787/terms.html
# http://localhost:8787/community.html
```

**預期結果：**
- ✅ 所有 3 個頁面都能正常顯示
- ✅ 樣式正確（響應式設計）
- ✅ 內容完整

### **Step 2: 部署到 Staging**

```bash
# 部署到 Staging 環境
pnpm deploy:staging
```

**預期輸出：**

```
✨ Built successfully!
✨ Uploading...
✨ Deployment complete!

URL: https://xunni-bot-staging.your-account.workers.dev
```

**測試 Staging 部署：**

1. **訪問法律文檔**

```bash
# 在瀏覽器中訪問
https://xunni-bot-staging.your-account.workers.dev/privacy.html
https://xunni-bot-staging.your-account.workers.dev/terms.html
https://xunni-bot-staging.your-account.workers.dev/community.html
```

2. **測試 Bot 中的鏈接**

- 啟動 Bot：`/start`
- 在註冊流程中點擊「View Privacy Policy」按鈕
- 確認鏈接正確打開

**如果 URL 不正確：**

1. 記下 Staging 的實際 URL
2. 更新 `src/config/legal_urls.ts` 中的 `staging` URL
3. 重新部署：`pnpm deploy:staging`

### **Step 3: 部署到 Production**

**⚠️ 部署前確認：**

- ✅ Staging 測試通過
- ✅ 所有鏈接正確
- ✅ 法律文檔顯示正常
- ✅ URL 配置正確

**部署命令：**

```bash
# 部署到 Production 環境
pnpm deploy:production
```

**測試 Production 部署：**

```bash
# 在瀏覽器中訪問
https://xunni-bot.your-account.workers.dev/privacy.html
https://xunni-bot.your-account.workers.dev/terms.html
https://xunni-bot.your-account.workers.dev/community.html
```

---

## 🔍 **驗證檢查清單**

### **部署驗證** ✅

- [ ] **法律文檔可訪問**
  - [ ] Privacy Policy 頁面正常顯示
  - [ ] Terms of Service 頁面正常顯示
  - [ ] Community Guidelines 頁面正常顯示

- [ ] **樣式正確**
  - [ ] 響應式設計正常（手機、平板、電腦）
  - [ ] 顏色、字體、排版正確
  - [ ] 警告框、提示框正常顯示

- [ ] **內容完整**
  - [ ] 所有章節都顯示
  - [ ] 沒有亂碼或格式錯誤
  - [ ] 頁尾鏈接正確

### **Bot 集成驗證** ✅

- [ ] **註冊流程**
  - [ ] `/start` 命令正常
  - [ ] 「View Privacy Policy」按鈕正確
  - [ ] 「View Terms of Service」按鈕正確
  - [ ] 點擊按鈕後正確打開法律文檔

- [ ] **多語言提示**
  - [ ] 顯示「Legal documents are provided in English only.」提示
  - [ ] 提示位置正確（在按鈕上方）

### **合規驗證** ✅

- [ ] **Telegram App Center 要求**
  - [ ] Privacy Policy 完整
  - [ ] Terms of Service 完整
  - [ ] Community Guidelines 完整
  - [ ] 年齡限制明確（18+）
  - [ ] 反詐騙警告明確

- [ ] **GDPR 合規**
  - [ ] 資料收集透明
  - [ ] 用戶權利說明
  - [ ] 資料保留期限說明
  - [ ] 帳號刪除流程說明

---

## 🎯 **下一步：設置 BotFather**

部署完成後，需要在 BotFather 中設置 Bot 信息。

### **Step 1: 設置 Bot 描述**

```
/setdescription

XunNi - MBTI Bottle Messaging Anonymous Social Bot
Match chat partners based on MBTI, zodiac, gender, and other criteria
```

### **Step 2: 設置 Bot 關於文字**

```
/setabouttext

🍾 XunNi is an anonymous bottle messaging social platform based on MBTI and zodiac signs

✨ Core Features:
• Match chat partners based on MBTI, zodiac, gender
• Completely anonymous chat, protect privacy
• MBTI personality test, horoscope readings
• VIP users support automatic translation in 34 languages

🛡️ Safety Guarantee:
• Must be 18+ years old to use
• Anti-fraud security test
• Reporting and banning mechanism

📋 Legal Documents:
• Privacy Policy: https://xunni-bot.your-account.workers.dev/privacy.html
• Terms of Service: https://xunni-bot.your-account.workers.dev/terms.html
• Community Guidelines: https://xunni-bot.your-account.workers.dev/community.html
```

**⚠️ 記得替換 URL 為你的實際 Workers URL！**

### **Step 3: 設置命令列表**

```
/setcommands

start - Start / Register
throw - Throw a bottle
catch - Catch a bottle
profile - View profile
stats - View statistics
invite - Invite friends
vip - VIP subscription
block - Block user
report - Report violation
appeal - Appeal ban
delete_me - Delete account
help - Help
```

---

## 🎉 **部署完成！**

### **已完成的工作** ✅

- ✅ 創建完整的英文版法律文檔（Privacy Policy、Terms of Service、Community Guidelines）
- ✅ 配置 Cloudflare Workers Sites 支持靜態文件
- ✅ 創建 URL 配置文件（`src/config/legal_urls.ts`）
- ✅ 更新所有 Handler 文件，使用新的 URL 配置
- ✅ 添加多語言提示（「Legal documents are provided in English only.」）
- ✅ 通過 Lint 檢查

### **下一步行動** 🚀

1. **立即可做：**
   - [ ] 更新 `src/config/legal_urls.ts` 中的 URL（替換為實際 Workers URL）
   - [ ] 部署到 Staging：`pnpm deploy:staging`
   - [ ] 測試 Staging 部署
   - [ ] 部署到 Production：`pnpm deploy:production`
   - [ ] 設置 BotFather（描述、關於文字、命令列表）

2. **後續可做：**
   - [ ] 提交 Bot 到 Telegram App Center
   - [ ] 開始推廣運營
   - [ ] 開發廣告系統（Phase 1-3）

---

## 🆘 **故障排除**

### **問題 1：法律文檔無法訪問（404 錯誤）**

**原因：** Workers Sites 配置可能未生效

**解決方案：**

1. 確認 `wrangler.toml` 中有 `[site]` 配置：

```toml
[site]
bucket = "./public"
```

2. 確認 `public/` 目錄存在且包含 3 個 HTML 文件
3. 重新部署：`pnpm deploy:staging`

### **問題 2：Bot 中的鏈接打不開**

**原因：** URL 配置不正確

**解決方案：**

1. 檢查 `src/config/legal_urls.ts` 中的 URL 是否正確
2. 確認 Workers URL 是否正確（查看部署日誌）
3. 更新 URL 後重新部署

### **問題 3：樣式顯示不正常**

**原因：** HTML 文件可能損壞或未正確上傳

**解決方案：**

1. 確認 `public/` 目錄中的 HTML 文件完整
2. 重新部署：`pnpm deploy:staging`
3. 清除瀏覽器緩存後重試

### **問題 4：本地測試無法訪問法律文檔**

**原因：** 本地開發服務器可能不支持 Workers Sites

**解決方案：**

1. 直接在瀏覽器中打開 HTML 文件：`file:///path/to/XunNi/public/privacy.html`
2. 或者部署到 Staging 進行測試

---

## 📞 **需要幫助？**

如果遇到問題：

1. **檢查部署日誌**：查看 `pnpm deploy:staging` 的輸出
2. **檢查 Cloudflare Dashboard**：確認 Worker 已部署
3. **檢查 URL 配置**：確認 `legal_urls.ts` 中的 URL 正確
4. **測試鏈接**：在瀏覽器中直接訪問法律文檔 URL

---

## 📝 **重要提醒**

### **1. URL 配置**

**⚠️ 必須在部署前更新 `src/config/legal_urls.ts` 中的 URL！**

部署後會得到實際的 Workers URL，例如：

```
https://xunni-bot-staging.your-account.workers.dev
```

請將這個 URL 更新到配置文件中。

### **2. BotFather 設置**

**⚠️ 記得在 BotFather 的「關於文字」中使用實際的 URL！**

不要使用 `your-account.workers.dev`，而是使用你的實際 Workers URL。

### **3. 法律文檔更新**

如果需要更新法律文檔：

1. 修改 `public/` 目錄中的 HTML 文件
2. 更新「Last Updated」日期
3. 重新部署：`pnpm deploy:production`
4. 通知用戶（如果是重大變更）

---

## 🎯 **總結**

### **部署流程總覽**

```
1. 更新 URL 配置（legal_urls.ts）
   ↓
2. 部署到 Staging（pnpm deploy:staging）
   ↓
3. 測試 Staging（訪問法律文檔、測試 Bot）
   ↓
4. 部署到 Production（pnpm deploy:production）
   ↓
5. 設置 BotFather（描述、關於文字、命令）
   ↓
6. 完成！🎉
```

### **預估時間**

- **更新 URL 配置**：5 分鐘
- **部署到 Staging**：5 分鐘
- **測試 Staging**：10 分鐘
- **部署到 Production**：5 分鐘
- **設置 BotFather**：10 分鐘
- **總計**：約 35 分鐘

---

**準備好了嗎？讓我們開始部署！** 🚀

**下一步：** 更新 `src/config/legal_urls.ts` 中的 URL，然後執行 `pnpm deploy:staging`

