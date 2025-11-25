/**
 * Comprehensive i18n Issues Checker
 * 全面的 i18n 问题检查器
 * 
 * This script checks for common i18n issues across all languages:
 * 1. Missing keys (compared to reference language)
 * 2. Untranslated placeholders ([Translation needed: ...], [需要翻译: ...])
 * 3. Template literal issues ({var || 'default'} ${var})
 * 4. Empty or placeholder values
 */

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const LOCALES_DIR = 'src/i18n/locales';
const REFERENCE_LANG = 'zh-TW';

interface Issue {
  type: 'missing' | 'untranslated' | 'template' | 'empty';
  key: string;
  lang: string;
  message: string;
}

/**
 * Extract all keys from a file
 */
function extractKeys(filePath: string): Set<string> {
  const content = readFileSync(filePath, 'utf-8');
  const keys = new Set<string>();
  
  // Simple regex extraction
  const keyPattern = /(\w+):\s*`([^`]*)`/g;
  const lines = content.split('\n');
  let currentPath: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const indent = (line.match(/^(\s*)/)?.[1].length || 0) / 2;
    currentPath = currentPath.slice(0, indent);

    const objMatch = line.match(/^(\s*)(\w+):\s*\{/);
    if (objMatch) {
      currentPath.push(objMatch[2]);
      continue;
    }

    const kvMatch = line.match(/^(\s*)(\w+):\s*`([^`]*)`/);
    if (kvMatch) {
      const key = kvMatch[2];
      const value = kvMatch[3];
      const fullPath = currentPath.length > 0 ? `${currentPath.join('.')}.${key}` : key;
      keys.add(fullPath);
    }
  }

  return keys;
}

/**
 * Check for issues in a file
 */
function checkFileIssues(filePath: string, refKeys: Set<string>): Issue[] {
  const content = readFileSync(filePath, 'utf-8');
  const lang = filePath.split('/').pop()?.replace('.ts', '') || '';
  const issues: Issue[] = [];
  
  const keys = extractKeys(filePath);
  
  // Check for missing keys
  for (const refKey of refKeys) {
    if (!keys.has(refKey)) {
      issues.push({
        type: 'missing',
        key: refKey,
        lang,
        message: `Missing key: ${refKey}`,
      });
    }
  }

  // Check for untranslated placeholders
  const untranslatedPattern = /\[(?:Translation needed|需要翻译):\s*([^\]]+)\]/g;
  let match;
  while ((match = untranslatedPattern.exec(content)) !== null) {
    const lineNum = content.substring(0, match.index).split('\n').length;
    issues.push({
      type: 'untranslated',
      key: match[1],
      lang,
      message: `Untranslated placeholder at line ${lineNum}: ${match[0]}`,
    });
  }

  // Check for template literal issues
  const templateIssues = [
    /\{user\.mbti_result\s*\|\|\s*[^}]+\}\s*\\?\$\{user\.mbti_result\}/g,
    /\{user\.zodiac_sign\s*\|\|\s*[^}]+\}\s*\\?\$\{user\.zodiac_sign\}/g,
    /\{updatedUser\.mbti_result\s*\|\|\s*[^}]+\}\s*\\?\$\{updatedUser\.mbti_result\}/g,
    /\{updatedUser\.zodiac_sign\s*\|\|\s*[^}]+\}\s*\\?\$\{updatedUser\.zodiac_sign\}/g,
  ];

  for (const pattern of templateIssues) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const lineNum = content.substring(0, match.index).split('\n').length;
      issues.push({
        type: 'template',
        key: '',
        lang,
        message: `Template literal issue at line ${lineNum}: ${match[0]}`,
      });
    }
  }

  // Check for empty or placeholder values
  const emptyPattern = /(\w+):\s*`(?:\[需要翻译\]|\[Translation needed\]|)`/g;
  while ((match = emptyPattern.exec(content)) !== null) {
    const lineNum = content.substring(0, match.index).split('\n').length;
    issues.push({
      type: 'empty',
      key: match[1],
      lang,
      message: `Empty/placeholder value at line ${lineNum}: ${match[1]}`,
    });
  }

  return issues;
}

/**
 * Main check function
 */
function checkAllIssues(): void {
  console.log('🔍 Checking i18n issues across all languages...\n');
  console.log('='.repeat(80));
  console.log('');

  const refFile = join(LOCALES_DIR, `${REFERENCE_LANG}.ts`);
  const refKeys = extractKeys(refFile);
  console.log(`📋 Reference language (${REFERENCE_LANG}): ${refKeys.size} keys\n`);

  const langFiles = readdirSync(LOCALES_DIR)
    .filter(f => f.endsWith('.ts') && f !== 'template.ts')
    .map(f => join(LOCALES_DIR, f));

  const allIssues: Issue[] = [];
  const langIssues: Map<string, Issue[]> = new Map();

  for (const file of langFiles) {
    const lang = file.split('/').pop()?.replace('.ts', '') || '';
    if (lang === REFERENCE_LANG) continue;

    const issues = checkFileIssues(file, refKeys);
    if (issues.length > 0) {
      allIssues.push(...issues);
      langIssues.set(lang, issues);
    }
  }

  // Report results
  if (allIssues.length === 0) {
    console.log('✅ No issues found! All languages are consistent.\n');
    return;
  }

  // Group by type
  const byType = {
    missing: allIssues.filter(i => i.type === 'missing'),
    untranslated: allIssues.filter(i => i.type === 'untranslated'),
    template: allIssues.filter(i => i.type === 'template'),
    empty: allIssues.filter(i => i.type === 'empty'),
  };

  console.log('📊 Issue Summary:\n');
  console.log(`   Missing keys: ${byType.missing.length}`);
  console.log(`   Untranslated placeholders: ${byType.untranslated.length}`);
  console.log(`   Template literal issues: ${byType.template.length}`);
  console.log(`   Empty/placeholder values: ${byType.empty.length}`);
  console.log(`   Total issues: ${allIssues.length}\n`);

  // Show details by language
  console.log('📁 Issues by Language:\n');
  for (const [lang, issues] of langIssues.entries()) {
    const langByType = {
      missing: issues.filter(i => i.type === 'missing').length,
      untranslated: issues.filter(i => i.type === 'untranslated').length,
      template: issues.filter(i => i.type === 'template').length,
      empty: issues.filter(i => i.type === 'empty').length,
    };
    
    console.log(`   ${lang}:`);
    if (langByType.missing > 0) console.log(`     - Missing: ${langByType.missing} keys`);
    if (langByType.untranslated > 0) console.log(`     - Untranslated: ${langByType.untranslated} placeholders`);
    if (langByType.template > 0) console.log(`     - Template issues: ${langByType.template}`);
    if (langByType.empty > 0) console.log(`     - Empty values: ${langByType.empty}`);
    console.log('');
  }

  // Show top missing keys
  if (byType.missing.length > 0) {
    const missingByKey = new Map<string, number>();
    byType.missing.forEach(issue => {
      missingByKey.set(issue.key, (missingByKey.get(issue.key) || 0) + 1);
    });

    console.log('🔑 Most Missing Keys (across languages):\n');
    const sorted = Array.from(missingByKey.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    
    sorted.forEach(([key, count]) => {
      console.log(`   ${key}: missing in ${count} languages`);
    });
    console.log('');
  }

  console.log('💡 To fix these issues:');
  console.log('   1. Run: pnpm i18n:sync to add missing keys');
  console.log('   2. Run: pnpm i18n:fix-templates to fix template literal issues');
  console.log('   3. Review and translate placeholder values\n');
}

checkAllIssues();

