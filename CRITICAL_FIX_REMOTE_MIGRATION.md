# 🔥 Critical Fix: Remote Database Migration

## 問題發現

**日期**: 2025-11-20  
**發現者**: 用戶測試  
**嚴重性**: 🔴 Critical

### 錯誤信息

```
D1_ERROR: no such column: age_range at offset 250: SQLITE_ERROR
D1_ERROR: no such column: match_status: SQLITE_ERROR
```

### 根本原因

❌ **Migration 沒有在 Remote 數據庫執行！**

雖然：
- ✅ Migration 文件存在（0040, 0041）
- ✅ 代碼已部署到 Staging
- ✅ 本地測試通過

但是：
- ❌ Remote 數據庫沒有執行 migration
- ❌ 缺少 `age_range` 和 `match_status` 欄位
- ❌ 導致智能配對功能完全失效

---

## 測試不足之處

### ❌ 我的 Smoke Test 只檢查了：

```typescript
// ❌ 只檢查本地文件存在
await testEndpoint('Smart Matching', 'Migration 0040 exists', async () => {
  const fs = await import('fs');
  if (!fs.existsSync('src/db/migrations/0040_add_smart_matching_fields.sql')) {
    throw new Error('Missing migration 0040');
  }
});
```

### ✅ 應該還要檢查：

```typescript
// ✅ 檢查遠程數據庫 schema
await testEndpoint('Smart Matching', 'Remote DB has age_range column', async () => {
  const response = await fetch(`${WORKER_URL}/api/health/db-schema`);
  const schema = await response.json();
  if (!schema.users.includes('age_range')) {
    throw new Error('age_range column not found in remote DB');
  }
});
```

---

## 修復步驟

### 1. 手動執行 Migration

```bash
# 添加 age_range 欄位
pnpm wrangler d1 execute xunni-db-staging --remote \
  --command="ALTER TABLE users ADD COLUMN age_range TEXT;"

# 添加 match_status 欄位
pnpm wrangler d1 execute xunni-db-staging --remote \
  --command="ALTER TABLE bottles ADD COLUMN match_status TEXT DEFAULT 'active';"

# 創建 matching_history 表
pnpm wrangler d1 execute xunni-db-staging --remote \
  --file=src/db/migrations/0041_create_matching_history.sql

# 創建性能索引
pnpm wrangler d1 execute xunni-db-staging --remote \
  --command="
    CREATE INDEX IF NOT EXISTS idx_users_active_status ON users(last_active_at DESC, is_banned);
    CREATE INDEX IF NOT EXISTS idx_users_language ON users(language_pref);
    CREATE INDEX IF NOT EXISTS idx_users_age_range ON users(age_range);
    CREATE INDEX IF NOT EXISTS idx_bottles_match_status_created ON bottles(match_status, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_bottles_status_owner ON bottles(match_status, owner_telegram_id);
  "
```

### 2. 驗證修復

```bash
# 檢查 age_range 欄位
pnpm wrangler d1 execute xunni-db-staging --remote \
  --command="PRAGMA table_info(users);" | grep age_range

# 檢查 match_status 欄位
pnpm wrangler d1 execute xunni-db-staging --remote \
  --command="PRAGMA table_info(bottles);" | grep match_status

# 檢查 matching_history 表
pnpm wrangler d1 execute xunni-db-staging --remote \
  --command="SELECT name FROM sqlite_master WHERE type='table' AND name='matching_history';"
```

### 3. 測試功能

```bash
# 測試丟瓶子（應該不再報錯）
curl -X POST https://xunni-bot-staging.yves221.workers.dev/webhook \
  -H "Content-Type: application/json" \
  -d '{"update_id":1,"message":{"message_id":1,"from":{"id":123},"chat":{"id":123},"date":1,"text":"/throw"}}'
```

---

## 修復結果

✅ **所有欄位已成功添加**

| 欄位 | 表 | 狀態 |
|------|-----|------|
| age_range | users | ✅ 已添加 |
| match_status | bottles | ✅ 已添加 |
| matching_history | - | ✅ 已創建 |
| idx_users_active_status | users | ✅ 已創建 |
| idx_users_language | users | ✅ 已創建 |
| idx_users_age_range | users | ✅ 已創建 |
| idx_bottles_match_status_created | bottles | ✅ 已創建 |
| idx_bottles_status_owner | bottles | ✅ 已創建 |

---

## 經驗教訓

### 🔴 Critical Lessons

1. **部署前必須檢查 Remote DB Schema**
   - 不能只檢查本地文件
   - 必須驗證遠程數據庫狀態

2. **Migration 必須明確執行**
   - 部署代碼 ≠ 執行 migration
   - 需要單獨執行 `wrangler d1 migrations apply --remote`

3. **測試必須覆蓋 Remote 環境**
   - Smoke Test 應該測試實際的 Remote DB
   - 不能只依賴本地測試

4. **部署檢查清單必須包含**
   - ✅ 代碼部署
   - ✅ Migration 執行
   - ✅ Remote DB Schema 驗證
   - ✅ 功能測試

---

## 改進措施

### 1. 更新部署流程

在 `doc/DEPLOYMENT.md` 中添加：

```markdown
## 部署檢查清單

### 1. 代碼部署
- [ ] `pnpm deploy:staging`
- [ ] 檢查 Worker 啟動成功

### 2. Migration 執行（如果有新 migration）
- [ ] `pnpm wrangler d1 migrations apply DB_NAME --remote`
- [ ] 驗證 migration 成功

### 3. Remote DB Schema 驗證
- [ ] 檢查新欄位存在
- [ ] 檢查新表存在
- [ ] 檢查索引創建

### 4. 功能測試
- [ ] 執行 Smoke Test
- [ ] 手動測試新功能
- [ ] 檢查 Cloudflare Logs
```

### 2. 更新 Smoke Test

添加 Remote DB Schema 檢查：

```typescript
await testEndpoint('Database', 'Remote DB Schema - age_range', async () => {
  // 實際查詢 Remote DB 確認欄位存在
  const response = await sendWebhook('/dev_info');
  // 解析響應，確認 schema 正確
});
```

### 3. 創建 Migration 檢查腳本

```bash
#!/bin/bash
# scripts/check-remote-migrations.sh

echo "Checking remote database schema..."

# 檢查 age_range
if ! pnpm wrangler d1 execute xunni-db-staging --remote \
  --command="PRAGMA table_info(users);" | grep -q "age_range"; then
  echo "❌ Missing age_range column"
  exit 1
fi

# 檢查 match_status
if ! pnpm wrangler d1 execute xunni-db-staging --remote \
  --command="PRAGMA table_info(bottles);" | grep -q "match_status"; then
  echo "❌ Missing match_status column"
  exit 1
fi

echo "✅ All migrations applied successfully"
```

---

## 總結

**問題**: Migration 沒有在 Remote 數據庫執行  
**影響**: 智能配對功能完全失效  
**修復**: 手動執行 migration  
**預防**: 更新部署流程和測試策略  

**狀態**: ✅ 已修復並部署

---

**修復時間**: 2025-11-20 15:18 UTC  
**修復者**: AI Assistant  
**驗證者**: 用戶測試

