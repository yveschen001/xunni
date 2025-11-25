#!/bin/bash

# Development Workflow - i18n Sync
# 開發工作流 - i18n 同步
# 
# 用途：完成新功能或修復後，自動執行 i18n 同步檢查
# 使用：./scripts/dev-workflow-i18n.sh

set -e

echo "🔄 開發工作流 - i18n 同步檢查"
echo "================================================"
echo ""

# 步驟 1: 檢查當前狀態
echo "📋 步驟 1/4: 檢查 i18n 問題..."
pnpm i18n:check
echo ""

# 步驟 2: 同步缺失的 key
echo "📋 步驟 2/4: 同步缺失的 key..."
read -p "❓ 是否執行同步？(y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  pnpm i18n:sync
  echo ""
else
  echo "⏭️  跳過同步"
  echo ""
fi

# 步驟 3: 修復模板字符串問題
echo "📋 步驟 3/4: 修復模板字符串問題..."
read -p "❓ 是否修復模板字符串問題？(y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  pnpm i18n:fix-templates
  echo ""
else
  echo "⏭️  跳過修復"
  echo ""
fi

# 步驟 4: 最終檢查
echo "📋 步驟 4/4: 最終檢查..."
pnpm i18n:check
echo ""

echo "================================================"
echo "✅ i18n 同步檢查完成！"
echo ""
echo "💡 下一步："
echo "  1. 檢查同步結果"
echo "  2. 翻譯占位符值（使用 CSV 或手動）"
echo "  3. 提交變更：git add src/i18n/locales/ && git commit"
echo ""

