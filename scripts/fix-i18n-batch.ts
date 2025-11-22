/**
 * Batch fix i18n for all handler files
 * This script will scan files and report which ones need i18n fixes
 */

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const HANDLERS_DIR = join(process.cwd(), 'src', 'telegram', 'handlers');

// Files that already have i18n
const COMPLETED_FILES = [
  'admin_ban.ts',
  'appeal.ts',
  'history.ts',
  'invite_activation.ts',
  'language_selection.ts',
  'menu.ts',
  'report.ts',
  'start.ts',
  'throw.ts',
];

// Check if file has i18n
function hasI18n(filePath: string): boolean {
  const content = readFileSync(filePath, 'utf-8');
  return content.includes('createI18n') || content.includes('i18n.t(');
}

// Count Chinese characters in file
function countChineseChars(filePath: string): number {
  const content = readFileSync(filePath, 'utf-8');
  const chineseRegex = /[\u4e00-\u9fa5]/g;
  const matches = content.match(chineseRegex);
  return matches ? matches.length : 0;
}

// Main
console.log('🔍 Scanning handler files for i18n status...\n');

const files = readdirSync(HANDLERS_DIR).filter(f => f.endsWith('.ts'));

const needsFix: Array<{ file: string; chineseCount: number }> = [];

for (const file of files) {
  const filePath = join(HANDLERS_DIR, file);
  const hasI18nSupport = hasI18n(filePath);
  const chineseCount = countChineseChars(filePath);
  
  if (!hasI18nSupport && chineseCount > 0) {
    needsFix.push({ file, chineseCount });
  }
}

// Sort by Chinese character count (most to least)
needsFix.sort((a, b) => b.chineseCount - a.chineseCount);

console.log(`📊 Summary:`);
console.log(`  Total files: ${files.length}`);
console.log(`  ✅ Already have i18n: ${files.length - needsFix.length}`);
console.log(`  ❌ Need i18n fix: ${needsFix.length}\n`);

console.log(`📋 Files that need i18n (sorted by priority):\n`);

for (const { file, chineseCount } of needsFix) {
  console.log(`  ❌ ${file.padEnd(35)} - ${chineseCount} Chinese chars`);
}

console.log(`\n💡 Priority files to fix first:`);
const topPriority = needsFix.slice(0, 10);
for (const { file } of topPriority) {
  console.log(`  - ${file}`);
}

