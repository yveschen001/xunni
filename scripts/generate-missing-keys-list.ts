/**
 * Generate a list of missing i18n keys that need to be added to CSV
 * This script extracts keys from code and compares with CSV
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { parse } from 'csv-parse/sync';

interface CSVRow {
  key: string;
  [language: string]: string;
}

async function main() {
  console.log('🔍 Checking missing i18n keys...\n');
  
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
  
  // Read zh-TW.ts to get all keys
  const zhTWPath = join(process.cwd(), 'src', 'i18n', 'locales', 'zh-TW.ts');
  const zhTWContent = readFileSync(zhTWPath, 'utf-8');
  
  // Extract all keys using regex (simple pattern matching)
  // Match: key: `value` or 'key': `value`
  const keyPattern = /(['"]?)([\w.]+)\1:\s*`([^`]*(?:`[^`]*`)*[^`]*)`/g;
  const zhTWKeys = new Set<string>();
  const keyToValue = new Map<string, string>();
  
  let match;
  while ((match = keyPattern.exec(zhTWContent)) !== null) {
    const fullKey = match[2];
    let value = match[3];
    
    // Unescape
    value = value.replace(/\\n/g, '\n');
    value = value.replace(/\\`/g, '`');
    value = value.replace(/\\\$\{/g, '${');
    value = value.replace(/\\\\/g, '\\');
    
    // Handle nested keys (namespace.key format)
    if (fullKey.includes('.')) {
      zhTWKeys.add(fullKey);
      keyToValue.set(fullKey, value);
    } else {
      // Try to find namespace from context
      // For now, just add as-is
      zhTWKeys.add(fullKey);
      keyToValue.set(fullKey, value);
    }
  }
  
  console.log(`✅ Found ${zhTWKeys.size} keys in zh-TW.ts (approximate)`);
  
  // Find missing keys
  const missingKeys: Array<{ key: string; value: string }> = [];
  for (const key of zhTWKeys) {
    if (!csvKeys.has(key)) {
      const value = keyToValue.get(key) || '';
      missingKeys.push({ key, value });
    }
  }
  
  console.log(`\n📊 Analysis:`);
  console.log(`   - Keys in CSV: ${csvKeys.size}`);
  console.log(`   - Keys in zh-TW.ts: ${zhTWKeys.size} (approximate)`);
  console.log(`   - Missing keys: ${missingKeys.length}`);
  
  if (missingKeys.length === 0) {
    console.log('\n✅ All keys are already in CSV!');
    return;
  }
  
  // Generate CSV rows for missing keys
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
  
  console.log(`\n📝 Generating missing keys CSV...`);
  
  const rows: string[] = [];
  for (const { key, value } of missingKeys) {
    const keyEscaped = escapeCSV(key);
    const valueEscaped = escapeCSV(value);
    const emptyCols = ALL_LANGUAGES.slice(1).map(() => '""').join(',');
    rows.push(`${keyEscaped},${valueEscaped},${emptyCols}`);
  }
  
  // Write to file
  const outputPath = join(process.cwd(), 'missing_keys_for_csv.txt');
  writeFileSync(outputPath, rows.join('\n'), 'utf-8');
  
  console.log(`✅ Generated: ${outputPath}`);
  console.log(`   - Contains ${missingKeys.length} missing keys`);
  console.log(`\n💡 Instructions:`);
  console.log(`   1. Open ${outputPath}`);
  console.log(`   2. Copy all lines`);
  console.log(`   3. Append to the end of i18n_for_translation.csv`);
  console.log(`   4. This preserves the existing CSV order`);
  
  // Also show first 10 keys as preview
  console.log(`\n📋 Preview (first 10 missing keys):`);
  missingKeys.slice(0, 10).forEach(({ key }) => {
    console.log(`   - ${key}`);
  });
  if (missingKeys.length > 10) {
    console.log(`   ... and ${missingKeys.length - 10} more`);
  }
}

main().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});

