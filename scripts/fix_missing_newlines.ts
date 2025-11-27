
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CSV_FILE_PATH = path.resolve(__dirname, '../i18n_for_translation.csv');

// Load CSV
console.log('📖 Reading CSV...');
const content = fs.readFileSync(CSV_FILE_PATH, 'utf-8');
const records = parse(content, {
  columns: true,
  skip_empty_lines: true,
  relax_column_count: true
});

let fixedCount = 0;
const languages = Object.keys(records[0]).filter(k => k !== 'key' && k !== 'zh-TW');

console.log(`🔍 Checking ${records.length} records...`);

for (const record of records) {
  const zhTwVal = record['zh-TW'];
  if (!zhTwVal) continue;

  // Check if source ends with newline
  // Note: CSV parser handles \n. If it was literally \n characters in the file, parser reads it as newline.
  // We check for actual newline character
  const hasNewline = zhTwVal.endsWith('\n');
  const hasDoubleNewline = zhTwVal.endsWith('\n\n');

  if (hasNewline) {
    for (const lang of languages) {
      let val = record[lang];
      if (!val || val === '[需要翻译]') continue;

      // If source has \n\n (double), ensure target has at least \n\n? 
      // Or just strictly match the suffix?
      
      // Strict suffix match strategy
      if (hasDoubleNewline) {
        if (!val.endsWith('\n\n')) {
             // If it ends with one \n, add another
             if (val.endsWith('\n')) {
                 record[lang] = val + '\n';
             } else {
                 record[lang] = val + '\n\n';
             }
             fixedCount++;
             // console.log(`Fixed ${record.key} [${lang}]: Added \\n\\n`);
        }
      } else {
        // Source has single \n (or maybe more but ends with at least one)
        if (!val.endsWith('\n')) {
            record[lang] = val + '\n';
            fixedCount++;
            // console.log(`Fixed ${record.key} [${lang}]: Added \\n`);
        }
      }
    }
  }
}

if (fixedCount > 0) {
  console.log(`✅ Fixed ${fixedCount} missing newlines.`);
  const output = stringify(records, {
    header: true,
    columns: Object.keys(records[0])
  });
  fs.writeFileSync(CSV_FILE_PATH, output);
  console.log('💾 CSV saved.');
} else {
  console.log('✨ No missing newlines found.');
}

