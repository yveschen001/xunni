
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';

const CSV_FILE_PATH = path.resolve(process.cwd(), 'i18n_for_translation.csv');

function cleanCsv() {
  console.log('🧹 Starting CSV Cleanup (Debug)...');

  if (!fs.existsSync(CSV_FILE_PATH)) {
    console.error('❌ CSV file not found!');
    return;
  }

  const fileContent = fs.readFileSync(CSV_FILE_PATH, 'utf-8');
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
    relax_quotes: true,
  });

  console.log(`- Loaded ${records.length} records.`);

  const keysToRemove = new Set([
    'bottle.bottle13',
    'bottle.cancelled',
    'bottle.friendlyContent',
    'bottle.selected',
    'bottle.selectedItem'
  ]);

  const patternsToRemove = [
    /^bottle\.catch\./,
  ];

  let removedCount = 0;

  const cleanedRecords = records.filter((record: any) => {
    const key = record.key;
    if (!key) return false;

    // Debug: Check a specific key
    if (key === 'bottle.catch.catch') {
        console.log(`DEBUG: Found 'bottle.catch.catch'. Testing regex...`);
        console.log(`Regex test: ${patternsToRemove[0].test(key)}`);
    }

    if (keysToRemove.has(key)) {
      console.log(`  🗑️ Removing dead key: ${key}`);
      removedCount++;
      return false;
    }

    for (const pattern of patternsToRemove) {
      if (pattern.test(key)) {
        console.log(`  🗑️ Removing pattern match: ${key}`);
        removedCount++;
        return false;
      }
    }

    return true;
  });

  console.log(`- Removed ${removedCount} records.`);
  console.log(`- Remaining ${cleanedRecords.length} records.`);

  const csvContent = stringify(cleanedRecords, {
    header: true,
    columns: Object.keys(records[0])
  });

  fs.writeFileSync(CSV_FILE_PATH, csvContent);
  console.log(`✅ CSV Cleaned and Saved to ${CSV_FILE_PATH}`);
}

cleanCsv();
