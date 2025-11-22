/**
 * Compare Extraction vs Actual Code
 * 对比提取结果和实际代码
 */

import * as fs from 'fs';

const extracted = JSON.parse(fs.readFileSync('i18n_complete_final.json', 'utf-8'));
const found = JSON.parse(fs.readFileSync('hardcoded_chinese_check.json', 'utf-8'));

console.log('🔍 对比提取结果和实际代码...\n');

console.log(`📊 提取结果:`);
console.log(`   - 提取的内容: ${extracted.meta.totalContent} 个`);
console.log(`   - 扫描的文件: ${extracted.meta.totalFiles} 个\n`);

console.log(`📊 实际代码检查:`);
console.log(`   - 发现的硬编码: ${found.total} 处`);
console.log(`   - 涉及的文件: ${found.files} 个\n`);

// 分析差异
const extractedTexts = new Set(extracted.content.map((c: any) => c.text.trim()));
const foundTexts = found.found.map((f: any) => f.text.trim());

console.log(`📊 差异分析:\n`);

// 检查提取的内容是否在实际代码中
let extractedButNotInCode = 0;
let inCodeButNotExtracted = 0;

for (const text of extractedTexts) {
  if (!foundTexts.some((f: string) => f.includes(text) || text.includes(f))) {
    extractedButNotInCode++;
  }
}

for (const text of foundTexts) {
  if (!Array.from(extractedTexts).some((e: string) => e.includes(text) || text.includes(e))) {
    inCodeButNotExtracted++;
  }
}

console.log(`   - 提取但代码中找不到: ${extractedButNotInCode} 个`);
console.log(`   - 代码中但未提取: ${inCodeButNotExtracted} 个\n`);

console.log('⚠️  结论:');
console.log('   提取的内容并没有应用到代码中！');
console.log('   代码仍然是纯中文版本，硬编码中文都还在。');
console.log('\n✅ 这是正常的，因为我们只做了提取，还没有应用替换。');
