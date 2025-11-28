# 翻譯成本監控與主動報告系統 (Translation Cost Monitoring & Reporting System)

> **版本**：1.0
> **狀態**：已實作
> **更新日期**：2025-01-20

本系統旨在提供輕量級、自動化的翻譯成本監控，幫助管理者即時掌握運營開銷，同時避免產生過多的日誌數據。

## 1. 設計原則

- **極簡存儲**：不記錄單次翻譯請求的詳細內容，只記錄每日、每個 Provider 的聚合數據（Token 數、請求數）。
- **主動報告**：Bot 每天早上主動向管理員發送昨日運營日報。
- **異常感知**：記錄並報告翻譯降級（Fallback）事件。

## 2. 資料庫設計

### 2.1 每日統計表 (`daily_translation_stats`)

用於存儲每日聚合數據。

| 欄位 | 類型 | 說明 |
| :--- | :--- | :--- |
| `id` | INTEGER | PK |
| `date` | TEXT | 日期 (YYYY-MM-DD) |
| `provider` | TEXT | 提供商 (openai, gemini, google) |
| `total_tokens` | INTEGER | 總 Token 數 (OpenAI) |
| `total_characters` | INTEGER | 總字符數 (Google) |
| `request_count` | INTEGER | 總請求次數 |
| `error_count` | INTEGER | 失敗次數 |

### 2.2 降級記錄表 (`translation_fallbacks`)

僅記錄異常（降級）事件，用於故障排查。

*註：此表結構沿用現有或根據需求新增，主要欄位：`user_id`, `from_provider`, `to_provider`, `error_message`, `created_at`。*

## 3. 核心組件

### 3.1 `TranslationLogService`

負責寫入日誌和讀取統計數據。

- `logUsage(provider, usage)`: 使用 `INSERT ... ON CONFLICT DO UPDATE` 原子性更新每日統計。
- `logFallback(...)`: 記錄降級事件。
- `getDailyStats(date)`: 獲取指定日期的統計。

### 3.2 `admin_report.ts` (Handler)

負責生成和發送報告。

- **觸發方式**：
  1. **Cron Job**: 每天 09:00 UTC+8 自動觸發。
  2. **手動指令**: `/admin_report`。
- **報告內容**：
  - 翻譯成本估算（基於 Token 數 x 單價）。
  - 異常監控（降級次數、失敗次數）。
  - 活躍數據（新增用戶、活躍對話，從 `daily_stats` 獲取）。

## 4. 使用指南

### 4.1 手動查詢
管理員可隨時發送指令獲取昨日報告：
```
/admin_report
```

### 4.2 每日推送
系統會自動推送到所有 Role 為 `god` 的用戶。

### 4.3 成本估算公式
目前 OpenAI 成本估算基於 GPT-4o-mini 定價：
`Cost = (Total Tokens / 1000) * $0.00015`
*(註：此為輸入價格估算，實際價格可能因輸出比例略有不同)*

## 5. 維護
- **數據保留**：`daily_translation_stats` 數據量極小（每天僅 ~3-5 條記錄），可永久保留。
- **擴展**：如需支持更多 Provider，只需在 `TranslationProvider` 枚舉中添加並在 `admin_report.ts` 中更新顯示邏輯。

