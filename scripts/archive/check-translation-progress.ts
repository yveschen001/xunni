/**
 * 检查翻译进度
 * 功能：
 * 1. 统计每种语言的翻译进度
 * 2. 找出缺失的翻译
 * 3. 生成进度报告
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { parse } from 'csv-parse/sync';

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

interface LanguageProgress {
  language: string;
  total: number;
  translated: number;
  missing: number;
  percentage: number;
  missingKeys: string[];
}

interface ProgressReport {
  timestamp: string;
  totalKeys: number;
  languages: LanguageProgress[];
  summary: {
    fullyTranslated: number; // 所有语言都翻译的 keys
    partiallyTranslated: number; // 部分语言翻译的 keys
    notTranslated: number; // 完全没有翻译的 keys
  };
}

function main() {
  console.log('📊 检查翻译进度...\n');
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

  console.log(`✅ 读取 ${records.length} 个 keys\n`);

  // 统计每种语言的进度
  const languagesProgress: LanguageProgress[] = ALL_LANGUAGES.map(lang => ({
    language: lang,
    total: records.length,
    translated: 0,
    missing: 0,
    percentage: 0,
    missingKeys: [],
  }));

  // 统计每个 key 的翻译状态
  let fullyTranslated = 0;
  let partiallyTranslated = 0;
  let notTranslated = 0;

  records.forEach(record => {
    let translatedCount = 0;
    
    ALL_LANGUAGES.forEach((lang, index) => {
      const value = (record[lang] || '').trim();
      
      if (lang === 'zh-TW') {
        // zh-TW 是源语言，应该总是有值
        if (value.length > 0) {
          languagesProgress[index].translated++;
        }
        translatedCount++;
      } else {
        // 其他语言
        if (value.length > 0) {
          languagesProgress[index].translated++;
          translatedCount++;
        } else {
          languagesProgress[index].missingKeys.push(record.key);
        }
      }
    });

    // 统计 key 的翻译状态（不包括 zh-TW）
    const nonSourceTranslated = translatedCount - 1; // 减去 zh-TW
    const nonSourceTotal = ALL_LANGUAGES.length - 1; // 减去 zh-TW

    if (nonSourceTranslated === nonSourceTotal) {
      fullyTranslated++;
    } else if (nonSourceTranslated > 0) {
      partiallyTranslated++;
    } else {
      notTranslated++;
    }
  });

  // 计算百分比和缺失数量
  languagesProgress.forEach(progress => {
    progress.missing = progress.total - progress.translated;
    progress.percentage = progress.total > 0 
      ? Math.round((progress.translated / progress.total) * 100) 
      : 0;
  });

  // 生成报告
  const report: ProgressReport = {
    timestamp: new Date().toISOString(),
    totalKeys: records.length,
    languages: languagesProgress,
    summary: {
      fullyTranslated,
      partiallyTranslated,
      notTranslated,
    },
  };

  // 显示进度
  console.log('📈 翻译进度:\n');
  
  ALL_LANGUAGES.forEach((lang, index) => {
    const progress = languagesProgress[index];
    const bar = '█'.repeat(Math.floor(progress.percentage / 2)) + '░'.repeat(50 - Math.floor(progress.percentage / 2));
    console.log(`   ${lang.padEnd(8)}: ${bar} ${progress.percentage.toString().padStart(3)}% (${progress.translated.toString().padStart(4)}/${progress.total})`);
  });

  console.log();
  console.log('📊 总体统计:\n');
  console.log(`   完全翻译的 keys: ${fullyTranslated} (${Math.round((fullyTranslated / records.length) * 100)}%)`);
  console.log(`   部分翻译的 keys: ${partiallyTranslated} (${Math.round((partiallyTranslated / records.length) * 100)}%)`);
  console.log(`   未翻译的 keys: ${notTranslated} (${Math.round((notTranslated / records.length) * 100)}%)\n`);

  // 显示缺失翻译最多的语言（前 5 个）
  const missingLanguages = languagesProgress
    .filter(p => p.language !== 'zh-TW')
    .sort((a, b) => b.missing - a.missing)
    .slice(0, 5);

  if (missingLanguages.length > 0) {
    console.log('⚠️  缺失翻译最多的语言（前 5 个）:\n');
    missingLanguages.forEach(p => {
      console.log(`   ${p.language.padEnd(8)}: ${p.missing} 个缺失 (${100 - p.percentage}%)`);
    });
    console.log();
  }

  // 保存报告
  const reportPath = join(process.cwd(), 'translation-progress-report.json');
  writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');
  console.log(`📄 详细报告已保存: ${reportPath}\n`);

  // 生成缺失翻译的 CSV（可选）
  const generateMissingCsv = process.argv.includes('--export-missing');
  if (generateMissingCsv) {
    console.log('📝 生成缺失翻译的 CSV...\n');
    
    const missingCsvPath = join(process.cwd(), 'missing-translations.csv');
    const missingRows: string[] = ['key,language,zh-TW'];
    
    languagesProgress
      .filter(p => p.language !== 'zh-TW' && p.missing > 0)
      .forEach(progress => {
        progress.missingKeys.slice(0, 100).forEach(key => { // 限制每个语言最多 100 个
          const record = records.find(r => r.key === key);
          if (record) {
            const zhTW = (record['zh-TW'] || '').replace(/"/g, '""');
            missingRows.push(`"${key}","${progress.language}","${zhTW}"`);
          }
        });
      });
    
    writeFileSync(missingCsvPath, missingRows.join('\n'), 'utf-8');
    console.log(`   ✅ 缺失翻译 CSV 已生成: ${missingCsvPath}\n`);
  }

  console.log('='.repeat(80));
  console.log('✅ 进度检查完成！\n');
}

main().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});

