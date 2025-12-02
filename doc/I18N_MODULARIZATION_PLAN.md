# 🌐 i18n 模組化與架構升級計畫 (Architecture Upgrade)

> **目標**：建立一個可擴展、高性能、適合長期商業運營的國際化架構，解決 Cloudflare Worker 腳本體積限制 (3MB) 問題，並實現翻譯內容的動態更新。

## 1. 現狀與瓶頸

*   **現狀**：所有 34 種語言的翻譯文本被編譯打包進單一 Worker 腳本 (`worker.js`)。
*   **瓶頸**：
    *   **體積超標**：總體積超過 20MB，遠超免費版 3MB 限制。
    *   **部署耦合**：修改一個錯別字需要重新部署整個後端代碼。
    *   **性能隱憂**：巨大的腳本加載會增加冷啟動時間 (Cold Start)。

## 2. 目標架構：i18n on KV (邊緣存儲)

採用 **Cloudflare KV (Key-Value Storage)** 作為翻譯數據的運行時存儲。

### 2.1 架構圖

```mermaid
graph TD
    User[用戶] --> Worker[Cloudflare Worker]
    
    subgraph "Runtime (運行時)"
        Worker -->|1. Check Memory Cache| Memory[Global Variable Cache]
        Worker -->|2. Check KV (If missing)| KV[Cloudflare KV: I18N_DATA]
        Worker -->|3. Fallback (If fail)| Fallback[Bundled zh-TW]
    end
    
    subgraph "Management (管理/開發)"
        Dev[開發者/運營] -->|CSV Import/Export| Source[src/i18n/locales/*.ts]
        Source -->|Build Script| Upload[upload-i18n-to-kv.ts]
        Upload -->|Push| KV
    end
```

### 2.2 核心優勢
1.  **無限擴展**：不再受 3MB 代碼限制，支持無限多種語言。
2.  **極致性能**：KV 具備全球邊緣緩存，配合 Worker 內存緩存，讀取延遲 < 1ms。
3.  **熱更新 (Hot Update)**：更新翻譯只需上傳 KV，無需重新部署 Worker，即時生效。
4.  **成本低廉**：KV 讀取非常便宜，且大部分請求會命中內存緩存。

## 3. 實施步驟 (Implementation Roadmap)

### 3.1 基礎設施準備
*   [ ] 在 `wrangler.toml` 中配置 KV Namespace `I18N_DATA`。
*   [ ] 創建 KV Namespace (Staging & Production)。

### 3.2 工具鏈開發
*   [ ] **開發上傳腳本 (`scripts/upload-i18n-to-kv.ts`)**：
    *   讀取 `src/i18n/locales/{lang}/index.ts`。
    *   將其序列化為 JSON 字串。
    *   調用 Cloudflare API 或 `wrangler kv:key put` 寫入 KV。
    *   Key 格式：`locale:{lang}` (如 `locale:en`, `locale:ja`)。

### 3.3 運行時改造 (`src/i18n/index.ts`)
*   [ ] **移除靜態導入**：刪除 `import { translations as en } ...` 等 33 種語言的導入，**僅保留 `zh-TW`** 作為災難恢復的兜底 (Fallback)。
*   [ ] **實現異步加載**：改造 `createI18n` 或 `loadTranslations`：
    *   優先檢查全局變數 `globalThis.LOCALE_CACHE`。
    *   若無，從 `env.I18N_DATA.get('locale:' + lang)` 讀取。
    *   若 KV 失敗，回退到 `zh-TW`。

### 3.4 部署與驗證
1.  **KV 注入**：執行上傳腳本，將現有翻譯灌入 KV。
2.  **Worker 部署**：部署瘦身後的 Worker (預計 < 1MB)。
3.  **驗收**：
    *   測試 `zh-TW` (本地兜底)。
    *   測試 `en` (KV 讀取)。
    *   測試緩存命中 (第二次請求應更快)。

## 4. 運營流程 (SOP)

**當需要更新翻譯時：**
1.  修改 `zh-TW` 代碼 或 導入 CSV。
2.  執行 `pnpm i18n:import` (生成本地文件)。
3.  執行 `pnpm i18n:upload` (同步到 KV)。
4.  **完成！** (用戶端即時生效)

---
**核准**：此方案符合 Cloudflare 最佳實踐，兼顧性能、成本與可維護性。請確認是否啟動實施？
