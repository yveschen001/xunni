/**
 * Check i18n Consistency Across All Languages
 * 检查所有语言的 i18n 一致性
 * 
 * This script checks if all languages have the same i18n keys as the reference language (zh-TW)
 * 此脚本检查所有语言是否与参考语言（zh-TW）具有相同的 i18n key
 */

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const LOCALES_DIR = 'src/i18n/locales';
const REFERENCE_LANG = 'zh-TW';

interface KeyPath {
  path: string[];
  value: string;
}

/**
 * Extract all i18n keys from a TypeScript file
 */
function extractKeys(filePath: string): Map<string, KeyPath> {
  const content = readFileSync(filePath, 'utf-8');
  const keys = new Map<string, KeyPath>();

  // Simple regex-based extraction (more reliable than AST parsing for this use case)
  // Match patterns like: key: `value` or key: `value`,
  const keyPattern = /(\w+):\s*`([^`]*)`/g;
  let match;
  const path: string[] = [];

  // Track nested objects
  const lines = content.split('\n');
  let currentPath: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const indent = line.match(/^(\s*)/)?.[1].length || 0;
    const level = Math.floor(indent / 2);

    // Reset path based on indent level
    currentPath = currentPath.slice(0, level);

    // Check for object start
    const objMatch = line.match(/^(\s*)(\w+):\s*\{/);
    if (objMatch) {
      currentPath.push(objMatch[2]);
      continue;
    }

    // Check for key-value pair
    const kvMatch = line.match(/^(\s*)(\w+):\s*`([^`]*)`/);
    if (kvMatch) {
      const key = kvMatch[2];
      const value = kvMatch[3];
      const fullPath = [...currentPath, key].join('.');
      keys.set(fullPath, { path: [...currentPath, key], value });
    }
  }

  return keys;
}

/**
 * Get all language files
 */
function getLanguageFiles(): string[] {
  return readdirSync(LOCALES_DIR)
    .filter((f: string) => f.endsWith('.ts') && f !== 'template.ts')
    .map((f: string) => join(LOCALES_DIR, f));
}

/**
 * Check consistency across all languages
 */
function checkConsistency(): void {
  console.log('🔍 Checking i18n consistency across all languages...\n');

  const refFile = join(LOCALES_DIR, `${REFERENCE_LANG}.ts`);
  const refKeys = extractKeys(refFile);
  console.log(`📋 Reference language (${REFERENCE_LANG}): ${refKeys.size} keys\n`);

  const langFiles = getLanguageFiles();
  const issues: Array<{ lang: string; missing: string[]; extra: string[] }> = [];

  for (const file of langFiles) {
    const lang = file.split('/').pop()?.replace('.ts', '') || '';
    if (lang === REFERENCE_LANG) continue;

    const keys = extractKeys(file);
    const missing: string[] = [];
    const extra: string[] = [];

    // Check for missing keys
    for (const [key, _] of refKeys) {
      if (!keys.has(key)) {
        missing.push(key);
      }
    }

    // Check for extra keys (optional, but good to know)
    for (const [key, _] of keys) {
      if (!refKeys.has(key)) {
        extra.push(key);
      }
    }

    if (missing.length > 0 || extra.length > 0) {
      issues.push({ lang, missing, extra });
    }
  }

  // Report results
  if (issues.length === 0) {
    console.log('✅ All languages are consistent!\n');
    return;
  }

  console.log('❌ Found inconsistencies:\n');
  for (const issue of issues) {
    console.log(`📁 ${issue.lang}:`);
    if (issue.missing.length > 0) {
      console.log(`   Missing keys (${issue.missing.length}):`);
      issue.missing.slice(0, 10).forEach((key) => console.log(`     - ${key}`));
      if (issue.missing.length > 10) {
        console.log(`     ... and ${issue.missing.length - 10} more`);
      }
    }
    if (issue.extra.length > 0) {
      console.log(`   Extra keys (${issue.extra.length}):`);
      issue.extra.slice(0, 5).forEach((key) => console.log(`     + ${key}`));
      if (issue.extra.length > 5) {
        console.log(`     ... and ${issue.extra.length - 5} more`);
      }
    }
    console.log('');
  }

  // Generate fix script
  console.log('💡 To fix missing keys, run: pnpm sync-i18n-keys\n');
}

checkConsistency();

