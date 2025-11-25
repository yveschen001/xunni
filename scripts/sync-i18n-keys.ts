/**
 * Sync i18n Keys Across All Languages
 * 同步所有语言的 i18n key
 * 
 * This script syncs missing keys from reference language (zh-TW) to all other languages
 * 此脚本将参考语言（zh-TW）中缺失的 key 同步到所有其他语言
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const LOCALES_DIR = 'src/i18n/locales';
const REFERENCE_LANG = 'zh-TW';

interface KeyInfo {
  key: string;
  value: string;
  path: string[];
  lineNumber: number;
}

/**
 * Extract key-value pairs from a TypeScript file with their structure
 */
function extractKeysWithStructure(filePath: string): {
  keys: Map<string, KeyInfo>;
  structure: string[];
} {
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const keys = new Map<string, KeyInfo>();
  const structure: string[] = [];

  let currentPath: string[] = [];
  let inTranslations = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const indent = (line.match(/^(\s*)/)?.[1].length || 0) / 2;

    // Track structure
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
      structure.push(line);
      continue;
    }

    // Check for key-value pair (e.g., "key: `value`,")
    const kvMatch = line.match(/^(\s*)(\w+):\s*`([^`]*)`/);
    if (kvMatch) {
      const key = kvMatch[2];
      const value = kvMatch[3];
      const fullPath = currentPath.join('.');
      const fullKey = fullPath ? `${fullPath}.${key}` : key;
      
      keys.set(fullKey, {
        key,
        value,
        path: [...currentPath],
        lineNumber: i + 1,
      });
    }

    // Check for object end
    if (line.match(/^\s*\},?\s*$/)) {
      currentPath.pop();
    }
  }

  return { keys, structure };
}

/**
 * Get all language files
 */
function getLanguageFiles(): Array<{ code: string; path: string }> {
  const fs = require('fs');
  return fs
    .readdirSync(LOCALES_DIR)
    .filter((f: string) => f.endsWith('.ts') && f !== 'template.ts')
    .map((f: string) => ({
      code: f.replace('.ts', ''),
      path: join(LOCALES_DIR, f),
    }));
}

/**
 * Find insertion point for a key in a file
 */
function findInsertionPoint(
  content: string,
  targetPath: string[]
): { line: number; indent: number } | null {
  const lines = content.split('\n');
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

    // Check for object start
    const objMatch = line.match(/^(\s*)(\w+):\s*\{/);
    if (objMatch) {
      currentPath.push(objMatch[2]);
      
      // Check if we're in the right path
      if (currentPath.length === targetPath.length - 1) {
        const lastKey = targetPath[targetPath.length - 1];
        // Look for the next key in the same level
        for (let j = i + 1; j < lines.length; j++) {
          const nextLine = lines[j];
          const nextIndent = (nextLine.match(/^(\s*)/)?.[1].length || 0) / 2;
          
          if (nextIndent < indent + 1) break;
          
          const nextKvMatch = nextLine.match(/^(\s*)(\w+):\s*`/);
          if (nextKvMatch && nextIndent === indent + 1) {
            // Insert before this key
            return { line: j, indent: indent + 1 };
          }
        }
        // If no next key found, insert at end of object
        for (let j = i + 1; j < lines.length; j++) {
          if (lines[j].match(/^\s*\},?\s*$/)) {
            return { line: j, indent: indent + 1 };
          }
        }
      }
      continue;
    }
  }

  return null;
}

/**
 * Add missing key to a file
 */
function addKeyToFile(
  filePath: string,
  keyInfo: KeyInfo,
  placeholder: string = '[需要翻译]'
): void {
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  const insertionPoint = findInsertionPoint(content, keyInfo.path);
  
  if (!insertionPoint) {
    console.error(`   ⚠️  Could not find insertion point for ${keyInfo.path.join('.')}`);
    return;
  }

  const indent = '  '.repeat(insertionPoint.indent);
  const newLine = `${indent}${keyInfo.key}: \`${placeholder}\`,`;
  
  lines.splice(insertionPoint.line, 0, newLine);
  
  writeFileSync(filePath, lines.join('\n'), 'utf-8');
}

/**
 * Sync missing keys
 */
function syncKeys(): void {
  console.log('🔄 Syncing i18n keys across all languages...\n');

  const refFile = join(LOCALES_DIR, `${REFERENCE_LANG}.ts`);
  const { keys: refKeys } = extractKeysWithStructure(refFile);
  console.log(`📋 Reference language (${REFERENCE_LANG}): ${refKeys.size} keys\n`);

  const langFiles = getLanguageFiles();
  let totalFixed = 0;

  for (const { code, path } of langFiles) {
    if (code === REFERENCE_LANG) continue;

    const { keys } = extractKeysWithStructure(path);
    const missing: KeyInfo[] = [];

    for (const [fullKey, keyInfo] of refKeys) {
      if (!keys.has(fullKey)) {
        missing.push(keyInfo);
      }
    }

    if (missing.length > 0) {
      console.log(`📁 ${code}: ${missing.length} missing keys`);
      
      // Add missing keys
      for (const keyInfo of missing) {
        addKeyToFile(path, keyInfo);
      }
      
      totalFixed += missing.length;
      console.log(`   ✅ Added ${missing.length} missing keys\n`);
    } else {
      console.log(`📁 ${code}: ✅ All keys present\n`);
    }
  }

  console.log(`\n✅ Sync complete! Added ${totalFixed} missing keys across all languages.`);
  console.log('💡 Please review and translate the placeholder values.\n');
}

syncKeys();

