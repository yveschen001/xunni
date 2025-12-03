/**
 * Auto-fix i18n for handler files
 * This script will automatically add i18n support to handler files
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const HANDLERS_DIR = join(process.cwd(), 'src', 'telegram', 'handlers');

// Common replacements
const COMMON_REPLACEMENTS: Array<[RegExp, string]> = [
  // Error messages
  [/⚠️ 用戶不存在，請先使用 \/start 註冊。/g, "i18n.t('common.userNotFound')"],
  [/❌ 用戶不存在，請先使用 \/start 註冊。/g, "i18n.t('common.userNotFound')"],
  [/⚠️ 請先完成註冊流程。\\n\\n使用 \/start 繼續註冊。/g, "i18n.t('common.notRegistered')"],
  [/❌ 請先完成註冊流程。\\n\\n使用 \/start 繼續註冊。/g, "i18n.t('common.notRegistered')"],
  [/❌ 系統發生錯誤，請稍後再試。/g, "i18n.t('common.systemError')"],
  
  // Common terms
  [/'未設定'/g, "i18n.t('common.notSet')"],
  [/'男'/g, "i18n.t('common.male')"],
  [/'女'/g, "i18n.t('common.female')"],
];

function addI18nImport(content: string): string {
  // Check if i18n import already exists
  if (content.includes('createI18n')) {
    return content;
  }
  
  // Find the last import statement
  const lines = content.split('\n');
  let lastImportIndex = -1;
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('import ')) {
      lastImportIndex = i;
    }
  }
  
  if (lastImportIndex >= 0) {
    // Add i18n import after last import
    lines.splice(lastImportIndex + 1, 0, "import { createI18n } from '~/i18n';");
    return lines.join('\n');
  }
  
  return content;
}

function addI18nInitialization(content: string, functionName: string): string {
  // Check if i18n is already initialized
  if (content.includes('createI18n(')) {
    return content;
  }
  
  // Find the function and add i18n initialization
  const functionRegex = new RegExp(`(export async function ${functionName}[^{]+{[^}]*?const telegramId[^;]+;)`, 's');
  const match = content.match(functionRegex);
  
  if (match) {
    const replacement = match[1] + '\n\n    const { createI18n } = await import(\'~/i18n\');\n    const i18n = createI18n(\'zh-TW\');';
    content = content.replace(functionRegex, replacement);
  }
  
  return content;
}

function applyCommonReplacements(content: string): string {
  for (const [pattern, replacement] of COMMON_REPLACEMENTS) {
    content = content.replace(pattern, replacement);
  }
  return content;
}

// Process a single file
function processFile(filename: string): void {
  const filePath = join(HANDLERS_DIR, filename);
  let content = readFileSync(filePath, 'utf-8');
  
  // Skip if already has i18n
  if (content.includes('i18n.t(')) {
    console.log(`⏭️  Skipping ${filename} (already has i18n)`);
    return;
  }
  
  console.log(`🔧 Processing ${filename}...`);
  
  // Add i18n import
  content = addI18nImport(content);
  
  // Apply common replacements
  content = applyCommonReplacements(content);
  
  // Write back
  writeFileSync(filePath, content, 'utf-8');
  console.log(`✅ Fixed ${filename}`);
}

// Main
const filesToFix = [
  'settings.ts',
  'stats.ts',
  'help.ts',
  'catch.ts',
  'chats.ts',
];

console.log('🚀 Starting auto-fix i18n...\n');

for (const file of filesToFix) {
  try {
    processFile(file);
  } catch (error) {
    console.error(`❌ Error processing ${file}:`, error);
  }
}

console.log('\n✅ Auto-fix complete!');

