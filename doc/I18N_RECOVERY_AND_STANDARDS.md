# i18n 修復與標準化規範 (Recovery & Standards)

> **版本**: 1.0.0
> **狀態**: 執行中 (In Progress)
> **目標**: 徹底修復 i18n 系統中的佔位符污染，建立商業級的穩定性標準。

## 1. 核心原則 (Core Principles)

1.  **純數據原則 (Pure Data)**: 
    *   i18n 文件 (`json`/`ts`) 必須只包含靜態文本和簡單變量。
    *   **嚴格禁止**在翻譯值中包含代碼邏輯（如 `? :`）、運算符（`+ -`）、屬性訪問（`.length`）或方法調用（`.join()`）。
2.  **源頭清潔 (Source Hygiene)**:
    *   `src/i18n/locales/zh-TW` 是唯一的真理來源 (Source of Truth)。
    *   必須確保源頭文件通過嚴格的語法校驗，任何非法格式將導致構建/導入失敗（Fail Fast）。
3.  **兜底機制 (Fallback Strategy)**:
    *   系統必須內置默認語言包 (`zh-TW`)，確保在 KV 存儲失效、網絡錯誤或加載延遲時，用戶界面仍能正常顯示（不回退到英文，不顯示 Key 名）。
4.  **資產保護 (Asset Preservation)**:
    *   CSV 文件是多語言資產的核心載體。任何操作不得覆蓋或丟失已有的翻譯內容。
    *   導入/導出必須是增量的，並保留歷史數據。

## 2. 佔位符規範 (Placeholder Standards)

所有 i18n key 中的變量佔位符必須遵循以下格式：

| ❌ 錯誤範例 (Forbidden) | ✅ 正確範例 (Allowed) | 說明 |
| :--- | :--- | :--- |
| `{ids.length}` | `{count}` | 邏輯應在代碼中處理，傳入最終數值 |
| `{user.is_vip ? '是' : '否'}` | `{isVipText}` 或 `{vipStatus}` | 條件判斷應在代碼中處理 |
| `{ad.reward_quota}` | `{rewardQuota}` | 對象屬性應扁平化傳入 |
| `{formatDate(date)}` | `{date}` | 格式化應在代碼中完成 |
| `{list.join(', ')}` | `{listText}` | 數組操作應在代碼中完成 |
| `\{variable\}` | `{variable}` | 禁止轉義佔位符（除非真的要顯示花括號） |

### 代碼實踐範例

**Bad:**
```typescript
// Locale
"msg": "清理了 {ids.length} 個項目"
// Code
i18n.t('msg', { ids: [1, 2, 3] }) // ❌ 運行時無法解析 .length
```

**Good:**
```typescript
// Locale
"msg": "清理了 {count} 個項目"
// Code
i18n.t('msg', { count: ids.length }) // ✅ 邏輯在代碼層解決
```

## 3. 修復計劃 (Recovery Plan)

### 階段一：核心修復與阻斷 (已完成)
- [x] **Hotfix**: 修復 `success.ts`, `common.ts` 中的非法佔位符。
- [x] **Fallback**: 修改 `i18n/index.ts`，打包 `zh-TW` 作為硬編碼兜底。
- [x] **Validation**: 升級 `i18n-manager.ts`，對 `zh-TW` 實施強制校驗，發現非法佔位符直接報錯。

### 階段二：全面掃描與標準化 (執行中)
- [ ] **Scan**: 掃描所有 `src/i18n/locales/zh-TW/*.ts` 文件。
- [ ] **Fix**: 批量替換所有剩餘的非法佔位符（`.`, `?`, `[]` 等）。
- [ ] **Verify**: 運行 `check:i18n` 確保 0 錯誤。

### 階段三：代碼與數據同步
- [ ] **Sync**: 執行 `pnpm i18n:export` 更新 CSV（保留多語言，更新中文源）。
- [ ] **Code Check**: 抽查核心業務代碼，確保傳參符合新的扁平化標準。

## 4. 自動化檢查機制

- **Pre-commit/Pre-deploy**: 必須運行 `scripts/check-i18n-integrity.ts`。
- **Import Guard**: `i18n:import` 腳本包含正則檢查，拒絕污染源頭。

---
**維護者**: System Architect
**最後更新**: 2025-01-15

