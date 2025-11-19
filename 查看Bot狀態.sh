#!/bin/bash

###############################################################################
# XunNi Bot - 狀態查看腳本
# 
# 這個腳本幫助你查看 Bot 的運行狀態
###############################################################################

echo "╔═══════════════════════════════════════════════════════╗"
echo "║  🤖 XunNi Bot - 狀態查看                              ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""

# 檢查 Bot 是否在運行
echo "📊 檢查 Bot 進程..."
BOT_PROCESSES=$(ps aux | grep "tsx.*dev-polling" | grep -v grep | wc -l | tr -d ' ')

if [ "$BOT_PROCESSES" -gt 0 ]; then
  echo "✅ Bot 正在運行（$BOT_PROCESSES 個進程）"
  echo ""
  echo "進程詳情："
  ps aux | grep "tsx.*dev-polling" | grep -v grep | head -3
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo "💡 現在可以在 Telegram 測試你的 Bot！"
  echo ""
  echo "📱 測試步驟："
  echo "   1. 打開 Telegram"
  echo "   2. 找到你的 Bot"
  echo "   3. 發送消息（例如：/start）"
  echo "   4. 日誌會實時顯示在啟動 Bot 的終端"
  echo ""
  echo "🛑 停止 Bot："
  echo "   pkill -f 'tsx.*dev-polling'"
  echo ""
  echo "📊 查看日誌："
  echo "   如果你用 tee 保存了日誌："
  echo "   tail -f bot-log.txt"
  echo ""
else
  echo "❌ Bot 未運行"
  echo ""
  echo "🚀 啟動 Bot："
  echo "   pnpm dev:polling"
  echo ""
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

