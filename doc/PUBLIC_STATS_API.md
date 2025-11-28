# 公開統計 API (Public Stats API) 設計文檔

## 1. 概述 (Overview)

本模組旨在提供一個公開的、唯讀的 API 端點，用於對外展示 XunNi Bot 的運營數據。
這些數據主要用於 Landing Page、行銷活動或合作夥伴展示，以體現平台的活躍度和規模。

## 2. API 規範 (API Specification)

### 2.1 端點資訊

- **URL**: `/api/stats`
- **Method**: `GET`
- **Access**: Public (無須認證)
- **Cache-Control**: `public, max-age=600` (緩存 10 分鐘)

### 2.2 回傳格式 (Response)

```json
{
  "success": true,
  "data": {
    "overview": {
      "total_users": 12500,
      "total_bottles": 45600,
      "total_conversations": 8900
    },
    "activity": {
      "active_last_24h": 1200,
      "new_users_last_24h": 150
    },
    "demographics": {
      "top_mbti": [
        { "type": "INFP", "percentage": 15.5 },
        { "type": "ENFP", "percentage": 12.0 },
        { "type": "INTJ", "percentage": 8.5 }
      ],
      "top_zodiac": [
        { "sign": "scorpio", "percentage": 10.2 },
        { "sign": "libra", "percentage": 9.8 }
      ],
      "top_regions": [
        { "code": "TW", "percentage": 45.0 },
        { "code": "HK", "percentage": 15.0 },
        { "code": "JP", "percentage": 10.0 }
      ]
    },
    "updated_at": "2025-11-28T10:00:00Z"
  }
}
```

## 3. 數據源與計算邏輯 (Data Source & Logic)

### 3.1 數據源

所有數據應優先從 `daily_user_summary` 表或預計算的緩存中讀取，避免對 `users` 或 `bottles` 大表進行實時 `COUNT(*)` 查詢。

### 3.2 計算規則

1.  **總用戶數 (Total Users)**:
    *   計算 `users` 表中 `deleted_at IS NULL` 的數量。
    *   *優化*: 使用 D1 的 `meta.rows_read` 估算或 Cloudflare KV 緩存計數。

2.  **總漂流瓶 (Total Bottles)**:
    *   計算 `bottles` 表總數。

3.  **總對話 (Total Conversations)**:
    *   計算 `conversations` 表總數。

4.  **活躍用戶 (Active Users)**:
    *   基於 `users.last_active_at` 在過去 24 小時內的數量。

5.  **分佈統計 (Demographics)**:
    *   **MBTI**: 聚合 `users.mbti_result`。
    *   **星座**: 聚合 `users.zodiac_sign`。
    *   **地區**: 聚合 `users.country_code` (如果有的話) 或 `language_pref`。
    *   *限制*: 只返回前 3-5 名，避免長尾數據過長。

## 4. 緩存策略 (Caching Strategy)

為了保護資料庫，API **必須** 實作緩存機制：

1.  **Cloudflare Cache API**:
    *   Response Header 設定 `Cache-Control: public, max-age=600, s-maxage=600`。
    *   讓 Cloudflare Edge 節點緩存回應。

2.  **內部 KV 緩存 (可選)**:
    *   如果計算成本過高，Worker 內部應將計算結果存入 KV (`STATS_CACHE`)，設定 1 小時過期。
    *   API 請求優先讀取 KV。

## 5. 安全與隱私 (Security & Privacy)

1.  **數據模糊化**:
    *   雖然目前設計為精確數字，但建議在顯示層（前端）或 API 層進行模糊化（如 `1234` -> `1.2k`）。
    *   對於極小數據（如 < 10），可返回 `0` 或隱藏，避免推斷出特定用戶。

2.  **敏感字段排除**:
    *   **絕不** 返回任何用戶 ID、用戶名或具體內容。
    *   **絕不** 返回性別比例（避免被標籤化為特定導向的平台，除非業務需要）。

## 6. 開發計畫

1.  **新增 API Handler**: `src/api/stats.ts`
2.  **註冊路由**: 在 `src/worker.ts` 或 `src/router.ts` 中註冊 `/api/stats`。
3.  **實現查詢優化**: 確保 SQL 查詢高效，使用索引。
4.  **部署與測試**: 部署到 Staging 並驗證輸出格式。

