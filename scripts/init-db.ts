/**
 * Initialize D1 Database
 * Run migration scripts to create tables
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MIGRATION_FILE = path.join(__dirname, '../src/db/migrations/0001_initial_schema.sql');

async function initDatabase() {
  console.log('📦 Initializing D1 Database...\n');

  // Read migration SQL
  const sql = fs.readFileSync(MIGRATION_FILE, 'utf-8');

  console.log('📄 Migration SQL:');
  console.log('─'.repeat(80));
  console.log(sql.substring(0, 500) + '...\n');
  console.log('─'.repeat(80));

  console.log('\n✅ Migration SQL loaded successfully!');
  console.log('\n📝 To apply this migration, run:');
  console.log('\n  wrangler d1 execute xunni-db --local --file=src/db/migrations/0001_initial_schema.sql');
  console.log('\n  # For production:');
  console.log('  wrangler d1 execute xunni-db --file=src/db/migrations/0001_initial_schema.sql\n');
}

initDatabase().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});

