/**
 * Add missing keys from mapping file to zh-TW.ts locale file
 * This ensures all 1939 keys are included, not just the 1391 that were used in code
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

interface MappingEntry {
  original: string;
  key: string;
  category?: string;
  confidence?: number;
  file?: string;
  line?: number;
}

async function main() {
  console.log('📥 Loading mapping file...');
  
  // Load mapping file
  const mappingPath = join(process.cwd(), 'i18n_keys_mapping_fixed.json');
  const mapping: Record<string, MappingEntry> = JSON.parse(
    readFileSync(mappingPath, 'utf-8')
  );
  
  console.log(`✅ Loaded ${Object.keys(mapping).length} entries from mapping file`);
  
  // Load current zh-TW.ts
  const zhTWPath = join(process.cwd(), 'src', 'i18n', 'locales', 'zh-TW.ts');
  const zhTWContent = readFileSync(zhTWPath, 'utf-8');
  
  // Extract current translations object
  const translationsMatch = zhTWContent.match(/export const translations: Translations = ({[\s\S]*});/);
  if (!translationsMatch) {
    throw new Error('Could not find translations object in zh-TW.ts');
  }
  
  const currentTranslations: Record<string, Record<string, string>> = eval(`(${translationsMatch[1]})`);
  
  // Count current keys
  let currentCount = 0;
  for (const ns of Object.values(currentTranslations)) {
    currentCount += Object.keys(ns).length;
  }
  console.log(`✅ Current locale file has ${currentCount} keys`);
  
  // Add missing keys
  console.log('\n📝 Adding missing keys...');
  let addedCount = 0;
  let skippedCount = 0;
  
  for (const entry of Object.values(mapping)) {
    if (!entry.key || !entry.original) {
      skippedCount++;
      continue;
    }
    
    const parts = entry.key.split('.');
    const namespace = parts[0];
    const key = parts.slice(1).join('.');
    
    // Initialize namespace if needed
    if (!currentTranslations[namespace]) {
      currentTranslations[namespace] = {};
    }
    
    // Add key if missing
    if (!currentTranslations[namespace][key]) {
      currentTranslations[namespace][key] = entry.original;
      addedCount++;
    }
  }
  
  console.log(`✅ Added ${addedCount} missing keys`);
  if (skippedCount > 0) {
    console.log(`⚠️  Skipped ${skippedCount} entries (missing key or original)`);
  }
  
  // Count final keys
  let finalCount = 0;
  for (const ns of Object.values(currentTranslations)) {
    finalCount += Object.keys(ns).length;
  }
  console.log(`✅ Final locale file has ${finalCount} keys`);
  
  // Generate new zh-TW.ts content
  console.log('\n📝 Generating new zh-TW.ts...');
  
  let newContent = `import type { Translations } from '../types';\n\n`;
  newContent += `/**\n`;
  newContent += ` * zh-TW translations\n`;
  newContent += ` * Traditional Chinese (Taiwan)\n`;
  newContent += ` * Auto-generated from i18n_keys_mapping_fixed.json\n`;
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
  console.log(`   - Original keys: ${currentCount}`);
  console.log(`   - Added keys: ${addedCount}`);
  console.log(`   - Final keys: ${finalCount}`);
  console.log(`   - Expected keys: ${Object.keys(mapping).length}`);
  console.log(`\n🎉 Complete!`);
}

main().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});

