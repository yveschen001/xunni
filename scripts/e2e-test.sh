#!/bin/bash

# 端到端測試腳本
# 測試 Staging 環境的所有核心功能

# 設置顏色
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 配置
BOT_TOKEN="8226418094:AAE5wfp_AvKW36yqya502hUEJQIdSDrYJzM"
WORKER_URL="https://xunni-bot-staging.yves221.workers.dev"
TEST_USER_ID="396943893"

# 計數器
PASSED_COUNT=0
FAILED_COUNT=0

# 函數：檢查命令是否成功
check_test() {
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} $1"
    PASSED_COUNT=$((PASSED_COUNT + 1))
  else
    echo -e "${RED}✗${NC} $1"
    FAILED_COUNT=$((FAILED_COUNT + 1))
  fi
}

echo -e "${BLUE}🧪 開始端到端測試...${NC}\n"

# ============================================================================
# Step 1: Worker 健康檢查
# ============================================================================
echo -e "${BLUE}🏥 Step 1: Worker 健康檢查${NC}"
echo "----------------------------------------"

# 測試 Worker 是否運行
curl -s -f "$WORKER_URL/health" > /dev/null
check_test "Worker 健康檢查"

# 測試廣告頁面
curl -s -f -I "$WORKER_URL/ad-test.html" | grep "200 OK" > /dev/null
check_test "廣告測試頁面可訪問"

echo ""

# ============================================================================
# Step 2: Webhook 配置檢查
# ============================================================================
echo -e "${BLUE}🔗 Step 2: Webhook 配置檢查${NC}"
echo "----------------------------------------"

# 檢查 Webhook 狀態
WEBHOOK_INFO=$(curl -s "https://api.telegram.org/bot$BOT_TOKEN/getWebhookInfo")
echo "$WEBHOOK_INFO" | grep -q "\"url\":\"$WORKER_URL/webhook\""
check_test "Webhook URL 正確"

echo "$WEBHOOK_INFO" | grep -q "\"pending_update_count\":0"
check_test "Webhook 無待處理更新"

echo ""

# ============================================================================
# Step 3: 數據庫 Schema 檢查
# ============================================================================
echo -e "${BLUE}🗄️  Step 3: 數據庫 Schema 檢查${NC}"
echo "----------------------------------------"

# 檢查關鍵表是否存在
pnpm wrangler d1 execute DB --env staging --remote \
  --command "SELECT name FROM sqlite_master WHERE type='table' AND name='users';" 2>&1 | grep -q "users"
check_test "users 表存在"

pnpm wrangler d1 execute DB --env staging --remote \
  --command "SELECT name FROM sqlite_master WHERE type='table' AND name='user_sessions';" 2>&1 | grep -q "user_sessions"
check_test "user_sessions 表存在"

pnpm wrangler d1 execute DB --env staging --remote \
  --command "SELECT name FROM sqlite_master WHERE type='table' AND name='ad_rewards';" 2>&1 | grep -q "ad_rewards"
check_test "ad_rewards 表存在"

pnpm wrangler d1 execute DB --env staging --remote \
  --command "SELECT name FROM sqlite_master WHERE type='table' AND name='ad_providers';" 2>&1 | grep -q "ad_providers"
check_test "ad_providers 表存在"

pnpm wrangler d1 execute DB --env staging --remote \
  --command "SELECT name FROM sqlite_master WHERE type='table' AND name='official_ads';" 2>&1 | grep -q "official_ads"
check_test "official_ads 表存在"

echo ""

# ============================================================================
# Step 4: 數據庫欄位檢查
# ============================================================================
echo -e "${BLUE}📋 Step 4: 數據庫欄位檢查${NC}"
echo "----------------------------------------"

# 檢查 user_sessions 表的欄位
pnpm wrangler d1 execute DB --env staging --remote \
  --command "PRAGMA table_info(user_sessions);" 2>&1 | grep -q "telegram_id"
check_test "user_sessions 表包含 telegram_id 欄位"

