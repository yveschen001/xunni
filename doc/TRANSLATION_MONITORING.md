## 7. 翻譯成本監控與日報

系統提供每日翻譯成本與活躍數據的自動化報告，協助管理者監控營運狀況。

### 7.1 功能概述

- **每日自動發送**：每天早上 09:00 (UTC+8) 自動推送給管理者（Role = `god`）。
- **聚合統計**：基於 `daily_translation_stats` 表，統計 OpenAI、Gemini、Google 等服務的 Token/字符用量。
- **異常監控**：統計翻譯降級（Fallback）和失敗次數。
- **手動觸發**：管理者可使用 `/admin_report_test` 指令手動生成報告。

### 7.2 報告內容範例

```text
📊 昨日運營日報 (2025-01-20)

💰 翻譯成本估算：
• OPENAI: $2.5000 (15.2k Tokens)
• GEMINI: $0.0000 (30.5k Chars)
👉 總計: $2.5000

⚠️ 異常監控：
• 翻譯降級次數：3 次
• 翻譯失敗次數：0 次

📈 活躍數據：
• 新增用戶：+50
• 活躍用戶：1200
• 新增對話：3500
• 總訊息數：15000
```

### 7.3 資料庫設計

使用 `daily_translation_stats` 表進行輕量級聚合統計：

```sql
CREATE TABLE daily_translation_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  stat_date TEXT NOT NULL,  -- YYYY-MM-DD
  provider TEXT NOT NULL,   -- 'openai', 'gemini', 'google'
  total_tokens INTEGER DEFAULT 0,
  total_characters INTEGER DEFAULT 0,
  request_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  cost_usd REAL DEFAULT 0.0,
  UNIQUE(stat_date, provider)
);
```

### 7.4 翻譯降級記錄

當主要翻譯服務（OpenAI）失敗並切換到備用服務（Gemini）時，記錄於 `translation_fallbacks` 表：

```sql
CREATE TABLE translation_fallbacks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT,
  from_provider TEXT,
  to_provider TEXT,
  error_message TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

