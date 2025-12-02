import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import { translations as zhTwTranslations } from '../src/i18n/locales/zh-TW';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CSV_FILE_PATH = path.resolve(__dirname, '../i18n_for_translation.csv');
const LOCALES_DIR = path.resolve(__dirname, '../src/i18n/locales');

// Supported Languages Order (User Preferred)
const HEADER_ORDER = [
  'key',
  'module', // Added context column
  'zh-TW', 'zh-CN', 'en', 'ja', 'ko', 'vi', 'th', 'id', 'ms', 'tl',
  'hi', 'ar', 'ur', 'fa', 'he', 'tr', 'ru', 'uk', 'pl', 'cs',
  'ro', 'hu', 'bn', 'hr', 'sk', 'sl', 'sr', 'mk', 'sq', 'el',
  'de', 'fr', 'es', 'it', 'pt', 'nl', 'sv', 'no', 'da', 'fi'
];

interface TranslationMap {
  [key: string]: string;
}

// Helper: Flatten nested object to dot notation keys
function flattenObject(obj: any, prefix = ''): TranslationMap {
  return Object.keys(obj).reduce((acc: TranslationMap, k: string) => {
    const pre = prefix.length ? prefix + '.' : '';
    if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
      Object.assign(acc, flattenObject(obj[k], pre + k));
    } else {
      acc[pre + k] = String(obj[k]);
    }
    return acc;
  }, {});
}

// Command: Export (Smart Append)
async function exportCsv() {
  console.log('📦 Starting Smart Export...');

  // 1. Get current keys from source code (zh-TW is the source of truth)
  const currentTranslations = flattenObject(zhTwTranslations);
  const currentKeys = Object.keys(currentTranslations);
  console.log(`- Found ${currentKeys.length} keys in source code (zh-TW).`);

  // 2. Read existing CSV to preserve order
  let existingRecords: any[] = [];
  const existingKeySet = new Set<string>();

  if (fs.existsSync(CSV_FILE_PATH)) {
    console.log('- Reading existing CSV to preserve order...');
    const fileContent = fs.readFileSync(CSV_FILE_PATH, 'utf-8');
    existingRecords = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      relax_column_count: true
    });
    existingRecords.forEach(r => existingKeySet.add(r.key));
  } else {
    console.log('- No existing CSV found. Creating new...');
  }

  // 3. Update existing records with latest zh-TW value (optional, but good for consistency)
  //    And mark keys that no longer exist in code (optional cleanup)
  const finalRecords: any[] = [];

  // 3a. Keep existing records in their original order
  for (const record of existingRecords) {
    // Ensure module column is populated
    if (!record.module) {
      record.module = record.key.split('.')[0];
    }

    if (currentTranslations[record.key]) {
      // Key still exists, update zh-TW reference just in case it changed in code
      record['zh-TW'] = currentTranslations[record.key];
      finalRecords.push(record);
    } else {
      // Key no longer exists in code.
      console.warn(`  ⚠️ Key in CSV but missing in code: ${record.key} (Kept)`);
      finalRecords.push(record);
    }
  }

  // 3b. Append NEW keys to the end
  const newKeys = currentKeys.filter(k => !existingKeySet.has(k));
  if (newKeys.length > 0) {
    console.log(`- Found ${newKeys.length} NEW keys. Appending to bottom...`);
    for (const key of newKeys) {
      const newRecord: any = { key: key };
      newRecord.module = key.split('.')[0];
      
      // Initialize all columns
      HEADER_ORDER.forEach(lang => {
        if (lang === 'key' || lang === 'module') return;
        if (lang === 'zh-TW') {
          newRecord[lang] = currentTranslations[key];
        } else {
          newRecord[lang] = '[需要翻译]'; // Placeholder
        }
      });
      finalRecords.push(newRecord);
    }
  } else {
    console.log('- No new keys to append.');
  }

  // 4. Write back to CSV
  // Ensure all records have all headers to avoid alignment issues
  const normalizedRecords = finalRecords.map(r => {
    const newR: any = {};
    HEADER_ORDER.forEach(h => {
      newR[h] = r[h] || '';
    });
    return newR;
  });

  const csvContent = stringify(normalizedRecords, {
    header: true,
    columns: HEADER_ORDER
  });

  fs.writeFileSync(CSV_FILE_PATH, csvContent);
  console.log(`✅ Smart Export Complete! Saved to ${CSV_FILE_PATH}`);
  console.log(`- Total records: ${normalizedRecords.length}`);
}

