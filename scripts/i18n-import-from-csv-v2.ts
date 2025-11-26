/**
 * Import i18n translations from CSV (v2)
 * Reads i18n_for_translation.csv and generates locale files
 * Format: key,zh-TW,zh-CN,en,ja,ko,th,vi,id,ms,tl,es,pt,fr,de,it,ru,ar,hi,bn,tr,pl,uk,nl,sv,no,da,fi,cs,el,he,fa,ur,sw,ro
 */

import { readFileSync, writeFileSync } from 'fs';
import { parse } from 'csv-parse/sync';
import { join } from 'path';

// All supported languages
const ALL_LANGUAGES = [
  'zh-TW', 'zh-CN', 'en', 'ja', 'ko', 'th', 'vi', 'id', 'ms', 'tl',
  'es', 'pt', 'fr', 'de', 'it', 'ru', 'ar', 'hi', 'bn', 'tr',
  'pl', 'uk', 'nl', 'sv', 'no', 'da', 'fi', 'cs', 'el', 'he',
  'fa', 'ur', 'sw', 'ro'
];

interface CSVRow {
  key: string;
  [language: string]: string;
}

function escapeString(str: string): string {
  if (!str) return '';
  
  // Unescape CSV escaped values
  str = str.replace(/\\n/g, '\n');
  str = str.replace(/\\`/g, '`');
  str = str.replace(/\\\$\{/g, '${');
  
  // Escape for TypeScript template literal
  str = str.replace(/\\/g, '\\\\');
  str = str.replace(/`/g, '\\`');
  str = str.replace(/\$\{/g, '\\${');
  
  return str;
}

function generateLocaleFile(language: string, translations: any): string {
  let content = `import type { Translations } from '../types';\n\n`;
  content += `/**\n`;
  content += ` * ${language} translations\n`;
  content += ` * Auto-generated from i18n_for_translation.csv\n`;
  content += ` */\n`;
  content += `export const translations: Translations = {\n`;
  
  // Sort namespaces
  const namespaces = Object.keys(translations).sort();
  
  for (let i = 0; i < namespaces.length; i++) {
    const namespace = namespaces[i];
    const keys = translations[namespace];
    
    content += `  ${namespace}: {\n`;
    
    // Group keys by nested namespace (e.g., "quick.question1" -> quick: { question1: ... })
    const nested: Record<string, Record<string, string>> = {};
    const flat: Record<string, string> = {};
    
    for (const key of Object.keys(keys)) {
      const value = keys[key];
      const keyParts = key.split('.');
      
      if (keyParts.length > 1) {
        // Nested key (e.g., "quick.question1")
        const nestedNs = keyParts[0];
        const nestedKey = keyParts.slice(1).join('.');
        
        if (!nested[nestedNs]) {
          nested[nestedNs] = {};
        }
        nested[nestedNs][nestedKey] = value;
      } else {
        // Flat key (e.g., "yes")
        flat[key] = value;
      }
    }
    
    // Write flat keys first
    const flatKeys = Object.keys(flat).sort();
    for (let j = 0; j < flatKeys.length; j++) {
      const key = flatKeys[j];
      const value = flat[key];
      const escapedValue = escapeString(value);
      const quotedKey = /[.-]/.test(key) ? `'${key}'` : key;
      content += `    ${quotedKey}: \`${escapedValue}\`,\n`;
    }
    
    // Write nested namespaces
    const nestedNamespaces = Object.keys(nested).sort();
    for (let j = 0; j < nestedNamespaces.length; j++) {
      const nestedNs = nestedNamespaces[j];
      const nestedKeys = nested[nestedNs];
      
      content += `    ${nestedNs}: {\n`;
      
      const nestedKeyNames = Object.keys(nestedKeys).sort();
      for (let k = 0; k < nestedKeyNames.length; k++) {
        const nestedKey = nestedKeyNames[k];
        const value = nestedKeys[nestedKey];
        const escapedValue = escapeString(value);
        const quotedKey = /[.-]/.test(nestedKey) ? `'${nestedKey}'` : nestedKey;
        content += `      ${quotedKey}: \`${escapedValue}\`,\n`;
      }
      
      content += `    },\n`;
    }
    
    content += `  },\n`;
  }
  
  content += `};\n`;
  
  return content;
}

async function main() {
  console.log('📥 Reading CSV file...');
  
  const csvPath = join(process.cwd(), 'i18n_for_translation.csv');
  
  // 🛡️ 保护机制：在导入前检查关键 key
  try {
    const { checkCriticalKeys } = await import('./protect-csv-keys.js');
    const protection = checkCriticalKeys(csvPath);
    if (!protection.passed) {
      console.error('\n❌ 关键 key 检查失败！导入已取消。');
      console.error('请先恢复缺失的关键 key 后再导入。');
      process.exit(1);
    }
  } catch (e) {
    console.warn('⚠️  无法运行保护检查，继续导入...');
  }
  
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
  
  for (const lang of ALL_LANGUAGES) {
    languageData[lang] = {};
  }
  
  // Process each row
  for (const row of records) {
    const fullKey = row.key;
    
    if (!fullKey) continue;
    
    // Parse namespace and key from fullKey
    // Support nested namespaces: "mbti.quick.question1" -> namespace: "mbti", nested: "quick", key: "question1"
    const parts = fullKey.split('.');
    if (parts.length < 2) {
      console.warn(`⚠️  Skipping invalid key: ${fullKey}`);
      continue;
    }
    
    const namespace = parts[0];
    const key = parts.slice(1).join('.');
    
    // Process each language
    for (const lang of ALL_LANGUAGES) {
      const value = row[lang];
      
      if (!languageData[lang][namespace]) {
        languageData[lang][namespace] = {};
      }
      
      // Use the translated value if available, otherwise fallback to zh-TW
      const translation = value && value.trim() ? value : (row['zh-TW'] || '');
      languageData[lang][namespace][key] = translation;
    }
  }
  
  // Generate locale files
  console.log('\n📝 Generating locale files...');
  
  for (const lang of ALL_LANGUAGES) {
    const content = generateLocaleFile(lang, languageData[lang]);
    const outputPath = join(process.cwd(), 'src', 'i18n', 'locales', `${lang}.ts`);
    
    writeFileSync(outputPath, content, 'utf-8');
    
    // Count translations
    const totalKeys = Object.values(languageData[lang]).reduce(
      (sum: number, ns: any) => sum + Object.keys(ns).length,
      0
    );
    
    // Count non-empty translations (excluding zh-TW fallback for other languages)
    let translatedKeys = 0;
    if (lang === 'zh-TW') {
      translatedKeys = totalKeys; // zh-TW is always complete
    } else {
      // For other languages, count keys that have actual translations (not empty)
      translatedKeys = Object.values(languageData[lang]).reduce(
        (sum: number, ns: any) => 
          sum + Object.values(ns).filter((v: any) => {
            // Check if this is a real translation (not empty and not just zh-TW fallback)
            return v && v.trim() && v !== languageData['zh-TW'][Object.keys(languageData[lang]).find(n => languageData[lang][n] === ns) || ''][Object.keys(ns).find(k => ns[k] === v) || ''];
          }).length,
        0
      );
    }
    
    const coverage = totalKeys > 0 ? ((translatedKeys / totalKeys) * 100).toFixed(1) : '0.0';
    
    console.log(`  ✅ ${lang}.ts - ${translatedKeys}/${totalKeys} keys (${coverage}%)`);
  }
  
  console.log('\n🎉 Import complete!');
  console.log('\n📊 Summary:');
  console.log(`   - Total keys: ${records.length}`);
  console.log(`   - Languages imported: ${ALL_LANGUAGES.length}`);
  console.log(`   - Locale files generated: ${ALL_LANGUAGES.length}`);
}

main().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});

