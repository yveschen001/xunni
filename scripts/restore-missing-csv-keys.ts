/**
 * 恢复 CSV 中丢失的 key
 * 从 HEAD 版本恢复所有丢失的 key
 */

import { readFileSync, writeFileSync } from 'fs';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import { execSync } from 'child_process';

console.log('🔍 检查 CSV key 丢失情况...\n');

// 获取 HEAD 版本的 CSV
console.log('📖 读取 HEAD 版本的 CSV...');
const headCsv = execSync('git show HEAD:i18n_for_translation.csv', { encoding: 'utf-8' });
const headRecords = parse(headCsv, {
  columns: true,
  skip_empty_lines: true,
  relax_quotes: true,
  relax_column_count: true,
});

// 获取当前版本的 CSV
console.log('📖 读取当前版本的 CSV...');
const currentCsv = readFileSync('i18n_for_translation.csv', 'utf-8');
const currentRecords = parse(currentCsv, {
  columns: true,
  skip_empty_lines: true,
  relax_quotes: true,
  relax_column_count: true,
});

console.log(`📊 统计：`);
console.log(`   HEAD 版本: ${headRecords.length} keys`);
console.log(`   当前版本: ${currentRecords.length} keys`);
console.log(`   差异: ${headRecords.length - currentRecords.length} keys\n`);

const headKeys = new Set(headRecords.map((r: any) => r.key));
const currentKeys = new Set(currentRecords.map((r: any) => r.key));

const missingInCurrent = [...headKeys].filter(k => !currentKeys.has(k));
const newInCurrent = [...currentKeys].filter(k => !headKeys.has(k));

console.log(`❌ 丢失的 key: ${missingInCurrent.length}`);
console.log(`➕ 新增的 key: ${newInCurrent.length}\n`);

if (missingInCurrent.length === 0) {
  console.log('✅ 没有丢失的 key！');
  process.exit(0);
}

// 创建 key 到记录的映射
const headKeyMap = new Map<string, any>();
headRecords.forEach((r: any) => {
  headKeyMap.set(r.key, r);
});

// 恢复丢失的 key
console.log('🔧 恢复丢失的 key...');
const restoredRecords: any[] = [...currentRecords];

let restoredCount = 0;
for (const key of missingInCurrent) {
  const headRecord = headKeyMap.get(key);
  if (headRecord) {
    restoredRecords.push(headRecord);
    restoredCount++;
  }
}

console.log(`✅ 已恢复 ${restoredCount} 个 key\n`);

// 确保所有字段都存在
const allFieldnames = new Set<string>();
headRecords.forEach((r: any) => {
  Object.keys(r).forEach(k => allFieldnames.add(k));
});
currentRecords.forEach((r: any) => {
  Object.keys(r).forEach(k => allFieldnames.add(k));
});

const fieldnames = Array.from(allFieldnames).sort();

// 确保所有记录都有所有字段
restoredRecords.forEach((r: any) => {
  fieldnames.forEach(f => {
    if (!(f in r)) {
      r[f] = '';
    }
  });
});

// 写回 CSV
console.log('💾 写回 CSV...');
const output = stringify(restoredRecords, {
  header: true,
  columns: fieldnames,
  quoted: true,
  quoted_empty: false,
});

writeFileSync('i18n_for_translation.csv', output, 'utf-8');

console.log(`✅ 恢复完成！`);
console.log(`   恢复前: ${currentRecords.length} keys`);
console.log(`   恢复后: ${restoredRecords.length} keys`);
console.log(`   恢复了: ${restoredCount} keys\n`);

// 验证
const finalCsv = readFileSync('i18n_for_translation.csv', 'utf-8');
const finalRecords = parse(finalCsv, {
  columns: true,
  skip_empty_lines: true,
  relax_quotes: true,
  relax_column_count: true,
});

const finalKeys = new Set(finalRecords.map((r: any) => r.key));
const stillMissing = [...headKeys].filter(k => !finalKeys.has(k));

if (stillMissing.length > 0) {
  console.log(`⚠️  仍有 ${stillMissing.length} 个 key 未恢复:`);
  stillMissing.slice(0, 10).forEach(k => console.log(`   - ${k}`));
  if (stillMissing.length > 10) {
    console.log(`   ... 还有 ${stillMissing.length - 10} 个`);
  }
} else {
  console.log('✅ 所有 key 都已恢复！');
}

