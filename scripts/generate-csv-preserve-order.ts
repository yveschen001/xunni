/**
 * Generate i18n_for_translation.csv from zh-TW.ts
 * PRESERVES EXISTING CSV ORDER - Only appends new keys to the end
 * 
 * This script:
 * 1. Reads existing CSV and preserves all existing rows in their current order
 * 2. Extracts all keys from zh-TW.ts
 * 3. Identifies new keys that don't exist in CSV
 * 4. Appends new keys to the end of CSV (doesn't reorder existing rows)
 * 
 * This ensures translation teams don't lose their place when new keys are added.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { parse } from 'csv-parse/sync';
import * as ts from 'typescript';

// 34 languages (including zh-TW)
const ALL_LANGUAGES = [
  'zh-TW', 'zh-CN', 'en', 'ja', 'ko', 'th', 'vi', 'id', 'ms', 'tl',
  'es', 'pt', 'fr', 'de', 'it', 'ru', 'ar', 'hi', 'bn', 'tr',
  'pl', 'uk', 'nl', 'sv', 'no', 'da', 'fi', 'cs', 'el', 'he',
  'fa', 'ur', 'sw', 'ro'
];

interface Translations {
  [namespace: string]: {
    [key: string]: string;
  };
}

interface CSVRow {
  key: string;
  [language: string]: string;
}

// Escape CSV value (proper CSV escaping)
function escapeCSV(value: string): string {
  if (!value) return '';
  
  // Replace actual newlines with \n (for display in CSV)
  value = value.replace(/\n/g, '\\n');
  
  // Escape backticks (they might be in template strings)
  value = value.replace(/`/g, '\\`');
  
  // Escape ${ (template variables)
  value = value.replace(/\$\{/g, '\\${');
  
  // Escape quotes by doubling them
  value = value.replace(/"/g, '""');
  
  // Always wrap in quotes for safety (CSV standard)
  return `"${value}"`;
}

// Extract all keys from translations object
function extractKeys(translations: Translations, prefix: string = ''): Array<{ key: string; value: string }> {
  const result: Array<{ key: string; value: string }> = [];
  
  for (const [namespace, keys] of Object.entries(translations)) {
    const fullPrefix = prefix ? `${prefix}.${namespace}` : namespace;
    
    for (const [key, value] of Object.entries(keys)) {
      const fullKey = `${fullPrefix}.${key}`;
      result.push({ key: fullKey, value });
    }
  }
  
  return result;
}

async function main() {
  console.log('📥 Reading zh-TW locale file...');
  
  // Read zh-TW.ts
  const zhTWPath = join(process.cwd(), 'src', 'i18n', 'locales', 'zh-TW.ts');
  const zhTWContent = readFileSync(zhTWPath, 'utf-8');
  
  // Use TypeScript compiler API to parse the file (safer than eval)
  const sourceFile = ts.createSourceFile(
    zhTWPath,
    zhTWContent,
    ts.ScriptTarget.Latest,
    true
  );
  
  const translations: Translations = {};
  
  // Find the translations export
  function visit(node: ts.Node) {
    // Look for: export const translations: Translations = { ... }
    if (ts.isVariableStatement(node)) {
      const declaration = node.declarationList.declarations[0];
      if (declaration && 
          ts.isIdentifier(declaration.name) && 
          declaration.name.text === 'translations') {
        
        // Extract the object literal
        if (declaration.initializer && ts.isObjectLiteralExpression(declaration.initializer)) {
          extractFromObject(declaration.initializer, translations);
        }
      }
    }
    
    ts.forEachChild(node, visit);
  }
  
  function extractFromObject(obj: ts.ObjectLiteralExpression, target: Translations) {
    for (const prop of obj.properties) {
      if (ts.isPropertyAssignment(prop)) {
        const key = prop.name.getText(sourceFile);
        
        if (ts.isObjectLiteralExpression(prop.initializer)) {
          // Nested namespace
          if (!target[key]) {
            target[key] = {};
          }
          extractFromObject(prop.initializer, target[key] as any);
        } else if (ts.isTemplateExpression(prop.initializer) || ts.isStringLiteral(prop.initializer)) {
          // Leaf value
          const value = prop.initializer.getText(sourceFile);
          // Remove quotes/backticks and unescape
          let cleanValue = value.replace(/^[`'"]|['"`]$/g, '');
          cleanValue = cleanValue.replace(/\\n/g, '\n');
          cleanValue = cleanValue.replace(/\\`/g, '`');
          cleanValue = cleanValue.replace(/\\\$\{/g, '${');
          cleanValue = cleanValue.replace(/\\\\/g, '\\');
          
          // Find the namespace for this key
          const namespace = findNamespace(prop, sourceFile);
          if (namespace) {
            if (!target[namespace]) {
              target[namespace] = {};
            }
            target[namespace][key] = cleanValue;
          } else {
            // Top-level key
            if (!target[key]) {
              target[key] = {};
            }
          }
        }
      }
    }
  }
  
  function findNamespace(node: ts.Node, sourceFile: ts.SourceFile): string | null {
    let current: ts.Node | undefined = node.parent;
    while (current) {
      if (ts.isPropertyAssignment(current)) {
        const parentKey = current.name.getText(sourceFile);
        return parentKey;
      }
      current = current.parent;
    }
    return null;
  }
  
  visit(sourceFile);
  
  const totalKeys = Object.values(translations).reduce((sum, ns) => {
    if (typeof ns === 'object' && ns !== null) {
      return sum + Object.keys(ns).length;
    }
    return sum;
  }, 0);
  
  if (totalKeys === 0) {
    throw new Error('Failed to extract any translations. File format may have changed.');
  }
  
  console.log(`✅ Extracted ${totalKeys} keys from ${Object.keys(translations).length} namespaces using TypeScript AST`);
  
  console.log(`✅ Loaded translations from zh-TW.ts`);
  
  // Extract all keys from zh-TW.ts
  const allKeysFromZhTW = extractKeys(translations);
  console.log(`✅ Extracted ${allKeysFromZhTW.length} translation keys from zh-TW.ts`);
  
  // Read existing CSV if it exists
  const csvPath = join(process.cwd(), 'i18n_for_translation.csv');
  let existingRows: CSVRow[] = [];
  let existingKeys = new Set<string>();
  
  if (existsSync(csvPath)) {
    console.log('\n📖 Reading existing CSV...');
    const csvContent = readFileSync(csvPath, 'utf-8');
    
    // Parse CSV
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      relax_quotes: true,
      relax_column_count: true,
    }) as CSVRow[];
    
    existingRows = records;
    existingKeys = new Set(records.map(r => r.key));
    
    console.log(`✅ Found ${existingRows.length} existing keys in CSV`);
  } else {
    console.log('\n📝 No existing CSV found, will create new one');
  }
  
  // Find new keys that don't exist in CSV
  const newKeys: Array<{ key: string; value: string }> = [];
  for (const { key, value } of allKeysFromZhTW) {
    if (!existingKeys.has(key)) {
      newKeys.push({ key, value });
    }
  }
  
  console.log(`\n🔍 Analysis:`);
  console.log(`   - Total keys in zh-TW.ts: ${allKeysFromZhTW.length}`);
  console.log(`   - Existing keys in CSV: ${existingKeys.size}`);
  console.log(`   - New keys to add: ${newKeys.length}`);
  
  if (newKeys.length === 0) {
    console.log('\n✅ All keys already exist in CSV! No changes needed.');
    return;
  }
  
  // Create new rows for new keys
  const newRows: CSVRow[] = [];
  for (const { key, value } of newKeys) {
    const row: CSVRow = { key };
    row['zh-TW'] = value;
    // Empty columns for other languages
    for (const lang of ALL_LANGUAGES.slice(1)) {
      row[lang] = '';
    }
    newRows.push(row);
  }
  
  // Combine existing rows + new rows (preserve order, append new to end)
  const allRows = [...existingRows, ...newRows];
  
  console.log(`\n📝 Writing CSV (preserving existing order, appending ${newKeys.length} new keys)...`);
  
  // Generate CSV header
  const header = `key,${ALL_LANGUAGES.join(',')}`;
  const rows = [header];
  
  // Write all rows (existing first, then new)
  for (const row of allRows) {
    const key = escapeCSV(row.key);
    const values = ALL_LANGUAGES.map(lang => {
      const value = row[lang] || '';
      return escapeCSV(value);
    });
    rows.push(`${key},${values.join(',')}`);
  }
  
  // Write CSV file
  writeFileSync(csvPath, rows.join('\n'), 'utf-8');
  
  console.log(`✅ Updated: ${csvPath}`);
  console.log(`   - Preserved ${existingRows.length} existing rows (in original order)`);
  console.log(`   - Added ${newKeys.length} new keys (appended to end)`);
  console.log(`   - Total keys: ${allRows.length}`);
  console.log(`   - Languages: ${ALL_LANGUAGES.length}`);
  console.log('\n🎉 CSV update complete!');
  console.log('\n💡 Note: Existing rows are preserved in their original order.');
  console.log('   New keys are appended to the end to avoid disrupting translation work.');
  
  if (newKeys.length > 0) {
    console.log('\n📋 New keys added:');
    newKeys.slice(0, 10).forEach(({ key }) => {
      console.log(`   - ${key}`);
    });
    if (newKeys.length > 10) {
      console.log(`   ... and ${newKeys.length - 10} more`);
    }
  }
}

main().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});