# 檢查 users 表的 role 欄位
pnpm wrangler d1 execute DB --env staging --remote \
  --command "PRAGMA table_info(users);" 2>&1 | grep -q "role"
check_test "users 表包含 role 欄位"

echo ""

# ============================================================================
# Step 5: 測試數據檢查
# ============================================================================
echo -e "${BLUE}📊 Step 5: 測試數據檢查${NC}"
echo "----------------------------------------"

# 檢查廣告提供商
AD_PROVIDER_COUNT=$(pnpm wrangler d1 execute DB --env staging --remote \
  --command "SELECT COUNT(*) as count FROM ad_providers WHERE is_enabled = 1;" 2>&1 | grep -oP '(?<="count":)\d+' | head -1)

if [ "$AD_PROVIDER_COUNT" -ge 1 ]; then
  echo -e "${GREEN}✓${NC} 廣告提供商已配置（$AD_PROVIDER_COUNT 個）"
  PASSED_COUNT=$((PASSED_COUNT + 1))
else
  echo -e "${RED}✗${NC} 廣告提供商未配置"
  FAILED_COUNT=$((FAILED_COUNT + 1))
fi

# 檢查官方廣告
OFFICIAL_AD_COUNT=$(pnpm wrangler d1 execute DB --env staging --remote \
  --command "SELECT COUNT(*) as count FROM official_ads WHERE is_enabled = 1;" 2>&1 | grep -oP '(?<="count":)\d+' | head -1)

if [ "$OFFICIAL_AD_COUNT" -ge 1 ]; then
  echo -e "${GREEN}✓${NC} 官方廣告已創建（$OFFICIAL_AD_COUNT 個）"
  PASSED_COUNT=$((PASSED_COUNT + 1))
else
  echo -e "${RED}✗${NC} 官方廣告未創建"
  FAILED_COUNT=$((FAILED_COUNT + 1))
fi

echo ""

# ============================================================================
# Step 6: 管理員權限檢查
# ============================================================================
echo -e "${BLUE}👑 Step 6: 管理員權限檢查${NC}"
echo "----------------------------------------"

# 檢查管理員角色
ADMIN_ROLE=$(pnpm wrangler d1 execute DB --env staging --remote \
  --command "SELECT role FROM users WHERE telegram_id = '$TEST_USER_ID';" 2>&1 | grep -oP '(?<="role":")[^"]+' | head -1)

if [ "$ADMIN_ROLE" == "god" ]; then
  echo -e "${GREEN}✓${NC} 管理員權限已設置（role: god）"
  PASSED_COUNT=$((PASSED_COUNT + 1))
else
  echo -e "${YELLOW}⚠${NC} 管理員權限未設置或用戶不存在（role: $ADMIN_ROLE）"
  echo -e "${YELLOW}  提示：請先在 Bot 中發送 /start 註冊${NC}"
  FAILED_COUNT=$((FAILED_COUNT + 1))
fi

echo ""

# ============================================================================
# Step 7: 函數導出檢查
# ============================================================================
echo -e "${BLUE}📦 Step 7: 函數導出檢查${NC}"
echo "----------------------------------------"

# 檢查 admin_analytics.ts 導出的函數
grep -q "export.*handleAnalytics" src/telegram/handlers/admin_analytics.ts && check_test "handleAnalytics 函數已導出" || check_test "handleAnalytics 函數已導出"
grep -q "export.*handleAdPerformance" src/telegram/handlers/admin_analytics.ts && check_test "handleAdPerformance 函數已導出" || check_test "handleAdPerformance 函數已導出"
grep -q "export.*handleVIPFunnel" src/telegram/handlers/admin_analytics.ts && check_test "handleVIPFunnel 函數已導出" || check_test "handleVIPFunnel 函數已導出"

# 檢查路由中使用的函數名稱是否正確
grep -q "handleVIPFunnel.*import.*admin_analytics" src/router.ts && check_test "handleVIPFunnel 導入正確（不是 handleFunnel）" || check_test "handleVIPFunnel 導入正確（不是 handleFunnel）"

