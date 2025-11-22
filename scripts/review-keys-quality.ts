/**
 * Review i18n Keys Quality
 * 审核生成的 keys 质量
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

console.log('🔍 审核 i18n keys 质量...\n');

// 1. 检查重复的 keys
const keyCount = new Map<string, KeyMapping[]>();
for (const mapping of mappings) {
  const list = keyCount.get(mapping.key) || [];
  list.push(mapping);
  keyCount.set(mapping.key, list);
}

const duplicates = Array.from(keyCount.entries())
  .filter(([_, list]) => list.length > 1)
  .sort((a, b) => b[1].length - a[1].length);

console.log(`📊 重复的 keys: ${duplicates.length} 个\n`);

if (duplicates.length > 0) {
  console.log('⚠️  前 10 个重复最多的 keys:\n');
  for (let i = 0; i < Math.min(10, duplicates.length); i++) {
    const [key, list] = duplicates[i];
    console.log(`${i + 1}. ${key} (${list.length} 次)`);
    console.log(`   示例: ${list[0].original.substring(0, 60)}...`);
  }
  console.log();
}

// 2. 检查太通用的 keys
const genericKeys = mappings.filter(m => 
  m.key.endsWith('.message') || 
  m.key.endsWith('.text') || 
  m.key.endsWith('.short')
);

console.log(`📊 通用 keys: ${genericKeys.length} 个\n`);

// 3. 检查 SQL 查询（不应该被提取）
const sqlQueries = mappings.filter(m => 
  m.original.includes('SELECT') || 
  m.original.includes('INSERT') || 
  m.original.includes('UPDATE') ||
  m.original.includes('DELETE')
);

console.log(`⚠️  SQL 查询: ${sqlQueries.length} 个（这些不应该被翻译！）\n`);

if (sqlQueries.length > 0) {
  console.log('前 5 个 SQL 查询:\n');
  for (let i = 0; i < Math.min(5, sqlQueries.length); i++) {
    const sql = sqlQueries[i];
    console.log(`${i + 1}. ${sql.key}`);
    console.log(`   ${sql.file}:${sql.line}`);
    console.log(`   ${sql.original.substring(0, 80)}...`);
    console.log();
  }
}

// 4. 生成审核报告
const report = {
  summary: {
    total: mappings.length,
    duplicates: duplicates.length,
    generic: genericKeys.length,
    sqlQueries: sqlQueries.length,
  },
  duplicates: duplicates.slice(0, 50).map(([key, list]) => ({
    key,
    count: list.length,
    examples: list.slice(0, 3).map(m => ({
      text: m.original.substring(0, 100),
      file: m.file,
      line: m.line,
    })),
  })),
  sqlQueries: sqlQueries.map(m => ({
    key: m.key,
    file: m.file,
    line: m.line,
    text: m.original.substring(0, 200),
  })),
  recommendations: [
    {
      issue: '重复的 keys',
      severity: 'high',
      count: duplicates.length,
      action: '需要为每个重复的 key 添加唯一后缀',
    },
    {
      issue: 'SQL 查询被提取',
      severity: 'critical',
      count: sqlQueries.length,
      action: '这些应该从提取结果中移除',
    },
    {
      issue: '通用 keys',
      severity: 'medium',
      count: genericKeys.length,
      action: '建议使用更具描述性的名称',
    },
  ],
};

fs.writeFileSync(
  'i18n_keys_review.json',
  JSON.stringify(report, null, 2),
  'utf-8'
);

console.log('📄 审核报告已生成: i18n_keys_review.json\n');

// 5. 总结
console.log('📊 质量评估:\n');
console.log(`✅ 总 keys: ${mappings.length}`);
console.log(`⚠️  重复 keys: ${duplicates.length} (${(duplicates.length / mappings.length * 100).toFixed(1)}%)`);
console.log(`⚠️  通用 keys: ${genericKeys.length} (${(genericKeys.length / mappings.length * 100).toFixed(1)}%)`);
console.log(`❌ SQL 查询: ${sqlQueries.length} (${(sqlQueries.length / mappings.length * 100).toFixed(1)}%)`);

const qualityScore = 100 - 
  (duplicates.length / mappings.length * 30) -
  (sqlQueries.length / mappings.length * 50) -
  (genericKeys.length / mappings.length * 20);

console.log(`\n🎯 质量评分: ${Math.max(0, qualityScore).toFixed(1)}/100`);

if (sqlQueries.length > 0) {
  console.log('\n❌ 严重问题：发现 SQL 查询被提取！');
  console.log('   这些不应该被翻译，需要从提取结果中移除。');
}

if (duplicates.length > 100) {
  console.log('\n⚠️  警告：重复 keys 过多！');
  console.log('   需要修复重复问题。');
}

