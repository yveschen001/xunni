
const fs = require('fs');
const path = require('path');

const MIGRATIONS_DIR = path.join(process.cwd(), 'src/db/migrations');
const OUTPUT_FILE = path.join(process.cwd(), 'full_migration.sql');

// Skip 0001 as it's already applied
const files = fs.readdirSync(MIGRATIONS_DIR)
  .filter(f => f.endsWith('.sql') && f !== '0001_initial_schema.sql')
  .sort();

let fullSql = '';

files.forEach(file => {
  const content = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf-8');
  fullSql += `\n-- Migration: ${file}\n`;
  fullSql += content + '\n';
});

fs.writeFileSync(OUTPUT_FILE, fullSql);
console.log(`Created ${OUTPUT_FILE} with ${files.length} migrations.`);