# 檢查是否有錯誤的函數名
if grep -q "handleFunnel.*import.*admin_analytics" src/router.ts 2>/dev/null; then
  echo -e "${RED}✗${NC} 發現錯誤的函數名 handleFunnel（應該是 handleVIPFunnel）"
  FAILED_COUNT=$((FAILED_COUNT + 1))
else
  echo -e "${GREEN}✓${NC} 沒有使用錯誤的函數名 handleFunnel"
  PASSED_COUNT=$((PASSED_COUNT + 1))
fi

echo ""

# ============================================================================
# Step 8: 命令路由測試
# ============================================================================
echo -e "${BLUE}🎮 Step 8: 命令路由測試${NC}"
echo "----------------------------------------"

# 檢查關鍵命令是否在路由中註冊
grep -q "/analytics" src/router.ts && check_test "路由包含 /analytics 命令" || check_test "路由包含 /analytics 命令"
grep -q "/ad_performance" src/router.ts && check_test "路由包含 /ad_performance 命令" || check_test "路由包含 /ad_performance 命令"
grep -q "/funnel" src/router.ts && check_test "路由包含 /funnel 命令" || check_test "路由包含 /funnel 命令"
grep -q "handleAnalytics" src/router.ts && check_test "路由導入 handleAnalytics" || check_test "路由導入 handleAnalytics"

echo ""

# ============================================================================
# Step 8: API 端點測試
# ============================================================================
echo -e "${BLUE}🔌 Step 8: API 端點測試${NC}"
echo "----------------------------------------"

# 測試廣告完成 API（預期失敗，但不應該 500 錯誤）
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$WORKER_URL/api/ad/complete?user=test&token=test&provider=test")
if [ "$HTTP_CODE" == "200" ] || [ "$HTTP_CODE" == "400" ]; then
  echo -e "${GREEN}✓${NC} 廣告完成 API 可訪問（HTTP $HTTP_CODE）"
  PASSED_COUNT=$((PASSED_COUNT + 1))
else
  echo -e "${RED}✗${NC} 廣告完成 API 錯誤（HTTP $HTTP_CODE）"
  FAILED_COUNT=$((FAILED_COUNT + 1))
fi

# 測試廣告錯誤 API
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$WORKER_URL/api/ad/error?user=test&provider=test&error=test")
if [ "$HTTP_CODE" == "200" ] || [ "$HTTP_CODE" == "400" ]; then
  echo -e "${GREEN}✓${NC} 廣告錯誤 API 可訪問（HTTP $HTTP_CODE）"
  PASSED_COUNT=$((PASSED_COUNT + 1))
else
  echo -e "${RED}✗${NC} 廣告錯誤 API 錯誤（HTTP $HTTP_CODE）"
  FAILED_COUNT=$((FAILED_COUNT + 1))
fi

echo ""

# ============================================================================
# 總結
# ============================================================================
echo "========================================"
echo -e "${BLUE}📊 測試結果總結${NC}"
echo "========================================"
echo -e "${GREEN}通過: ${PASSED_COUNT}${NC}"
echo -e "${RED}失敗: ${FAILED_COUNT}${NC}"
echo ""

TOTAL_COUNT=$((PASSED_COUNT + FAILED_COUNT))
PASS_RATE=$((PASSED_COUNT * 100 / TOTAL_COUNT))

if [ $FAILED_COUNT -eq 0 ]; then
  echo -e "${GREEN}✅ 所有測試通過！（${PASSED_COUNT}/${TOTAL_COUNT}, ${PASS_RATE}%）${NC}\n"
  echo "🎉 Staging 環境已準備就緒！"
  echo ""
  echo "下一步："
  echo "1. 在 Telegram 中測試 Bot: /start"
  echo "2. 測試廣告功能"
  echo "3. 測試管理員命令"
else
  echo -e "${RED}❌ 存在失敗的測試（${PASS_RATE}% 通過率）${NC}"
  echo ""
  echo "請檢查失敗的項目並修復。"
fi

# 返回失敗數量作為退出碼
exit $FAILED_COUNT

