#!/bin/bash
# 检查smoke test进度

LOG_FILE="/tmp/smoke_test_full.log"

if [ -f "$LOG_FILE" ]; then
    echo "📊 Smoke Test 进度检查"
    echo "===================="
    echo ""
    echo "📄 日志文件: $LOG_FILE"
    echo "📏 文件大小: $(wc -l < "$LOG_FILE") 行"
    echo "🕐 最后更新: $(stat -f "%Sm" "$LOG_FILE" 2>/dev/null || stat -c "%y" "$LOG_FILE" 2>/dev/null || echo "未知")"
    echo ""
    echo "📈 当前进度:"
    echo "------------"
    
    # 统计完成的套件
    COMPLETED=$(grep -c "✅.*completed" "$LOG_FILE" 2>/dev/null || echo "0")
    FAILED=$(grep -c "❌.*failed" "$LOG_FILE" 2>/dev/null || echo "0")
    SKIPPED=$(grep -c "⏭️.*skipped" "$LOG_FILE" 2>/dev/null || echo "0")
    RUNNING=$(grep -c "⏳ Running:" "$LOG_FILE" 2>/dev/null || echo "0")
    
    echo "✅ 已完成: $COMPLETED 个套件"
    echo "❌ 失败: $FAILED 个套件"
    echo "⏭️  跳过: $SKIPPED 个套件"
    echo "⏳ 运行中: $RUNNING 个套件"
    echo ""
    
    echo "📋 最后10行输出:"
    echo "----------------"
    tail -10 "$LOG_FILE"
    echo ""
    
    # 检查是否完成
    if grep -q "Test Summary" "$LOG_FILE" 2>/dev/null; then
        echo "✅ 测试已完成！"
        echo ""
        echo "📊 完整结果:"
        tail -50 "$LOG_FILE" | grep -A 50 "Test Summary"
    else
        echo "⏳ 测试仍在运行中..."
        echo ""
        echo "💡 提示: 运行 'tail -f $LOG_FILE' 可以实时查看进度"
    fi
else
    echo "⚠️  测试日志文件不存在"
    echo "   可能测试还未开始或已结束"
fi
