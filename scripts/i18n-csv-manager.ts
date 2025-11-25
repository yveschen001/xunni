/**
 * i18n CSV Manager - Export and Import translations
 * 
 * This script can:
 * 1. Export: Extract all translations from zh-TW.ts and generate/update CSV
 * 2. Import: Read CSV and update zh-TW.ts with translations
 * 
 * Uses TypeScript compiler API for accurate parsing
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { parse } from 'csv-parse/sync';
import * as ts from 'typescript';

// 34 languages
const ALL_LANGUAGES = [
  'zh-TW', 'zh-CN', 'en', 'ja', 'ko', 'th', 'vi', 'id', 'ms', 'tl',
  'es', 'pt', 'fr', 'de', 'it', 'ru', 'ar', 'hi', 'bn', 'tr',
  'pl', 'uk', 'nl', 'sv', 'no', 'da', 'fi', 'cs', 'el', 'he',
  'fa', 'ur', 'sw', 'ro'
];

interface TranslationMap {
  [key: string]: string;
}

interface CSVRow {
  key: string;
  [language: string]: string;
}

function escapeCSV(value: string): string {
  if (!value) return '';
  value = value.replace(/\n/g, '\\n');
  value = value.replace(/`/g, '\\`');
  value = value.replace(/\$\{/g, '\\${');
  value = value.replace(/"/g, '""');
  return `"${value}"`;
}

/**
 * Extract all translations from zh-TW.ts using TypeScript compiler API
 */
