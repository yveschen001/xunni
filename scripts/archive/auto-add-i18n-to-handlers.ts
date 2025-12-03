/**
 * Auto-add i18n to handler files
 * This script automatically adds i18n initialization to handler files
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const HANDLERS_DIR = join(process.cwd(), 'src', 'telegram', 'handlers');

// Common error message replacements
const COMMON_REPLACEMENTS: Array<[RegExp, string]> = [
  // User not found
  [/'⚠️ 用戶不存在，請先使用 \/start 註冊。'/g, "i18n.t('common.userNotFound')"],
  [/'❌ 用戶不存在，請先使用 \/start 註冊。'/g, "i18n.t('common.userNotFound')"],
  [/"⚠️ 用戶不存在，請先使用 \/start 註冊。"/g, "i18n.t('common.userNotFound')"],
  [/"❌ 用戶不存在，請先使用 \/start 註冊。"/g, "i18n.t('common.userNotFound')"],
  
  // Not registered
  [/'⚠️ 請先完成註冊流程。\\n\\n使用 \/start 繼續註冊。'/g, "i18n.t('common.notRegistered')"],
  [/'❌ 請先完成註冊流程。\\n\\n使用 \/start 繼續註冊。'/g, "i18n.t('common.notRegistered')"],
  [/"⚠️ 請先完成註冊流程。\\n\\n使用 \/start 繼續註冊。"/g, "i18n.t('common.notRegistered')"],
  [/"❌ 請先完成註冊流程。\\n\\n使用 \/start 繼續註冊。"/g, "i18n.t('common.notRegistered')"],
  
  // System error
  [/'❌ 系統發生錯誤，請稍後再試。'/g, "i18n.t('common.systemError')"],
  [/"❌ 系統發生錯誤，請稍後再試。"/g, "i18n.t('common.systemError')"],
  
  // Common terms
  [/'未設定'/g, "i18n.t('common.notSet')"],
  [/"未設定"/g, "i18n.t('common.notSet')"],
];

function addI18nToFile(filename: string): boolean {
  const filePath = join(HANDLERS_DIR, filename);
  
  if (!existsSync(filePath)) {
    console.log(`⏭️  Skipping ${filename} (file not found)`);
    return false;
  }
  
  let content = readFileSync(filePath, 'utf-8');
  
  // Skip if already has i18n
  if (content.includes('createI18n') || content.includes('i18n.t(')) {
    console.log(`⏭️  Skipping ${filename} (already has i18n)`);
    return false;
  }
  
  console.log(`🔧 Processing ${filename}...`);
  
  let modified = false;
  
  // Apply common replacements
  for (const [pattern, replacement] of COMMON_REPLACEMENTS) {
    if (pattern.test(content)) {
      content = content.replace(pattern, replacement);
      modified = true;
    }
  }
  
  if (modified) {
    // Add i18n import at the top (after other imports)
    const importMatch = content.match(/(import[^;]+;[\s\S]*?)\n\nexport/);
    if (importMatch) {
      content = content.replace(
        importMatch[1],
        importMatch[1] + "\nimport { createI18n } from '~/i18n';"
      );
    }
    
    writeFileSync(filePath, content, 'utf-8');
    console.log(`✅ Fixed ${filename}`);
    return true;
  }
  
  console.log(`⏭️  Skipping ${filename} (no changes needed)`);
  return false;
}

// Files to process (high priority first)
const FILES_TO_PROCESS = [
  'catch.ts',
  'chats.ts',
  'conversation_actions.ts',
  'message_forward.ts',
  'vip.ts',
  'tasks.ts',
  'throw_advanced.ts',
  'mbti.ts',
  'mbti_test.ts',
  'edit_profile.ts',
  'onboarding_callback.ts',
  'onboarding_input.ts',
  'country_confirmation.ts',
  'country_selection.ts',
  'nickname_callback.ts',
  'draft.ts',
  'vip_refund.ts',
  'block.ts',
  'tutorial.ts',
  'refresh_conversations.ts',
  'refresh_avatar.ts',
  'broadcast.ts',
  'dev.ts',
  'admin_ad_config.ts',
  'official_ad.ts',
  'ad_reward.ts',
  'admin_diagnose_avatar.ts',
  'maintenance.ts',
  'admin_refresh_vip_avatars.ts',
  'admin_analytics.ts',
  'admin_test_refresh.ts',
];

console.log('🚀 Starting batch i18n fix...\n');

let fixedCount = 0;
for (const file of FILES_TO_PROCESS) {
  if (addI18nToFile(file)) {
    fixedCount++;
  }
}

console.log(`\n✅ Batch fix complete! Fixed ${fixedCount} files.`);
console.log(`\n⚠️  Note: This script only fixes common error messages.`);
console.log(`   You still need to manually fix other user-facing strings.`);

