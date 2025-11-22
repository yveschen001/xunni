/**
 * Generate Translation CSV
 * 生成翻译 CSV（简化版）
 */

import * as fs from 'fs';

interface KeyMapping {
  original: string;
  key: string;
  category: string;
  confidence: number;
  file: string;
  line: number;
}

const mappings: KeyMapping[] = JSON.parse(
  fs.readFileSync('i18n_keys_mapping_fixed.json', 'utf-8')
);

console.log('📝 生成翻译 CSV...\n');

// CSV 表头
const languages = ['zh-TW', 'zh-CN', 'en', 'ja', 'ko', 'th', 'vi', 'id', 'ms', 'tl', 'es', 'pt', 'fr', 'de', 'it', 'ru', 'ar', 'hi', 'bn', 'tr', 'pl', 'uk', 'nl', 'sv', 'no', 'da', 'fi', 'cs', 'el', 'he', 'fa', 'ur', 'sw', 'ro'];
const csvHeader = `key,${languages.join(',')}`;
const csvRows = [csvHeader];

// 生成 CSV 行
for (const mapping of mappings) {
  const key = mapping.key;
  const text = mapping.original
    .replace(/"/g, '""') // 转义引号
    .replace(/\n/g, '\\n'); // 转义换行
  
  // zh-TW 列填充原文，其他列留空
  const row = [
    `"${key}"`,
    `"${text}"`,
    ...Array(languages.length - 1).fill('""')
  ].join(',');
  
  csvRows.push(row);
}

const csvContent = csvRows.join('\n');
fs.writeFileSync('i18n_for_translation.csv', csvContent, 'utf-8');

console.log('✅ CSV 生成完成！');
console.log(`\n📊 统计:`);
console.log(`   - 总 keys: ${mappings.length}`);
console.log(`   - 语言数: ${languages.length}`);
console.log(`\n📄 输出文件:`);
console.log(`   - i18n_for_translation.csv`);
console.log(`\n💡 下一步:`);
console.log(`   1. 将 CSV 发送给翻译团队`);
console.log(`   2. 或使用 AI 翻译服务批量翻译`);
console.log(`   3. 翻译完成后导入回系统`);

