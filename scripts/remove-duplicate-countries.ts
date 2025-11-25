/**
 * Remove duplicate countries (countries.short*) and keep only countries.xx format
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

async function main() {
  console.log('📥 Reading zh-TW.ts...');
  
  const zhTWPath = join(process.cwd(), 'src', 'i18n', 'locales', 'zh-TW.ts');
  const content = readFileSync(zhTWPath, 'utf-8');
  
  const match = content.match(/export const translations: Translations = ({[\s\S]*});/);
  if (!match) {
    throw new Error('Could not find translations');
  }
  
  const translations: Record<string, Record<string, string>> = eval(`(${match[1]})`);
  
  // Remove countries.short* keys, keep only countries.xx
  if (translations.countries) {
    const countries = translations.countries;
    const shortKeys = Object.keys(countries).filter(k => k.startsWith('short'));
    const codeKeys = Object.keys(countries).filter(k => /^[a-z]{2}$/.test(k));
    
    console.log(`Found ${shortKeys.length} countries.short* keys`);
    console.log(`Found ${codeKeys.length} countries.xx keys`);
    
    // Remove short* keys
    for (const key of shortKeys) {
      delete countries[key];
    }
    
    console.log(`✅ Removed ${shortKeys.length} duplicate countries.short* keys`);
    console.log(`✅ Kept ${Object.keys(countries).length} countries.xx keys`);
  }
  
  // Generate new file
  let newContent = `import type { Translations } from '../types';\n\n`;
  newContent += `/**\n`;
  newContent += ` * zh-TW translations\n`;
  newContent += ` * Traditional Chinese (Taiwan)\n`;
  newContent += ` * Auto-generated from i18n_keys_mapping_fixed.json and COUNTRY_NAMES\n`;
  newContent += ` */\n`;
  newContent += `export const translations: Translations = {\n`;
  
  const namespaces = Object.keys(translations).sort();
  
  for (let i = 0; i < namespaces.length; i++) {
    const namespace = namespaces[i];
    const keys = translations[namespace];
    
    newContent += `  ${namespace}: {\n`;
    
    const keyNames = Object.keys(keys).sort();
    for (let j = 0; j < keyNames.length; j++) {
      const key = keyNames[j];
      const value = keys[key];
      
      let escapedValue = value
        .replace(/\\/g, '\\\\')
        .replace(/`/g, '\\`')
        .replace(/\$\{/g, '\\${');
      
      const quotedKey = /[.-]/.test(key) ? `'${key}'` : key;
      
      newContent += `    ${quotedKey}: \`${escapedValue}\`,\n`;
    }
    
    newContent += `  },\n`;
  }
  
  newContent += `};\n`;
  
  writeFileSync(zhTWPath, newContent, 'utf-8');
  
  // Count final keys
  let totalKeys = 0;
  for (const ns of Object.values(translations)) {
    totalKeys += Object.keys(ns).length;
  }
  
  console.log(`\n✅ Updated: ${zhTWPath}`);
  console.log(`📊 Final keys count: ${totalKeys}`);
  console.log(`\n🎉 Complete!`);
}

main().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});

