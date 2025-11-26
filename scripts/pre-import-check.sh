#!/bin/bash
# 导入前检查脚本
# 在运行 i18n-import-from-csv-v2.ts 前自动运行此脚本

set -e

echo "🛡️  导入前保护检查..."
echo ""

# 检查关键 key
pnpm tsx scripts/protect-csv-keys.ts

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ 保护检查通过，可以继续导入"
  exit 0
else
  echo ""
  echo "❌ 保护检查失败！请先修复缺失的关键 key"
  exit 1
fi

