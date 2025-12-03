/**
 * Extract MBTI Questions and Answers to CSV
 * 将 MBTI 问题和答案提取到 CSV 中，支持所有 34 种语言
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { parse, stringify } from 'csv-parse/sync';

const ALL_LANGUAGES = [
  'zh-TW', 'zh-CN', 'en', 'ja', 'ko', 'vi', 'th', 'id', 'ms', 'tl', 'hi', 'ar', 'ur', 'fa', 'he', 'tr', 'ru', 'uk', 'pl', 'cs', 'ro', 'hu', 'bg', 'hr', 'sk', 'sl', 'sr', 'mk', 'sq', 'el', 'de', 'fr', 'es', 'it', 'pt', 'nl', 'sv', 'no', 'da', 'fi'
];

interface MBTIQuestion {
  id: number;
  dimension: string;
  question_zh_TW: string;
  question_en: string;
  options: {
    text_zh_TW: string;
    text_en: string;
    score: number;
  }[];
}

interface MBTIDescription {
  zh_TW: string;
  en: string;
}

function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

async function main() {
  console.log('📖 Reading MBTI test file...');
  
  const mbtiTestPath = join(process.cwd(), 'src', 'domain', 'mbti_test.ts');
  const mbtiTestContent = readFileSync(mbtiTestPath, 'utf-8');
  
  // Extract MBTI_QUESTIONS_QUICK
  const quickMatch = mbtiTestContent.match(/export const MBTI_QUESTIONS_QUICK: MBTIQuestion\[\] = (\[[\s\S]*?\]);/);
  if (!quickMatch) {
    throw new Error('Could not find MBTI_QUESTIONS_QUICK');
  }
  
  // Extract MBTI_QUESTIONS_FULL
  const fullMatch = mbtiTestContent.match(/export const MBTI_QUESTIONS_FULL: MBTIQuestion\[\] = (\[[\s\S]*?\]);/);
  if (!fullMatch) {
    throw new Error('Could not find MBTI_QUESTIONS_FULL');
  }
  
  // Extract MBTI_DESCRIPTIONS
  const descMatch = mbtiTestContent.match(/export const MBTI_DESCRIPTIONS: Record<string, \{ zh_TW: string; en: string \}> = ({[\s\S]*?});/);
  if (!descMatch) {
    throw new Error('Could not find MBTI_DESCRIPTIONS');
  }
  
  // Read existing CSV
  const csvPath = join(process.cwd(), 'i18n_for_translation.csv');
  let existingRows: any[] = [];
  let existingKeys = new Set<string>();
  
  try {
    const csvContent = readFileSync(csvPath, 'utf-8');
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      relax_quotes: true,
      relax_column_count: true,
    });
    existingRows = records;
    records.forEach((r: any) => existingKeys.add(r.key));
    console.log(`✅ Found ${existingKeys.size} existing keys in CSV`);
  } catch (error) {
    console.log('⚠️  CSV file not found, will create new one');
  }
  
  const newRows: any[] = [];
  
  // Parse Quick questions (12 questions)
  console.log('\n📝 Extracting Quick questions (12 questions)...');
  const quickCode = quickMatch[1];
  const quickQuestions: MBTIQuestion[] = eval(`(${quickCode})`);
  
  for (const q of quickQuestions) {
    // Question text
    const questionKey = `mbti.quick.question${q.id}`;
    if (!existingKeys.has(questionKey)) {
      const row: any = { key: questionKey };
      row['zh-TW'] = q.question_zh_TW;
      row['en'] = q.question_en;
      ALL_LANGUAGES.slice(2).forEach(lang => {
        row[lang] = '';
      });
      newRows.push(row);
      existingKeys.add(questionKey);
    }
    
    // Answer options
    q.options.forEach((option, index) => {
      const optionKey = `mbti.quick.question${q.id}.option${index + 1}`;
      if (!existingKeys.has(optionKey)) {
        const row: any = { key: optionKey };
        row['zh-TW'] = option.text_zh_TW;
        row['en'] = option.text_en;
        ALL_LANGUAGES.slice(2).forEach(lang => {
          row[lang] = '';
        });
        newRows.push(row);
        existingKeys.add(optionKey);
      }
    });
  }
  
  // Parse Full questions (36 questions)
  console.log('📝 Extracting Full questions (36 questions)...');
  const fullCode = fullMatch[1];
  const fullQuestions: MBTIQuestion[] = eval(`(${fullCode})`);
  
  for (const q of fullQuestions) {
    // Question text
    const questionKey = `mbti.full.question${q.id}`;
    if (!existingKeys.has(questionKey)) {
      const row: any = { key: questionKey };
      row['zh-TW'] = q.question_zh_TW;
      row['en'] = q.question_en;
      ALL_LANGUAGES.slice(2).forEach(lang => {
        row[lang] = '';
      });
      newRows.push(row);
      existingKeys.add(questionKey);
    }
    
    // Answer options
    q.options.forEach((option, index) => {
      const optionKey = `mbti.full.question${q.id}.option${index + 1}`;
      if (!existingKeys.has(optionKey)) {
        const row: any = { key: optionKey };
        row['zh-TW'] = option.text_zh_TW;
        row['en'] = option.text_en;
        ALL_LANGUAGES.slice(2).forEach(lang => {
          row[lang] = '';
        });
        newRows.push(row);
        existingKeys.add(optionKey);
      }
    });
  }
  
  // Parse descriptions
  console.log('📝 Extracting MBTI descriptions...');
  const descCode = descMatch[1];
  const descriptions: Record<string, MBTIDescription> = eval(`(${descCode})`);
  
  for (const [type, desc] of Object.entries(descriptions)) {
    const descKey = `mbti.description.${type}`;
    if (!existingKeys.has(descKey)) {
      const row: any = { key: descKey };
      row['zh-TW'] = desc.zh_TW;
      row['en'] = desc.en;
      ALL_LANGUAGES.slice(2).forEach(lang => {
        row[lang] = '';
      });
      newRows.push(row);
      existingKeys.add(descKey);
    }
  }
  
  console.log(`\n✅ Extracted ${newRows.length} new MBTI keys`);
  
  // Combine with existing rows
  const allRows = [...existingRows, ...newRows];
  
  // Write CSV
  console.log('\n📝 Writing CSV...');
  const header = `key,${ALL_LANGUAGES.join(',')}`;
  const csvRows = [header];
  
  for (const row of allRows) {
    const values = [escapeCSV(row.key)];
    for (const lang of ALL_LANGUAGES) {
      values.push(escapeCSV(row[lang] || ''));
    }
    csvRows.push(values.join(','));
  }
  
  writeFileSync(csvPath, csvRows.join('\n'), 'utf-8');
  console.log(`✅ Updated CSV with ${allRows.length} total keys`);
  console.log(`\n📊 Summary:`);
  console.log(`   - Quick questions: ${quickQuestions.length} questions`);
  console.log(`   - Full questions: ${fullQuestions.length} questions`);
  console.log(`   - Descriptions: ${Object.keys(descriptions).length} types`);
  console.log(`   - New keys added: ${newRows.length}`);
}

main().catch(console.error);

