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
    if (currentTranslations[record.key]) {
      // Key still exists, update zh-TW reference just in case it changed in code
      record['zh-TW'] = currentTranslations[record.key];
      finalRecords.push(record);
    } else {
      // Key no longer exists in code.
      // Strategy: Keep it but mark it, or move to bottom?
      // User request: "Don't mess up order". 
      // Safe bet: Keep it where it is. Maybe add a note? 
      // For now, we keep it to be safe.
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
      // Initialize all columns
      HEADER_ORDER.forEach(lang => {
        if (lang === 'key') return;
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
  // HEADER_ORDER includes 'key', 'zh-TW', ...
  // Allow updating zh-TW as well to sync back changes/fixes from CSV
  const languages = HEADER_ORDER.filter(h => h !== 'key');

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
      if (value === '[需要翻译]' || value.trim() === '') continue;

      // Use the smart setter
      setDeepValue(translationObj, key, value, zhTwTranslations);
    }

    // Write to file
    const filePath = path.join(LOCALES_DIR, `${lang}.ts`);
    const fileContent = `import type { Translations } from '../types';\n\nexport const translations: Translations = ${JSON.stringify(translationObj, null, 2)};\n`;
    
    // Formatting: The JSON.stringify output is valid JS but not pretty TypeScript object literal.
    // For best results, we might want to use a smarter serializer or just Prettier later.
    // But this works for functionality. 
    // Optimization: Use a custom serializer to make it look like the original source (unquoted keys where possible, backticks etc).
    // For now, JSON format is 100% valid TS.
    
    fs.writeFileSync(filePath, fileContent);
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

