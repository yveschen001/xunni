/**
 * 对比 CSV 和代码使用情况，找出未使用的 keys
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { parse } from 'csv-parse/sync';

interface CSVRow {
  key: string;
  'zh-TW': string;
  [language: string]: string;
}

interface UnusedKeyReport {
  key: string;
  translation: string;
  reason: 'not_used' | 'duplicate_unused';
  duplicateOf?: string;
}

function main() {
  console.log('🔍 对比 CSV 和代码使用情况...\n');
  
  // 读取使用报告
  const usageReportPath = join(process.cwd(), 'i18n_usage_report.json');
  let usedKeys: Set<string>;
  
  try {
    const usageReport = JSON.parse(readFileSync(usageReportPath, 'utf-8'));
    usedKeys = new Set(usageReport.map((r: { key: string }) => r.key));
    console.log(`✅ 已读取使用报告: ${usedKeys.size} 个 keys 在代码中使用\n`);
  } catch (error) {
    console.error('❌ 找不到使用报告，请先运行: pnpm tsx scripts/scan-i18n-usage.ts');
    process.exit(1);
  }
  
  // 读取 CSV
  const csvPath = join(process.cwd(), 'i18n_for_translation.csv');
  const csvContent = readFileSync(csvPath, 'utf-8');
  
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
    relax_column_count: true,
  }) as CSVRow[];
  
  console.log(`✅ 已读取 CSV: ${records.length} 个 keys\n`);
  
  // 找出未使用的 keys
  const unusedKeys: UnusedKeyReport[] = [];
  const translationToKeys = new Map<string, string[]>();
  
  // 先建立翻译值到 keys 的映射（用于找出重复）
  records.forEach(r => {
    const zhTW = (r['zh-TW'] || '').trim();
    if (zhTW.length > 0 && zhTW.length <= 50) { // 只检查较短的翻译
      if (!translationToKeys.has(zhTW)) {
        translationToKeys.set(zhTW, []);
      }
      translationToKeys.get(zhTW)!.push(r.key);
    }
  });
  
  // 检查每个 key
  records.forEach(r => {
    if (!usedKeys.has(r.key)) {
      const zhTW = (r['zh-TW'] || '').trim();
      const duplicates = translationToKeys.get(zhTW) || [];
      
      // 检查是否有其他 keys 使用相同的翻译且正在使用
      const hasUsedDuplicate = duplicates.some(k => k !== r.key && usedKeys.has(k));
      
      if (hasUsedDuplicate) {
        // 这是一个未使用的重复 key
        const usedDuplicate = duplicates.find(k => k !== r.key && usedKeys.has(k));
        unusedKeys.push({
          key: r.key,
          translation: zhTW,
          reason: 'duplicate_unused',
          duplicateOf: usedDuplicate,
        });
      } else if (duplicates.length > 1) {
        // 有重复但都不在使用中（可能是旧的 keys）
        unusedKeys.push({
          key: r.key,
          translation: zhTW,
          reason: 'duplicate_unused',
        });
      } else {
        // 完全未使用
        unusedKeys.push({
          key: r.key,
          translation: zhTW,
          reason: 'not_used',
        });
      }
    }
  });
  
  // 写入报告
  const outputPath = join(process.cwd(), 'unused_keys_report.json');
  writeFileSync(outputPath, JSON.stringify(unusedKeys, null, 2), 'utf-8');
  
  console.log(`✅ 分析完成！`);
  console.log(`   - 未使用的 keys: ${unusedKeys.length}`);
  console.log(`   - 未使用的重复 keys: ${unusedKeys.filter(k => k.reason === 'duplicate_unused').length}`);
  console.log(`   - 完全未使用的 keys: ${unusedKeys.filter(k => k.reason === 'not_used').length}`);
  console.log(`   - 报告已保存: ${outputPath}\n`);
  
  // 显示一些示例
  console.log('📋 未使用的重复 keys 示例 (Top 20):');
  unusedKeys
    .filter(k => k.reason === 'duplicate_unused')
    .slice(0, 20)
    .forEach(k => {
      console.log(`   - ${k.key}: "${k.translation.substring(0, 30)}..."`);
      if (k.duplicateOf) {
        console.log(`     重复于: ${k.duplicateOf}`);
      }
    });
}

main().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});

