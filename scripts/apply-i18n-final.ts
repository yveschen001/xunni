/**
 * Apply i18n replacements using TypeScript
 * More reliable than sed for complex strings
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { parse } from 'csv-parse/sync';

const HANDLERS_DIR = join(process.cwd(), 'src', 'telegram', 'handlers');
const CSV_FILE = join(process.cwd(), 'i18n_extracted.csv');

console.log('🔄 Applying i18n replacements...\n');

// Read CSV
const csvContent = readFileSync(CSV_FILE, 'utf-8');
const records = parse(csvContent, {
  columns: true,
  skip_empty_lines: true,
});

console.log(`📖 Loaded ${records.length} replacements`);

// Group by file
const byFile: Record<string, Array<{ text: string; key: string }>> = {};

for (const record of records) {
  const [filename] = record.key.split('.');
  const file = `${filename}.ts`;
  
  if (!byFile[file]) {
    byFile[file] = [];
  }
  
  byFile[file].push({
    text: record['zh-TW'],
    key: record.key,
  });
}

console.log(`📊 Processing ${Object.keys(byFile).length} files\n`);

let totalReplacements = 0;

for (const [filename, replacements] of Object.entries(byFile)) {
  const filePath = join(HANDLERS_DIR, filename);
  
  try {
    let content = readFileSync(filePath, 'utf-8');
    let fileReplacements = 0;
    
    // Sort by length (longest first) to avoid partial replacements
    const sorted = replacements.sort((a, b) => b.text.length - a.text.length);
    
    for (const { text, key } of sorted) {
      // Try different quote styles
      const patterns = [
        `'${text}'`,
        `"${text}"`,
        `\`${text}\``,
      ];
      
      for (const pattern of patterns) {
        const replacement = `i18n.t('${key}')`;
        const before = content;
        content = content.split(pattern).join(replacement);
        
        if (content !== before) {
          fileReplacements++;
          break;
        }
      }
    }
    
    if (fileReplacements > 0) {
      // Add i18n import if not exists
      if (!content.includes("from '~/i18n'")) {
        // Find last import
        const lines = content.split('\n');
        let lastImportIndex = -1;
        
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].startsWith('import ')) {
            lastImportIndex = i;
          }
        }
        
        if (lastImportIndex >= 0) {
          lines.splice(lastImportIndex + 1, 0, "import { createI18n } from '~/i18n';");
          content = lines.join('\n');
        }
      }
      
      writeFileSync(filePath, content, 'utf-8');
      console.log(`✅ ${filename}: ${fileReplacements} replacements`);
      totalReplacements += fileReplacements;
    } else {
      console.log(`⏭️  ${filename}: no changes`);
    }
  } catch (error) {
    console.error(`❌ ${filename}: ${error}`);
  }
}

console.log(`\n✅ Complete! Total replacements: ${totalReplacements}`);
console.log(`\n⚠️  Note: You still need to add i18n initialization in each handler function`);
console.log(`   Example: const i18n = createI18n(user.language_pref || 'zh-TW');`);

