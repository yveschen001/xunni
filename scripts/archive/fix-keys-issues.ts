/**
 * Fix Keys Issues
 * 修复 keys 的问题
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
  fs.readFileSync('i18n_keys_mapping.json', 'utf-8')
);

console.log('🔧 修复 keys 问题...\n');
console.log(`📊 原始: ${mappings.length} 个\n`);

// 1. 移除 SQL 查询
const filtered = mappings.filter(m => {
  const text = m.original.toUpperCase();
  const isSQL = 
    text.includes('SELECT ') ||
    text.includes('INSERT INTO') ||
    text.includes('UPDATE ') ||
    text.includes('DELETE FROM') ||
    text.includes('CREATE TABLE') ||
    text.includes('ALTER TABLE');
  
  if (isSQL) {
    console.log(`❌ 移除 SQL: ${m.key} (${m.file}:${m.line})`);
  }
  
  return !isSQL;
});

console.log(`\n✅ 移除了 ${mappings.length - filtered.length} 个 SQL 查询\n`);

// 2. 修复重复的 keys
const keyCount = new Map<string, number>();
const fixed: KeyMapping[] = [];

for (const mapping of filtered) {
  let key = mapping.key;
  const count = keyCount.get(key) || 0;
  
  if (count > 0) {
    // 添加序号
    key = `${key}${count + 1}`;
  }
  
  keyCount.set(mapping.key, count + 1);
  
  fixed.push({
    ...mapping,
    key,
  });
}

console.log(`✅ 修复了重复 keys\n`);

// 3. 统计
console.log(`📊 最终统计:`);
console.log(`   - 总 keys: ${fixed.length}`);
console.log(`   - 唯一 keys: ${new Set(fixed.map(m => m.key)).size}`);

// 保存
fs.writeFileSync(
  'i18n_keys_mapping_fixed.json',
  JSON.stringify(fixed, null, 2),
  'utf-8'
);

console.log(`\n📄 输出文件: i18n_keys_mapping_fixed.json`);
console.log(`\n✅ 修复完成！`);

