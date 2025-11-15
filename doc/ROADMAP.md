# XunNi 專案路線圖

## 1. 概述

本路線圖規劃 XunNi 專案的三個主要里程碑，從 Telegram Bot 擴展到多平台支援。

---

## 2. 里程碑規劃

### M1: Telegram Mini App（當前階段）

**目標**：完成 Telegram Bot + Mini App 整合

**技術交付物**：
- ✅ 完整的 Telegram Bot 功能
- ✅ Telegram Mini App（WebApp）
- ✅ initData 驗簽機制
- ✅ Deep Link 支援（startapp=share_mbti_{resultId}）
- ✅ AuthAdapter（帳號綁定）
- ✅ NotificationAdapter（通知推送）
- ✅ < 2 秒首屏載入

**合規交付物**：
- ✅ Telegram Bot 審查
- ✅ Telegram Mini App 審查
- ✅ 內容授權說明
- ✅ Data Safety 說明

**運營交付物**：
- ✅ 邀請碼生成與分享
- ✅ KPI 追蹤（邀請轉化率）
- ✅ 反濫用規則（配額上限、設備/IP 監控）

**風險 Owner**：開發團隊

**完成標準**：
- 所有 Bot 功能正常運作
- Mini App 通過 Telegram 審查
- 邀請系統運作正常

---

### M2: WeChat / Line 插件

**目標**：擴展到微信和 Line 平台

**技術交付物**：
- ✅ WeChat Mini Program / Official Account
- ✅ Line Bot / LIFF App
- ✅ 統一的 AuthAdapter（支援多平台）
- ✅ 統一的 NotificationAdapter（支援多平台）
- ✅ 帳號綁定機制（Telegram ↔ WeChat ↔ Line）
- ✅ 跨平台資料同步

**合規交付物**：
- ✅ 微信審查資源（登入/刪帳、影片/截圖）
- ✅ Line 審查資源
- ✅ ICP 備案（如適用）
- ✅ Line Official Account 申請

**運營交付物**：
- ✅ WeChat 裂變策略
- ✅ Line 裂變策略
- ✅ 跨平台 KPI 追蹤

**風險 Owner**：開發團隊 + 運營團隊

**完成標準**：
- WeChat 和 Line 功能正常運作
- 通過各平台審查
- 帳號綁定機制穩定

---

### M3: App Store / Google Play

**目標**：發布原生 App

**技術交付物**：
- ✅ iOS App（Swift/SwiftUI）
- ✅ Android App（Kotlin/Jetpack Compose）
- ✅ 統一的 API 後端
- ✅ OAuth 登入（Google、Apple）
- ✅ Push Notification（APNs、FCM）
- ✅ App Store / Google Play 混合包

**合規交付物**：
- ✅ App Store 審查資源（影片/截圖、登入/刪帳）
- ✅ Google Play 審查資源
- ✅ Data Safety 表格
- ✅ 內容授權說明
- ✅ 隱私權政策（多語言）
- ✅ 使用者條款（多語言）

**運營交付物**：
- ✅ App Store 優化（ASO）
- ✅ Google Play 優化
- ✅ 應用商店裂變策略

**風險 Owner**：開發團隊 + 法務團隊 + 運營團隊

**完成標準**：
- iOS 和 Android App 通過審查
- 上架 App Store 和 Google Play
- 所有功能正常運作

---

## 3. 技術架構演進

### 3.1 M1 架構

```
Telegram Bot (Cloudflare Workers)
  ↓
Telegram Mini App (Cloudflare Pages)
  ↓
統一 API 後端
```

### 3.2 M2 架構

```
Telegram Bot / WeChat / Line
  ↓
統一 AuthAdapter / NotificationAdapter
  ↓
統一 API 後端
```

### 3.3 M3 架構

```
Telegram / WeChat / Line / iOS / Android
  ↓
統一 AuthAdapter / NotificationAdapter
  ↓
統一 API 後端 (Cloudflare Workers)
```

---

## 4. 開發順序

### 階段 1：完成 M1（當前）

1. 完成 Telegram Bot 核心功能
2. 開發 Telegram Mini App
3. 實作 initData 驗簽
4. 實作 Deep Link
5. 通過 Telegram 審查

### 階段 2：準備 M2

1. 設計統一的 AuthAdapter
2. 設計統一的 NotificationAdapter
3. 設計帳號綁定機制
4. 準備 WeChat / Line 審查資源

### 階段 3：實作 M2

1. 開發 WeChat 功能
2. 開發 Line 功能
3. 通過各平台審查

### 階段 4：準備 M3

1. 設計原生 App 架構
2. 準備 App Store / Google Play 審查資源
3. 申請開發者帳號

### 階段 5：實作 M3

1. 開發 iOS App
2. 開發 Android App
3. 通過各平台審查
4. 上架應用商店

---

## 5. 風險管理

### 5.1 技術風險

| 風險 | 影響 | 緩解措施 | Owner |
|------|------|---------|-------|
| Mini App 審查失敗 | 高 | 提前準備審查資源，遵循平台規範 | 開發團隊 |
| 多平台帳號綁定複雜 | 中 | 設計統一的 AuthAdapter | 開發團隊 |
| 翻譯 API 成本超支 | 中 | 監控使用量，設定告警 | 運營團隊 |

### 5.2 合規風險

| 風險 | 影響 | 緩解措施 | Owner |
|------|------|---------|-------|
| 審查不通過 | 高 | 提前準備審查資源，遵循平台規範 | 法務團隊 |
| 資料保護不合規 | 高 | 遵循 GDPR、CCPA 等規範 | 法務團隊 |

### 5.3 運營風險

| 風險 | 影響 | 緩解措施 | Owner |
|------|------|---------|-------|
| 邀請系統被濫用 | 中 | 反濫用規則，配額上限 | 運營團隊 |
| 翻譯成本過高 | 中 | 監控使用量，優化策略 | 運營團隊 |

---

## 6. 里程碑追蹤

### 6.1 PR 要求

每個 PR 必須標註對應的里程碑：
- `[M1]` - Telegram Mini App
- `[M2]` - WeChat / Line
- `[M3]` - App Store / Google Play

### 6.2 文檔更新

每次完成里程碑，需更新：
- DOCUMENT_COMPLETENESS.md
- 相關技術文檔
- 審查清單

---

## 7. 成功標準

### M1 成功標準
- ✅ Telegram Bot 所有功能正常
- ✅ Mini App 通過審查
- ✅ 邀請系統運作正常
- ✅ KPI 追蹤正常

### M2 成功標準
- ✅ WeChat 功能正常
- ✅ Line 功能正常
- ✅ 帳號綁定機制穩定
- ✅ 通過各平台審查

### M3 成功標準
- ✅ iOS App 上架
- ✅ Android App 上架
- ✅ 所有功能正常運作
- ✅ 通過各平台審查

---

**最後更新**：2025-01-15  
**當前階段**：M1（進行中）

