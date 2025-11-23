/**
 * Import i18n translations from CSV
 * Reads i18n_translation_template.csv and generates locale files
 */

import { readFileSync, writeFileSync } from 'fs';
import { parse } from 'csv-parse/sync';
import { join } from 'path';

// Language mapping: CSV column name -> code file name
const LANGUAGES_TO_IMPORT = ['zh-TW', 'zh-CN', 'en', 'ar'];

interface CSVRow {
  namespace: string;
  key: string;
  [language: string]: string;
}

function escapeString(str: string): string {
  if (!str) return '';
  
  // Replace actual newlines with \\n
  str = str.replace(/\n/g, '\\n');
  
  // Escape backticks
  str = str.replace(/`/g, '\\`');
  
  // Escape ${
  str = str.replace(/\$\{/g, '\\${');
  
  return str;
}

function generateLocaleFile(language: string, translations: any): string {
  const languageNames: Record<string, string> = {
    'zh-TW': 'Traditional Chinese (Taiwan)',
    'zh-CN': 'Simplified Chinese',
    'en': 'English',
    'ar': 'Arabic (RTL)',
  };

  let content = `import type { Translations } from '../types';\n\n`;
  content += `/**\n`;
  content += ` * ${language} translations\n`;
  content += ` * ${languageNames[language] || language}\n`;
  content += ` * Auto-generated from i18n_translation_template.csv\n`;
  content += ` */\n`;
  content += `export const translations: Translations = {\n`;

  const namespaces = Object.keys(translations).sort();
  
  for (let i = 0; i < namespaces.length; i++) {
    const namespace = namespaces[i];
    const keys = translations[namespace];
    
    content += `  ${namespace}: {\n`;
    
    const keyNames = Object.keys(keys).sort();
    for (let j = 0; j < keyNames.length; j++) {
      const key = keyNames[j];
      const value = keys[key];
      
      // Quote keys that contain dots or other special characters
      const quotedKey = /[.-]/.test(key) ? `'${key}'` : key;
      
      content += `    ${quotedKey}: \`${escapeString(value)}\`,\n`;
    }
    
    content += `  },\n`;
  }
  
  content += `};\n`;
  
  return content;
}

async function main() {
  console.log('📥 Reading CSV file...');
  
  const csvPath = join(process.cwd(), 'i18n_translation_template.csv');
  const csvContent = readFileSync(csvPath, 'utf-8');
  
  console.log('📊 Parsing CSV...');
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
    relax_column_count: true,
  }) as CSVRow[];
  
  console.log(`✅ Parsed ${records.length} translation entries`);
  
  // Group by language
  const languageData: Record<string, any> = {};
  
  for (const lang of LANGUAGES_TO_IMPORT) {
    languageData[lang] = {};
  }
  
  // Process each row
  for (const row of records) {
    const namespace = row.namespace;
    const key = row.key;
    
    if (!namespace || !key) continue;
    
    for (const lang of LANGUAGES_TO_IMPORT) {
      const value = row[lang];
      
      if (!languageData[lang][namespace]) {
        languageData[lang][namespace] = {};
      }
      
      // Use the translated value if available, otherwise fallback to zh-TW
      languageData[lang][namespace][key] = value || row['zh-TW'] || '';
    }
  }
  
  // Generate locale files
  console.log('\n📝 Generating locale files...');
  
  for (const lang of LANGUAGES_TO_IMPORT) {
    const content = generateLocaleFile(lang, languageData[lang]);
    const outputPath = join(process.cwd(), 'src', 'i18n', 'locales', `${lang}.ts`);
    
    writeFileSync(outputPath, content, 'utf-8');
    
    // Count translations
    const totalKeys = Object.values(languageData[lang]).reduce(
      (sum: number, ns: any) => sum + Object.keys(ns).length,
      0
    );
    const translatedKeys = Object.values(languageData[lang]).reduce(
      (sum: number, ns: any) => 
        sum + Object.values(ns).filter((v: any) => v && v !== '').length,
      0
    );
    const coverage = ((translatedKeys / totalKeys) * 100).toFixed(1);
    
    console.log(`  ✅ ${lang}.ts - ${translatedKeys}/${totalKeys} keys (${coverage}%)`);
  }
  
  console.log('\n🎉 Import complete!');
  console.log('\n📋 Next steps:');
  console.log('1. Update src/i18n/index.ts to load these languages');
  console.log('2. Run: pnpm lint');
  console.log('3. Test language switching');
  console.log('4. Deploy: pnpm deploy:staging');
}

main().catch(console.error);

