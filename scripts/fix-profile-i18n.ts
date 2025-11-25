/**
 * Fix profile.ts hardcoded Chinese strings
 * This is a temporary script to help fix profile.ts
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const profilePath = join(process.cwd(), 'src', 'telegram', 'handlers', 'profile.ts');
let content = readFileSync(profilePath, 'utf-8');

// Fix: Add i18n import and get user language
content = content.replace(
  /\/\/ Get user\n\s*const user = await findUserByTelegramId\(db, telegramId\);\n\s*if \(!user\) \{/,
  `// Get user
    const user = await findUserByTelegramId(db, telegramId);
    
    // Get i18n
    const { createI18n } = await import('~/i18n');
    const i18n = createI18n(user?.language_pref || 'zh-TW');
    
    if (!user) {`
);

// Fix: Replace error messages
content = content.replace(
  /await telegram\.sendMessage\(chatId, '⚠️ 用戶不存在，請先使用 \/start 註冊。'\);/g,
  `await telegram.sendMessage(chatId, i18n.t('errors.userNotFound'));`
);

content = content.replace(
  /await telegram\.sendMessage\(chatId, '⚠️ 請先完成註冊流程。\\n\\n使用 \/start 繼續註冊。'\);/g,
  `await telegram.sendMessage(chatId, i18n.t('common.notRegistered'));`
);

// Fix: Replace gender strings
content = content.replace(
  /const gender = user\.gender === 'male' \? '男' : user\.gender === 'female' \? '女' : '未設定';/g,
  `const gender = user.gender === 'male' ? i18n.t('catch.short5').replace('♀️ ', '') : user.gender === 'female' ? i18n.t('catch.short4').replace('♂️ ', '') : i18n.t('profile.settings');`
);

// Fix: Replace mbtiSource
content = content.replace(
  /const mbtiSource =\s+user\.mbti_source === 'manual' \? '手動輸入' : user\.mbti_source === 'test' \? '測驗結果' : '';/g,
  `const mbtiSource =
      user.mbti_source === 'manual' ? i18n.t('common.mbti7') : user.mbti_source === 'test' ? i18n.t('common.short106') : '';`
);

// Fix: Replace profile message - use i18n.t() for all strings
// This is complex, so we'll do it step by step
content = content.replace(
  /const profileMessage =\s+`👤 \*\*個人資料\*\*\\n\\n`/g,
  `const profileMessage =
      i18n.t('profile.profile2') + '\n\n'`
);

content = content.replace(
  /`📛 暱稱：\$\{displayNickname\}\\n`/g,
  `i18n.t('profile.nickname', { displayNickname }) + '\n'`
);

content = content.replace(
  /`🎂 年齡：\$\{age\}\\n`/g,
  `i18n.t('profile.age', { age }) + '\n'`
);

content = content.replace(
  /`👤 性別：\$\{gender\}\\n`/g,
  `i18n.t('profile.gender', { gender }) + '\n'`
);

content = content.replace(
  /`🩸 血型：\$\{bloodType\}\\n`/g,
  `i18n.t('profile.bloodType', { bloodType }) + '\n'`
);

content = content.replace(
  /`🧠 MBTI：\$\{mbti\}\$\{mbtiSource \? ` \(\$\{mbtiSource\}\)` : ''\}\\n`/g,
  `i18n.t('profile.mbti', { mbti, mbtiSource: mbtiSource ? ` (${mbtiSource})` : '' }) + '\n'`
);

content = content.replace(
  /`⭐ 星座：\$\{zodiac\}\\n`/g,
  `i18n.t('profile.zodiac', { zodiac }) + '\n'`
);

content = content.replace(
  /`🌍 語言：\$\{user\.language_pref \|\| 'zh-TW'\}\\n`/g,
  `i18n.t('profile.message3', { user }) + '\n'`
);

content = content.replace(
  /`💎 會員：\$\{vipStatus\}\\n\\n`/g,
  `i18n.t('profile.text3', { vipStatus }) + '\n\n'`
);

// Fix: Replace invite section
content = content.replace(
  /`━━━━━━━━━━━━━━━━\\n\\n`/g,
  `'━━━━━━━━━━━━━━━━\n\n'`
);

content = content.replace(
  /`🎁 \*\*邀請資訊\*\*\\n\\n`/g,
  `i18n.t('profile.invite2') + '\n\n'`
);

content = content.replace(
  /`📋 你的邀請碼：\\`\$\{inviteCode\}\\`\\n`/g,
  `i18n.t('profile.invite2').replace('🎁 **邀請資訊**\n\n', '').replace('📋 你的邀請碼：\\`', '📋 你的邀請碼：`').replace('${inviteCode}', inviteCode) + '\n'`
);

// Fix: Replace buttons
content = content.replace(
  /\[\{ text: '📤 分享邀請碼', url: shareUrl \}\]/g,
  `[{ text: i18n.t('menu.invite3'), url: shareUrl }]`
);

content = content.replace(
  /\[\{ text: '📝 編輯資料', callback_data: 'edit_profile_menu' \}\]/g,
  `[{ text: i18n.t('profile.short'), callback_data: 'edit_profile_menu' }]`
);

// Fix: Replace error message
content = content.replace(
  /await telegram\.sendMessage\(chatId, '❌ 系統發生錯誤，請稍後再試。'\);/g,
  `await telegram.sendMessage(chatId, i18n.t('errors.systemErrorRetry'));`
);

writeFileSync(profilePath, content, 'utf-8');
console.log('✅ Fixed profile.ts');