// Command: Import
async function importCsv() {
  console.log('📥 Starting Import...');

  if (!fs.existsSync(CSV_FILE_PATH)) {
    console.error('❌ CSV file not found!');
    return;
  }

  const fileContent = fs.readFileSync(CSV_FILE_PATH, 'utf-8');
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true
  });

  console.log(`- Loaded ${records.length} records from CSV.`);

  // Group by language
  // HEADER_ORDER includes 'key', 'module', 'zh-TW', ...
  // Allow updating zh-TW as well to sync back changes/fixes from CSV
  const languages = HEADER_ORDER.filter(h => h !== 'key' && h !== 'module');

  // We also need to update zh-TW if we want the CSV to be the source of truth for text changes
  // But usually zh-TW source comes from code. 
  // Let's stick to updating OTHER languages based on CSV.
  
  // Actually, for "Import", we usually want to generate the .ts files for ALL languages except zh-TW (which is the master).
  // OR, if we treat CSV as master for everything, we update all.
  // Standard flow: Code (zh-TW) -> CSV -> Translators -> CSV -> Code (Other Langs)
  
  for (const lang of languages) {
    // Skip if column doesn't exist in CSV record (shouldn't happen if exported correctly)
    if (records.length > 0 && !(lang in records[0])) {
      console.warn(`  ⚠️ Column ${lang} missing in CSV. Skipping.`);
      continue;
    }

    console.log(`- Processing ${lang}...`);
    
    // Read existing locale file to preserve structure (if we used AST, but here we rebuild from object)
    // To be safe and simple: We rebuild the object structure from the flat CSV keys.
    
    const translationObj: any = {};
    
    // Helper to find the correct key structure based on schema (zh-TW)
    function setDeepValue(target: any, pathStr: string, value: string, schema: any) {
      const parts = pathStr.split('.');
      let currentTgt = target;
      
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        
        // Check if we are at the end (Setting the value)
        if (i === parts.length - 1) {
          if (currentTgt[part] && typeof currentTgt[part] === 'object') {
             // Conflict: Target is already an object, but we are trying to set it as a string.
             // Strategy: Don't overwrite the object. Set the value to 'text' property if appropriate, or ignore if duplicate.
             // For MBTI questions, 'question1' string value is usually same as 'question1.text'.
             if (!currentTgt[part]['text']) {
                 currentTgt[part]['text'] = value;
             }
          } else {
             // Standard case: Set value
             currentTgt[part] = value;
          }
          return;
        }

        // We need to go deeper
        if (currentTgt[part] && typeof currentTgt[part] === 'string') {
             // Conflict: Current part is a string, but we need to attach children.
             // Strategy: Convert string to object with 'text' property containing the original string.
             const originalValue = currentTgt[part];
             currentTgt[part] = { text: originalValue };
        }

        currentTgt[part] = currentTgt[part] || {};
        currentTgt = currentTgt[part];
      }
    }

    for (const record of records) {
      const key = record.key;
      const value = record[lang];
      
      if (!key || !value) continue;
      
      // Don't import placeholders
      // if (value === '[需要翻译]' || value.trim() === '') continue;
      // UPDATE: For full synchronization, we WANT to import even if it's a placeholder,
      // so that the key exists in the file structure (and falls back to Key name in UI).
      // However, we shouldn't overwrite existing valid translations with empty.
      // But here we are rebuilding the object from scratch based on CSV (sort of).
      // Actually we are merging into 'translationObj'.
      
      let finalValue = value;
      if (value === '[需要翻译]' || value.trim() === '') {
          // If missing, use empty string so the key is created
          finalValue = ''; 
      }

      // Use the smart setter
      setDeepValue(translationObj, key, finalValue, zhTwTranslations);
    }

    // Write to file
    // NEW: Modular write support.
    // Instead of writing one big file, we need to split it again using refactor logic or similar.
    // BUT, we already have a split directory structure!
    // The easiest way is to reuse the logic from refactor-i18n.ts to split this object into files.
    
    const targetDir = path.join(LOCALES_DIR, lang);
    if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
    }

    // Helper from refactor-i18n.ts (duplicated here for independence)
    function getModuleName(key: string, value: any): string {
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            return key; 
        }
        return 'misc';
    }

    const modules: Record<string, any> = {};
    const imports: string[] = [];
    const exportAssignments: string[] = [];
    
    // JS Reserved Words
    const RESERVED_WORDS = new Set([
      'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger', 'default', 'delete', 'do',
      'else', 'enum', 'export', 'extends', 'false', 'finally', 'for', 'function', 'if', 'import',
      'in', 'instanceof', 'new', 'null', 'return', 'super', 'switch', 'this', 'throw', 'true',
      'try', 'typeof', 'var', 'void', 'while', 'with', 'yield', 'implements', 'interface', 'let',
      'package', 'private', 'protected', 'public', 'static', 'await', 'async'
    ]);

    for (const key of Object.keys(translationObj)) {
        const value = translationObj[key];
        const moduleName = getModuleName(key, value);

        if (!modules[moduleName]) {
            modules[moduleName] = {};
        }

        if (moduleName === 'misc') {
            modules[moduleName][key] = value;
        } else {
            modules[moduleName] = value;
        }
    }

    // Write module files
    for (const [modName, content] of Object.entries(modules)) {
        const modFilePath = path.join(targetDir, `${modName}.ts`);
        const modFileContent = `export default ${JSON.stringify(content, null, 2)};\n`;
        fs.writeFileSync(modFilePath, modFileContent);

        if (modName === 'misc') {
            imports.push(`import misc from './misc';`);
        } else {
            let varName = modName;
            if (RESERVED_WORDS.has(modName)) {
                varName = `${modName}_module`;
            }
            imports.push(`import ${varName} from './${modName}';`);
            
            if (varName !== modName) {
                exportAssignments.push(`  "${modName}": ${varName},`);
            } else {
                exportAssignments.push(`  ${modName},`);
            }
        }
    }

    // Generate index.ts
    const indexContent = [
        imports.join('\n'),
        '',
        'export const translations = {',
        modules['misc'] ? '  ...misc,' : '',
        exportAssignments.join('\n'),
        '};',
        ''
    ].join('\n');

    fs.writeFileSync(path.join(targetDir, 'index.ts'), indexContent);
  }
  
  console.log('✅ Import Complete! All locale files updated.');
}

// Main CLI
const mode = process.argv[2];

if (mode === 'export') {
  exportCsv();
} else if (mode === 'import') {
  importCsv();
} else {
  console.log('Usage: ts-node scripts/i18n-manager.ts [export|import]');
}

