/**
 * 全面检查所有代码中使用的 i18n key 是否都在 CSV 中
 * 这是关键检查，确保没有功能受影响
 */

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { parse } from 'csv-parse/sync';

// 提取所有代码中使用的 i18n key
function extractI18nKeys(filePath: string): string[] {
  const content = readFileSync(filePath, 'utf-8');
  const keys: string[] = [];
  const pattern = /i18n\.t\(['"]([^'"]+)['"]/g;
  let match;
  while ((match = pattern.exec(content)) !== null) {
    keys.push(match[1]);
  }
  return keys;
}

// 扫描所有 handler 文件
const handlersDir = join(process.cwd(), 'src/telegram/handlers');
const files = readdirSync(handlersDir).filter(f => f.endsWith('.ts'));

const allKeys = new Set<string>();
files.forEach(file => {
  const filePath = join(handlersDir, file);
  const keys = extractI18nKeys(filePath);
  keys.forEach(k => allKeys.add(k));
});

// 读取 CSV
const csvPath = join(process.cwd(), 'i18n_for_translation.csv');
const csvContent = readFileSync(csvPath, 'utf-8');
const records = parse(csvContent, {
  columns: true,
  skip_empty_lines: true,
  relax_quotes: true,
  relax_column_count: true,
});

const csvKeys = new Set(records.map((r: any) => r.key));

// 找出缺失的 key
const missing = [...allKeys].filter(k => !csvKeys.has(k));

console.log('📊 全面功能检查：\n');
console.log('='.repeat(80));
console.log(`   代码中使用的 key 总数: ${allKeys.size}`);
console.log(`   CSV 中的 key 总数: ${csvKeys.size}`);
console.log(`   缺失的 key: ${missing.length}\n`);

if (missing.length > 0) {
  console.log('❌ 发现缺失的 key（可能影响功能）：\n');
  missing.slice(0, 50).forEach(k => console.log(`  - ${k}`));
  if (missing.length > 50) {
    console.log(`  ... 还有 ${missing.length - 50} 个\n`);
  }
  
  // 按命名空间分组
  const byNamespace = new Map<string, string[]>();
  missing.forEach(k => {
    const ns = k.split('.')[0];
    if (!byNamespace.has(ns)) {
      byNamespace.set(ns, []);
    }
    byNamespace.get(ns)!.push(k);
  });
  
  console.log('\n按命名空间分组：');
  byNamespace.forEach((keys, ns) => {
    console.log(`  ${ns}: ${keys.length} 个`);
  });
  
  process.exit(1);
} else {
  console.log('✅ 所有代码中使用的 key 都在 CSV 中！');
  console.log('✅ 没有功能受影响！\n');
  process.exit(0);
}

