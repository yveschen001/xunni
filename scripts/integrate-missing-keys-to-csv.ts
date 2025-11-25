/**
 * Integrate missing i18n keys directly into existing CSV
 * Extracts keys from code, finds translations in zh-TW.ts, and appends to CSV
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
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

function escapeCSV(value: string): string {
  if (!value) return '';
  value = value.replace(/\n/g, '\\n');
  value = value.replace(/`/g, '\\`');
  value = value.replace(/\$\{/g, '\\${');
  value = value.replace(/"/g, '""');
  return `"${value}"`;
}

// Extract i18n keys from code
function extractI18nKeysFromCode(): Set<string> {
  const srcDir = join(process.cwd(), 'src');
  const keys = new Set<string>();
  
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

// Build translation map from zh-TW.ts (using same logic as generate-missing-keys-from-check.ts)
function buildZhTWKeyMap(zhTWContent: string): Map<string, string> {
  const keyMap = new Map<string, string>();
  
  // Match all key: `value` patterns (handle nested structures)
  const keyValuePattern = /(['"]?)([\w.]+)\1:\s*`([^`]*(?:`[^`]*`)*[^`]*)`/g;
  
  let match;
  while ((match = keyValuePattern.exec(zhTWContent)) !== null) {
    const key = match[2];
    let value = match[3];
    value = unescapeValue(value);
    keyMap.set(key, value);
  }
  
  // Find namespace blocks and reconstruct full keys
  const namespacePattern = /(\w+):\s*\{/g;
  const namespaces: Array<{ name: string; start: number; end: number }> = [];
  
  let nsMatch;
  while ((nsMatch = namespacePattern.exec(zhTWContent)) !== null) {
    const namespace = nsMatch[1];
    const start = nsMatch.index + nsMatch[0].length;
    
    let braceCount = 1;
    let end = start;
    for (let i = start; i < zhTWContent.length && braceCount > 0; i++) {
      if (zhTWContent[i] === '{') braceCount++;
      if (zhTWContent[i] === '}') braceCount--;
      if (braceCount === 0) {
        end = i;
        break;
      }
    }
    
    namespaces.push({ name: namespace, start, end });
  }
  
  // For each namespace, extract keys with full path
  for (const { name, start, end } of namespaces) {
    const nsContent = zhTWContent.substring(start, end);
    
    const nsKeyPattern = /(['"]?)([\w.]+)\1:\s*`([^`]*(?:`[^`]*`)*[^`]*)`/g;
    let keyMatch;
    while ((keyMatch = nsKeyPattern.exec(nsContent)) !== null) {
      const keyName = keyMatch[2];
      let value = keyMatch[3];
      value = unescapeValue(value);
      
      const afterKey = nsContent.substring(keyMatch.index + keyMatch[0].length);
      if (afterKey.trim().startsWith('{')) {
        continue; // Skip nested namespaces for now
      }
      
      const fullKey = `${name}.${keyName}`;
      keyMap.set(fullKey, value);
    }
  }
  
  // Handle nested namespaces (e.g., admin.ban.noPermission)
  const nestedPattern = /(\w+):\s*\{([^}]+)\}/g;
  for (const { name, start, end } of namespaces) {
    const nsContent = zhTWContent.substring(start, end);
    let nestedMatch;
    while ((nestedMatch = nestedPattern.exec(nsContent)) !== null) {
      const subNamespace = nestedMatch[1];
      const subContent = nestedMatch[2];
      
      const subKeyPattern = /(['"]?)([\w.]+)\1:\s*`([^`]*(?:`[^`]*`)*[^`]*)`/g;
      let subKeyMatch;
      while ((subKeyMatch = subKeyPattern.exec(subContent)) !== null) {
        const keyName = subKeyMatch[2];
        let value = subKeyMatch[3];
        value = unescapeValue(value);
        
        const fullKey = `${name}.${subNamespace}.${keyName}`;
        keyMap.set(fullKey, value);
      }
    }
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
  console.log(`✅ Found ${csvKeys.size} keys in CSV`);
  
  // Find missing keys
  const missingKeys = Array.from(codeKeys).filter(key => !csvKeys.has(key));
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
  
  // Add missing keys to CSV
  console.log(`\n📝 Adding missing keys to CSV...`);
  
  let foundTranslations = 0;
  let missingTranslations = 0;
  
  for (const key of missingKeys.sort()) {
    const value = keyMap.get(key) || '';
    
    if (value) {
      foundTranslations++;
    } else {
      missingTranslations++;
      console.log(`⚠️  Missing translation for: ${key}`);
    }
    
    // Create new row
    const newRow: CSVRow = { key };
    newRow['zh-TW'] = value || '[需要从 zh-TW.ts 获取翻译]';
    // Fill other language columns as empty
    ALL_LANGUAGES.slice(1).forEach(lang => {
      newRow[lang] = '';
    });
    
    records.push(newRow);
  }
  
  // Write updated CSV
  const header = `key,${ALL_LANGUAGES.join(',')}`;
  const rows = [header];
  
  for (const record of records) {
    const key = escapeCSV(record.key);
    const values = ALL_LANGUAGES.map(lang => {
      const value = record[lang] || '';
      return escapeCSV(value);
    });
    rows.push(`${key},${values.join(',')}`);
  }
  
  // Backup existing CSV
  const backupPath = `${csvPath}.backup.${Date.now()}`;
  writeFileSync(backupPath, csvContent, 'utf-8');
  console.log(`✅ Backed up existing CSV to: ${backupPath}`);
  
  // Write updated CSV
  writeFileSync(csvPath, rows.join('\n'), 'utf-8');
  
  console.log(`\n✅ Updated CSV file: ${csvPath}`);
  console.log(`   - Total keys: ${records.length}`);
  console.log(`   - New keys added: ${missingKeys.length}`);
  console.log(`   - Found translations: ${foundTranslations}`);
  console.log(`   - Missing translations: ${missingTranslations}`);
  
  if (missingTranslations > 0) {
    console.log(`\n⚠️  ${missingTranslations} keys need manual translation lookup in zh-TW.ts`);
    console.log(`   Search for these keys in src/i18n/locales/zh-TW.ts and update CSV manually`);
  }
  
  // Verify
  console.log(`\n🔍 Verifying...`);
  const verifyCheck = await import('./check-hardcoded-chinese.js');
  // Run check to see if alignment improved
  console.log(`\n💡 Run 'pnpm check:i18n' to verify alignment`);
}

main().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});

