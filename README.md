# XunNi - MBTI + 星座心理測驗漂流瓶交友 Bot

> 運行在 Cloudflare Workers 的匿名聊天 Telegram Bot

> **⚠️ 重要：AI 代理在開始任何工作前，必須先閱讀 `@doc/SPEC.md`（專案規格書，包含專案概覽和完整規格）**

## 🌟 專案簡介

XunNi 是一個結合 MBTI 測驗與星座運勢的匿名漂流瓶交友 Bot，提供：

- 🎯 **智能匹配**：依 MBTI、年齡、性別等條件匹配
- 🌐 **多語言支援**：34 種語言自動翻譯（VIP）
- ⭐ **VIP 訂閱**：透過 Telegram Stars 付費
- 🛡️ **安全風控**：反詐騙測驗 + AI 審核 + 舉報機制
- 📊 **運營管理**：完整的管理後台與數據統計

## 🚀 快速開始

### 環境需求

- **Node.js**: 22.x（建議使用 [nvm](https://github.com/nvm-sh/nvm) 管理版本）
- **包管理器**: pnpm 9.x（推薦）或 npm
- **Cloudflare 帳號**: 需要 API Token
- **Telegram Bot Token**: 從 [@BotFather](https://t.me/botfather) 取得
- **OpenAI API Key**: 從 [OpenAI Platform](https://platform.openai.com/) 取得

詳細環境設置請參考 [doc/ENV_CONFIG.md](./doc/ENV_CONFIG.md)

### 安裝

```bash
# 安裝依賴
npm install

# 配置環境變數
cp .dev.vars.example .dev.vars
# 編輯 .dev.vars 填入你的配置

# 本地開發
wrangler dev
```

### 部署

```bash
# 部署到 Staging
wrangler deploy --env staging

# 部署到 Production
wrangler deploy --env production
```

## 📚 文檔

**開始之前，必須先閱讀：**
- **[doc/SPEC.md](./doc/SPEC.md)** - 專案規格書（**AI 代理必讀**，包含專案概覽和完整規格）
- **[doc/ENV_CONFIG.md](./doc/ENV_CONFIG.md)** - 開發環境設置指南（設置本地環境）

完整文檔請查看 [doc/](./doc/) 目錄：

- [專案規格書](./doc/SPEC.md)
- [開發規範](./doc/DEVELOPMENT_STANDARDS.md)
- [環境配置](./doc/ENV_CONFIG.md)
- [國際化指南](./doc/I18N_GUIDE.md)
- [管理後台設計](./doc/ADMIN_PANEL.md)
- [Telegram Stars 訂閱](./doc/TELEGRAM_STARS.md)
- [測試規範](./doc/TESTING.md)
- [部署指南](./doc/DEPLOYMENT.md)
- [備份策略](./doc/BACKUP_STRATEGY.md)

## 🏗️ 專案結構

```
XunNi/
├── src/              # 源代碼
│   ├── worker.ts     # Worker 入口
│   ├── router.ts     # 路由處理
│   ├── config/       # 配置
│   ├── db/           # 資料庫層
│   ├── domain/       # 業務邏輯層
│   ├── telegram/     # Telegram Handlers
│   ├── services/     # 外部服務
│   ├── utils/        # 工具函數
│   └── i18n/         # 國際化
├── tests/            # 測試
├── scripts/          # 腳本
├── doc/              # 文檔
└── wrangler.toml     # Cloudflare 配置
```

## 🛠️ 技術棧

- **Runtime**: Cloudflare Workers
- **Database**: Cloudflare D1 (SQLite)
- **Language**: TypeScript (ESM)
- **Testing**: Vitest
- **Payment**: Telegram Stars

## 📋 開發流程

1. **環境準備**：註冊所需帳號，配置環境變數
2. **資料庫層**：建立 Schema 和 Database Client
3. **Domain 層**：實作業務邏輯（純函數）
4. **Handlers 層**：實作 Telegram 指令處理
5. **路由與入口**：整合所有功能
6. **測試與部署**：測試、部署到 Staging/Production

詳細步驟請參考 TODO 列表和 [doc/README.md](./doc/README.md)。

## 🔒 安全

- 所有 URL 通過白名單檢查
- 匿名轉發不暴露真實 Telegram ID
- 風險分數累積與分級封禁
- 敏感資訊使用 Cloudflare Secrets

## 📄 授權

本專案為私有專案，未經授權不得使用。

## 💾 備份策略

本專案使用**單向備份原則**，只從本地推送到遠程，不會修改本地文件。

### 快速備份

```bash
# 本地備份（添加文件到暫存區）
pnpm backup

# 推送到 GitHub
pnpm backup:push
```

### 遠程倉庫

**倉庫 URL**：https://github.com/yveschen001/xunni  
**分支**：main  
**權限**：私有倉庫

詳細備份指南請參考：[doc/BACKUP_GUIDE.md](./doc/BACKUP_GUIDE.md)

---

## 📞 聯絡

如有問題，請參考 [doc/README.md](./doc/README.md) 中的常見問題或查看相關文檔。

---

**版本**: 1.0.0  
**最後更新**: 2025-01-15

