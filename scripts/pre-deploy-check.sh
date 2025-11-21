#!/bin/bash

# Pre-Deployment Check Script
# 部署前強制檢查腳本
# 
# 用途：確保所有必要步驟都已完成，防止部署錯誤
# 使用：./scripts/pre-deploy-check.sh staging|production

set -e

ENV=$1

if [ -z "$ENV" ]; then
  echo "❌ 錯誤：請指定環境 (staging 或 production)"
  echo "使用方式：./scripts/pre-deploy-check.sh staging"
  exit 1
fi

if [ "$ENV" != "staging" ] && [ "$ENV" != "production" ]; then
  echo "❌ 錯誤：環境必須是 staging 或 production"
  exit 1
fi

echo "🔍 開始部署前檢查 - 環境: $ENV"
echo "================================================"

# 檢查 1: 是否有未執行的 migration
echo ""
echo "📋 檢查 1/6: 檢查是否有未執行的 migration..."

MIGRATION_DIR="src/db/migrations"
LATEST_MIGRATION=$(ls -1 $MIGRATION_DIR/*.sql 2>/dev/null | tail -1)

if [ -z "$LATEST_MIGRATION" ]; then
  echo "✅ 沒有 migration 文件"
else
  MIGRATION_NAME=$(basename "$LATEST_MIGRATION")
  echo "📄 最新 migration: $MIGRATION_NAME"
  
  read -p "❓ 這個 migration 是否已在 $ENV 遠端資料庫執行？(y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "❌ Migration 尚未執行！"
    echo ""
    echo "請先執行："
    echo "  npx wrangler d1 execute DB --env=$ENV --remote --file=$LATEST_MIGRATION"
    echo ""
    exit 1
  fi
  echo "✅ Migration 已確認執行"
fi

# 檢查 2: Lint
echo ""
echo "📋 檢查 2/6: 執行 Lint..."
if pnpm lint > /dev/null 2>&1; then
  echo "✅ Lint 通過"
else
  echo "❌ Lint 失敗，請修復後再部署"
  pnpm lint
  exit 1
fi

# 檢查 3: 測試
echo ""
echo "📋 檢查 3/6: 執行測試..."
read -p "❓ 是否要執行單元測試？(建議執行) (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  if pnpm test > /dev/null 2>&1; then
    echo "✅ 測試通過"
  else
    echo "❌ 測試失敗，請修復後再部署"
    pnpm test
    exit 1
  fi
else
  echo "⚠️  跳過測試（不建議）"
fi

# 檢查 4: 確認變更內容
echo ""
echo "📋 檢查 4/6: 確認變更內容..."
echo ""
echo "本次變更的文件："
git diff --name-only HEAD~1 HEAD | head -20
echo ""
read -p "❓ 您是否已檢查所有變更內容？(y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "❌ 請先檢查變更內容"
  exit 1
fi
echo "✅ 變更內容已確認"

# 檢查 5: 功能測試確認
echo ""
echo "📋 檢查 5/6: 功能測試確認..."
echo ""
echo "⚠️  重要：您必須實際測試過以下功能："
echo ""
echo "如果修改了以下功能，必須實際測試："
echo "  □ 註冊流程 (/start)"
echo "  □ 丟瓶子 (/throw)"
echo "  □ 撿瓶子 (/catch)"
echo "  □ 查看對話 (/chats)"
echo "  □ 查看資料卡（對話中）"
echo "  □ 看廣告 (watch_ad)"
echo "  □ VIP 功能"
echo "  □ 其他修改的功能"
echo ""
read -p "❓ 您是否已在 $ENV 環境實際測試過所有修改的功能？(y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo ""
  echo "❌ 請先實際測試功能！"
  echo ""
  echo "測試步驟："
  echo "  1. 部署到 $ENV: pnpm deploy:$ENV"
  echo "  2. 打開 Telegram Bot"
  echo "  3. 實際點擊按鈕、執行指令"
  echo "  4. 查看 Cloudflare Logs 確認無錯誤"
  echo "  5. 確認功能正常後，再次執行此腳本"
  echo ""
  exit 1
fi
echo "✅ 功能測試已完成"

# 檢查 6: Cloudflare Logs 確認
echo ""
echo "📋 檢查 6/6: Cloudflare Logs 確認..."
echo ""
read -p "❓ 您是否已查看 Cloudflare Logs 確認無錯誤？(y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo ""
  echo "❌ 請先查看 Cloudflare Logs！"
  echo ""
  echo "查看方式："
  echo "  https://dash.cloudflare.com/[account]/workers/services/view/xunni-bot-$ENV/logs/live"
  echo ""
  exit 1
fi
echo "✅ Logs 已確認無錯誤"

# 所有檢查通過
echo ""
echo "================================================"
echo "✅ 所有檢查通過！"
echo ""
echo "現在可以安全部署到 $ENV："
echo "  pnpm deploy:$ENV"
echo ""

