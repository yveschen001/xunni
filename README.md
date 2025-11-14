# XunNi - MBTI + 星座心理測驗漂流瓶交友 Bot

> 運行在 Cloudflare Workers 的匿名聊天 Telegram Bot

## 🌟 專案簡介

XunNi 是一個結合 MBTI 測驗與星座運勢的匿名漂流瓶交友 Bot，提供：

- 🎯 **智能匹配**：依 MBTI、年齡、性別等條件匹配
- 🌐 **多語言支援**：34 種語言自動翻譯（VIP）
- ⭐ **VIP 訂閱**：透過 Telegram Stars 付費
- 🛡️ **安全風控**：反詐騙測驗 + AI 審核 + 舉報機制
- 📊 **運營管理**：完整的管理後台與數據統計

## 🚀 快速開始

### 環境需求

- Node.js 20+
- Cloudflare 帳號
- Telegram Bot Token
- OpenAI API Key

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

## 📞 聯絡

如有問題，請參考 [doc/README.md](./doc/README.md) 中的常見問題或查看相關文檔。

---

**版本**: 1.0.0  
**最後更新**: 2025-01-15

