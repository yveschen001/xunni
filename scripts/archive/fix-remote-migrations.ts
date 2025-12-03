import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const MIGRATIONS_DIR = path.resolve('src/db/migrations');

async function main() {
  // 1. Get all migration files
  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort();

  // 2. Filter out 0058 (we want to apply that one)
  const filesToSkip = files.filter(f => !f.startsWith('0058'));

  console.log(`Found ${filesToSkip.length} migrations to skip.`);

  // 3. Generate SQL
  // D1 migrations table usually has columns: id, name, applied_at
  // We don't set ID, let it autoincrement.
  // We set applied_at to current timestamp.
  
  // Construct a large INSERT statement (or multiple)
  // INSERT INTO d1_migrations (name, applied_at) VALUES ('0001...', datetime('now')), ...
  
  const values = filesToSkip.map(f => `('${f}', datetime('now'))`).join(',\n');
  const sql = `INSERT INTO d1_migrations (name, applied_at) VALUES \n${values};`;

  console.log('Generated SQL length:', sql.length);
  
  // 4. Execute on Remote DB
  // We write to a temp file to avoid shell argument length limits
  const tempFile = 'temp_fix_migrations.sql';
  fs.writeFileSync(tempFile, sql);

  console.log('Executing SQL on remote DB...');
  try {
      execSync(`npx wrangler d1 execute DB --remote --file ${tempFile}`, { stdio: 'inherit' });
      console.log('✅ Successfully backfilled migration history.');
  } catch (e) {
      console.error('❌ Failed to execute SQL:', e);
  } finally {
      fs.unlinkSync(tempFile);
  }
}

main();

