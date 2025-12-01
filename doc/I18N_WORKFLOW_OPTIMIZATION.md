# I18n 工作流程優化與防護計畫

## 1. 問題分析 (Root Cause Analysis)

目前專案面臨的主要問題是 **i18n 回歸錯誤 (Regressions)**：每當修復一個翻譯問題，往往會因為文件結構過大、重複鍵值（Duplicate Keys）或格式不統一，導致其他正常的功能損壞（如 `menu.birthDate` 消失、占位符格式錯誤）。

主要原因：
1.  **單一大文件 (`zh-TW.ts`)**：超過 4000 行的單一文件難以維護，且容易在合併或批量替換時出錯。
2.  **缺乏自動化防護**：目前的檢查腳本僅檢查語法錯誤，未檢查「關鍵鍵值是否存在」。
3.  **重複鍵值**：文件中存在大量重複的鍵值（如 `menu` 出現在多處），導致修改時容易改錯地方或被覆蓋。

## 2. 立即防護措施 (Immediate Protection)

為了回應您的要求：「確保已經修好的東西不要再被改壞」，我們將實施以下防護：

### 2.1 關鍵鍵值鎖定腳本 (Golden Key Protection)

我們將建立一個新的測試腳本 `scripts/verify-protected-keys.ts`，用於「鎖定」核心功能的翻譯。此腳本將在每次部署前強制執行。

**保護範圍包括但不限於：**
- **主選單 (Menu)**: `menu.birthDate`, `menu.zodiac`, `menu.bloodType`, `menu.interests`, `menu.bio`
- **算命功能 (Fortune)**: `fortune.menuTitle`, `fortune.menu.love`
- **任務系統 (Tasks)**: `tasks.name.city`, `tasks.description.city`
- **管理員功能 (Admin)**: `admin.analyticsTitle`, `help.superAdminTitle`

**工作流程變更：**
每次修改 `zh-TW.ts` 後，**必須** 執行此腳本。如果腳本失敗，禁止部署。

### 2.2 禁止手動批量替換

嚴格禁止使用全局正則表達式（如 `sed`）對 `zh-TW.ts` 進行無差別替換，除非先通過了完整的單元測試。

## 3. 長期優化方案 (Long-term Optimization)

建議將 `src/i18n/locales/zh-TW.ts` 拆分為模組化文件，以徹底解決結構混亂問題。

**建議結構：**
```text
src/i18n/locales/zh-TW/
├── index.ts       (匯出整合後的物件)
├── common.ts      (通用文字)
├── menu.ts        (主選單、個人資料)
├── fortune.ts     (算命相關)
├── tasks.ts       (任務相關)
└── admin.ts       (管理員後台)
```

這樣每次只需編輯特定模組，不會影響其他部分。

## 4. 執行計畫

1.  **建立防護腳本**：立即創建 `scripts/verify-protected-keys.ts`。
2.  **修復當前錯誤**：使用該腳本驗證並修復缺失的鍵值。
3.  **鎖定狀態**：確認所有測試通過後，標記當前版本為「Golden Master」。

---
**文件狀態**: 提案中
**日期**: 2025-12-01
