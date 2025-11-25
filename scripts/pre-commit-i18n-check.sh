#!/bin/bash

# Pre-Commit i18n Check Script
# 提交前 i18n 檢查腳本
# 
# 用途：確保 i18n 變更已同步到所有語言
# 使用：在 git commit 前自動執行（可選，或手動執行）

set -e

echo "🔍 檢查 i18n 同步狀態..."
echo "================================================"

# 檢查是否有 i18n 相關變更
I18N_CHANGES=$(git diff --cached --name-only | grep -E "src/i18n/locales/(zh-TW|zh-CN|en)\.ts" || true)

if [ -z "$I18N_CHANGES" ]; then
  echo "✅ 沒有 i18n 相關變更，跳過檢查"
  exit 0
fi

echo "📋 發現 i18n 相關變更："
echo "$I18N_CHANGES"
echo ""

# 檢查是否有新增或修改的 key
echo "🔍 檢查是否需要同步..."
MISSING_KEYS=$(pnpm i18n:check 2>&1 | grep -E "Missing keys: [1-9]" || true)

if [ -n "$MISSING_KEYS" ]; then
  echo ""
  echo "⚠️  發現缺失的 i18n keys！"
  echo ""
  echo "請執行以下命令同步："
  echo "  1. pnpm i18n:sync           # 同步缺失的 key"
  echo "  2. pnpm i18n:fix-templates  # 修復模板字符串問題"
  echo "  3. pnpm i18n:check          # 再次檢查確認"
  echo ""
  echo "然後重新提交："
  echo "  git add src/i18n/locales/"
  echo "  git commit"
  echo ""
  
  read -p "❓ 是否現在執行同步？(y/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "🔄 執行同步..."
    pnpm i18n:sync
    pnpm i18n:fix-templates
    echo ""
    echo "✅ 同步完成！請檢查變更並重新提交："
    echo "  git add src/i18n/locales/"
    echo "  git commit"
    exit 0
  else
    echo ""
    echo "⚠️  請記住手動執行同步後再提交！"
    exit 0  # 不阻止提交，但提醒
  fi
else
  echo "✅ i18n 同步狀態正常"
fi

