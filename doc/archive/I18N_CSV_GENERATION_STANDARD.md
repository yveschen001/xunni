# i18n CSV 生成規範

## 📋 原則

**核心原則：保持現有 CSV 順序，新增 keys 追加到末尾**

### 為什麼需要這個規範？

1. **翻譯團隊工作流程**：翻譯團隊在 CSV 中按順序翻譯，如果順序改變會導致：
   - 找不到之前翻譯的位置
   - 需要重新定位已翻譯的內容
   - 增加翻譯錯誤的風險

2. **版本控制友好**：保持順序可以讓 Git diff 更清晰，只顯示新增的行

3. **協作效率**：多人協作時，不會因為順序改變而產生衝突

## 🔧 使用規範

### 推薦腳本

**使用 `scripts/generate-csv-preserve-order.ts`** 來生成/更新 CSV：

```bash
pnpm tsx scripts/generate-csv-preserve-order.ts
```

**⚠️ 注意**：如果 `zh-TW.ts` 包含變量引用（如 `${vipRevenue}`、`${formatIdentifier(...)}`），腳本可能無法直接解析。在這種情況下：

1. **首次生成**：使用 `scripts/generate-csv-from-locales.ts` 生成初始 CSV
2. **後續更新**：手動編輯 CSV，將新 keys 追加到末尾
3. **或者**：修復 `zh-TW.ts` 中的變量引用，使用模板字符串參數（如 `{vipRevenue}`）而不是直接變量引用

### 腳本行為

1. **讀取現有 CSV**：
   - 如果 CSV 存在，讀取所有現有行
   - 保留所有行的原始順序

2. **提取新 keys**：
   - 從 `src/i18n/locales/zh-TW.ts` 提取所有 keys
   - 比對 CSV 中已存在的 keys
   - 找出不存在的 keys（新 keys）

3. **追加新 keys**：
   - 將新 keys 追加到 CSV 末尾
   - **不改變**現有行的順序
   - **不重新排序**現有 keys

4. **輸出結果**：
   - 現有行保持原樣（順序、內容都不變）
   - 新 keys 追加到末尾
   - 新 keys 的 zh-TW 列填充翻譯，其他語言列留空

### 禁止使用的腳本

❌ **不要使用** `scripts/generate-csv-from-locales.ts`：
- 這個腳本會**完全重寫** CSV
- 會**重新排序**所有 keys
- 會**改變**現有行的順序

### 其他腳本說明

- `scripts/generate-csv-from-mapping-only.ts`：從 mapping 文件生成，會排序
- `scripts/generate-csv-only.ts`：簡化版，會排序
- `scripts/extract-db-hardcoded-to-csv.ts`：只處理資料庫硬編碼，會排序

**這些腳本都不會保持現有 CSV 順序，請謹慎使用。**

## 📝 工作流程

### 日常更新 CSV（推薦）

```bash
# 1. 更新 CSV（保持順序，追加新 keys）
pnpm tsx scripts/generate-csv-preserve-order.ts

# 2. 檢查新增的 keys
# 查看腳本輸出的 "New keys added" 部分

# 3. 將 CSV 發送給翻譯團隊
# 翻譯團隊只需要翻譯末尾的新 keys
```

### 首次生成 CSV

如果是首次生成 CSV（沒有現有 CSV），可以使用：

```bash
pnpm tsx scripts/generate-csv-preserve-order.ts
```

腳本會自動檢測 CSV 是否存在，如果不存在會創建新的。

### 檢查 CSV 狀態

```bash
# 檢查硬編碼和 CSV 對齊
pnpm check:i18n

# 查看 CSV 行數
wc -l i18n_for_translation.csv

# 查看最後幾行（新添加的 keys）
tail -20 i18n_for_translation.csv
```

## ⚠️ 注意事項

1. **不要手動排序 CSV**：
   - 不要使用 Excel 或其他工具對 CSV 進行排序
   - 排序會改變行的順序，影響翻譯團隊的工作

2. **不要使用會重新排序的腳本**：
   - 避免使用 `generate-csv-from-locales.ts`
   - 避免使用其他會排序的腳本

3. **Git 提交前檢查**：
   - 確認 CSV 的變更只包含新增的行（在末尾）
   - 確認現有行沒有被修改或移動

4. **翻譯團隊協作**：
   - 告知翻譯團隊新 keys 的位置（在 CSV 末尾）
   - 提供新 keys 的數量，方便翻譯團隊規劃工作

## 🔍 驗證

### 檢查腳本是否正確工作

```bash
# 1. 記錄當前 CSV 的行數和最後幾行
tail -5 i18n_for_translation.csv > before.txt

# 2. 運行腳本
pnpm tsx scripts/generate-csv-preserve-order.ts

# 3. 檢查變更
# - 現有行應該保持不變（順序、內容）
# - 只有末尾新增了新行
# - Git diff 應該只顯示新增的行
```

### 檢查 CSV 完整性

```bash
# 檢查是否有重複的 keys
cut -d',' -f1 i18n_for_translation.csv | sort | uniq -d

# 應該沒有輸出（沒有重複）
```

## 📚 相關文檔

- `@doc/I18N_GUIDE.md` - i18n 使用指南
- `@doc/I18N_EXTRACTION_AND_REPLACEMENT_STANDARDS.md` - i18n 提取與替換規範
- `I18N_COMPREHENSIVE_CHECK_REPORT.md` - i18n 全面檢查報告

## 🎯 總結

**核心原則**：
- ✅ 保持現有 CSV 順序
- ✅ 新增 keys 追加到末尾
- ✅ 不改變現有行的順序和內容
- ✅ 使用 `scripts/generate-csv-preserve-order.ts`

**這樣可以確保翻譯團隊的工作不會被打斷，提高協作效率。**

