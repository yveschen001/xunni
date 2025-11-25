/**
 * 清理 CSV 中的无效行
 * 删除：
 * 1. key 为空的行
 * 2. key 包含中文的行
 * 3. zh-TW 为空的行（除非是占位符）
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';

interface CSVRow {
  key: string;
  [language: string]: string;
}

// 34 languages
const ALL_LANGUAGES = [
  'zh-TW', 'zh-CN', 'en', 'ja', 'ko', 'th', 'vi', 'id', 'ms', 'tl',
  'es', 'pt', 'fr', 'de', 'it', 'ru', 'ar', 'hi', 'bn', 'tr',
  'pl', 'uk', 'nl', 'sv', 'no', 'da', 'fi', 'cs', 'el', 'he',
  'fa', 'ur', 'sw', 'ro'
];

function main() {
  console.log('🧹 清理 CSV 中的无效行...\n');
  console.log('='.repeat(80));
  console.log();

  // 读取 CSV
  const csvPath = join(process.cwd(), 'i18n_for_translation.csv');
  const csvContent = readFileSync(csvPath, 'utf-8');
  
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
    relax_column_count: true,
  }) as CSVRow[];

  console.log(`✅ 读取 ${records.length} 个记录\n`);

  // 检查无效行
  const invalidRows: Array<{ row: number; key: string; zhTW: string; reason: string }> = [];
  const validRecords: CSVRow[] = [];
  
  records.forEach((record, index) => {
    const rowNum = index + 2; // +2 因为 header 和 0-based index
    const key = (record.key || '').trim();
    const zhTW = (record['zh-TW'] || '').trim();
    
    let isValid = true;
    let reason = '';
    
    // 检查 1: key 为空
    if (!key) {
      isValid = false;
      reason = 'key 为空';
    }
    // 检查 2: key 包含中文（且不是合法的 key 格式）
    else if (/[\u4e00-\u9fff]/.test(key) && !key.match(/^[\w\.]+$/)) {
      isValid = false;
      reason = 'key 包含中文';
    }
    // 检查 3: zh-TW 为空（且 key 不是占位符）
    else if (!zhTW && !key.startsWith('[') && !key.includes('placeholder')) {
      isValid = false;
      reason = 'zh-TW 为空';
    }
    
    if (!isValid) {
      invalidRows.push({
        row: rowNum,
        key: key || '(空)',
        zhTW: zhTW || '(空)',
        reason,
      });
    } else {
      validRecords.push(record);
    }
  });

  if (invalidRows.length === 0) {
    console.log('✅ 没有发现无效行！\n');
    return;
  }

  console.log(`⚠️  发现 ${invalidRows.length} 个无效行:\n`);
  invalidRows.forEach(invalid => {
    console.log(`   行 ${invalid.row}: ${invalid.reason}`);
    console.log(`     key: "${invalid.key}"`);
    console.log(`     zh-TW: "${invalid.zhTW.substring(0, 50)}"`);
    console.log();
  });

  console.log('='.repeat(80));
  console.log('💾 创建备份...');
  const backupPath = `${csvPath}.backup-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)}`;
  writeFileSync(backupPath, csvContent, 'utf-8');
  console.log(`   ✅ 备份已创建: ${backupPath}\n`);

  console.log('📝 写入清理后的 CSV...');
  const csvOutput = stringify(validRecords, {
    header: true,
    columns: ['key', ...ALL_LANGUAGES],
    quoted: true,
    quoted_empty: false,
  });
  
  writeFileSync(csvPath, csvOutput, 'utf-8');
  console.log(`   ✅ CSV 已清理: ${csvPath}\n`);
  console.log(`✅ 已删除 ${invalidRows.length} 个无效行，保留 ${validRecords.length} 个有效记录！\n`);
}

main().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});

