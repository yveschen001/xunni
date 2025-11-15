# XunNi 專案文檔索引

## 📚 文檔總覽

本目錄包含 XunNi 專案的完整開發規範與指南。請按照以下順序閱讀：

### 1. 核心規格

- **[SPEC.md](./SPEC.md)** - 專案規格書
  - 產品總覽與核心特性
  - 技術棧與專案結構
  - 資料庫 Schema
  - 業務邏輯詳述
  - 使用流程與 Telegram 指令

### 2. 開發規範

- **[DEVELOPMENT_STANDARDS.md](./DEVELOPMENT_STANDARDS.md)** - 開發規範
  - 目錄結構規範
  - 代碼規範（TypeScript、命名、註釋）
  - 模組化設計原則
  - Git 提交規範

- **[MODULE_DESIGN.md](./MODULE_DESIGN.md)** - 模組化設計 ⭐ **更新**
  - 架構原則與分層設計
  - 各層職責說明
  - account-linker.ts（帳號綁定）⭐ 新增
  - translation-policy.ts（翻譯策略）⭐ 新增
  - 模組間通信方式
  - 測試策略

### 3. 配置與環境

- **[ENV_CONFIG.md](./ENV_CONFIG.md)** - 環境配置指南 ⭐ **更新**
  - 環境變數總覽（含多平台變數）
  - Development / Staging / Production 配置
  - Telegram WebApp 驗簽（TELEGRAM_BOT_SECRET）
  - Google / Apple OAuth 配置
  - WeChat / Line 配置
  - 翻譯供應商配置（GOOGLE_TRANSLATE_API_KEY）
  - 環境變數驗證
  - 安全最佳實踐

- **[I18N_GUIDE.md](./I18N_GUIDE.md)** - 國際化指南
  - i18n 架構設計
  - 翻譯鍵值命名規範
  - 語言包結構
  - 使用範例

### 4. 功能實作

- **[ONBOARDING_FLOW.md](./ONBOARDING_FLOW.md)** - 註冊引導流程
  - 智能對話式引導（10 步）
  - 中斷恢復機制
  - 性別/生日深度確認（永遠不能修改）
  - 18 歲年齡驗證
  - 條款與隱私權同意

- **[USER_STATS.md](./USER_STATS.md)** - 使用者數據統計 ⭐ **更新**
  - 漂流瓶統計（總數、最近 7 天、最近 30 天）
  - 聊天統計（總次數、活躍對話、對話對象）
  - 充值記錄查詢
  - 活躍度排名（全球百分比）
  - 裂變 KPI（邀請統計、分享統計）⭐ 新增
  - 翻譯使用統計（VIP 專屬）⭐ 新增

- **[PUSH_NOTIFICATIONS.md](./PUSH_NOTIFICATIONS.md)** - 主動推送機制 ⭐ **更新**
  - 智能推送策略（丟瓶、撿瓶、對話提醒）
  - 測驗完成分享提醒 ⭐ 新增
  - 避免打擾機制
  - 使用者偏好設定
  - 推送效果追蹤

- **[CHAT_HISTORY.md](./CHAT_HISTORY.md)** - 聊天記錄功能 ⭐ **新增**
  - 查看所有對話列表
  - 查看單個對話完整記錄
  - 查看漂流瓶原始內容
  - 匿名保護

- **[ROADMAP.md](./ROADMAP.md)** - 專案路線圖 ⭐ **新增**
  - M1: Telegram Mini App
  - M2: WeChat / Line 插件
  - M3: App Store / Google Play
  - 技術交付物與合規要求
  - 風險管理與里程碑追蹤

- **[TRANSLATION_STRATEGY.md](./TRANSLATION_STRATEGY.md)** - 翻譯策略設計 ⭐ **新增**
  - VIP 優先使用 OpenAI，失敗降級到 Google
  - 免費使用者僅使用 Google
  - 翻譯成本記錄與監控
  - 降級事件追蹤與告警

- **[AI_MODERATION.md](./AI_MODERATION.md)** - AI 內容審核設計 ⭐ **新增**
  - OpenAI 內容審核（可選，失敗不阻擋）
  - 本地規則優先（URL 白名單、敏感詞）
  - Audit 日誌記錄
  - 失敗處理策略

- **[ADMIN_PANEL.md](./ADMIN_PANEL.md)** - 管理後台設計
  - 角色權限說明
  - 管理指令詳述
  - 運營數據統計
  - 手動封禁/解封、VIP 升級

- **[TELEGRAM_STARS.md](./TELEGRAM_STARS.md)** - Telegram Stars 訂閱 ⭐ **更新**
  - 支付流程實作
  - 自動續訂機制
  - 退款處理
  - 價格計算
  - VIP 翻譯權益說明（OpenAI vs Google）⭐ 新增

- **[REFERENCE_CODE.md](./REFERENCE_CODE.md)** - 參考代碼分析
  - moonini_bot 訊息轉發機制
  - 翻譯功能實作
  - 匿名聊天實現細節

