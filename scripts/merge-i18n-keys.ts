/**
 * Merge extracted i18n keys with existing CSV
 * 
 * This script:
 * 1. Reads existing i18n_translation_template.csv
 * 2. Reads newly extracted i18n_extracted.csv
 * 3. Merges them (avoiding duplicates)
 * 4. Generates final CSV for translation
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { parse } from 'csv-parse/sync';

const EXISTING_CSV = join(process.cwd(), 'i18n_translation_template.csv');
const EXTRACTED_CSV = join(process.cwd(), 'i18n_extracted.csv');
const OUTPUT_CSV = join(process.cwd(), 'i18n_final_template.csv');

interface I18nEntry {
  key: string;
  zhTW: string;
  zhCN: string;
  en: string;
  [key: string]: string;
}

console.log('🔄 Merging i18n keys...\n');

// Read existing CSV
console.log('📖 Reading existing CSV...');
const existingContent = readFileSync(EXISTING_CSV, 'utf-8');
const existingRecords = parse(existingContent, {
  columns: true,
  skip_empty_lines: true,
  relax_column_count: true,
});

console.log(`   Found ${existingRecords.length} existing keys`);

// Read extracted CSV
console.log('📖 Reading extracted CSV...');
const extractedContent = readFileSync(EXTRACTED_CSV, 'utf-8');
const extractedRecords = parse(extractedContent, {
  columns: true,
  skip_empty_lines: true,
});

console.log(`   Found ${extractedRecords.length} extracted keys`);

// Create a map of existing keys
const existingKeys = new Set(existingRecords.map((r: any) => {
  // Handle both formats: "key,subkey,..." and "category.subcategory.key"
  if (r.key) return r.key;
  // For CSV with multiple columns, join them
  const cols = Object.keys(r);
  if (cols.length > 0) {
    return cols[0]; // First column is usually the key
  }
  return '';
}));

// Find new keys
const newKeys: any[] = [];
for (const record of extractedRecords) {
  if (!existingKeys.has(record.key)) {
    newKeys.push(record);
  }
}

console.log(`\n📊 Analysis:`);
console.log(`   Existing keys: ${existingKeys.size}`);
console.log(`   Extracted keys: ${extractedRecords.length}`);
console.log(`   New keys to add: ${newKeys.length}`);
console.log(`   Duplicates skipped: ${extractedRecords.length - newKeys.length}`);

// Merge: existing + new
const mergedRecords = [...existingRecords, ...newKeys];

console.log(`\n✅ Total keys after merge: ${mergedRecords.length}`);

// Write merged CSV
console.log(`\n💾 Writing merged CSV to: ${OUTPUT_CSV}`);

// Get all language columns from existing CSV
const firstRecord = existingRecords[0] || {};
const columns = Object.keys(firstRecord);

// Write CSV header
let csvContent = columns.join(',') + '\n';

// Write records
for (const record of mergedRecords) {
  const row = columns.map(col => {
    const value = record[col] || '';
    // Escape quotes and wrap in quotes if contains comma or newline
    if (value.includes(',') || value.includes('\n') || value.includes('"')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }).join(',');
  csvContent += row + '\n';
}

writeFileSync(OUTPUT_CSV, csvContent, 'utf-8');

console.log(`✅ Merged CSV saved!`);
console.log(`\n📋 Summary:`);
console.log(`   - Original keys: ${existingKeys.size}`);
console.log(`   - New keys added: ${newKeys.length}`);
console.log(`   - Total keys: ${mergedRecords.length}`);
console.log(`\n🎯 Next step: Translate the new keys in ${OUTPUT_CSV}`);

