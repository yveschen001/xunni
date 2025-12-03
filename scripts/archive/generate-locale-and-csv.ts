/**
 * Generate Locale Files and CSV
 * 生成 locale 文件和翻译 CSV
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

console.log('📝 生成 locale 文件和 CSV...\n');

// 1. 生成 zh-TW locale 文件
console.log('1️⃣ 生成 zh-TW.ts...');

// 按 category 分组
const byCategory = new Map<string, KeyMapping[]>();
for (const mapping of mappings) {
  const list = byCategory.get(mapping.category) || [];
  list.push(mapping);
  byCategory.set(mapping.category, list);
}

// 构建嵌套对象
const translations: any = {};

for (const mapping of mappings) {
  const parts = mapping.key.split('.');
  let current = translations;
  
  for (let i = 0; i < parts.length - 1; i++) {
    if (!current[parts[i]]) {
      current[parts[i]] = {};
    }
    current = current[parts[i]];
  }
  
  current[parts[parts.length - 1]] = mapping.original;
}

// 生成 TypeScript 文件
const localeContent = `import type { Translations } from '../types';

/**
 * zh-TW translations
 * 繁體中文（台灣）
 */
export const translations: Translations = ${JSON.stringify(translations, null, 2)};
`;

fs.writeFileSync('src/i18n/locales/zh-TW-generated.ts', localeContent, 'utf-8');
console.log('   ✓ src/i18n/locales/zh-TW-generated.ts\n');

// 2. 生成翻译 CSV
console.log('2️⃣ 生成翻译 CSV...');

const csvHeader = 'namespace,key,zh-TW,zh-CN,en,ja,ko,th,vi,id,ms,tl,es,pt,fr,de,it,ru,ar,hi,bn,tr,pl,uk,nl,sv,no,da,fi,cs,el,he,fa,ur,sw,ro';
const csvRows = [csvHeader];

for (const mapping of mappings) {
  const parts = mapping.key.split('.');
  const namespace = parts.slice(0, -1).join('.');
  const key = parts[parts.length - 1];
  const text = mapping.original.replace(/"/g, '""'); // 转义引号
  
  const emptyCols = Array(31).fill('""').join(',');
  csvRows.push(`"${namespace}","${key}","${text}",${emptyCols}`);
}

fs.writeFileSync('i18n_for_translation.csv', csvRows.join('\n'), 'utf-8');
console.log('   ✓ i18n_for_translation.csv\n');

// 3. 生成统计报告
console.log('3️⃣ 生成统计报告...');

const report = {
  summary: {
    totalKeys: mappings.length,
    categories: byCategory.size,
    files: new Set(mappings.map(m => m.file)).size,
  },
  byCategory: Array.from(byCategory.entries()).map(([cat, items]) => ({
    category: cat,
    count: items.length,
  })).sort((a, b) => b.count - a.count),
  files: {
    locale: 'src/i18n/locales/zh-TW-generated.ts',
    csv: 'i18n_for_translation.csv',
  },
};

fs.writeFileSync('i18n_generation_report.json', JSON.stringify(report, null, 2), 'utf-8');
console.log('   ✓ i18n_generation_report.json\n');

console.log('✅ 生成完成！');
console.log(`\n📊 统计:`);
console.log(`   - 总 keys: ${mappings.length}`);
console.log(`   - 分类数: ${byCategory.size}`);
console.log(`   - 涉及文件: ${new Set(mappings.map(m => m.file)).size}`);
console.log(`\n📄 输出文件:`);
console.log(`   - src/i18n/locales/zh-TW-generated.ts`);
console.log(`   - i18n_for_translation.csv`);
console.log(`   - i18n_generation_report.json`);

