/**
 * Analyze Extraction Gaps
 * 分析提取遗漏
 */

import * as fs from 'fs';

const extracted = JSON.parse(fs.readFileSync('i18n_complete_final.json', 'utf-8'));
const found = JSON.parse(fs.readFileSync('hardcoded_chinese_check.json', 'utf-8'));

console.log('🔍 分析提取遗漏...\n');

// 提取的文本集合（标准化）
const extractedSet = new Set(
  extracted.content.map((c: any) => c.text.trim().replace(/\s+/g, ' '))
);

// 代码中发现的文本
const foundTexts = found.found.map((f: any) => f.text.trim().replace(/\s+/g, ' '));

// 找出未提取的
const notExtracted: typeof found.found = [];

for (const item of found.found) {
  const text = item.text.trim().replace(/\s+/g, ' ');
  
  // 检查是否在提取结果中
  let foundInExtracted = false;
  
  for (const extracted of extractedSet) {
    // 精确匹配
    if (extracted === text) {
      foundInExtracted = true;
      break;
    }
    // 包含关系
    if (extracted.includes(text) || text.includes(extracted)) {
      // 如果差异很小，认为是同一个
      const diff = Math.abs(extracted.length - text.length);
      if (diff < 10 || (diff / Math.max(extracted.length, text.length)) < 0.2) {
        foundInExtracted = true;
        break;
      }
    }
  }
  
  if (!foundInExtracted) {
    notExtracted.push(item);
  }
}

console.log(`📊 分析结果:\n`);
console.log(`   - 提取的内容: ${extracted.content.length} 个`);
console.log(`   - 代码中的硬编码: ${found.found.length} 处`);
console.log(`   - 未提取的内容: ${notExtracted.length} 处\n`);

if (notExtracted.length > 0) {
  console.log('⚠️  未提取的内容示例（前 20 个）:\n');
  
  // 按文件分组
  const byFile = new Map<string, typeof notExtracted>();
  for (const item of notExtracted) {
    const list = byFile.get(item.file) || [];
    list.push(item);
    byFile.set(item.file, list);
  }
  
  let count = 0;
  for (const [file, items] of Array.from(byFile.entries())) {
    if (count >= 20) break;
    console.log(`📄 ${file} (${items.length} 处)`);
    for (const item of items.slice(0, 3)) {
      console.log(`   Line ${item.line}: ${item.text.substring(0, 60)}...`);
      count++;
      if (count >= 20) break;
    }
    console.log();
  }
  
  // 保存未提取的内容
  fs.writeFileSync(
    'not_extracted_strings.json',
    JSON.stringify({ notExtracted, total: notExtracted.length }, null, 2),
    'utf-8'
  );
  
  console.log(`\n📄 详细报告: not_extracted_strings.json`);
  console.log(`\n❌ 结论: 提取不完整！还有 ${notExtracted.length} 处未提取。`);
} else {
  console.log('✅ 所有内容都已提取！');
  console.log('   代码中的硬编码是因为还没有应用替换。');
}
