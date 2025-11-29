#!/bin/bash

echo "🚀 Running Pre-Push Checks..."

# 1. Local Simulation (Admin role covers most features including Ads/Tasks wizard)
echo "🧪 Running Local Simulation Test (Admin Role)..."
./scripts/run-local-sim.sh admin
if [ $? -ne 0 ]; then
  echo "❌ Local Simulation Failed! Push aborted."
  exit 1
fi

# 2. Lint
echo "🧹 Running Lint..."
pnpm lint
if [ $? -ne 0 ]; then
  echo "❌ Lint Failed! Push aborted."
  exit 1
fi

# 3. Type Check (Optional but recommended)
# echo "TypeScript Check..."
# pnpm typecheck
# if [ $? -ne 0 ]; then
#   echo "❌ Type Check Failed!"
#   exit 1
# fi

echo "✅ All Checks Passed! Ready to push."
exit 0

