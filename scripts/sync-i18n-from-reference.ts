/**
 * Sync i18n Keys from Reference Language to All Other Languages
 * 从参考语言同步 i18n key 到所有其他语言
 * 
 * This script ensures that when you fix an issue in one language (zh-TW),
 * the same fix structure is applied to all other languages.
 * 
 * 当你修复一个语言（zh-TW）的问题后，此脚本会将相同的修复结构应用到所有其他语言。
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

const LOCALES_DIR = 'src/i18n/locales';
const REFERENCE_LANG = 'zh-TW';

interface KeyStructure {
  fullPath: string;
  key: string;
  value: string;
  path: string[];
  indent: number;
}

/**
 * Extract all keys with their structure from a file
 */
function extractKeys(filePath: string): Map<string, KeyStructure> {
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const keys = new Map<string, KeyStructure>();
  
  let currentPath: string[] = [];
  let inTranslations = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const indent = (line.match(/^(\s*)/)?.[1].length || 0) / 2;

    if (line.includes('export const translations')) {
      inTranslations = true;
      continue;
    }

    if (!inTranslations) continue;

    // Reset path based on indent
    currentPath = currentPath.slice(0, indent);

    // Check for object start (e.g., "common: {")
    const objMatch = line.match(/^(\s*)(\w+):\s*\{/);
    if (objMatch) {
      currentPath.push(objMatch[2]);
      continue;
    }

    // Check for key-value pair (e.g., "key: `value`,")
    const kvMatch = line.match(/^(\s*)(\w+):\s*`([^`]*)`/);
    if (kvMatch) {
      const key = kvMatch[2];
      const value = kvMatch[3];
      const fullPath = currentPath.length > 0 ? `${currentPath.join('.')}.${key}` : key;
      
      keys.set(fullPath, {
        fullPath,
        key,
        value,
        path: [...currentPath],
        indent: indent + 1,
      });
    }

    // Check for object end
    if (line.match(/^\s*\},?\s*$/)) {
      currentPath.pop();
    }
  }

  return keys;
}

/**
 * Find where to insert a key in a file
 */
function findInsertionPoint(
  content: string,
  targetPath: string[]
): { line: number; indent: number } | null {
  const lines = content.split('\n');
  let currentPath: string[] = [];
  let inTranslations = false;
  let lastKeyLine = -1;
  let lastKeyIndent = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const indent = (line.match(/^(\s*)/)?.[1].length || 0) / 2;

    if (line.includes('export const translations')) {
      inTranslations = true;
      continue;
    }

    if (!inTranslations) continue;

    // Reset path based on indent
    currentPath = currentPath.slice(0, indent);

    // Check for object start
    const objMatch = line.match(/^(\s*)(\w+):\s*\{/);
    if (objMatch) {
      currentPath.push(objMatch[2]);
      
      // Check if we're in the right path
      if (currentPath.length === targetPath.length) {
        // We're in the target object, find the last key
        for (let j = i + 1; j < lines.length; j++) {
          const nextLine = lines[j];
          const nextIndent = (nextLine.match(/^(\s*)/)?.[1].length || 0) / 2;
          
          // If we've left the object, insert before the closing brace
          if (nextIndent <= indent) {
            return { line: j, indent: indent + 1 };
          }
          
          // If we found a key at the right level, remember it
          const nextKvMatch = nextLine.match(/^(\s*)(\w+):\s*`/);
          if (nextKvMatch && nextIndent === indent + 1) {
            lastKeyLine = j + 1; // Insert after this key
            lastKeyIndent = indent + 1;
          }
        }
        
        // If we found a last key, return after it
        if (lastKeyLine > 0) {
          return { line: lastKeyLine, indent: lastKeyIndent };
        }
      }
      continue;
    }

    // Check for key-value pair
    const kvMatch = line.match(/^(\s*)(\w+):\s*`/);
    if (kvMatch && currentPath.length === targetPath.length) {
      lastKeyLine = i + 1;
      lastKeyIndent = indent;
    }
  }

  return lastKeyLine > 0 ? { line: lastKeyLine, indent: lastKeyIndent } : null;
}

/**
 * Add a missing key to a file
 */
function addKeyToFile(
  filePath: string,
  keyStruct: KeyStructure,
  placeholder: string = '[需要翻译]'
): boolean {
  const content = readFileSync(filePath, 'utf-8');
  const insertionPoint = findInsertionPoint(content, keyStruct.path);
  
  if (!insertionPoint) {
    return false;
  }

  const lines = content.split('\n');
  const indent = '  '.repeat(insertionPoint.indent);
  const newLine = `${indent}${keyStruct.key}: \`${placeholder}\`,`;
  
  lines.splice(insertionPoint.line, 0, newLine);
  writeFileSync(filePath, lines.join('\n'), 'utf-8');
  
  return true;
}

/**
 * Sync missing keys from reference to all languages
 */
function syncMissingKeys(): void {
  console.log('🔄 Syncing missing i18n keys from reference language...\n');

  const refFile = join(LOCALES_DIR, `${REFERENCE_LANG}.ts`);
  const refKeys = extractKeys(refFile);
  console.log(`📋 Reference language (${REFERENCE_LANG}): ${refKeys.size} keys\n`);

  const langFiles = readdirSync(LOCALES_DIR)
    .filter(f => f.endsWith('.ts') && f !== 'template.ts')
    .map(f => join(LOCALES_DIR, f));

  let totalAdded = 0;
  const results: Array<{ lang: string; added: number; failed: string[] }> = [];

  for (const file of langFiles) {
    const lang = file.split('/').pop()?.replace('.ts', '') || '';
    if (lang === REFERENCE_LANG) continue;

    const keys = extractKeys(file);
    const missing: KeyStructure[] = [];
    const failed: string[] = [];

    // Find missing keys
    for (const [fullPath, keyStruct] of refKeys) {
      if (!keys.has(fullPath)) {
        missing.push(keyStruct);
      }
    }

    if (missing.length > 0) {
      console.log(`📁 ${lang}: ${missing.length} missing keys`);
      
      for (const keyStruct of missing) {
        const success = addKeyToFile(file, keyStruct);
        if (success) {
          totalAdded++;
        } else {
          failed.push(keyStruct.fullPath);
        }
      }
      
      results.push({
        lang,
        added: missing.length - failed.length,
        failed,
      });
      
      console.log(`   ✅ Added ${missing.length - failed.length} keys`);
      if (failed.length > 0) {
        console.log(`   ⚠️  Failed to add ${failed.length} keys`);
      }
      console.log('');
    } else {
      console.log(`📁 ${lang}: ✅ All keys present\n`);
    }
  }

  console.log(`\n✅ Sync complete!`);
  console.log(`   Total keys added: ${totalAdded}`);
  console.log(`   Languages updated: ${results.length}`);
  
  if (results.some(r => r.failed.length > 0)) {
    console.log('\n⚠️  Some keys could not be automatically added. Please check manually.');
  }
  
  console.log('\n💡 Next steps:');
  console.log('   1. Review the added placeholder values');
  console.log('   2. Translate them or use CSV import for bulk translation');
  console.log('   3. Run: pnpm i18n:check to verify consistency\n');
}

syncMissingKeys();

