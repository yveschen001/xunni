# 系統優化與數據治理計劃 (System Optimization & Data Governance Plan)

## 1. 目標
確保 XunNi Bot 在用戶量增長時仍能保持高效、穩定且低成本運行，防止數據無限堆積導致的性能下降。

## 2. 核心問題與風險
*   **數據堆積 (Data Bloat)**：`analytics_events` 和 `conversation_messages` 表目前缺乏自動清理機制，長期運行將導致數據庫查詢變慢。
*   **成本控制 (Cost Control)**：隨著數據量增加，D1 存儲和讀取成本會上升。
*   **安全性 (Security)**：缺乏針對高頻請求的應用層限流。

## 3. 執行計劃 (Action Plan)

### 3.1 階段一：自動化數據清理 (Priority: High)
**目標**：控制資料庫大小，確保查詢速度。

1.  **實作 Cron Job 清理機制**：
    *   **任務**：創建 `Scheduled Handler` (Cron Job)。
    *   **頻率**：每日一次 (例如 UTC 00:00)。
    *   **邏輯**：
        *   調用 `deleteOldAnalyticsEvents(90)`：刪除 90 天前的分析日誌。
        *   *新功能*：刪除 1 年前的非 VIP 用戶聊天記錄 (需確認業務規則)。
    *   **相關文件**：`src/worker.ts`, `src/services/cleanup.ts` (需新增)。

2.  **配置 `wrangler.toml`**：
    *   啟用 Cron Triggers。

### 3.2 階段二：KV 限流防護 (Priority: Medium)
**目標**：防止惡意高頻請求消耗資源。

1.  **實作 KV Rate Limiter** (✅ 完成)：
    *   **邏輯**：在 `router.ts` 入口處檢查 `telegram_id`。
    *   **限制**：60 請求 / 60 秒 (滑動窗口近似算法)。
    *   **存儲**：使用 Cloudflare KV (`env.CACHE`)。
    *   **處置**：超過限制時直接返回 HTTP 200 (丟棄請求) 以避免 Telegram 重試。

### 3.3 階段三：數據歸檔策略 (Priority: Low)
**目標**：長期保存高價值數據，但從熱數據庫中移除。

1.  **R2 歸檔 (可選)**：
    *   將超過 90 天的 Analytics 數據導出為 CSV/JSON 存入 Cloudflare R2 (對象存儲)，然後從 D1 刪除。
    *   優點：極低成本長期保存，支持大數據分析。

### 3.4 階段四：VIP 權益增強與合規 (Priority: High)
**目標**：完善 VIP 價值主張，並確保隱私合規。

1.  **數據保留政策實作與告知**：
    *   **邏輯**：VIP 聊天記錄保留 3 年，普通用戶保留 1 年。
    *   **UI**：在 VIP 購買頁和 `/settings` 隱私頁面增加明確的保留期限說明。
    *   **Terms**：更新隱私政策文檔。

2.  **VIP 專屬連結白名單**：
    *   **功能**：普通用戶僅限發送 `t.me` 連結。
    *   **特權**：VIP 用戶可發送 `youtube.com`, `twitter.com`, `instagram.com`, `facebook.com` 等社交媒體連結。
    *   **實作**：升級 `checkUrlWhitelist` 函數，支持 `isVip` 參數。

### 3.5 階段五：智能監控與防風暴報警 (Priority: Medium)
**目標**：主動發現系統異常，同時避免「報警風暴」干擾管理員。

1.  **錯誤日誌智能聚合 (Smart Alerting)**：
    *   **機制**：基於 KV 的去重與計數。
    *   **規則**：同一類錯誤（Same Error Fingerprint），**5 分鐘內只推送一次**。
    *   **內容**：推送時附帶「過去 5 分鐘發生次數」，讓管理員知道嚴重程度。
    *   **場景**：支付失敗、翻譯 API 連續錯誤、資料庫連接超時。

2.  **每日健康檢查 (Daily Health Check)**：
    *   **頻率**：每日早上發送。
    *   **內容**：昨日錯誤率、API 響應時間 P95、關鍵業務指標（如零匹配次數）。

3.  **外部服務健康監控 (External API Monitoring)**：
    *   **問題**：外部服務（廣告、OpenAI）中斷可能被誤判為系統錯誤，或未被及時發現。
    *   **對象**：
        *   **翻譯服務 (OpenAI/Gemini)**：監控連續失敗率，失敗時自動切換或降級。
        *   **廣告服務 (GigaPub)**：監控廣告加載失敗率，異常時報警。
    *   **策略**：
        *   **被動監控**：業務代碼中捕獲並統計 API 呼叫失敗。
        *   **主動探測**：Cron Job 定期檢查關鍵依賴的連通性。
        *   **即時報警**：關鍵依賴不可用時，立即通知管理員。

## 4. 預期成果 (Status: All High/Medium Completed)
*   ✅ **資料庫瘦身**：`analytics_events` 表大小將維持在穩定水平（約 90 天數據量）。
*   ✅ **性能提升**：避免因全表掃描大表導致的查詢超時。
*   ✅ **成本可控**：D1 存儲費用不會無限增長。
*   ✅ **營收增長**：更強的 VIP 權益（社交連結解鎖）將提升付費轉化率。
*   ✅ **運維安枕**：異常即時知曉，且不會被垃圾訊息轟炸。
*   ✅ **安全防護**：KV 限流有效阻擋惡意請求。

---

**執行狀態：**
*   2025-11-29: Phase 1, 4, 5 完成代碼並部署 Staging。
*   2025-11-29: Phase 2 (Rate Limiter) 完成代碼並部署 Staging。
*   Phase 3 (R2) 暫緩執行。

