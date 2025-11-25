/**
 * Generate i18n_for_translation.csv from existing locale files
 * Reads zh-TW.ts and generates CSV with all keys and translations
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

// 34 languages (including zh-TW)
const ALL_LANGUAGES = [
  'zh-TW', 'zh-CN', 'en', 'ja', 'ko', 'th', 'vi', 'id', 'ms', 'tl',
  'es', 'pt', 'fr', 'de', 'it', 'ru', 'ar', 'hi', 'bn', 'tr',
  'pl', 'uk', 'nl', 'sv', 'no', 'da', 'fi', 'cs', 'el', 'he',
  'fa', 'ur', 'sw', 'ro'
];

interface Translations {
  [namespace: string]: {
    [key: string]: string;
  };
}

// Escape CSV value (proper CSV escaping)
function escapeCSV(value: string): string {
  if (!value) return '';
  
  // Replace actual newlines with \n (for display in CSV)
  value = value.replace(/\n/g, '\\n');
  
  // Escape backticks (they might be in template strings)
  value = value.replace(/`/g, '\\`');
  
  // Escape ${ (template variables)
  value = value.replace(/\$\{/g, '\\${');
  
  // Escape quotes by doubling them
  value = value.replace(/"/g, '""');
  
  // Always wrap in quotes for safety (CSV standard)
  return `"${value}"`;
}

// Extract all keys from translations object
function extractKeys(translations: Translations, prefix: string = ''): Array<{ key: string; value: string }> {
  const result: Array<{ key: string; value: string }> = [];
  
  for (const [namespace, keys] of Object.entries(translations)) {
    const fullPrefix = prefix ? `${prefix}.${namespace}` : namespace;
    
    for (const [key, value] of Object.entries(keys)) {
      const fullKey = `${fullPrefix}.${key}`;
      result.push({ key: fullKey, value });
    }
  }
  
  return result;
}

async function main() {
  console.log('📥 Reading zh-TW locale file...');
  
  // Read zh-TW.ts
  const zhTWPath = join(process.cwd(), 'src', 'i18n', 'locales', 'zh-TW.ts');
  const zhTWContent = readFileSync(zhTWPath, 'utf-8');
  
  // Extract translations object using eval (safe in this context)
  // We'll use a regex to extract the translations object
  const translationsMatch = zhTWContent.match(/export const translations: Translations = ({[\s\S]*});/);
  
  if (!translationsMatch) {
    throw new Error('Could not find translations object in zh-TW.ts');
  }
  
  // Replace ALL variable references with safe placeholders before eval
  // This allows us to parse the file even with variable references
  // We replace ${...} with a placeholder string, preserving the structure
  let safeCode = translationsMatch[1]
    // First, replace escaped template strings (\${...}) - these are literal text, not code
    // We need to preserve these as-is, so we temporarily mark them
    .replace(/\\\$\{([^}]+)\}/g, '__ESCAPED_TEMPLATE_$1__')
    // Now replace all ${...} template expressions with placeholder
    .replace(/\$\{([^}]+)\}/g, '"PLACEHOLDER"')
    // Restore escaped templates
    .replace(/__ESCAPED_TEMPLATE_([^_]+)__/g, '\\${$1}');
  
  // Evaluate the translations object
  const translations: Translations = eval(`(${safeCode})`);
  
  console.log(`✅ Loaded translations from zh-TW.ts`);
  
  // Extract all keys
  const allKeys = extractKeys(translations);
  console.log(`✅ Extracted ${allKeys.length} translation keys`);
  
  // Generate CSV
  console.log('\n📝 Generating CSV...');
  
  // CSV header
  const header = `key,${ALL_LANGUAGES.join(',')}`;
  const rows = [header];
  
  // Generate rows
  for (const { key, value } of allKeys) {
    const zhTWValue = escapeCSV(value);
    // Empty columns for other languages (33 languages after zh-TW)
    const emptyCols = ALL_LANGUAGES.slice(1).map(() => '""').join(',');
    rows.push(`${escapeCSV(key)},${zhTWValue},${emptyCols}`);
  }
  
  // Write CSV file
  const csvPath = join(process.cwd(), 'i18n_for_translation.csv');
  writeFileSync(csvPath, rows.join('\n'), 'utf-8');
  
  console.log(`✅ Generated: i18n_for_translation.csv`);
  console.log(`   - Total keys: ${allKeys.length}`);
  console.log(`   - Languages: ${ALL_LANGUAGES.length}`);
  console.log(`   - zh-TW translations: ${allKeys.length} (100%)`);
  console.log(`   - Other languages: 0 (待翻译)`);
  console.log('\n🎉 CSV generation complete!');
}

main().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});

