/**
 * Final Verification
 * 最终验证：确认提取内容覆盖所有硬编码
 */

import * as fs from 'fs';

const extracted = JSON.parse(fs.readFileSync('i18n_complete_final.json', 'utf-8'));
const hardcoded = JSON.parse(fs.readFileSync('hardcoded_chinese_check.json', 'utf-8'));

console.log('🔍 最终验证：提取内容 vs 代码硬编码\n');

console.log(`📊 提取的内容: ${extracted.content.length} 个`);
console.log(`📊 代码中的硬编码: ${hardcoded.found.length} 处\n`);

// 标准化文本（用于匹配）
function normalize(text: string): string {
  return text
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '\t');
}

const extractedTexts = new Set(
  extracted.content.map((c: any) => normalize(c.text))
);

// 检查硬编码是否都在提取结果中
let matched = 0;
let notMatched: typeof hardcoded.found = [];

for (const item of hardcoded.found) {
  const text = normalize(item.text);
  
  // 精确匹配
  if (extractedTexts.has(text)) {
    matched++;
    continue;
  }
  
  // 检查是否被包含（长文本可能被拆分）
  let found = false;
  for (const extracted of extractedTexts) {
    if (extracted.includes(text) || text.includes(extracted)) {
      // 如果差异很小，认为是匹配的
      const diff = Math.abs(extracted.length - text.length);
      const ratio = diff / Math.max(extracted.length, text.length);
      if (ratio < 0.3 || diff < 20) {
        matched++;
        found = true;
        break;
      }
    }
  }
  
  if (!found) {
    notMatched.push(item);
  }
}

console.log(`📊 匹配结果:\n`);
console.log(`   ✅ 已匹配: ${matched} 处 (${(matched / hardcoded.found.length * 100).toFixed(1)}%)`);
console.log(`   ❌ 未匹配: ${notMatched.length} 处 (${(notMatched.length / hardcoded.found.length * 100).toFixed(1)}%)\n`);

if (notMatched.length === 0) {
  console.log('🎉 完美！所有硬编码都已提取！\n');
  console.log('✅ 提取完整性: 100%');
  console.log('✅ 可以安全地进行下一步（翻译和应用替换）');
} else {
  console.log(`⚠️  还有 ${notMatched.length} 处未匹配\n`);
  
  // 分析未匹配的原因
  const byReason = new Map<string, number>();
  for (const item of notMatched) {
    const text = item.text;
    let reason = 'unknown';
    
    if (text.length < 3) {
      reason = 'too_short';
    } else if (text.includes('${')) {
      reason = 'template_fragment';
    } else if (text.includes('`')) {
      reason = 'template_string';
    } else {
      reason = 'not_extracted';
    }
    
    byReason.set(reason, (byReason.get(reason) || 0) + 1);
  }
  
  console.log('📊 未匹配原因:');
  for (const [reason, count] of byReason.entries()) {
    console.log(`   - ${reason}: ${count} 处`);
  }
  
  // 显示前 20 个未匹配的
  console.log('\n⚠️  前 20 个未匹配的内容:');
  for (let i = 0; i < Math.min(20, notMatched.length); i++) {
    const item = notMatched[i];
    console.log(`\n${i + 1}. ${item.file}:${item.line}`);
    console.log(`   文本: ${item.text.substring(0, 80)}${item.text.length > 80 ? '...' : ''}`);
  }
}

// 保存报告
fs.writeFileSync(
  'final_verification_report.json',
  JSON.stringify({
    extracted: extracted.content.length,
    hardcoded: hardcoded.found.length,
    matched,
    notMatched: notMatched.length,
    matchRate: (matched / hardcoded.found.length * 100).toFixed(1) + '%',
    notMatchedItems: notMatched.slice(0, 50),
  }, null, 2),
  'utf-8'
);

console.log('\n📄 详细报告: final_verification_report.json');
