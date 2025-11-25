/**
 * 修复 CSV 中缺失 key 的行
 * 检查并修复：
 * 1. key 为空的行
 * 2. key 包含中文的行
 * 3. 根据 zh-TW 内容推断正确的 key
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

// 从 zh-TW.ts 读取所有 keys 和翻译的映射
function loadZhTWTranslations(): Map<string, string> {
  const zhTWPath = join(process.cwd(), 'src', 'i18n', 'locales', 'zh-TW.ts');
  const content = readFileSync(zhTWPath, 'utf-8');
  const map = new Map<string, string>();
  
  // 简单的正则匹配来提取 key-value 对
  // 匹配模式: key: `value` 或 'key': `value`
  const pattern = /(['"]?)([\w\.]+)\1:\s*`([^`]+)`/g;
  let match;
  
  while ((match = pattern.exec(content)) !== null) {
    const key = match[2];
    const value = match[3].replace(/\\n/g, '\n').replace(/\\`/g, '`');
    map.set(value.trim(), key);
  }
  
  return map;
}

// 根据翻译内容推断 key
function inferKey(zhTW: string, translationMap: Map<string, string>): string | null {
  // 直接匹配
  if (translationMap.has(zhTW.trim())) {
    return translationMap.get(zhTW.trim())!;
  }
  
  // 尝试去除一些常见的前缀/后缀
  const variations = [
    zhTW.trim(),
    zhTW.trim().replace(/^❌\s*/, '').replace(/^⚠️\s*/, '').replace(/^✅\s*/, ''),
    zhTW.trim().replace(/\n+$/, ''),
  ];
  
  for (const variant of variations) {
    if (translationMap.has(variant)) {
      return translationMap.get(variant)!;
    }
  }
  
  return null;
}

function main() {
  console.log('🔧 修复 CSV 中缺失 key 的行...\n');
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

  // 加载 zh-TW 翻译映射
  console.log('📖 加载 zh-TW.ts 翻译映射...');
  const translationMap = loadZhTWTranslations();
  console.log(`   ✅ 加载 ${translationMap.size} 个翻译映射\n`);

  // 检查问题
  const issues: Array<{ row: number; key: string; zhTW: string; issue: string; fixedKey?: string }> = [];
  
  records.forEach((record, index) => {
    const rowNum = index + 2; // +2 因为 header 和 0-based index
    const key = (record.key || '').trim();
    const zhTW = (record['zh-TW'] || '').trim();
    
    // 检查 key 是否为空
    if (!key && zhTW) {
      const inferredKey = inferKey(zhTW, translationMap);
      if (inferredKey) {
        issues.push({
          row: rowNum,
          key: '',
          zhTW: zhTW.substring(0, 50),
          issue: 'key 为空',
          fixedKey: inferredKey,
        });
        record.key = inferredKey;
      } else {
        issues.push({
          row: rowNum,
          key: '',
          zhTW: zhTW.substring(0, 50),
          issue: 'key 为空，且无法推断',
        });
      }
    }
    // 检查 key 是否包含中文
    else if (key && /[\u4e00-\u9fff]/.test(key)) {
      const inferredKey = inferKey(zhTW, translationMap);
      if (inferredKey) {
        issues.push({
          row: rowNum,
          key: key.substring(0, 50),
          zhTW: zhTW.substring(0, 50),
          issue: 'key 包含中文',
          fixedKey: inferredKey,
        });
        record.key = inferredKey;
      } else {
        issues.push({
          row: rowNum,
          key: key.substring(0, 50),
          zhTW: zhTW.substring(0, 50),
          issue: 'key 包含中文，且无法推断',
        });
      }
    }
  });

  if (issues.length === 0) {
    console.log('✅ 没有发现问题！\n');
    return;
  }

  console.log(`⚠️  发现 ${issues.length} 个问题:\n`);
  
  const fixable = issues.filter(i => i.fixedKey);
  const unfixable = issues.filter(i => !i.fixedKey);
  
  if (fixable.length > 0) {
    console.log(`✅ 可以自动修复: ${fixable.length} 个\n`);
    fixable.slice(0, 10).forEach(issue => {
      console.log(`   行 ${issue.row}: ${issue.issue}`);
      console.log(`     原文: "${issue.zhTW}"`);
      console.log(`     修复为: "${issue.fixedKey}"`);
      console.log();
    });
    if (fixable.length > 10) {
      console.log(`   ... 还有 ${fixable.length - 10} 个可以修复\n`);
    }
  }
  
  if (unfixable.length > 0) {
    console.log(`❌ 无法自动修复: ${unfixable.length} 个\n`);
    unfixable.slice(0, 10).forEach(issue => {
      console.log(`   行 ${issue.row}: ${issue.issue}`);
      console.log(`     key: "${issue.key}"`);
      console.log(`     zh-TW: "${issue.zhTW}"`);
      console.log();
    });
    if (unfixable.length > 10) {
      console.log(`   ... 还有 ${unfixable.length - 10} 个无法修复\n`);
    }
  }

  // 如果有可修复的问题，询问是否修复
  if (fixable.length > 0) {
    console.log('='.repeat(80));
    console.log('💾 创建备份...');
    const backupPath = `${csvPath}.backup-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)}`;
    writeFileSync(backupPath, csvContent, 'utf-8');
    console.log(`   ✅ 备份已创建: ${backupPath}\n`);

    console.log('📝 写入修复后的 CSV...');
    const csvOutput = stringify(records, {
      header: true,
      columns: ['key', ...ALL_LANGUAGES],
      quoted: true,
      quoted_empty: false,
    });
    
    writeFileSync(csvPath, csvOutput, 'utf-8');
    console.log(`   ✅ CSV 已修复: ${csvPath}\n`);
    console.log(`✅ 已修复 ${fixable.length} 个问题！\n`);
  } else {
    console.log('\n⚠️  没有可以自动修复的问题，请手动检查。\n');
  }
}

main().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});

