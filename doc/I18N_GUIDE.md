# XunNi i18n 國際化指南 (v2.0 - KV Architecture)

> **⚠️ 重要架構變更**：
> 本專案已從單一文件架構遷移至 **Cloudflare KV 邊緣存儲 + 模組化文件** 架構。
> 請務必遵守新的開發與部署流程。

## 1. 概述

本專案採用 **Cloudflare KV (Key-Value Storage)** 存儲多語言數據，以解決 Cloudflare Worker 腳本體積限制 (3MB) 並實現「熱更新」。

**核心特點：**
*   **數據與代碼分離**：翻譯數據不打包進 Worker 代碼中，而是存儲在 KV。
*   **模組化管理**：原始碼中按功能模組拆分文件（如 `fortune.ts`, `vip.ts`）。
*   **CSV 工作流**：統一使用 CSV 進行翻譯管理，自動同步到代碼與 KV。
*   **即時更新**：更新翻譯無需重新部署後端代碼。

## 2. 架構設計

### 2.1 運行時架構

```mermaid
graph TD
    User[用戶請求] --> Worker[Cloudflare Worker]
    
    subgraph "i18n Runtime"
        Worker -->|1. 檢查內存| Memory[內存緩存 (Global Cache)]
        Worker -->|2. 讀取 KV (未命中時)| KV[Cloudflare KV: I18N_DATA]
        Worker -->|3. 兜底回退 (失敗時)| Fallback[代碼內建 zh-TW]
    end
```

### 2.2 目錄結構

```
src/i18n/
├── index.ts              # 核心邏輯：動態加載與 KV 讀取
├── locales/              # 語言包源碼 (Source of Truth)
│   ├── zh-TW/            # 繁體中文 (基準語言)
│   │   ├── index.ts      # 模組聚合
│   │   ├── common.ts     # 通用模組
│   │   ├── fortune.ts    # 算命模組
│   │   └── ...
│   ├── en/               # 英文 (自動生成/導入)
│   └── ... (其他 34 種語言)
└── types.ts              # 型別定義
```

## 3. 開發流程 (Workflow)

### 3.1 新增/修改翻譯 (開發者)

**場景 A：開發新功能，新增 Key**
1.  直接在 `src/i18n/locales/zh-TW/` 下的對應模組文件（如 `fortune.ts`）中新增 Key。
2.  如果不確定放哪個文件，可以新建一個模組文件。
3.  **注意**：`zh-TW` 是代碼中的 Source of Truth。

**場景 B：修改現有翻譯文字**
1.  推薦通過 **CSV 流程** 修改，以確保所有語言同步。
2.  若只改中文，可直接改代碼，然後執行導出。

### 3.2 翻譯同步 (CSV 流程)

我們使用自動化腳本來管理 CSV 與代碼的同步。

#### 步驟 1: 導出 CSV (Export)
將代碼中的最新 Key (zh-TW) 導出到 CSV，供翻譯人員使用。

```bash
pnpm i18n:export
```
*   產出：`i18n_for_translation.csv`
*   邏輯：讀取 `zh-TW` 源碼，保留舊 CSV 的翻譯，新增的 Key 會標記為 `[需要翻译]`。

#### 步驟 2: 翻譯 (External)
使用 Excel / Google Sheets 編輯 `i18n_for_translation.csv`。

#### 步驟 3: 導入代碼 (Import)
將翻譯好的 CSV 寫回 `src/i18n/locales/*` 目錄。

```bash
pnpm i18n:import
```
*   這會自動生成所有語言的模組文件 (`en/common.ts`, `ja/fortune.ts` 等)。
*   **這步很重要**：它確保 Git 中有最新的翻譯備份。

#### 步驟 4: 上傳至 KV (Upload / Deploy)
將最新的翻譯數據推送到 Cloudflare KV，讓用戶端生效。

```bash
# 推送到測試環境
pnpm i18n:upload staging

# 推送到正式環境
pnpm i18n:upload production
```
*   **無需重新部署 Worker (`pnpm deploy`)**，執行完立即生效。

## 4. 程式碼使用指南

### 4.1 初始化 (Router 層)

在處理請求前，必須先異步加載翻譯數據：

```typescript
// src/router.ts
import { loadTranslations } from './i18n';

// 根據用戶語言偏好加載
await loadTranslations(env, userLang); 
```

### 4.2 調用翻譯 (Handler 層)

使用方式與之前基本保持一致：

```typescript
import { createI18n } from '../../i18n';

export async function handleFortune(message, env) {
  // 1. 初始化 i18n 實例
  const i18n = createI18n(user.language_pref);
  
  // 2. 調用翻譯 (支持點號嵌套)
  const text = i18n.t('fortune.daily.title');
  
  // 3. 帶參數
  const textWithParams = i18n.t('fortune.result', { name: 'Yves', score: 100 });
}
```

### 4.3 模組化引用注意事項

雖然文件拆分了，但 `key` 的使用方式不變。腳本會自動將文件名作為前綴嗎？
**答：目前的實作邏輯是 `index.ts` 聚合所有模組並 Flatten (或者保持巢狀)。**
*   我們的 `i18n-manager` 導入邏輯會生成：`export const translations = { ...common, ...fortune };`
*   如果 `fortune.ts` 裡有 `daily: { title: "..." }`，則 Key 為 `daily.title`（如果沒有命名衝突）。
*   **最佳實踐**：為了避免衝突，建議模組內的 Key 不要與其他模組重複，或者在模組導出時加上命名空間（目前腳本尚未強制加命名空間，依賴 Key 自身的唯一性）。
*   **目前 CSV 中的 Key (如 `fortune.daily.title`) 會被 `import` 腳本正確解析並拆分到 `fortune.ts` 中。**

## 5. 部署與運維

### 5.1 首次部署
必須確保 KV Namespace 已創建且綁定到 `wrangler.toml` 的 `I18N_DATA`。

### 5.2 翻譯回滾
如果上傳了錯誤的翻譯：
1.  在本地 `git restore` 恢復舊的 CSV 或代碼。
2.  執行 `pnpm i18n:import`。
3.  執行 `pnpm i18n:upload` 覆蓋 KV。

### 5.3 故障排查
*   **翻譯顯示 Key 名 (如 `common.ok`)**：
    1.  檢查 KV 中是否有該語言數據。
    2.  檢查 `loadTranslations` 是否被調用。
    3.  檢查 CSV 中該 Key 是否為空。
*   **回退到中文**：說明目標語言 KV 讀取失敗，觸發了代碼內建的 `zh-TW` 兜底。

## 6. 禁止事項

1.  ❌ **禁止** 手動修改 `src/i18n/locales/en/*.ts` 等非中文代碼文件（會被 Import 覆蓋）。
2.  ❌ **禁止** 在沒有執行 `upload` 的情況下只 `deploy` 代碼（翻譯不會更新）。
3.  ❌ **禁止** 將巨大的 JSON 直接寫死在 `src/worker.ts` 中。
