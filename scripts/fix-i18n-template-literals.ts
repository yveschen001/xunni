/**
 * Fix i18n Template Literal Issues
 * 修复 i18n 模板字符串问题
 * 
 * This script finds and fixes common i18n issues:
 * - Removes duplicate template expressions like {var || 'default'} ${var}
 * - Removes [Translation needed: ...] placeholders
 * - Ensures consistent key structure
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

const LOCALES_DIR = 'src/i18n/locales';

/**
 * Fix template literal issues in a file
 */
function fixTemplateLiterals(filePath: string): { fixed: number; issues: string[] } {
  let content = readFileSync(filePath, 'utf-8');
  const issues: string[] = [];
  let fixed = 0;

  // Pattern 1: Remove duplicate expressions like {var || 'default'} ${var}
  const duplicatePatterns = [
    /\{user\.mbti_result\s*\|\|\s*[^}]+\}\s*\\?\$\{user\.mbti_result\}/g,
    /\{user\.zodiac_sign\s*\|\|\s*[^}]+\}\s*\\?\$\{user\.zodiac_sign\}/g,
    /\{updatedUser\.mbti_result\s*\|\|\s*[^}]+\}\s*\\?\$\{updatedUser\.mbti_result\}/g,
    /\{updatedUser\.zodiac_sign\s*\|\|\s*[^}]+\}\s*\\?\$\{updatedUser\.zodiac_sign\}/g,
    /\{targetUser\.mbti_result\s*\|\|\s*[^}]+\}\s*\\?\$\{targetUser\.mbti_result\}/g,
    /\{targetUser\.zodiac_sign\s*\|\|\s*[^}]+\}\s*\\?\$\{targetUser\.zodiac_sign\}/g,
    /\{otherUser\.mbti_result\s*\|\|\s*[^}]+\}\s*\\?\$\{otherUser\.mbti_result\}/g,
    /\{otherUser\.zodiac_sign\s*\|\|\s*[^}]+\}\s*\\?\$\{otherUser\.zodiac_sign\}/g,
    /\{bottle\.mbti_result\s*\|\|\s*[^}]+\}\s*\\?\$\{bottle\.mbti_result\}/g,
    /\{matchResult\.user\.mbti_result\s*\|\|\s*[^}]+\}\s*\\?\$\{matchResult\.user\.mbti_result\}/g,
    /\{matchResult\.user\.zodiac\s*\|\|\s*[^}]+\}\s*\\?\$\{matchResult\.user\.zodiac\}/g,
    /\{updatedUser\.interests\s*\|\|\s*[^}]+\}\s*\\?\$\{updatedUser\.interests\}/g,
    /\{user\.interests\s*\|\|\s*[^}]+\}\s*\\?\$\{user\.interests\}/g,
    /\{updatedUser\.bio\s*\|\|\s*[^}]+\}\s*\\?\$\{updatedUser\.bio\}/g,
    /\{user\.bio\s*\|\|\s*[^}]+\}\s*\\?\$\{user\.bio\}/g,
    /\{updatedUser\.city\s*\|\|\s*[^}]+\}\s*\\?\$\{updatedUser\.city\}/g,
    /\{user\.city\s*\|\|\s*[^}]+\}\s*\\?\$\{user\.city\}/g,
    /\{targetUser\.nickname\s*\|\|\s*[^}]+\}\s*\\?\$\{targetUser\.nickname\}/g,
    /\{user\.nickname\s*\|\|\s*[^}]+\}\s*\\?\$\{user\.nickname\}/g,
  ];

  for (const pattern of duplicatePatterns) {
    const matches = content.match(pattern);
    if (matches) {
      issues.push(`Found ${matches.length} duplicate template expressions`);
      content = content.replace(pattern, '');
      fixed += matches.length;
    }
  }

  // Pattern 2: Remove standalone lines with just these patterns
  const lines = content.split('\n');
  const cleanedLines: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Skip lines that are just whitespace and these patterns
    if (line.match(/^\s*\{[^}]+\|\|[^}]+\}[^`]*$/)) {
      issues.push(`Removed standalone template line: ${line.trim()}`);
      fixed++;
      continue;
    }
    cleanedLines.push(line);
  }
  content = cleanedLines.join('\n');

  // Pattern 3: Remove [Translation needed: ...] or [需要翻译: ...]
  const translationNeededPattern = /\[(?:Translation needed|需要翻译):\s*[^\]]+\]/g;
  const translationMatches = content.match(translationNeededPattern);
  if (translationMatches) {
    issues.push(`Found ${translationMatches.length} untranslated placeholders`);
    // Don't auto-remove these, just report them
  }

  if (fixed > 0) {
    writeFileSync(filePath, content, 'utf-8');
  }

  return { fixed, issues };
}

/**
 * Fix all locale files
 */
function fixAllFiles(): void {
  console.log('🔧 Fixing i18n template literal issues...\n');

  const files = readdirSync(LOCALES_DIR)
    .filter(f => f.endsWith('.ts') && f !== 'template.ts')
    .map(f => join(LOCALES_DIR, f));

  let totalFixed = 0;
  const filesWithIssues: Array<{ file: string; fixed: number; issues: string[] }> = [];

  for (const file of files) {
    const lang = file.split('/').pop()?.replace('.ts', '') || '';
    const result = fixTemplateLiterals(file);
    
    if (result.fixed > 0 || result.issues.length > 0) {
      filesWithIssues.push({ file: lang, fixed: result.fixed, issues: result.issues });
      totalFixed += result.fixed;
    }
  }

  if (filesWithIssues.length === 0) {
    console.log('✅ No template literal issues found!\n');
    return;
  }

  console.log('📊 Fix summary:\n');
  for (const { file, fixed, issues } of filesWithIssues) {
    console.log(`📁 ${file}:`);
    console.log(`   Fixed: ${fixed} issues`);
    if (issues.length > 0) {
      issues.slice(0, 3).forEach((issue) => console.log(`   - ${issue}`));
      if (issues.length > 3) {
        console.log(`   ... and ${issues.length - 3} more`);
      }
    }
    console.log('');
  }

  console.log(`\n✅ Fixed ${totalFixed} issues across ${filesWithIssues.length} files.\n`);
}

fixAllFiles();