function extractTranslationsFromZhTW(zhTWPath: string): TranslationMap {
  const content = readFileSync(zhTWPath, 'utf-8');
  const sourceFile = ts.createSourceFile(
    zhTWPath,
    content,
    ts.ScriptTarget.Latest,
    true
  );
  
  const translations: TranslationMap = {};
  
  // Find the translations variable declaration
  function findTranslationsDeclaration(node: ts.Node): ts.VariableDeclaration | null {
    if (ts.isVariableDeclaration(node)) {
      if (ts.isIdentifier(node.name) && node.name.text === 'translations') {
        return node;
      }
    }
    
    let found: ts.VariableDeclaration | null = null;
    ts.forEachChild(node, (child) => {
      if (!found) {
        found = findTranslationsDeclaration(child);
      }
    });
    return found;
  }
  
  const translationsDecl = findTranslationsDeclaration(sourceFile);
  if (!translationsDecl || !ts.isObjectLiteralExpression(translationsDecl.initializer)) {
    console.error('❌ Could not find translations object');
    return translations;
  }
  
  // Recursively extract keys from object literal
  function extractFromObject(obj: ts.ObjectLiteralExpression, path: string[] = []): void {
    for (const prop of obj.properties) {
      if (!ts.isPropertyAssignment(prop)) continue;
      
      const key = getPropertyName(prop.name);
      if (!key) continue;
      
      // Check if key contains dots (e.g., 'catch.translationServiceFallback')
      // This means it's a flat key that should be used as-is
      if (key.includes('.')) {
        // This is a flat key, use it directly
        if (ts.isTemplateExpression(prop.initializer)) {
          const value = getTemplateStringValue(prop.initializer, sourceFile);
          translations[key] = value;
        } else if (ts.isNoSubstitutionTemplateLiteral(prop.initializer)) {
          let value = prop.initializer.text;
          value = value.replace(/\\n/g, '\n');
          value = value.replace(/\\`/g, '`');
          value = value.replace(/\\\$\{/g, '${');
          value = value.replace(/\\\\/g, '\\');
          translations[key] = value;
        } else if (ts.isStringLiteral(prop.initializer)) {
          translations[key] = prop.initializer.text;
        }
        continue;
      }
      
      // Normal nested key
      const currentPath = path.length > 0 ? [...path, key] : [key];
      const fullKey = currentPath.join('.');
      
      if (ts.isObjectLiteralExpression(prop.initializer)) {
        // Nested object - recurse
        extractFromObject(prop.initializer, currentPath);
      } else if (ts.isTemplateExpression(prop.initializer)) {
        // Template string with substitutions
        const value = getTemplateStringValue(prop.initializer, sourceFile);
        translations[fullKey] = value;
      } else if (ts.isNoSubstitutionTemplateLiteral(prop.initializer)) {
        // Template literal without substitutions
        let value = prop.initializer.text;
        // Unescape
        value = value.replace(/\\n/g, '\n');
        value = value.replace(/\\`/g, '`');
        value = value.replace(/\\\$\{/g, '${');
        value = value.replace(/\\\\/g, '\\');
        translations[fullKey] = value;
      } else if (ts.isStringLiteral(prop.initializer)) {
        // String literal
        translations[fullKey] = prop.initializer.text;
      }
    }
  }
  
  extractFromObject(translationsDecl.initializer);
  
  return translations;
}

function getPropertyName(name: ts.PropertyName): string | null {
  if (ts.isIdentifier(name)) {
    return name.text;
  } else if (ts.isStringLiteral(name) || ts.isNumericLiteral(name)) {
    return name.text;
  }
  return null;
}

function getTemplateStringValue(node: ts.Node, sourceFile: ts.SourceFile): string {
  if (ts.isTemplateExpression(node)) {
    // For template expressions, reconstruct from parts
    let value = '';
    for (const part of node.templateSpans) {
      value += part.literal.text;
    }
    // Unescape
    value = value.replace(/\\n/g, '\n');
    value = value.replace(/\\`/g, '`');
    value = value.replace(/\\\$\{/g, '${');
    value = value.replace(/\\\\/g, '\\');
    return value;
  } else if (ts.isNoSubstitutionTemplateLiteral(node)) {
    // Template literal without substitutions
    let value = node.text;
    // Unescape
    value = value.replace(/\\n/g, '\n');
    value = value.replace(/\\`/g, '`');
    value = value.replace(/\\\$\{/g, '${');
    value = value.replace(/\\\\/g, '\\');
    return value;
  } else if (ts.isStringLiteral(node)) {
    return node.text;
  }
  return '';
}

/**
 * Export: Generate CSV from zh-TW.ts
 */
function exportToCSV(zhTWPath: string, csvPath: string, preserveOrder: boolean = true): void {
  console.log('📖 Extracting translations from zh-TW.ts...');
  const translations = extractTranslationsFromZhTW(zhTWPath);
  console.log(`✅ Extracted ${Object.keys(translations).length} translations`);
  
  // Read existing CSV if preserving order
  let existingRows: CSVRow[] = [];
  let existingKeys = new Set<string>();
  
  if (preserveOrder && existsSync(csvPath)) {
    console.log('📖 Reading existing CSV to preserve order...');
    const csvContent = readFileSync(csvPath, 'utf-8');
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      relax_quotes: true,
      relax_column_count: true,
    }) as CSVRow[];
    
    existingRows = records;
    records.forEach(r => existingKeys.add(r.key));
    console.log(`✅ Found ${existingKeys.size} existing keys in CSV`);
  }
  
  // Find new keys
  const newKeys: Array<{ key: string; value: string }> = [];
  for (const [key, value] of Object.entries(translations)) {
    if (!existingKeys.has(key)) {
      newKeys.push({ key, value });
    }
  }
  
  console.log(`\n📊 Analysis:`);
  console.log(`   - Total keys in zh-TW.ts: ${Object.keys(translations).length}`);
  console.log(`   - Existing keys in CSV: ${existingKeys.size}`);
  console.log(`   - New keys to add: ${newKeys.length}`);
  
  // Combine existing rows and new keys
  const finalRows = [...existingRows];
  for (const { key, value } of newKeys.sort()) {
    const newRow: CSVRow = { key };
    newRow['zh-TW'] = value;
    ALL_LANGUAGES.slice(1).forEach(lang => {
      newRow[lang] = '';
    });
    finalRows.push(newRow);
  }
  
  // Update existing rows with latest translations from zh-TW.ts
  for (const row of finalRows) {
    if (translations[row.key]) {
      row['zh-TW'] = translations[row.key];
    }
  }
  
  // Generate CSV
  console.log('\n📝 Writing CSV...');
  const header = `key,${ALL_LANGUAGES.join(',')}`;
  const rows = [header];
  
  for (const record of finalRows) {
    const key = escapeCSV(record.key);
    const values = ALL_LANGUAGES.map(lang => {
      const value = record[lang] || '';
      return escapeCSV(value);
    });
    rows.push(`${key},${values.join(',')}`);
  }
  
  // Backup existing CSV
  if (existsSync(csvPath)) {
    const backupPath = `${csvPath}.backup.${Date.now()}`;
    writeFileSync(backupPath, readFileSync(csvPath, 'utf-8'), 'utf-8');
    console.log(`✅ Backed up existing CSV to: ${backupPath}`);
  }
  
  writeFileSync(csvPath, rows.join('\n'), 'utf-8');
  
  console.log(`✅ Generated: ${csvPath}`);
  console.log(`   - Total keys: ${finalRows.length}`);
  console.log(`   - New keys added: ${newKeys.length}`);
}

/**
 * Import: Update zh-TW.ts from CSV (for other languages, not zh-TW)
 * Note: zh-TW.ts is the source of truth, we import other languages from CSV
 */
function importFromCSV(csvPath: string, localeDir: string): void {
  console.log('📖 Reading CSV...');
  const csvContent = readFileSync(csvPath, 'utf-8');
  
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
    relax_column_count: true,
  }) as CSVRow[];
  
  console.log(`✅ Parsed ${records.length} translation entries`);
  
  // Group translations by language
  const translationsByLang: Record<string, TranslationMap> = {};
  for (const lang of ALL_LANGUAGES) {
    translationsByLang[lang] = {};
  }
  
  for (const record of records) {
    for (const lang of ALL_LANGUAGES) {
      if (record[lang] && record[lang].trim() && record[lang] !== '[需要从 zh-TW.ts 获取翻译]') {
        translationsByLang[lang][record.key] = record[lang];
      }
    }
  }
  
  // Import to each locale file (except zh-TW, which is the source)
  console.log('\n📝 Importing translations to locale files...');
  
  for (const lang of ALL_LANGUAGES.slice(1)) { // Skip zh-TW
    const translations = translationsByLang[lang];
    if (Object.keys(translations).length === 0) {
      console.log(`⏭️  Skipping ${lang} - no translations`);
      continue;
    }
    
    const localePath = join(localeDir, `${lang}.ts`);
    
    if (!existsSync(localePath)) {
      console.log(`⚠️  Locale file not found: ${localePath}`);
      continue;
    }
    
    // Read current locale file
    let localeContent = readFileSync(localePath, 'utf-8');
    const sourceFile = ts.createSourceFile(
      localePath,
      localeContent,
      ts.ScriptTarget.Latest,
      true
    );
    
    // Extract current structure
    const currentTranslations = extractTranslationsFromZhTW(localePath);
    
    // Update translations using AST manipulation
    let updatedCount = 0;
    
    // Use regex replacement for now (more reliable than AST manipulation)
    for (const [key, value] of Object.entries(translations)) {
      const parts = key.split('.');
      if (parts.length >= 2) {
        const namespace = parts[0];
        const keyName = parts.slice(1).join('.');
        
        // Find namespace block
        const nsPattern = new RegExp(`(${namespace}:\\s*\\{)([^}]+)(\\})`, 's');
        const nsMatch = nsPattern.exec(localeContent);
        
        if (nsMatch) {
          const nsContent = nsMatch[2];
          // Find key in namespace
          const keyPattern = new RegExp(`(['"]?)${keyName.replace(/\./g, '\\.')}\\1:\\s*\`([^\`]*)\``);
          const keyMatch = keyPattern.exec(nsContent);
          
          if (keyMatch) {
            // Escape value
            let escapedValue = value;
            escapedValue = escapedValue.replace(/\\/g, '\\\\');
            escapedValue = escapedValue.replace(/`/g, '\\`');
            escapedValue = escapedValue.replace(/\${/g, '\\${');
            escapedValue = escapedValue.replace(/\n/g, '\\n');
            
            const oldKeyValue = keyMatch[0];
            const newKeyValue = `${keyMatch[1]}${keyName}${keyMatch[1]}: \`${escapedValue}\``;
            
            localeContent = localeContent.replace(
              new RegExp(oldKeyValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
              newKeyValue
            );
            updatedCount++;
          }
        }
      }
    }
    
    if (updatedCount > 0) {
      // Backup
      const backupPath = `${localePath}.backup.${Date.now()}`;
      writeFileSync(backupPath, readFileSync(localePath, 'utf-8'), 'utf-8');
      
      // Write updated file
      writeFileSync(localePath, localeContent, 'utf-8');
      console.log(`✅ Updated ${updatedCount} translations in ${lang}.ts`);
    }
  }
  
  console.log('\n✅ Import complete!');
  console.log('💡 Note: zh-TW.ts is the source of truth and is not modified by import');
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  const zhTWPath = join(process.cwd(), 'src', 'i18n', 'locales', 'zh-TW.ts');
  const csvPath = join(process.cwd(), 'i18n_for_translation.csv');
  
  if (command === 'export') {
    const preserveOrder = !args.includes('--no-preserve-order');
    exportToCSV(zhTWPath, csvPath, preserveOrder);
  } else if (command === 'import') {
    const localeDir = join(process.cwd(), 'src', 'i18n', 'locales');
    importFromCSV(csvPath, localeDir);
  } else {
    console.log('Usage:');
    console.log('  pnpm tsx scripts/i18n-csv-manager.ts export [--no-preserve-order]');
    console.log('    - Export translations from zh-TW.ts to CSV');
    console.log('    - By default, preserves existing CSV order and appends new keys');
    console.log('');
    console.log('  pnpm tsx scripts/i18n-csv-manager.ts import');
    console.log('    - Import translations from CSV to zh-TW.ts');
    console.log('    - Updates existing translations in zh-TW.ts');
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});

