/**
 * Add missing countries from COUNTRY_NAMES to locale file
 * COUNTRY_NAMES has 120 countries, but CSV only has 72
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

async function main() {
  console.log('📥 Reading COUNTRY_NAMES from country_flag.ts...');
  
  // Read country_flag.ts
  const countryFlagPath = join(process.cwd(), 'src', 'utils', 'country_flag.ts');
  const content = readFileSync(countryFlagPath, 'utf-8');
  
  // Extract COUNTRY_NAMES
  const match = content.match(/const COUNTRY_NAMES: Record<string, string> = ({[\s\S]*?});/);
  if (!match) {
    throw new Error('Could not find COUNTRY_NAMES');
  }
  
  const countryNames: Record<string, string> = eval(`(${match[1]})`);
  console.log(`✅ Found ${Object.keys(countryNames).length} countries in COUNTRY_NAMES`);
  
  // Load current zh-TW.ts
  const zhTWPath = join(process.cwd(), 'src', 'i18n', 'locales', 'zh-TW.ts');
  const zhTWContent = readFileSync(zhTWPath, 'utf-8');
  
  // Extract current translations
  const translationsMatch = zhTWContent.match(/export const translations: Translations = ({[\s\S]*});/);
  if (!translationsMatch) {
    throw new Error('Could not find translations object');
  }
  
  const currentTranslations: Record<string, Record<string, string>> = eval(`(${translationsMatch[1]})`);
  
  // Initialize countries namespace
  if (!currentTranslations.countries) {
    currentTranslations.countries = {};
  }
  
  // Add all countries with proper keys (using country code)
  console.log('\n📝 Adding countries...');
  let addedCount = 0;
  let existingCount = 0;
  
  for (const [code, name] of Object.entries(countryNames)) {
    // Use country code as key (e.g., 'TW', 'US')
    const key = code.toLowerCase(); // Use lowercase for consistency
    
    if (!currentTranslations.countries[key]) {
      currentTranslations.countries[key] = name;
      addedCount++;
    } else {
      existingCount++;
    }
  }
  
  console.log(`✅ Added ${addedCount} countries`);
  console.log(`✅ Existing: ${existingCount} countries`);
  console.log(`✅ Total countries in locale: ${Object.keys(currentTranslations.countries).length}`);
  
  // Generate new zh-TW.ts
  console.log('\n📝 Generating new zh-TW.ts...');
  
  let newContent = `import type { Translations } from '../types';\n\n`;
  newContent += `/**\n`;
  newContent += ` * zh-TW translations\n`;
  newContent += ` * Traditional Chinese (Taiwan)\n`;
  newContent += ` * Auto-generated from i18n_keys_mapping_fixed.json and COUNTRY_NAMES\n`;
  newContent += ` */\n`;
  newContent += `export const translations: Translations = {\n`;
  
  // Sort namespaces
  const namespaces = Object.keys(currentTranslations).sort();
  
  for (let i = 0; i < namespaces.length; i++) {
    const namespace = namespaces[i];
    const keys = currentTranslations[namespace];
    
    newContent += `  ${namespace}: {\n`;
    
    // Sort keys
    const keyNames = Object.keys(keys).sort();
    for (let j = 0; j < keyNames.length; j++) {
      const key = keyNames[j];
      const value = keys[key];
      
      // Escape value
      let escapedValue = value
        .replace(/\\/g, '\\\\')
        .replace(/`/g, '\\`')
        .replace(/\$\{/g, '\\${');
      
      // Quote key if needed
      const quotedKey = /[.-]/.test(key) ? `'${key}'` : key;
      
      newContent += `    ${quotedKey}: \`${escapedValue}\`,\n`;
    }
    
    newContent += `  },\n`;
  }
  
  newContent += `};\n`;
  
  // Write new file
  writeFileSync(zhTWPath, newContent, 'utf-8');
  
  console.log(`✅ Updated: ${zhTWPath}`);
  console.log(`\n📊 Summary:`);
  console.log(`   - Countries in COUNTRY_NAMES: ${Object.keys(countryNames).length}`);
  console.log(`   - Countries in locale: ${Object.keys(currentTranslations.countries).length}`);
  console.log(`\n🎉 Complete!`);
}

main().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});

