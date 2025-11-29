#!/bin/bash

# Configuration
MOCK_API_PORT=9000
WORKER_PORT=8787
TELEGRAM_API_ROOT="http://127.0.0.1:$MOCK_API_PORT"
TEST_USER_ID="123456789"

# Role selection (user, admin, super_admin)
ROLE=$1
if [ -z "$ROLE" ]; then ROLE="user"; fi

echo "🚀 Starting Local Simulation Environment (Role: $ROLE)..."

# Determine Vars based on Role
VAR_ADMIN_IDS=""
VAR_SUPER_ADMIN_ID=""

if [ "$ROLE" == "admin" ]; then
  VAR_ADMIN_IDS="$TEST_USER_ID"
  echo "   👮 Simulating Admin User ($TEST_USER_ID)"
elif [ "$ROLE" == "super_admin" ]; then
  VAR_SUPER_ADMIN_ID="$TEST_USER_ID"
  echo "   👑 Simulating Super Admin User ($TEST_USER_ID)"
else
  echo "   👤 Simulating Ordinary User"
fi

# 1. Kill any existing processes on these ports (cleanup)
lsof -ti:$WORKER_PORT | xargs kill -9 2>/dev/null
lsof -ti:$MOCK_API_PORT | xargs kill -9 2>/dev/null

# 2. Start Wrangler Dev in background with injected vars
echo "📦 Starting Cloudflare Worker (Local Mode)..."
npx wrangler dev --port $WORKER_PORT \
  --var TELEGRAM_WEBHOOK_SECRET:test-secret \
  --var TELEGRAM_BOT_TOKEN:mock-token \
  --var TELEGRAM_API_ROOT:$TELEGRAM_API_ROOT \
  --var ADMIN_USER_IDS:$VAR_ADMIN_IDS \
  --var SUPER_ADMIN_USER_ID:$VAR_SUPER_ADMIN_ID \
  --var ADMIN_LOG_GROUP_ID:"-999999" \
  > worker.log 2>&1 &
WRANGLER_PID=$!

echo "⏳ Waiting for Worker to initialize (10s)..."
sleep 10

# 3. Run Simulation Test
echo "🧪 Running Simulation Tests..."
npx tsx scripts/local-simulation.ts --role=$ROLE
TEST_EXIT_CODE=$?

# 4. Cleanup
echo "🧹 Cleaning up..."
kill $WRANGLER_PID 2>/dev/null
lsof -ti:$WORKER_PORT | xargs kill -9 2>/dev/null
lsof -ti:$MOCK_API_PORT | xargs kill -9 2>/dev/null

if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo "✅ Local Simulation Passed for $ROLE!"
    exit 0
else
    echo "❌ Local Simulation Failed for $ROLE!"
    exit 1
fi
