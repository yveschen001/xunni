import { readdirSync, statSync, writeFileSync, unlinkSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Usage: ts-node scripts/upload-i18n-to-kv.ts [staging|production]
const ENV = process.argv[2] || 'staging'; 
const LOCALES_DIR = resolve(__dirname, '../src/i18n/locales');
const TEMP_FILE = resolve(__dirname, '../temp_i18n_upload.json');

async function main() {
  console.log(`🚀 Starting i18n upload to KV for environment: [${ENV}]`);
  console.log(`📂 Locales Directory: ${LOCALES_DIR}`);

  // 1. Get all languages
  const languages = readdirSync(LOCALES_DIR).filter(f => 
    statSync(join(LOCALES_DIR, f)).isDirectory()
  );

  console.log(`🌍 Found ${languages.length} languages: ${languages.join(', ')}`);

  for (const lang of languages) {
    console.log(`\nProcessing [${lang}]...`);
    try {
      // Dynamic import the locale module
      // Note: We use dynamic import so ts-node compiles it on the fly
      const modulePath = join(LOCALES_DIR, lang, 'index.ts');
      const mod = await import(modulePath);
      const translations = mod.translations || mod.default;

      if (!translations) {
        console.error(`❌ No translations found for ${lang} (export 'translations' or default missing)`);
        continue;
      }

      const jsonStr = JSON.stringify(translations);
      console.log(`  - Size: ${(jsonStr.length / 1024).toFixed(2)} KB`);

      // Write to temp file
      writeFileSync(TEMP_FILE, jsonStr);

      // Upload to KV using wrangler
      // We use --binding I18N_DATA which is defined in wrangler.toml for the specific env
      console.log(`  - Uploading to KV...`);
      execSync(`npx wrangler kv:key put "locale:${lang}" --path "${TEMP_FILE}" --binding I18N_DATA --env ${ENV}`, {
        stdio: 'inherit' 
      });

    } catch (error) {
      console.error(`❌ Failed to process ${lang}:`, error);
    }
  }

  // Cleanup
  try {
    if (require('fs').existsSync(TEMP_FILE)) {
      unlinkSync(TEMP_FILE);
    }
  } catch (e) {}
  
  console.log('\n✅ All uploads completed successfully!');
}

main().catch(err => {
  console.error('Fatal Error:', err);
  process.exit(1);
});
