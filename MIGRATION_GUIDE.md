# 數據庫 Migration 執行指南

## ✅ **已創建的 Migrations**

### **廣告系統 Migrations (0022-0027)**

1. **0022_create_ad_rewards_table.sql**
   - 創建廣告獎勵表
   - 追蹤每日第三方視頻廣告觀看和額度獎勵
   - 每用戶每天最多 20 次

2. **0023_add_ad_statistics.sql**
   - 增強 daily_stats 表的廣告統計
   - 添加第三方和官方廣告指標

3. **0024_create_ad_providers_table.sql**
   - 創建廣告提供商表
   - 支持多廣告商（GigaPub, Google, Unity）
   - 自動 Fallback 機制

4. **0025_create_ad_provider_logs.sql**
   - 創建廣告提供商日誌表
   - 詳細追蹤每次廣告請求
   - 用於調試和優化

5. **0026_create_official_ads.sql**
   - 創建官方廣告系統
   - 支持文字/鏈接/群組/頻道廣告
   - 一次性展示，永久額度獎勵

6. **0027_create_quota_prompts.sql** (可選)
   - 創建額度提示變體表
   - 用於 A/B 測試
   - 可以稍後實現

### **分析系統 Migrations (0028-0032)**

7. **0028_create_analytics_events.sql**
   - 創建核心分析事件表
   - 追蹤所有用戶行為
   - 支持完整的用戶旅程分析

8. **0029_create_user_sessions.sql**
   - 創建用戶會話表
   - 追蹤會話時長和行為
   - 用於轉化路徑分析

9. **0030_create_daily_user_summary.sql**
   - 創建每日用戶摘要表
   - 預聚合指標，提高查詢性能
   - 用於留存率和群組分析

10. **0031_create_funnel_events.sql**
    - 創建漏斗分析表
    - 追蹤多步驟轉化流程
    - 識別流失點

11. **0032_update_daily_stats_analytics.sql**
    - 更新 daily_stats 表
    - 添加完整的業務指標
    - 支持執行儀表板

---

## 🚀 **執行 Migrations**

### **Step 1: 本地測試**

```bash
# 1. 確保在項目根目錄
cd /Users/yichen/Downloads/cursor/XunNi

# 2. 執行所有 Migrations（本地）
wrangler d1 migrations apply DB --local

# 3. 驗證表結構
wrangler d1 execute DB --local --command "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"

# 4. 檢查特定表
wrangler d1 execute DB --local --command "PRAGMA table_info(ad_rewards);"
```

### **Step 2: 部署到 Staging**

```bash
# 1. 執行 Migrations
wrangler d1 migrations apply DB --env staging

# 2. 驗證
wrangler d1 execute DB --env staging --command "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"

# 3. 檢查數據
wrangler d1 execute DB --env staging --command "SELECT COUNT(*) as table_count FROM sqlite_master WHERE type='table';"
```

### **Step 3: 初始化廣告提供商數據**

```bash
# 執行初始化腳本（見下方）
wrangler d1 execute DB --env staging --file=./scripts/init-ad-providers.sql
```

### **Step 4: 部署到 Production（謹慎！）**

```bash
# 1. 確認 Staging 測試通過
# 2. 備份 Production 數據庫（如果有數據）
pnpm backup:db

# 3. 執行 Migrations
wrangler d1 migrations apply DB --env production

# 4. 初始化數據
wrangler d1 execute DB --env production --file=./scripts/init-ad-providers.sql

# 5. 驗證
wrangler d1 execute DB --env production --command "SELECT COUNT(*) FROM ad_providers;"
```

---

## 📊 **驗證 Migrations**

### **檢查所有表**

```sql
-- 查看所有表
SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;

-- 預期結果應包含：
-- ad_providers
-- ad_provider_logs
-- ad_rewards
-- analytics_events
-- daily_user_summary
-- funnel_events
-- official_ads
-- official_ad_views
-- quota_prompt_variants (可選)
-- quota_prompt_impressions (可選)
-- user_sessions
-- (以及所有現有的表)
```

### **檢查 daily_stats 新字段**

```sql
-- 查看 daily_stats 表結構
PRAGMA table_info(daily_stats);

-- 應該看到新增的字段：
-- total_sessions, avg_session_duration_seconds, dau, wau, mau
-- total_ad_impressions, total_ad_clicks, ad_ctr
-- vip_awareness_count, vip_conversion_rate
-- etc.
```

### **測試插入數據**

```sql
-- 測試 ad_rewards 表
INSERT INTO ad_rewards (telegram_id, reward_date, ads_watched, quota_earned)
VALUES ('test_user_123', '2025-01-18', 1, 1);

SELECT * FROM ad_rewards WHERE telegram_id = 'test_user_123';

-- 測試 analytics_events 表
INSERT INTO analytics_events (event_type, event_category, user_id, event_date, event_hour)
VALUES ('user_registered', 'user', 'test_user_123', '2025-01-18', 10);

SELECT * FROM analytics_events WHERE user_id = 'test_user_123';

-- 清理測試數據
DELETE FROM ad_rewards WHERE telegram_id = 'test_user_123';
DELETE FROM analytics_events WHERE user_id = 'test_user_123';
```

---

## 🔧 **故障排除**

### **問題 1: Migration 失敗**

```bash
# 查看 Migration 狀態
wrangler d1 migrations list DB --env staging

# 如果某個 Migration 失敗，可以手動執行
wrangler d1 execute DB --env staging --file=./src/db/migrations/0022_create_ad_rewards_table.sql
```

### **問題 2: 表已存在**

```bash
# 如果表已存在，可以先刪除（謹慎！）
wrangler d1 execute DB --local --command "DROP TABLE IF EXISTS ad_rewards;"

# 然後重新執行 Migration
wrangler d1 migrations apply DB --local
```

### **問題 3: 字段已存在（ALTER TABLE 失敗）**

```sql
-- 檢查字段是否已存在
PRAGMA table_info(daily_stats);

-- 如果字段已存在，Migration 會失敗
-- 解決方案：手動跳過該 Migration 或刪除重建表（謹慎！）
```

---

## 📝 **Migration 最佳實踐**

### **1. 總是先在本地測試**

```bash
# 本地測試
wrangler d1 migrations apply DB --local

# 驗證
wrangler d1 execute DB --local --command "SELECT * FROM ad_rewards LIMIT 1;"
```

### **2. Staging 環境驗證**

```bash
# 部署到 Staging
wrangler d1 migrations apply DB --env staging

# 完整測試
pnpm test
pnpm dev:staging
```

### **3. Production 前備份**

```bash
# 備份數據庫
pnpm backup:db

# 或手動導出
wrangler d1 export DB --env production --output=backup-$(date +%Y%m%d).sql
```

### **4. 監控 Migration 執行**

```bash
# 查看 Migration 歷史
wrangler d1 migrations list DB --env production

# 查看最近的 Migration
wrangler d1 migrations list DB --env production | tail -5
```

---

## 🎯 **下一步**

Migration 執行完成後，繼續：

1. ✅ **實現 Domain 邏輯** - 創建 `src/domain/ad_reward.ts` 等
2. ✅ **實現數據庫查詢** - 創建 `src/db/queries/ad_rewards.ts` 等
3. ✅ **實現廣告處理器** - 創建 `src/telegram/handlers/ad_reward.ts` 等
4. ✅ **集成分析追蹤** - 在所有關鍵點添加事件追蹤
5. ✅ **測試** - 完整測試所有功能

---

**最後更新**: 2025-01-18  
**狀態**: ✅ Migrations 已創建，待執行  
**下一步**: 執行 Migrations 並初始化數據

