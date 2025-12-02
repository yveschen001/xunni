# Operational Analytics & Financial Reporting System

> **Goal**: Provide transparent, automated daily reports on Cost (AI Usage) vs. Revenue (Stars/Ads) to optimize business strategy without affecting user experience.

## 1. Overview

To understand Unit Economics (e.g., "Is the Fortune feature profitable?"), we need to separate:
- **Direct Revenue**: Star payments, VIP subscriptions.
- **Indirect Revenue**: Ad views.
- **Direct Costs**: AI Token usage (Fortune Telling).
- **Indirect Costs**: AI Token usage (Translation/Chat).

## 2. Data Architecture

### 2.1 New Database Table: `ai_cost_logs`
A dedicated table to log every AI interaction for auditing and aggregation.

```sql
CREATE TABLE ai_cost_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,                 -- Who used it
    feature_type TEXT,            -- 'FORTUNE', 'TRANSLATION', 'CHAT', 'SYSTEM'
    sub_type TEXT,                -- 'daily', 'love_match', 'zh-TW'
    provider TEXT,                -- 'openai', 'gemini'
    model TEXT,                   -- 'gpt-4o-mini', 'gemini-1.5-flash'
    input_tokens INTEGER,         -- Cost factor 1
    output_tokens INTEGER,        -- Cost factor 2
    cost_usd REAL,                -- Estimated cost at time of usage
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_ai_cost_date ON ai_cost_logs(created_at);
CREATE INDEX idx_ai_cost_type ON ai_cost_logs(feature_type);
```

### 2.2 New Database Table: `daily_financial_reports`
Stores pre-calculated daily metrics for fast retrieval and trend analysis.

```sql
CREATE TABLE daily_financial_reports (
    date TEXT PRIMARY KEY,        -- YYYY-MM-DD
    total_revenue REAL,           -- Total Revenue (USD estimated)
    total_cost REAL,              -- Total AI Cost (USD)
    gross_profit REAL,            -- Revenue - Cost
    dau INTEGER,                  -- Daily Active Users
    fortune_count INTEGER,        -- Total Fortunes Generated
    fortune_cost REAL,            -- Cost specifically for Fortunes
    translation_cost REAL,        -- Cost specifically for Translation
    model_breakdown TEXT,         -- JSON: Cost per model
    feature_breakdown TEXT        -- JSON: Cost per feature type
);
```

## 3. Implementation Strategy

### 3.1 Data Capture (Real-time)
- **Service Layer**: Modify `FortuneService` and `TranslateService` to return token usage stats from API responses.
- **Logging**: Asynchronously write to `ai_cost_logs` (fire-and-forget to avoid latency).

### 3.2 Aggregation (Daily Cron)
- **Worker**: A scheduled Cron Job runs at 00:00 UTC.
- **Process**:
  1. Aggregate `ai_cost_logs` for the previous day.
  2. Aggregate `payment_transactions` (Revenue).
  3. Aggregate `ad_history` (Ad Revenue estimate).
  4. Calculate KPIs (ARPU, Cost per Bottle).
  5. Store in `daily_financial_reports`.
  6. **Alert**: Send a summary report to the Admin Telegram Group.

## 4. Reporting (Admin View)

### Daily Report Format (Telegram)
```
📊 **Daily Financial Report (2025-12-01)**

💰 **Revenue**: $50.00
  • Stars: $45.00 (9 tx)
  • Ads: $5.00 (500 views)

💸 **AI Costs**: $4.50
  • Fortune: $3.20 (71%)
  • Translation: $1.30 (29%)

📈 **Profit**: $45.50 (Margin: 91%)

🤖 **Top Models (Cost)**:
  1. GPT-4o: $2.50
  2. Gemini 1.5 Pro: $1.50
  3. GPT-4o-mini: $0.50

🔮 **Fortune Stats**:
  • Total Generated: 150
  • Avg Cost/Fortune: $0.021
```

## 5. Pricing Strategy (Configuration)
*Centralized pricing configuration to estimate costs.*

```typescript
export const MODEL_PRICING = {
  // USD per 1M tokens (Input / Output)
  'gpt-4o': { input: 2.50, output: 10.00 },
  'gpt-4o-mini': { input: 0.15, output: 0.60 },
  'gemini-1.5-pro': { input: 3.50, output: 10.50 },
  'gemini-1.5-flash': { input: 0.075, output: 0.30 },
  'gemini-2.0-flash-exp': { input: 0, output: 0 }, // Currently Free
};
```

## 6. Optimization Opportunities
1. **Model Routing**: If `gpt-4o` costs are too high for "Daily Fortune", route to `gemini-1.5-flash` automatically.
2. **Caching**: If Translation costs spike, increase caching duration or aggressive deduplication.
3. **User Tiers**: Limit high-cost models (GPT-4) to VIP users only.

