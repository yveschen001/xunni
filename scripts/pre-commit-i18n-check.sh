#!/bin/bash
# Pre-commit hook: 检查 i18n key 使用是否正确
# 这个脚本应该在 git commit 前自动运行

set -e

echo "🛡️  Pre-commit: 检查 i18n key 使用..."
echo ""

# 1. 检查关键 key 是否存在
echo "1️⃣  检查关键 key..."
pnpm tsx scripts/protect-csv-keys.ts
if [ $? -ne 0 ]; then
  echo ""
  echo "❌ 关键 key 检查失败！"
  exit 1
fi

# 2. 检查 key 使用是否正确
echo ""
echo "2️⃣  检查 key 使用是否正确..."
pnpm tsx scripts/verify-i18n-key-usage.ts
if [ $? -ne 0 ]; then
  echo ""
  echo "❌ Key 使用检查失败！"
  exit 1
fi

# 3. 检查所有代码中使用的 key 是否都在 CSV 中
echo ""
echo "3️⃣  检查所有 key 是否都在 CSV 中..."
pnpm tsx scripts/check-all-i18n-keys.ts
if [ $? -ne 0 ]; then
  echo ""
  echo "❌ 有 key 缺失！"
  exit 1
fi

echo ""
echo "✅ 所有检查通过！"
exit 0
