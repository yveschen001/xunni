/**
 * Generate CSV from mapping file only (1939 keys + 120 countries = 2059 keys)
 * This is the correct CSV for translation, containing only the extracted keys
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

// 34 languages
const ALL_LANGUAGES = [
  'zh-TW', 'zh-CN', 'en', 'ja', 'ko', 'th', 'vi', 'id', 'ms', 'tl',
  'es', 'pt', 'fr', 'de', 'it', 'ru', 'ar', 'hi', 'bn', 'tr',
  'pl', 'uk', 'nl', 'sv', 'no', 'da', 'fi', 'cs', 'el', 'he',
  'fa', 'ur', 'sw', 'ro'
];

interface MappingEntry {
  original: string;
  key: string;
  category?: string;
}

// Escape CSV value
function escapeCSV(value: string): string {
  if (!value) return '';
  
  // Replace newlines with \n
  value = value.replace(/\n/g, '\\n');
  
  // Escape backticks
  value = value.replace(/`/g, '\\`');
  
  // Escape ${ (template variables)
  value = value.replace(/\$\{/g, '\\${');
  
  // Escape quotes by doubling them
  value = value.replace(/"/g, '""');
  
  // Always wrap in quotes
  return `"${value}"`;
}

async function main() {
  console.log('📥 Reading mapping file...');
  
  // Load mapping file
  const mappingPath = join(process.cwd(), 'i18n_keys_mapping_fixed.json');
  const mapping: Record<string, MappingEntry> = JSON.parse(
    readFileSync(mappingPath, 'utf-8')
  );
  
  console.log(`✅ Loaded ${Object.keys(mapping).length} entries from mapping file`);
  
  // Load country names
  console.log('📥 Reading COUNTRY_NAMES...');
  const countryFlagPath = join(process.cwd(), 'src', 'utils', 'country_flag.ts');
  const countryFlagContent = readFileSync(countryFlagPath, 'utf-8');
  const countryMatch = countryFlagContent.match(/const COUNTRY_NAMES: Record<string, string> = ({[\s\S]*?});/);
  
  if (!countryMatch) {
    throw new Error('Could not find COUNTRY_NAMES');
  }
  
  const countryNames: Record<string, string> = eval(`(${countryMatch[1]})`);
  console.log(`✅ Found ${Object.keys(countryNames).length} countries`);
  
  // Collect all keys
  const allKeys: Array<{ key: string; value: string }> = [];
  const countryKeysAdded = new Set<string>();
  
  // Add mapping keys (excluding countries.short* keys, we'll use countries.xx format instead)
  for (const entry of Object.values(mapping)) {
    if (entry && entry.key && entry.original) {
      // Skip countries.short* keys, we'll use countries.xx format
      if (entry.key.startsWith('countries.short')) {
        continue;
      }
      allKeys.push({ key: entry.key, value: entry.original });
    }
  }
  
  // Add country keys (countries.xx format)
  for (const [code, name] of Object.entries(countryNames)) {
    const key = `countries.${code.toLowerCase()}`;
    allKeys.push({ key, value: name });
    countryKeysAdded.add(key);
  }
  
  // Count mapping keys (excluding countries.short*)
  const mappingKeysCount = Object.values(mapping).filter(
    e => e && e.key && !e.key.startsWith('countries.short')
  ).length;
  
  console.log(`✅ Total keys: ${allKeys.length}`);
  console.log(`   - From mapping (excluding countries.short*): ${mappingKeysCount}`);
  console.log(`   - Countries (countries.xx format): ${Object.keys(countryNames).length}`);
  
  // Generate CSV
  console.log('\n📝 Generating CSV...');
  
  // CSV header
  const header = `key,${ALL_LANGUAGES.join(',')}`;
  const rows = [header];
  
  // Sort keys
  allKeys.sort((a, b) => a.key.localeCompare(b.key));
  
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
  
  console.log(`✅ Generated: ${csvPath}`);
  console.log(`   - Total keys: ${allKeys.length}`);
  console.log(`   - Languages: ${ALL_LANGUAGES.length}`);
  console.log(`   - zh-TW translations: ${allKeys.length} (100%)`);
  console.log(`   - Other languages: 0 (待翻译)`);
  console.log('\n🎉 CSV generation complete!');
  console.log('\n📊 This CSV contains:');
  console.log(`   - ${Object.values(mapping).length} keys from mapping file`);
  console.log(`   - ${Object.keys(countryNames).length} country codes`);
  console.log(`   - Total: ${allKeys.length} keys`);
}

main().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});

