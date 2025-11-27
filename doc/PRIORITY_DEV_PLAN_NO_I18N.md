# 優先開發計劃 (無 i18n 依賴篇)

> **版本**：v1.0
> **策略**：避開 UI 文字變更，專注於系統穩定性、效能優化與後端邏輯增強。
> **目標**：在進行下一輪翻譯工作前，先把系統「地基」打得更穩固。

---

## 1. 核心架構優化 (Core Architecture)

這部分完全是在後端運作，用戶無感知，但對系統承載量至關重要。

### 1.1 引入 KV 緩存機制 (KV Caching Layer)
*   **痛點**：目前 MoonPacket API 與 Admin 報表頻繁查詢數據庫，流量大時會導致 D1 讀取瓶頸。
*   **實作內容**：
    *   **設計緩存鍵值規範**：例如 `user:profile:{id}` (TTL: 1h), `stats:daily:{date}` (TTL: 24h)。
    *   **封裝緩存服務 (`src/services/cache.ts`)**：
        *   `getOrSet<T>(key, ttl, fetchFn)`：標準的「讀取 -> 未命中則查詢 DB -> 寫入」流程。
    *   **應用場景**：
        *   `MoonPacketService.getUserProfile`：緩存用戶基礎資料。
        *   `checkVipExpirations`：緩存 VIP 狀態。
*   **預期效益**：數據庫讀取量減少 80% 以上，API 響應速度從 ~300ms 降至 <50ms。

### 1.2 廣播系統分批處理 (Broadcast Pagination)
*   **痛點**：目前的廣播可能一次性撈取所有用戶 ID，若用戶量達 10 萬級別，Worker 內存會溢出 (OOM)。
*   **實作內容**：
    *   修改 `src/db/queries/users.ts`，實現 **Cursor Pagination** (基於 `id` 或 `created_at` 的游標分頁)。
    *   優化 `processBroadcastQueue`：
        *   每次只處理 100-500 個用戶。
        *   記錄 `last_processed_id` 到數據庫，確保任務中斷後能續傳。
*   **預期效益**：徹底解決大規模廣播時的內存崩潰風險。

---

## 2. 數據分析與報表 (Analytics & Reporting)

這部分是給機器和管理員看的，主要涉及數據聚合與 AI 邏輯，不涉及用戶端 UI 文字。

### 2.1 MoonPacket API 效能增強
*   **痛點**：`COUNT(*)` 查詢在數據量大時非常慢。
*   **實作內容**：
    *   **實作「計數器」邏輯**：
        *   在 `daily_usage` 表中增加 `ads_watched`, `bottles_thrown` 等欄位。
        *   在用戶行為發生時（看廣告、丟瓶子），同步更新這個計數表（Increment）。
    *   **修改查詢邏輯**：
        *   MoonPacket API 直接讀取 `daily_usage` 表，而不是去掃描百萬行的 `ad_rewards` 表。
*   **預期效益**：API 查詢複雜度從 O(N) 降為 O(1)。

### 2.2 AI 智能報表引擎 (AI Insight Engine)
*   **痛點**：目前的日報是死板數據。
*   **實作內容**：
    *   **接入 Gemini 1.5 Flash**：在 `src/services/daily_reports.ts` 中。
    *   **Prompt Engineering**：設計一個 Prompt，輸入 JSON 格式的營運數據，要求 AI 輸出一段 **繁體中文 (zh-TW)** 的分析摘要。
        *   *註：雖然這裡有中文，但這是寫死在 Prompt 裡的系統指令，或是後端生成的管理員訊息，不需要走 i18n 用戶翻譯流程。*
    *   **異常檢測邏輯**：讓 AI 判斷數據波動是否超過閾值（如：跌幅 > 20%）。
*   **預期效益**：讓超級管理員能一眼看懂數據背後的意義。

---

## 3. 後台管理功能 (Admin Features)

針對管理員的功能，指令與回覆通常不需要嚴格的多語言支援（默認 zh-TW 即可）。

### 3.1 異常流量監控與告警
*   **痛點**：被攻擊或刷量時後知後覺。
*   **實作內容**：
    *   **頻率限制器 (Rate Limiter)**：在關鍵接口（丟瓶、註冊）加強 Rate Limit。
    *   **告警觸發器**：當某個 IP 或用戶 ID 觸發限制時，立即向 **Admin Log Group** 發送通知。
*   **預期效益**：提升系統安全性，縮短異常響應時間。

---

## 4. 執行順序建議

1.  **P0: 引入 KV 緩存服務**（這是基礎設施，最先做）。
2.  **P1: 廣播分批處理**（保護系統不崩潰）。
3.  **P1: MoonPacket API 計數器優化**（為即將到來的流量做準備）。
4.  **P2: AI 智能報表**（提升管理效率）。

---

**備註**：以上所有任務均不涉及修改 `src/i18n/locales/*.ts` 或 CSV 文件，您可以放心安排開發。

