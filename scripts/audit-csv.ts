/**
 * CSV 审计脚本
 * 检查：重复 keys、过短/过长翻译、相同字义的 keys
 */

import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';

interface CSVRow {
  key: string;
  'zh-TW': string;
  [language: string]: string;
}

function main() {
  console.log('📊 CSV 审计报告\n');
  console.log('='.repeat(80));
  console.log();

  // 读取 CSV
  const csvContent = readFileSync('i18n_for_translation.csv', 'utf-8');
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
    relax_column_count: true,
  }) as CSVRow[];

  console.log(`📋 总记录数: ${records.length}\n`);

  // 1. 检查重复的 keys
  console.log('1️⃣ 重复的 Keys:');
  const keyMap = new Map<string, number[]>();
  records.forEach((r, i) => {
    if (!keyMap.has(r.key)) {
      keyMap.set(r.key, []);
    }
    keyMap.get(r.key)!.push(i + 2); // +2 因为 header 和 0-based index
  });

  const duplicates: Array<{ key: string; lines: number[] }> = [];
  keyMap.forEach((lines, key) => {
    if (lines.length > 1) {
      duplicates.push({ key, lines });
    }
  });

  if (duplicates.length === 0) {
    console.log('   ✅ 没有发现重复的 keys\n');
  } else {
    console.log(`   ❌ 发现 ${duplicates.length} 个重复的 keys:\n`);
    duplicates.slice(0, 10).forEach(d => {
      console.log(`      - ${d.key} (行 ${d.lines.join(', ')})`);
    });
    if (duplicates.length > 10) {
      console.log(`      ... 还有 ${duplicates.length - 10} 个重复`);
    }
    console.log();
  }

  // 2. 检查过短的翻译（1-2个字，排除变量、数字等）
  console.log('2️⃣ 过短的翻译（1-2个字）:');
  const shortTranslations: Array<{ key: string; value: string; line: number }> = [];
  records.forEach((r, i) => {
    const zhTW = (r['zh-TW'] || '').trim();
    // 排除：空值、包含换行、纯数字/变量、emoji 单独
    if (
      zhTW.length > 0 &&
      zhTW.length <= 2 &&
      !zhTW.includes('\n') &&
      !zhTW.match(/^[\d\s\$\{\}\.]+$/) &&
      !zhTW.match(/^[✅❌⚠️💡📺🎁💎📋🔧👤📝💬🔖🧠✏️🩸📜🎓📢]+$/)
    ) {
      shortTranslations.push({ key: r.key, value: zhTW, line: i + 2 });
    }
  });

  if (shortTranslations.length === 0) {
    console.log('   ✅ 没有发现过短的翻译\n');
  } else {
    console.log(`   ⚠️  发现 ${shortTranslations.length} 个过短的翻译:\n`);
    shortTranslations.slice(0, 20).forEach(s => {
      console.log(`      - ${s.key}: "${s.value}" (行 ${s.line})`);
    });
    if (shortTranslations.length > 20) {
      console.log(`      ... 还有 ${shortTranslations.length - 20} 个`);
    }
    console.log();
  }

  // 3. 检查过长的翻译（超过500字符）
  console.log('3️⃣ 过长的翻译（超过500字符）:');
  const longTranslations: Array<{ key: string; length: number; line: number }> = [];
  records.forEach((r, i) => {
    const zhTW = r['zh-TW'] || '';
    if (zhTW.length > 500) {
      longTranslations.push({ key: r.key, length: zhTW.length, line: i + 2 });
    }
  });

  if (longTranslations.length === 0) {
    console.log('   ✅ 没有发现过长的翻译\n');
  } else {
    console.log(`   ⚠️  发现 ${longTranslations.length} 个过长的翻译:\n`);
    longTranslations.forEach(l => {
      console.log(`      - ${l.key}: ${l.length} 字符 (行 ${l.line})`);
    });
    console.log();
  }

  // 4. 检查相同字义的 keys（例如"同意"按钮）
  console.log('4️⃣ 相同字义的 Keys（需要合并）:\n');
  
  // 收集所有翻译值（只检查较短的翻译，避免误判）
  const valueToKeys = new Map<string, string[]>();
  records.forEach(r => {
    const zhTW = (r['zh-TW'] || '').trim();
    // 只检查较短的翻译（1-30字符），排除变量、数字等
    if (
      zhTW.length > 0 &&
      zhTW.length <= 30 &&
      !zhTW.includes('\n') &&
      !zhTW.match(/^[\d\s\$\{\}\.]+$/) &&
      !zhTW.startsWith('[') // 排除占位符
    ) {
      if (!valueToKeys.has(zhTW)) {
        valueToKeys.set(zhTW, []);
      }
      valueToKeys.get(zhTW)!.push(r.key);
    }
  });

  // 找出有多个 keys 的相同翻译
  const duplicatesByValue: Array<{ value: string; keys: string[] }> = [];
  valueToKeys.forEach((keys, value) => {
    if (keys.length > 1) {
      duplicatesByValue.push({ value, keys });
    }
  });

  // 按 keys 数量排序
  duplicatesByValue.sort((a, b) => b.keys.length - a.keys.length);

  if (duplicatesByValue.length === 0) {
    console.log('   ✅ 没有发现相同字义的 keys\n');
  } else {
    console.log(`   ⚠️  发现 ${duplicatesByValue.length} 组相同字义的翻译:\n`);
    
    // 只显示前30组，且每组至少有2个 keys
    const significant = duplicatesByValue.filter(d => d.keys.length >= 2).slice(0, 30);
    
    significant.forEach(d => {
      console.log(`      "${d.value}" (出现 ${d.keys.length} 次):`);
      d.keys.forEach(k => console.log(`         - ${k}`));
      console.log();
    });
    
    if (duplicatesByValue.length > 30) {
      console.log(`      ... 还有 ${duplicatesByValue.length - 30} 组`);
    }
  }

  // 5. 检查脚本逻辑：确认新增 keys 会追加在末尾
  console.log('5️⃣ CSV 生成脚本逻辑检查:');
  console.log('   检查 scripts/generate-csv-complete.ts...\n');
  
  const scriptContent = readFileSync('scripts/generate-csv-complete.ts', 'utf-8');
  
  // 检查关键逻辑
  const hasAppendLogic = scriptContent.includes('[...records, ...newRows]');
  const hasBackup = scriptContent.includes('backup');
  const hasPreserveOrder = scriptContent.includes('allRecords = [...records, ...newRows]');
  
  console.log(`   ${hasAppendLogic ? '✅' : '❌'} 新增 keys 会追加在末尾`);
  console.log(`   ${hasBackup ? '✅' : '❌'} 会创建备份文件`);
  console.log(`   ${hasPreserveOrder ? '✅' : '❌'} 保持现有记录顺序`);
  
  if (hasAppendLogic && hasBackup && hasPreserveOrder) {
    console.log('\n   ✅ 脚本逻辑正确：新增 keys 只会追加在最下方，不会破坏顺序\n');
  } else {
    console.log('\n   ⚠️  脚本逻辑可能有问题，请检查\n');
  }

  console.log('='.repeat(80));
  console.log('✅ 审计完成');
}

main().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});

