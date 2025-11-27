
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const csvPath = path.resolve(__dirname, '../i18n_for_translation.csv');

const content = fs.readFileSync(csvPath, 'utf-8');
const records = parse(content, {
  columns: true,
  skip_empty_lines: true,
  relax_column_count: true
});

const record = records.find((r: any) => r.key === 'profile.age');

if (record) {
    console.log('--- CSV: profile.age (ja) ---');
    console.log(JSON.stringify(record.ja));
    console.log('--- CSV: profile.age (zh-TW) ---');
    console.log(JSON.stringify(record['zh-TW']));
} else {
    console.log('Record not found');
}

