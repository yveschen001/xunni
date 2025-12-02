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
      let currentSchema = schema;
      
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        
        // Check if we are at the end
        if (i === parts.length - 1) {
          currentTgt[part] = value;
          return;
        }

        // Look ahead: Does the schema use a composite key here?
        // e.g. path is "a.b.c", current is at "a". 
        // We expect "b" to be a nested object. 
        // But maybe "b.c" is the key in schema?
        
        // Heuristic: Try to match the longest possible key from schema
        let foundComposite = false;
        
        // Try to combine current part with next parts
        // e.g. mbti.quick.question1.option1
        // i=2 (question1). next is option1. 
        // schema['mbti']['quick'] has 'question1' (string) and 'question1.option1' (string)
        // Wait, schema logic is tricky because we flattened it for export.
        // But here we have the original zhTwTranslations object (nested).
        
        if (currentSchema && typeof currentSchema === 'object') {
             // Check if 'part' exists in schema
             if (part in currentSchema) {
                 // It exists. Is it an object or string?
                 if (typeof currentSchema[part] === 'string') {
                     // Conflict! We are at an intermediate step but schema says it's a string.
                     // This means the CSV key implies nesting that schema doesn't have 
                     // OR schema has a composite key that spans further.
                     
                     // Check if schema has a key that combines current part + next part
                     const nextPart = parts[i+1];
                     const composite = `${part}.${nextPart}`;
                     if (composite in currentSchema) {
                         // Found it! "question1.option1" is the key.
                         currentTgt[composite] = value;
                         // Skip the next part in loop as we consumed it
                         // Actually, we are done because we set the value (assuming it's a leaf)
                         // But what if it's a.b.c.d and key is "b.c"? 
                         // For this specific project issue (question1.option1), it's a leaf.
                         return;
                     }
                 }
             } else {
                 // part not in schema? 
                 // Maybe it's a new key, or a composite key we haven't found.
                 // Try composite with next part
                 const nextPart = parts[i+1];
                 if (nextPart) {
                    const composite = `${part}.${nextPart}`;
                    if (composite in currentSchema) {
                         currentTgt[composite] = value;
                         return;
                    }
                 }
             }
        }

        // Standard traversal
        // Check if current part exists and is a string (collision!)
        if (typeof currentTgt[part] === 'string') {
             // We are trying to go deeper, but 'part' is already a string leaf.
             // This means the schema implies a composite key like "question1.option1"
             // But we are iterating part by part. 
             // We need to merge current part with next part.
             // However, the loop structure is rigid.
             
             // Workaround: If we hit a string but need an object, it's a conflict.
             // But in our specific case (based on the error), we probably have:
             // Key 1: "mbti.quick.question1" -> "Question Text"
             // Key 2: "mbti.quick.question1.option1" -> "Option Text"
             
             // These two CANNOT coexist in a standard JS object structure unless "question1" is an object that has a special property for its own text value (not supported by our i18n).
             // OR, one of them uses a dot in the key name explicitly.
             
             // Let's assume the CSV keys are flat dot notation.
             // If "mbti.quick.question1" exists, it's a leaf.
             // If "mbti.quick.question1.option1" comes along, it implies "question1" should be an object.
             
             // TRICKY: The error says "Cannot create property... on string". 
             // This means "mbti.quick.question1" was already set as a string.
             
             // Fix: If we encounter this, it means we probably should have treated "question1.option1" as a single key segment relative to "question1"? No.
             
             // The only way this works is if the keys are actually:
             // { "question1": "..." }
             // AND
             // { "question1.option1": "..." } (as a sibling key "question1.option1"?)
             // No, that would be { "question1": "...", "question1.option1": "..." } valid in JS? Yes.
             
             // So, we need to detect if we should step into it or create a sibling key.
             // If schema says it's a string, we shouldn't step into it. We should treat the rest of the path as part of the key.
             
             const remainingPath = parts.slice(i).join('.');
             // We are at 'part' (e.g. question1). 
             // We want to set 'question1.option1'. 
             // But 'question1' is already set.
             // We can set 'question1.option1' as a sibling key on currentTgt.
             currentTgt[remainingPath] = value;
             return;
        }

        currentTgt[part] = currentTgt[part] || {};
        currentTgt = currentTgt[part];
        
        if (currentSchema && typeof currentSchema === 'object') {
            currentSchema = currentSchema[part];
        } else {
            currentSchema = null; // Lost schema track, fallback to standard nesting
        }
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

