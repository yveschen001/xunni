
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CSV_FILE_PATH = path.resolve(__dirname, '../i18n_for_translation.csv');
const LOCALES_DIR = path.resolve(__dirname, '../src/i18n/locales');

// Supported Languages (excluding zh-TW which is source)
const LANGUAGES = [
  'zh-CN', 'en', 'ja', 'ko', 'vi', 'th', 'id', 'ms', 'tl',
  'hi', 'ar', 'ur', 'fa', 'he', 'tr', 'ru', 'uk', 'pl', 'cs',
  'ro', 'hu', 'bn', 'hr', 'sk', 'sl', 'sr', 'mk', 'sq', 'el',
  'de', 'fr', 'es', 'it', 'pt', 'nl', 'sv', 'no', 'da', 'fi'
];

function flattenObject(obj: any, prefix = ''): Record<string, string> {
  return Object.keys(obj).reduce((acc: Record<string, string>, k: string) => {
    const pre = prefix.length ? prefix + '.' : '';
    if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
      Object.assign(acc, flattenObject(obj[k], pre + k));
    } else {
      acc[pre + k] = String(obj[k]);
    }
    return acc;
  }, {});
}

async function rebuildCsv() {
  console.log('🏗️ Starting CSV Rebuild from Locale Files...');

  if (!fs.existsSync(CSV_FILE_PATH)) {
    console.error('❌ CSV file not found!');
    return;
  }

  // Read CSV
  const fileContent = fs.readFileSync(CSV_FILE_PATH, 'utf-8');
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true
  });

  console.log(`- Loaded ${records.length} records from skeleton CSV.`);

  // Create a map for fast lookup
  const recordsMap = new Map<string, any>();
  records.forEach((r: any) => recordsMap.set(r.key, r));

  // Iterate languages
  for (const lang of LANGUAGES) {
    const localePath = path.join(LOCALES_DIR, lang, 'index.ts');
    if (!fs.existsSync(localePath)) {
      console.warn(`⚠️ Locale file not found for ${lang}, skipping.`);
      continue;
    }

    console.log(`- Processing ${lang}...`);
    try {
      // Import the translations
      // We use a relative path for dynamic import. tsx should handle this.
      const modulePath = `../src/i18n/locales/${lang}/index.ts`;
      const module = await import(modulePath);
      const translations = module.translations || module.default;

      if (!translations) {
        console.warn(`  ❌ No translations found in ${modulePath}`);
        continue;
      }

      const flatTranslations = flattenObject(translations);
      let updatedCount = 0;

      for (const [key, value] of Object.entries(flatTranslations)) {
        const record = recordsMap.get(key);
        if (record) {
          record[lang] = value;
          updatedCount++;
        }
      }
      console.log(`  ✅ Updated ${updatedCount} keys.`);

    } catch (e) {
      console.error(`  ❌ Error processing ${lang}:`, e);
    }
  }

  // Write back
  const csvContent = stringify(records, {
    header: true,
    columns: Object.keys(records[0])
  });

  fs.writeFileSync(CSV_FILE_PATH, csvContent);
  console.log(`✅ CSV Rebuild Complete! Saved to ${CSV_FILE_PATH}`);
}

rebuildCsv();

