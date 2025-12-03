# Migration 0016 手動執行記錄

## 問題

用戶在 staging 環境點擊「重新測試 MBTI」時出現錯誤：
```
D1_ERROR: table mbti_test_progress has no column named test_version: SQLITE_ERROR
```

## 原因

Migration `0016_add_mbti_test_version.sql` 在本地開發時創建，但沒有在 remote staging 資料庫執行。

## 解決方案

由於 staging 資料庫已有數據，但 migrations 表記錄不完整，無法使用 `wrangler d1 migrations apply` 自動執行（會因為 `0001_initial_schema.sql` 的索引已存在而失敗）。

因此，我們手動執行了 migration SQL：

### 執行時間
2025-11-17 08:59 UTC

### 執行的 SQL

```sql
-- 添加 test_version 欄位
ALTER TABLE mbti_test_progress ADD COLUMN test_version TEXT DEFAULT 'quick' CHECK(test_version IN ('quick', 'full'));

-- 創建索引
CREATE INDEX IF NOT EXISTS idx_mbti_test_progress_version ON mbti_test_progress(test_version);
```

### 執行命令

```bash
# 添加欄位
CLOUDFLARE_ACCOUNT_ID=7404fbe7880034e92c7d4a20969e42f5 npx wrangler d1 execute xunni-db-staging --remote --command="ALTER TABLE mbti_test_progress ADD COLUMN test_version TEXT DEFAULT 'quick' CHECK(test_version IN ('quick', 'full'));"

# 創建索引
CLOUDFLARE_ACCOUNT_ID=7404fbe7880034e92c7d4a20969e42f5 npx wrangler d1 execute xunni-db-staging --remote --command="CREATE INDEX IF NOT EXISTS idx_mbti_test_progress_version ON mbti_test_progress(test_version);"
```

### 驗證

```bash
CLOUDFLARE_ACCOUNT_ID=7404fbe7880034e92c7d4a20969e42f5 npx wrangler d1 execute xunni-db-staging --remote --command="PRAGMA table_info(mbti_test_progress);"
```

結果顯示 `test_version` 欄位已成功添加：
- cid: 5
- name: test_version
- type: TEXT
- dflt_value: 'quick'

## 影響範圍

- ✅ 修復了「重新測試 MBTI」功能
- ✅ 支持 12 題快速版和 36 題完整版 MBTI 測試
- ✅ 現有數據不受影響（默認值為 'quick'）

## 後續建議

1. **Production 環境**：在部署到 production 前，需要執行相同的 migration
2. **Migration 管理**：考慮為已有數據的環境建立 migration baseline，避免重複執行問題
3. **文檔更新**：在 `doc/DEPLOYMENT.md` 中記錄手動 migration 的流程

## 相關文件

- Migration 文件：`src/db/migrations/0016_add_mbti_test_version.sql`
- MBTI 服務：`src/services/mbti_test_service.ts`
- MBTI 處理器：`src/telegram/handlers/mbti.ts`

