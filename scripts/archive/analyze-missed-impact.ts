/**
 * Analyze Impact of Missed Strings
 * 分析遗漏内容对用户体验的影响
 */

import * as fs from 'fs';

const missed = JSON.parse(fs.readFileSync('not_extracted_strings.json', 'utf-8'));

console.log('🔍 分析遗漏内容对用户体验的影响...\n');

// 分类遗漏内容
const categories = {
  critical: [],      // 关键用户可见内容
  important: [],     // 重要但非关键
  minor: [],         // 次要内容
  internal: [],      // 内部/调试内容
};

for (const item of missed.notExtracted) {
  const text = item.text;
  
  // 关键内容：错误消息、成功消息、按钮、主要提示
  if (
    text.startsWith('❌') ||
    text.startsWith('✅') ||
    text.startsWith('⚠️') ||
    text.includes('錯誤') ||
    text.includes('失敗') ||
    text.includes('成功') ||
    text.includes('請') ||
    text.includes('無法') ||
    text.length > 20
  ) {
    categories.critical.push(item);
  }
  // 重要内容：状态显示、选项
  else if (
    text.includes('設定') ||
    text.includes('狀態') ||
    text.includes('選擇') ||
    text.length > 10
  ) {
    categories.important.push(item);
  }
  // 次要内容：短标签、状态值
  else if (
    text === '是' ||
    text === '否' ||
    text === '未設定' ||
    text === '待處理' ||
    text.length <= 5
  ) {
    categories.minor.push(item);
  }
  // 内部内容
  else {
    categories.internal.push(item);
  }
}

console.log('📊 遗漏内容分类:\n');
console.log(`   🔴 关键内容: ${categories.critical.length} 处`);
console.log(`   🟡 重要内容: ${categories.important.length} 处`);
console.log(`   🟢 次要内容: ${categories.minor.length} 处`);
console.log(`   ⚪ 内部内容: ${categories.internal.length} 处\n`);

// 分析影响
console.log('📋 影响分析:\n');

if (categories.critical.length > 0) {
  console.log('🔴 关键内容（会影响用户体验）:');
  console.log('   这些是用户直接看到的重要消息\n');
  
  const byFile = new Map<string, typeof categories.critical>();
  for (const item of categories.critical) {
    const list = byFile.get(item.file) || [];
    list.push(item);
    byFile.set(item.file, list);
  }
  
  for (const [file, items] of Array.from(byFile.entries()).slice(0, 10)) {
    console.log(`   📄 ${file} (${items.length} 处)`);
    for (const item of items.slice(0, 2)) {
      console.log(`      Line ${item.line}: ${item.text.substring(0, 60)}...`);
    }
    if (items.length > 2) {
      console.log(`      ... 还有 ${items.length - 2} 处`);
    }
    console.log();
  }
}

if (categories.important.length > 0) {
  console.log('🟡 重要内容（部分影响用户体验）:');
  console.log('   这些是状态显示、选项等\n');
  
  const examples = categories.important.slice(0, 10);
  for (const item of examples) {
    console.log(`   - ${item.text.substring(0, 50)} (${item.file}:${item.line})`);
  }
  console.log();
}

if (categories.minor.length > 0) {
  console.log('🟢 次要内容（影响较小）:');
  console.log('   这些是短标签、状态值等\n');
  
  const unique = Array.from(new Set(categories.minor.map(i => i.text)));
  console.log(`   示例: ${unique.slice(0, 20).join(', ')}`);
  console.log();
}

// 总结
console.log('📊 总结:\n');
const criticalRate = (categories.critical.length / missed.notExtracted.length * 100).toFixed(1);
const importantRate = (categories.important.length / missed.notExtracted.length * 100).toFixed(1);
const minorRate = ((categories.minor.length + categories.internal.length) / missed.notExtracted.length * 100).toFixed(1);

console.log(`   - 关键遗漏: ${categories.critical.length} 处 (${criticalRate}%)`);
console.log(`   - 重要遗漏: ${categories.important.length} 处 (${importantRate}%)`);
console.log(`   - 次要遗漏: ${categories.minor.length + categories.internal.length} 处 (${minorRate}%)\n`);

if (categories.critical.length > 0) {
  console.log('⚠️  建议: 需要补充提取关键内容，否则会影响用户体验！');
} else if (categories.important.length > 0) {
  console.log('💡 建议: 建议补充提取重要内容，提升用户体验。');
} else {
  console.log('✅ 遗漏内容主要是次要的，影响较小。');
}

// 保存分析结果
fs.writeFileSync(
  'missed_strings_impact_analysis.json',
  JSON.stringify({
    summary: {
      total: missed.notExtracted.length,
      critical: categories.critical.length,
      important: categories.important.length,
      minor: categories.minor.length,
      internal: categories.internal.length,
    },
    critical: categories.critical,
    important: categories.important,
    minor: categories.minor,
    internal: categories.internal,
  }, null, 2),
  'utf-8'
);

console.log('\n📄 详细分析已保存: missed_strings_impact_analysis.json');
