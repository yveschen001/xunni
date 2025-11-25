/**
 * Generate missing i18n keys list based on pnpm check:i18n results
 * Extracts keys used in code but not in CSV, then generates CSV rows to append
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

// Build a complete map of all keys in zh-TW.ts
function buildZhTWKeyMap(zhTWContent: string): Map<string, string> {
  const keyMap = new Map<string, string>();
  
  // Match all key: `value` patterns (handle nested structures)
  // This regex matches: key: `value` or 'key': `value`
  // It handles multi-line template strings
  const keyValuePattern = /(['"]?)([\w.]+)\1:\s*`([^`]*(?:`[^`]*`)*[^`]*)`/g;
  
  let match;
  while ((match = keyValuePattern.exec(zhTWContent)) !== null) {
    const key = match[2];
    let value = match[3];
    value = unescapeValue(value);
    
    // Store the key-value pair
    // Note: This captures all keys, including nested ones
    // We'll need to reconstruct the full path from context
    keyMap.set(key, value);
  }
  
  // Now build full paths by analyzing structure
  // Find namespace blocks and reconstruct full keys
  const namespacePattern = /(\w+):\s*\{/g;
  const namespaces: Array<{ name: string; start: number; end: number }> = [];
  
  let nsMatch;
  while ((nsMatch = namespacePattern.exec(zhTWContent)) !== null) {
    const namespace = nsMatch[1];
    const start = nsMatch.index + nsMatch[0].length;
    
    // Find matching closing brace
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
    
    // Extract keys in this namespace
    const nsKeyPattern = /(['"]?)([\w.]+)\1:\s*`([^`]*(?:`[^`]*`)*[^`]*)`/g;
    let keyMatch;
    while ((keyMatch = nsKeyPattern.exec(nsContent)) !== null) {
      const keyName = keyMatch[2];
      let value = keyMatch[3];
      value = unescapeValue(value);
      
      // Check if this is a nested namespace (has { after :)
      const afterKey = nsContent.substring(keyMatch.index + keyMatch[0].length);
      if (afterKey.trim().startsWith('{')) {
        // This is a nested namespace, skip for now (handle separately)
        continue;
      }
      
      // Store as namespace.key
      const fullKey = `${name}.${keyName}`;
      keyMap.set(fullKey, value);
    }
  }
  
  // Handle nested namespaces (e.g., admin.ban.noPermission)
  // Find patterns like: ban: { noPermission: `...` }
  const nestedPattern = /(\w+):\s*\{([^}]+)\}/g;
  for (const { name, start, end } of namespaces) {
    const nsContent = zhTWContent.substring(start, end);
    let nestedMatch;
    while ((nestedMatch = nestedPattern.exec(nsContent)) !== null) {
      const subNamespace = nestedMatch[1];
      const subContent = nestedMatch[2];
      
      // Extract keys in sub-namespace
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

// Get translation value from zh-TW.ts using the built map
function getTranslationValue(key: string, keyMap: Map<string, string>): string {
  return keyMap.get(key) || '';
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
  
  // Read CSV
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
  
  console.log(`\n📝 Generating CSV rows for missing keys...`);
  
  const rows: string[] = [];
  let foundTranslations = 0;
  
  for (const key of missingKeys.sort()) {
    const value = getTranslationValue(key, keyMap);
    if (value) {
      foundTranslations++;
    }
    
    const keyEscaped = escapeCSV(key);
    const valueEscaped = escapeCSV(value || '[需要从 zh-TW.ts 获取翻译]');
    const emptyCols = ALL_LANGUAGES.slice(1).map(() => '""').join(',');
    rows.push(`${keyEscaped},${valueEscaped},${emptyCols}`);
  }
  
  // Write to file
  const outputPath = join(process.cwd(), 'missing_keys_for_csv.txt');
  writeFileSync(outputPath, rows.join('\n'), 'utf-8');
  
  console.log(`✅ Generated: ${outputPath}`);
  console.log(`   - Total missing keys: ${missingKeys.length}`);
  console.log(`   - Found translations: ${foundTranslations}`);
  console.log(`   - Need manual lookup: ${missingKeys.length - foundTranslations}`);
  console.log(`\n💡 Instructions:`);
  console.log(`   1. Open ${outputPath}`);
  console.log(`   2. Review and fix any "[需要从 zh-TW.ts 获取翻译]" placeholders`);
  console.log(`   3. Copy all lines`);
  console.log(`   4. Append to the end of i18n_for_translation.csv`);
  console.log(`   5. This preserves the existing CSV order`);
  
  // Show preview
  console.log(`\n📋 Preview (first 20 missing keys):`);
  missingKeys.slice(0, 20).forEach(key => {
    const value = getTranslationValue(key, keyMap);
    console.log(`   - ${key}${value ? ' ✅' : ' ⚠️  (need translation)'}`);
  });
  if (missingKeys.length > 20) {
    console.log(`   ... and ${missingKeys.length - 20} more`);
  }
}

main().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});