- **[COMMERCIAL_CHECKLIST.md](./COMMERCIAL_CHECKLIST.md)** - 商業化檢查清單 ⭐ **更新**
  - 法律合規檢查
  - 功能完整性檢查
  - 上線前檢查
  - 多平台審查與 UI Guideline ⭐ 新增
    - Google Play Material 3
    - App Store HIG
    - Telegram Mini App
    - WeChat / Line 插件
  - 持續改進計劃

- **[DOCUMENT_COMPLETENESS.md](./DOCUMENT_COMPLETENESS.md)** - 文檔完整性檢查 ⭐ **更新**
  - 功能覆蓋檢查（含多平台、翻譯、裂變）
  - 資料庫完整性檢查（28 個表）
  - 指令完整性檢查
  - 市場產品功能對比

### 5. 測試與部署

- **[TESTING.md](./TESTING.md)** - 測試規範
  - 測試策略與覆蓋率目標
  - 單元測試範例
  - 整合測試
  - CI/CD 整合

- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - 部署指南
  - 部署前準備
  - Staging / Production 部署流程
  - 自動化部署（GitHub Actions）
  - 監控與故障排除

- **[BACKUP_STRATEGY.md](./BACKUP_STRATEGY.md)** - 備份策略
  - 單向備份原則
  - 備份流程與腳本
  - 自動化備份
  - 還原流程

---

## 🚀 快速開始

### 第一步：閱讀核心文檔

1. 閱讀 **[SPEC.md](./SPEC.md)** 了解專案全貌
2. 閱讀 **[DEVELOPMENT_STANDARDS.md](./DEVELOPMENT_STANDARDS.md)** 了解開發規範
3. 閱讀 **[ENV_CONFIG.md](./ENV_CONFIG.md)** 了解環境配置

### 第二步：準備開發環境

按照 TODO 列表中的「階段 0：環境準備」任務：

1. 註冊 Cloudflare 帳號並取得 API Token
2. 安裝 Wrangler CLI 和 Node.js 20+
3. 建立 Telegram Bot 並取得 Bot Token
4. 建立 OpenAI API 帳號並取得 API Key
5. 初始化專案結構

### 第三步：開始開發

按照 TODO 列表的階段順序：

1. **階段 1**：資料庫層、配置層、i18n 系統
2. **階段 2**：Domain 層、Services 層、Utils 層
3. **階段 3**：Telegram Handlers
4. **階段 4**：路由與入口
5. **階段 5**：部署與測試
6. **階段 6**：備份與自動化

---

## 📋 開發檢查清單

### 環境準備
- [ ] Cloudflare 帳號已註冊
- [ ] Wrangler CLI 已安裝
- [ ] Telegram Bot 已建立
- [ ] OpenAI API Key 已取得
- [ ] 專案目錄結構已建立

### 開發規範
- [ ] 已閱讀開發規範文檔
- [ ] 已了解命名規範
- [ ] 已了解模組化設計原則
- [ ] 已了解 i18n 使用方式

### 功能開發
- [ ] 資料庫 Schema 已建立
- [ ] Domain 層函數已實作並測試
- [ ] Telegram Handlers 已實作
- [ ] 路由與入口已實作

### 部署準備
- [ ] 本地測試通過
- [ ] Staging 環境已部署並測試
- [ ] Production 環境已部署
- [ ] 備份策略已設定

---

## 🔗 外部資源

### 官方文檔
- [Cloudflare Workers 文檔](https://developers.cloudflare.com/workers/)
- [Cloudflare D1 文檔](https://developers.cloudflare.com/d1/)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [OpenAI API 文檔](https://platform.openai.com/docs)

### 參考專案
- [moonini_bot](https://github.com/yveschen001/moonini_bot/tree/master/cloudflare-worker)

---

## 💡 開發提示

1. **遵循規範**：嚴格遵守開發規範，確保代碼一致性
2. **測試優先**：Domain 層函數應先寫測試，再實作
3. **模組化**：保持模組職責單一，避免過度耦合
4. **文檔更新**：重要變更時同步更新相關文檔
5. **安全第一**：敏感資訊使用 Secrets，不提交到 Git

---

## ❓ 常見問題

### Q: 如何開始開發？
A: 按照 TODO 列表的「階段 0：環境準備」開始，逐步完成各階段任務。

### Q: 如何新增語言？
A: 參考 [I18N_GUIDE.md](./I18N_GUIDE.md) 中的「新增語言」章節。

### Q: 如何部署到 Production？
A: 參考 [DEPLOYMENT.md](./DEPLOYMENT.md) 中的「Production 環境部署」章節。

### Q: 如何備份代碼和資料庫？
A: 參考 [BACKUP_STRATEGY.md](./BACKUP_STRATEGY.md)，使用 `pnpm backup` 和 `pnpm backup:push`。

---

## 📝 文檔維護

本文檔集會隨著專案發展持續更新。如有疑問或建議，請：
1. 檢查相關文檔是否有說明
2. 參考 TODO 列表中的任務描述
3. 查看參考代碼和外部資源

---

**最後更新**: 2025-01-15  
**版本**: 2.0（新增多平台支援、翻譯策略、AI 審核、裂變功能等）

