#!/bin/bash
# Full Test Script - 完整測試腳本
# 
# 用途：在部署前執行完整的自動化測試
# 使用：bash scripts/full-test.sh

set -e

echo "=========================================="
echo "🚀 XunNi 完整測試流程"
echo "=========================================="
echo ""

# ============================================================================
# 階段 1：靜態代碼檢查
# ============================================================================

echo "=========================================="
echo "階段 1：靜態代碼檢查"
echo "=========================================="
echo ""

echo "✅ 1.1 代碼格式化..."
pnpm format > /dev/null 2>&1
echo "   格式化完成"

echo "✅ 1.2 Lint 檢查..."
LINT_OUTPUT=$(pnpm lint 2>&1)
ERROR_COUNT=$(echo "$LINT_OUTPUT" | grep -c "error" || true)
WARNING_COUNT=$(echo "$LINT_OUTPUT" | grep -c "warning" || true)

if [ "$ERROR_COUNT" -gt 0 ]; then
  echo "   ❌ 發現 $ERROR_COUNT 個錯誤"
  echo "$LINT_OUTPUT"
  exit 1
else
  echo "   Lint 通過（0 錯誤，$WARNING_COUNT 警告）"
fi

echo "✅ 1.3 單元測試..."
pnpm test > /dev/null 2>&1
echo "   所有測試通過"

echo "✅ 1.4 Schema 一致性檢查..."
# 檢查是否使用了不存在的欄位
if grep -r "\.is_super_admin" src/telegram/handlers/ 2>/dev/null | grep -v "function isSuperAdmin" | grep -v "//"; then
  echo "   ❌ 發現使用 is_super_admin 欄位（應該使用 role === 'god'）"
  exit 1
fi

if grep -r "\.is_admin" src/telegram/handlers/ 2>/dev/null | grep -v "function isAdmin" | grep -v "//"; then
  echo "   ❌ 發現使用 is_admin 欄位（應該使用 role）"
  exit 1
fi
echo "   Schema 一致性檢查通過"

echo "✅ 1.5 路由完整性檢查..."
bash scripts/e2e-test.sh > /dev/null 2>&1
echo "   路由完整性檢查通過"

echo ""

# ============================================================================
# 階段 2：資料庫驗證
# ============================================================================

echo "=========================================="
echo "階段 2：資料庫驗證"
echo "=========================================="
echo ""

echo "✅ 2.1 檢查 migrations..."
MIGRATION_COUNT=$(pnpm wrangler d1 migrations list DB --env staging --remote 2>&1 | grep -c "sql" || true)
echo "   發現 $MIGRATION_COUNT 個 migration 文件"

echo "✅ 2.2 檢查表結構..."
TABLE_COUNT=$(pnpm wrangler d1 execute DB --env staging --remote \
  --command "SELECT COUNT(*) as count FROM sqlite_master WHERE type='table';" 2>&1 | \
  grep -o '"count":[0-9]*' | grep -o '[0-9]*' || echo "0")
echo "   資料庫包含 $TABLE_COUNT 個表"

# 檢查必須存在的表
REQUIRED_TABLES=("users" "bottles" "conversations" "ad_providers" "ad_rewards" "official_ads" "analytics_events")
MISSING_TABLES=()

for table in "${REQUIRED_TABLES[@]}"; do
  if ! pnpm wrangler d1 execute DB --env staging --remote \
    --command "SELECT name FROM sqlite_master WHERE type='table' AND name='$table';" 2>&1 | grep -q "$table"; then
    MISSING_TABLES+=("$table")
  fi
done

if [ ${#MISSING_TABLES[@]} -gt 0 ]; then
  echo "   ❌ 缺少以下表：${MISSING_TABLES[*]}"
  exit 1
fi

echo "   所有必需的表都存在"

echo ""

# ============================================================================
# 測試總結
# ============================================================================

echo "=========================================="
echo "✅ 所有自動化測試通過！"
echo "=========================================="
echo ""
echo "📋 測試摘要："
echo "   - 代碼格式化：✅"
echo "   - Lint 檢查：✅ (0 錯誤，$WARNING_COUNT 警告)"
echo "   - 單元測試：✅"
echo "   - Schema 一致性：✅"
echo "   - 路由完整性：✅"
echo "   - Migrations：✅ ($MIGRATION_COUNT 個文件)"
echo "   - 表結構：✅ ($TABLE_COUNT 個表)"
echo ""
echo "⚠️  請手動執行以下測試："
echo ""
echo "📝 階段 3：功能測試"
echo "   1. 權限測試"
echo "      - 使用一般用戶測試管理員命令（應該被拒絕）"
echo "      - 使用超級管理員測試管理員命令（應該成功）"
echo ""
echo "   2. 命令路由測試"
echo "      - 發送所有新命令並確認有回覆"
echo "      - 檢查 Cloudflare Worker 日誌"
echo ""
echo "   3. 數據正確性測試"
echo "      - 檢查報表數據格式"
echo "      - 檢查數據邏輯（百分比、總數等）"
echo ""
echo "📝 階段 4：整合測試"
echo "   - 執行完整 Smoke Test（所有核心功能）"
echo ""
echo "📝 階段 5：日誌檢查"
echo "   - 查看 Cloudflare Worker 日誌"
echo "   - 確認沒有錯誤和異常"
echo ""
echo "=========================================="
echo "🎯 準備部署到 Staging"
echo "=========================================="
echo ""
echo "執行以下命令部署："
echo "   pnpm deploy:staging"
echo ""

