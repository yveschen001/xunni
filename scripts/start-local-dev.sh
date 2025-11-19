#!/bin/bash

###############################################################################
# XunNi Bot - Local Development Starter
# 
# This script starts the bot in local development mode with polling.
# 
# Usage:
#   chmod +x scripts/start-local-dev.sh
#   ./scripts/start-local-dev.sh
###############################################################################

set -e

echo "╔═══════════════════════════════════════════════════════╗"
echo "║  🚀 Starting XunNi Bot Local Development             ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""

# Check if .dev.vars exists
if [ ! -f .dev.vars ]; then
  echo "❌ Error: .dev.vars file not found"
  echo "💡 Please create .dev.vars with your configuration"
  exit 1
fi

# Check if node_modules exists
if [ ! -d node_modules ]; then
  echo "📦 Installing dependencies..."
  pnpm install
fi

# Load environment variables
export $(cat .dev.vars | grep -v '^#' | xargs)

echo "✅ Environment variables loaded"
echo "🔑 Bot Token: ${TELEGRAM_BOT_TOKEN:0:20}..."
echo ""

# Start Wrangler dev in the background
echo "🔧 Starting Wrangler (local D1 database)..."
pnpm wrangler dev --local --persist &
WRANGLER_PID=$!

# Wait for Wrangler to start
echo "⏳ Waiting for Wrangler to initialize..."
sleep 3

# Trap to kill Wrangler on exit
trap "echo ''; echo '👋 Shutting down...'; kill $WRANGLER_PID 2>/dev/null; exit" INT TERM

# Start polling
echo ""
echo "🤖 Starting bot in polling mode..."
echo ""
pnpm tsx scripts/dev-polling.ts

# Cleanup
kill $WRANGLER_PID 2>/dev/null

