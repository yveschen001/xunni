# XunNi 國際化 (i18n) 工作流程與規範

> **核心原則**：
> 1. **Code (`src/i18n/locales/zh-TW.ts`) 是結構與原文的唯一真理 (Source of Truth)**。
> 2. **CSV (`i18n_for_translation.csv`) 是翻譯交換的基準**。
> 3. 禁止手動修改 `src/i18n/locales/*.ts` (除了 `zh-TW.ts`)，所有其他語言必須通過 CSV 導入生成。

## 1. 檔案位置

- **基準 CSV**: `i18n_for_translation.csv` (位於專案根目錄)
- **基準代碼**: `src/i18n/locales/zh-TW.ts`
- **生成代碼**: `src/i18n/locales/*.ts` (en, ja, ko...)
- **管理腳本**: `scripts/i18n-manager.ts`

## 2. 標準開發流程

### 第一步：新增或修改文案 (開發者)
直接在 `src/i18n/locales/zh-TW.ts` 中新增或修改 Key 和中文內容。

```typescript
// src/i18n/locales/zh-TW.ts
export const translations = {
  // ...
  newFeature: {
    welcome: "歡迎使用新功能", // 新增 Key
  }
};
```

### 第二步：同步到 CSV (Smart Export)
執行以下命令，將新增的 Key 追加到 CSV 底部。此操作**不會**破壞 CSV 中現有的翻譯順序。

```bash
pnpm i18n:export
```

- 新增的 Key 會出現在 CSV 最下方。
- 其他語言欄位會自動填入 `[需要翻译]` 佔位符。
- 既有的翻譯會被保留。

### 第三步：進行翻譯 (翻譯者/PM/AI)
1. 將 `i18n_for_translation.csv` 匯入 Google Sheets。
2. 使用 `翻譯工具 (translation_tool.gs)` 進行翻譯、質檢與修復。
3. 翻譯完成後，將 Google Sheets 匯出為 CSV。
4. 覆蓋根目錄下的 `i18n_for_translation.csv`。

### 第四步：匯回專案 (Import)
執行以下命令，將 CSV 的內容生成為各語言的 `.ts` 檔案。

```bash
pnpm i18n:import
```

- 腳本會自動忽略 `[需要翻译]` 和空白內容。
- 腳本會智慧處理 `mbti.quick.question1.option1` 這類結構歧義的 Key。
- `src/i18n/locales/` 下的所有檔案 (除了 `zh-TW.ts`) 都會被更新。

### 第五步：檢查與提交
1. 執行 Lint 檢查確保格式正確：
   ```bash
   pnpm lint
   ```
2. 提交變更：
   ```bash
   git add i18n_for_translation.csv src/i18n/locales/
   git commit -m "chore(i18n): update translations from csv"
   ```

## 3. 關鍵規則

1. **不要手動重排序 CSV**：為了減少 Git Diff 的混亂，盡量保持 CSV 的行順序（Export 腳本會自動維護）。
2. **結構衝突處理**：
   - 如果 CSV 中有 `a.b` (字串) 和 `a.b.c` (子屬性)，腳本會優先參考 `zh-TW.ts` 的結構來決定如何還原。
   - 盡量避免在代碼中設計這種歧義結構。
3. **刪除 Key**：
   - 如果在 `zh-TW.ts` 中刪除了 Key，執行 `export` 時，該 Key 仍會保留在 CSV 中（防止誤刪翻譯資產），但會在 Console 顯示警告。
   - 若確定要刪除，請手動在 CSV 中刪除該行。

## 4. Google Sheets 翻譯工具整合

使用 `tools/gas/translation_tool.gs` 時：
1. **掃描空白**：使用「🔍 掃描選區空白未翻譯」找出漏翻。
2. **自動翻譯**：使用「⚙ 自動翻譯高亮」補齊翻譯。
3. **AI 複核**：使用「🤖 AI 智能複核」檢查語意。
4. **匯出**：下載為 CSV 時，確保編碼為 UTF-8。

---
**最後更新**: 2025-11-27

