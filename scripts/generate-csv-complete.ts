/**
 * Generate complete CSV update by appending missing keys to existing CSV
 * Preserves existing CSV order and appends new keys at the end
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
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

function escapeCSV(value: string): string {
  if (!value) return '';
  // Don't escape newlines, quotes, etc. - let csv-stringify handle it
  return value;
}

// Extract i18n keys from code using regex
function extractI18nKeysFromCode(): Set<string> {
  const srcDir = join(process.cwd(), 'src');
  const keys = new Set<string>();
  
  // Simple regex to find i18n.t('key') or i18n.t("key")
  const i18nPattern = /i18n\.t\(['"]([^'"]+)['"]\)/g;
  
  function scanFile(filePath: string) {
    try {
      const content = readFileSync(filePath, 'utf-8');
      let match;
      while ((match = i18nPattern.exec(content)) !== null) {
        keys.add(match[1]);
      }
    } catch (error) {
      // Skip files that can't be read
    }
  }
  
  function scanDirectory(dir: string) {
    const files = readdirSync(dir);
    for (const file of files) {
      const fullPath = join(dir, file);
      const stat = statSync(fullPath);
      if (stat.isDirectory() && !file.includes('node_modules')) {
        scanDirectory(fullPath);
      } else if (stat.isFile() && file.endsWith('.ts')) {
        scanFile(fullPath);
      }
    }
  }
  
  scanDirectory(srcDir);
  return keys;
}

// Improved extraction using recursive namespace matching
function buildZhTWKeyMap(zhTWContent: string): Map<string, string> {
  const keyMap = new Map<string, string>();
  
  // Recursive function to extract keys from a namespace
  function extractNamespace(content: string, prefix: string = ''): void {
    // Match namespace: { ... } patterns
    const namespacePattern = /(\w+):\s*\{/g;
    let nsMatch;
    const namespaces: Array<{ name: string; start: number; end: number }> = [];
    
    // Find all namespace blocks
    while ((nsMatch = namespacePattern.exec(content)) !== null) {
      const namespace = nsMatch[1];
      const start = nsMatch.index + nsMatch[0].length;
      
      // Find matching closing brace
      let braceCount = 1;
      let end = start;
      for (let i = start; i < content.length && braceCount > 0; i++) {
        if (content[i] === '{') braceCount++;
        if (content[i] === '}') braceCount--;
        if (braceCount === 0) {
          end = i;
          break;
        }
      }
      
      namespaces.push({ name: namespace, start, end });
    }
    
    // Extract keys in current level (not in nested namespaces)
    // Match key: `value` patterns that are NOT followed by {
    const keyPattern = /(['"]?)([\w.]+)\1:\s*`([^`]*(?:`[^`]*`)*[^`]*)`/g;
    let keyMatch;
    let lastIndex = 0;
    
    while ((keyMatch = keyPattern.exec(content)) !== null) {
      // Check if this key is inside a namespace block
      const keyIndex = keyMatch.index;
      let isInNamespace = false;
      
      for (const ns of namespaces) {
        if (keyIndex > ns.start && keyIndex < ns.end) {
          isInNamespace = true;
          break;
        }
      }
      
      if (!isInNamespace) {
        // This is a top-level key in current namespace
        const keyName = keyMatch[2];
        let value = keyMatch[3];
        value = unescapeValue(value);
        
        const fullKey = prefix ? `${prefix}.${keyName}` : keyName;
        keyMap.set(fullKey, value);
      }
    }
    
    // Recursively process nested namespaces
    for (const { name, start, end } of namespaces) {
      const nsContent = content.substring(start, end);
      const fullPrefix = prefix ? `${prefix}.${name}` : name;
      extractNamespace(nsContent, fullPrefix);
    }
  }
  
  // Start extraction from the translations object
  const translationsMatch = zhTWContent.match(/export const translations: Translations = \{([\s\S]+)\};/);
  if (translationsMatch) {
    extractNamespace(translationsMatch[1]);
  }
  
  return keyMap;
}

function unescapeValue(value: string): string {
  value = value.replace(/\\n/g, '\n');
  value = value.replace(/\\`/g, '`');
  value = value.replace(/\\\$\{/g, '${');
  value = value.replace(/\\\\/g, '\\');
  return value;
}

async function main() {
  console.log('🔍 Extracting i18n keys from code...\n');
  
  // Extract keys from code
  const codeKeys = extractI18nKeysFromCode();
  console.log(`✅ Found ${codeKeys.size} i18n keys in code`);
  
  // Read existing CSV
  const csvPath = join(process.cwd(), 'i18n_for_translation.csv');
  const csvContent = readFileSync(csvPath, 'utf-8');
  
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
    relax_column_count: true,
  }) as CSVRow[];
  
  const csvKeys = new Set(records.map(r => r.key));
  console.log(`✅ Found ${csvKeys.size} keys in existing CSV`);
  
  // Find missing keys
  const missingKeys = Array.from(codeKeys).filter(key => !csvKeys.has(key)).sort();
  console.log(`\n📊 Missing keys: ${missingKeys.length}`);
  
  if (missingKeys.length === 0) {
    console.log('\n✅ All keys are already in CSV!');
    return;
  }
  
  // Read zh-TW.ts to get translations
  const zhTWPath = join(process.cwd(), 'src', 'i18n', 'locales', 'zh-TW.ts');
  const zhTWContent = readFileSync(zhTWPath, 'utf-8');
  
  console.log(`\n📖 Building translation map from zh-TW.ts...`);
  const keyMap = buildZhTWKeyMap(zhTWContent);
  console.log(`✅ Built map with ${keyMap.size} keys`);
  
  console.log(`\n📝 Generating CSV rows for missing keys...`);
  
  // Create new rows for missing keys
  const newRows: CSVRow[] = [];
  let foundTranslations = 0;
  
  for (const key of missingKeys) {
    const value = keyMap.get(key) || '';
    if (value) {
      foundTranslations++;
    }
    
    const row: CSVRow = {
      key,
      'zh-TW': value || '[需要从 zh-TW.ts 获取翻译]',
    };
    
    // Add empty columns for other languages
    for (const lang of ALL_LANGUAGES.slice(1)) {
      row[lang] = '';
    }
    
    newRows.push(row);
  }
  
  // Append new rows to existing records
  const allRecords = [...records, ...newRows];
  
  // Generate CSV with proper headers
  const csvOutput = stringify(allRecords, {
    header: true,
    columns: ['key', ...ALL_LANGUAGES],
    quoted: true,
    quoted_empty: false,
  });
  
  // Write backup first
  const backupPath = join(process.cwd(), 'i18n_for_translation.csv.backup');
  writeFileSync(backupPath, csvContent, 'utf-8');
  console.log(`\n💾 Backup created: ${backupPath}`);
  
  // Write updated CSV
  writeFileSync(csvPath, csvOutput, 'utf-8');
  
  console.log(`\n✅ Updated CSV: ${csvPath}`);
  console.log(`   - Total keys: ${allRecords.length}`);
  console.log(`   - New keys added: ${newRows.length}`);
  console.log(`   - Found translations: ${foundTranslations}`);
  console.log(`   - Need manual lookup: ${newRows.length - foundTranslations}`);
  
  // Show preview of missing translations
  const missingTranslations = newRows.filter(r => r['zh-TW'].includes('[需要从'));
  if (missingTranslations.length > 0) {
    console.log(`\n⚠️  Keys needing manual translation lookup (${missingTranslations.length}):`);
    missingTranslations.slice(0, 10).forEach(row => {
      console.log(`   - ${row.key}`);
    });
    if (missingTranslations.length > 10) {
      console.log(`   ... and ${missingTranslations.length - 10} more`);
    }
  }
}

main().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});

