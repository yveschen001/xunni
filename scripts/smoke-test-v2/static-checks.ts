import * as fs from 'fs';
import * as path from 'path';
import { SmartRunner } from './runner';

export async function runStaticChecks(runner: SmartRunner) {
  // 1. Migration Check
  await runner.runSuite('static', 'Migration Completeness', async () => {
    const migrationDir = path.resolve('src/db/migrations');
    if (!fs.existsSync(migrationDir)) {
      throw new Error('Migration directory missing');
    }
    const files = fs.readdirSync(migrationDir);
    const sqlFiles = files.filter(f => f.endsWith('.sql'));
    if (sqlFiles.length === 0) {
      throw new Error('No migration files found');
    }
    // Basic check: file naming convention 0000_name.sql
    const invalidNames = sqlFiles.filter(f => !/^\d{4}_/.test(f));
    if (invalidNames.length > 0) {
      throw new Error(`Invalid migration filenames: ${invalidNames.join(', ')}`);
    }
  });

  // 2. i18n Check (Basic existence)
  await runner.runSuite('static', 'i18n Structure', async () => {
    const i18nDir = path.resolve('src/i18n/locales');
    if (!fs.existsSync(i18nDir)) {
      throw new Error('i18n directory missing');
    }
    const zhTWPath = path.join(i18nDir, 'zh-TW.ts');
    if (!fs.existsSync(zhTWPath)) {
      throw new Error('Base language (zh-TW) missing');
    }
  });
  
  // 3. Environment Config Check (wrangler.toml)
  await runner.runSuite('static', 'Environment Config', async () => {
      const wranglerPath = path.resolve('wrangler.toml');
      if (!fs.existsSync(wranglerPath)) {
          throw new Error('wrangler.toml missing');
      }
      const content = fs.readFileSync(wranglerPath, 'utf-8');
      if (!content.includes('MOONPACKET_API_SECRET')) {
          throw new Error('MOONPACKET_API_SECRET missing in wrangler.toml');
      }
  });
}

