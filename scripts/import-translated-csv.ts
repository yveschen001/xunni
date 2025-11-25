/**
 * 导入翻译好的 CSV 文件
 * 功能：
 * 1. 读取翻译好的 CSV
 * 2. 更新现有的 i18n_for_translation.csv
 * 3. 检查格式和变量
 * 4. 自动修复常见错误
 * 5. 生成进度报告
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
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

interface ValidationError {
  key: string;
  language: string;
  error: string;
  fixed?: boolean;
  original?: string;
  fixedValue?: string;
}

interface ImportStats {
  totalKeys: number;
  updatedKeys: number;
  newKeys: number;
  skippedKeys: number;
  errors: ValidationError[];
  fixedErrors: number;
  languagesProgress: Record<string, { total: number; translated: number; percentage: number }>;
}

// 检查并修复格式错误
function validateAndFix(value: string, sourceValue: string, key: string, language: string): { value: string; errors: string[]; fixed: boolean } {
  const errors: string[] = [];
  let fixed = false;
  let fixedValue = value;

  // 0. 自动修复：移除 JavaScript 表达式（如 || 'zh-TW'）
  // i18n 系统不支持 JavaScript 表达式，需要在代码中处理默认值
  const jsExpressionPattern = /\$\{([^}]+)\s*\|\|\s*['"][^'"]+['"]\}/g;
  if (jsExpressionPattern.test(fixedValue)) {
    fixedValue = fixedValue.replace(jsExpressionPattern, (match, expr) => {
      // 提取变量名（去掉 || 'default' 部分）
      const varName = expr.split('||')[0].trim();
      return `\${${varName}}`;
    });
    fixed = true;
    errors.push('已自动移除 JavaScript 表达式（如 || \'zh-TW\'），默认值应在代码中处理');
  }

  // 1. 检查变量占位符
  const sourceVariables = (sourceValue.match(/\{(\w+)\}/g) || []).sort();
  const targetVariables = (fixedValue.match(/\{(\w+)\}/g) || []).sort();
  
  if (sourceVariables.length !== targetVariables.length) {
    errors.push(`变量数量不匹配: 源语言有 ${sourceVariables.length} 个，翻译有 ${targetVariables.length} 个`);
    // 尝试修复：补充缺失的变量
    sourceVariables.forEach(v => {
      if (!targetVariables.includes(v)) {
        fixedValue = fixedValue.replace(/\{(\w+)\}/g, (match, varName) => {
          if (varName === v.replace(/[{}]/g, '')) return match;
          return match + ` ${v}`;
        });
        if (!fixedValue.includes(v)) {
          fixedValue += ` ${v}`;
        }
        fixed = true;
      }
    });
  }

  // 2. 检查模板字符串变量（${variable}）
  const sourceTemplateVars = (sourceValue.match(/\$\{(\w+)\}/g) || []).sort();
  const targetTemplateVars = (fixedValue.match(/\$\{(\w+)\}/g) || []).sort();
  
  if (sourceTemplateVars.length !== targetTemplateVars.length) {
    errors.push(`模板变量数量不匹配: 源语言有 ${sourceTemplateVars.length} 个，翻译有 ${targetTemplateVars.length} 个`);
    // 尝试修复
    sourceTemplateVars.forEach(v => {
      if (!targetTemplateVars.includes(v)) {
        fixedValue = fixedValue.replace(/\$\{(\w+)\}/g, (match, varName) => {
          if (varName === v.replace(/[${}]/g, '')) return match;
          return match + ` ${v}`;
        });
        if (!fixedValue.includes(v)) {
          fixedValue += ` ${v}`;
        }
        fixed = true;
      }
    });
  }

  // 3. 检查换行符（\n）
  const sourceNewlines = (sourceValue.match(/\\n/g) || []).length;
  const targetNewlines = (fixedValue.match(/\\n/g) || []).length;
  
  // 注意：换行符数量可能不同（翻译可能不需要那么多换行），所以只警告不修复

  // 4. 检查 emoji（可选，只警告）
  // 这个比较复杂，暂时跳过

  return { value: fixedValue, errors, fixed };
}

function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('📥 CSV 导入工具\n');
    console.log('用法:');
    console.log('  pnpm tsx scripts/import-translated-csv.ts <翻译好的CSV文件路径> [选项]\n');
    console.log('选项:');
    console.log('  --update-source    允许更新源语言 (zh-TW)，默认不更新源语言\n');
    console.log('示例:');
    console.log('  pnpm tsx scripts/import-translated-csv.ts translated.csv');
    console.log('  pnpm tsx scripts/import-translated-csv.ts translated.csv --update-source\n');
    process.exit(1);
  }

  const translatedCsvPath = args[0];
  const allowSourceUpdate = args.includes('--update-source');
  
  if (!existsSync(translatedCsvPath)) {
    console.error(`❌ 文件不存在: ${translatedCsvPath}`);
    process.exit(1);
  }

  console.log('📥 开始导入翻译好的 CSV...\n');
  if (allowSourceUpdate) {
    console.log('⚠️  警告: 已启用 --update-source 选项，源语言 (zh-TW) 将被更新！\n');
  }
  console.log('='.repeat(80));
  console.log();

  // 读取现有的 CSV
  const existingCsvPath = join(process.cwd(), 'i18n_for_translation.csv');
  if (!existsSync(existingCsvPath)) {
    console.error('❌ 找不到现有的 i18n_for_translation.csv');
    process.exit(1);
  }

  console.log('1️⃣ 读取现有 CSV...');
  const existingCsvContent = readFileSync(existingCsvPath, 'utf-8');
  const existingRecords = parse(existingCsvContent, {
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
    relax_column_count: true,
  }) as CSVRow[];

  console.log(`   ✅ 读取 ${existingRecords.length} 个现有 keys\n`);

  // 读取翻译好的 CSV
  console.log('2️⃣ 读取翻译好的 CSV...');
  const translatedCsvContent = readFileSync(translatedCsvPath, 'utf-8');
  const parsedRecords = parse(translatedCsvContent, {
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
    relax_column_count: true,
  }) as CSVRow[];

  // 过滤无效行（key 为空、key 包含中文、zh-TW 为空）
  const translatedRecords = parsedRecords.filter(r => {
    const key = (r.key || '').trim();
    const zhTW = (r['zh-TW'] || '').trim();
    
    // 跳过无效行
    if (!key) return false;
    if (/[\u4e00-\u9fff]/.test(key) && !key.match(/^[\w\.]+$/)) return false;
    if (!zhTW && !key.startsWith('[')) return false;
    
    return true;
  });

  const skippedCount = parsedRecords.length - translatedRecords.length;
  if (skippedCount > 0) {
    console.log(`   ⚠️  跳过 ${skippedCount} 个无效行（key 为空、包含中文或 zh-TW 为空）`);
  }
  console.log(`   ✅ 读取 ${translatedRecords.length} 个有效翻译 keys\n`);

  // 创建翻译记录的映射
  const translatedMap = new Map<string, CSVRow>();
  translatedRecords.forEach(r => {
    translatedMap.set(r.key, r);
  });

  // 统计信息
  const stats: ImportStats = {
    totalKeys: existingRecords.length,
    updatedKeys: 0,
    newKeys: 0,
    skippedKeys: 0,
    errors: [],
    fixedErrors: 0,
    languagesProgress: {},
  };

  // 初始化语言进度
  ALL_LANGUAGES.forEach(lang => {
    stats.languagesProgress[lang] = { total: 0, translated: 0, percentage: 0 };
  });

  console.log('3️⃣ 更新翻译...\n');

  // 更新现有记录
  const updatedRecords: CSVRow[] = [];
  
  for (const existingRecord of existingRecords) {
    const translatedRecord = translatedMap.get(existingRecord.key);
    
    if (translatedRecord) {
      // 找到翻译，更新
      const updatedRecord: CSVRow = { ...existingRecord };
      let hasUpdate = false;

      // 更新每个语言的翻译
      for (const lang of ALL_LANGUAGES) {
        const translatedValue = translatedRecord[lang]?.trim();
        
        if (translatedValue && translatedValue.length > 0) {
          // 处理源语言 (zh-TW)
          if (lang === 'zh-TW') {
            if (allowSourceUpdate) {
              // 允许更新源语言
              updatedRecord[lang] = translatedValue;
              hasUpdate = true;
            } else {
              // 默认不更新源语言，但记录差异
              const existingValue = existingRecord[lang] || '';
              if (translatedValue !== existingValue.trim()) {
                stats.errors.push({
                  key: existingRecord.key,
                  language: lang,
                  error: `源语言有变更，但未使用 --update-source 选项。现有: "${existingValue.substring(0, 50)}..."，新值: "${translatedValue.substring(0, 50)}..."`,
                  fixed: false,
                });
              }
            }
            continue;
          }

          // 验证和修复
          const sourceValue = existingRecord['zh-TW'] || '';
          const validation = validateAndFix(translatedValue, sourceValue, existingRecord.key, lang);
          
          if (validation.errors.length > 0) {
            stats.errors.push({
              key: existingRecord.key,
              language: lang,
              error: validation.errors.join('; '),
              fixed: validation.fixed,
              original: translatedValue,
              fixedValue: validation.fixed ? validation.value : undefined,
            });
            
            if (validation.fixed) {
              stats.fixedErrors++;
              updatedRecord[lang] = validation.value;
            } else {
              updatedRecord[lang] = translatedValue; // 即使有错误也更新，但记录错误
            }
          } else {
            updatedRecord[lang] = validation.value;
          }

          hasUpdate = true;
          
          // 更新进度统计
          if (lang !== 'zh-TW') {
            stats.languagesProgress[lang].total++;
            if (translatedValue.length > 0) {
              stats.languagesProgress[lang].translated++;
            }
          }
        }
      }

      if (hasUpdate) {
        stats.updatedKeys++;
      }
      
      updatedRecords.push(updatedRecord);
      translatedMap.delete(existingRecord.key); // 标记为已处理
    } else {
      // 没有找到翻译，保持原样
      updatedRecords.push(existingRecord);
      stats.skippedKeys++;
    }
  }

  // 处理新 keys（翻译 CSV 中有但现有 CSV 中没有的）
  translatedMap.forEach((translatedRecord, key) => {
    const newRecord: CSVRow = { key };
    
    // 复制所有语言的翻译
    for (const lang of ALL_LANGUAGES) {
      newRecord[lang] = translatedRecord[lang] || '';
    }
    
    updatedRecords.push(newRecord);
    stats.newKeys++;
  });

  // 计算语言进度百分比
  Object.keys(stats.languagesProgress).forEach(lang => {
    const progress = stats.languagesProgress[lang];
    if (progress.total > 0) {
      progress.percentage = Math.round((progress.translated / progress.total) * 100);
    }
  });

  // 创建备份
  console.log('4️⃣ 创建备份...');
  const backupPath = `${existingCsvPath}.backup-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)}`;
  writeFileSync(backupPath, existingCsvContent, 'utf-8');
  console.log(`   ✅ 备份已创建: ${backupPath}\n`);

  // 写入更新后的 CSV
  console.log('5️⃣ 写入更新后的 CSV...');
  const csvOutput = stringify(updatedRecords, {
    header: true,
    columns: ['key', ...ALL_LANGUAGES],
    quoted: true,
    quoted_empty: false,
  });
  
  writeFileSync(existingCsvPath, csvOutput, 'utf-8');
  console.log(`   ✅ CSV 已更新: ${existingCsvPath}\n`);

  // 生成报告
  console.log('='.repeat(80));
  console.log('📊 导入统计\n');
  console.log(`   总 keys: ${stats.totalKeys}`);
  console.log(`   更新的 keys: ${stats.updatedKeys}`);
  console.log(`   新增的 keys: ${stats.newKeys}`);
  console.log(`   跳过的 keys: ${stats.skippedKeys}`);
  console.log(`   发现的错误: ${stats.errors.length}`);
  console.log(`   自动修复的错误: ${stats.fixedErrors}\n`);

  // 语言进度
  console.log('📈 翻译进度:\n');
  ALL_LANGUAGES.slice(1).forEach(lang => {
    const progress = stats.languagesProgress[lang];
    const bar = '█'.repeat(Math.floor(progress.percentage / 5)) + '░'.repeat(20 - Math.floor(progress.percentage / 5));
    console.log(`   ${lang.padEnd(8)}: ${bar} ${progress.percentage}% (${progress.translated}/${progress.total})`);
  });
  console.log();

  // 显示错误（如果有）
  if (stats.errors.length > 0) {
    console.log('⚠️  发现的错误和警告（前 20 个）:\n');
    stats.errors.slice(0, 20).forEach(err => {
      console.log(`   - ${err.key} [${err.language}]: ${err.error}`);
      if (err.fixed && err.fixedValue) {
        console.log(`     已修复: "${err.original}" → "${err.fixedValue}"`);
      }
    });
    if (stats.errors.length > 20) {
      console.log(`   ... 还有 ${stats.errors.length - 20} 个错误/警告`);
    }
    console.log();
  }

  // 显示源语言更新统计（如果允许更新）
  if (allowSourceUpdate) {
    const sourceUpdates = stats.errors.filter(e => e.language === 'zh-TW' && e.error.includes('源语言有变更')).length;
    if (sourceUpdates > 0) {
      console.log(`📝 源语言更新: ${sourceUpdates} 个 keys 的源语言已更新\n`);
    }
  }

  // 保存详细报告
  const reportPath = join(process.cwd(), 'import-translation-report.json');
  writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    stats,
    errors: stats.errors,
  }, null, 2), 'utf-8');
  console.log(`📄 详细报告已保存: ${reportPath}\n`);

  console.log('='.repeat(80));
  console.log('✅ 导入完成！\n');
}

main().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});

