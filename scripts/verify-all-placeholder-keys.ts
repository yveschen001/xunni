/**
 * 验证所有图片中显示的占位符 key
 * 这个脚本可以直接运行，不需要复杂的导入
 */

import { createI18n } from '../src/i18n';

// 从图片中看到的占位符 key
const placeholderKeys = [
  // 第一张图
  'nickname.genderSelection',
  'nickname.genderHint',
  
  // 第二张图
  'warnings.settings',  // 已修复为 onboarding.genderWarning
  'success.confirm3',
  
  // 第三张图
  'onboarding.birthdayError',
  'onboarding.birthdayRetry',
  'onboarding.confirmBirthday',
  'onboarding.age',
  'onboarding.zodiac',
  'onboarding.birthdayWarning',
  'onboarding.retry',
];

console.log('🔍 验证所有图片中显示的占位符 key：\n');
console.log('='.repeat(80));

const languages = ['zh-TW', 'zh-CN', 'en', 'ar'] as const;
let allOk = true;
const issues: Array<{ key: string; languages: string[] }> = [];

for (const key of placeholderKeys) {
  const missing: string[] = [];
  
  for (const lang of languages) {
    try {
      const i18n = createI18n(lang);
      const value = i18n.t(key);
      if (value.startsWith('[') && value.endsWith(']')) {
        missing.push(lang);
      }
    } catch (e) {
      missing.push(lang);
    }
  }
  
  if (missing.length > 0) {
    console.log(`❌ ${key} - 缺失: ${missing.join(', ')}`);
    issues.push({ key, languages: missing });
    allOk = false;
  } else {
    const i18n = createI18n('zh-TW');
    const value = i18n.t(key);
    console.log(`✅ ${key}: ${value.substring(0, 50)}`);
  }
}

console.log('\n' + '='.repeat(80));
if (allOk) {
  console.log('✅ 所有图片中的占位符 key 都已修复！');
  console.log('✅ 注册流程可以正常进行了！');
  process.exit(0);
} else {
  console.log(`❌ 发现 ${issues.length} 个问题！`);
  console.log('\n运行自动修复：');
  console.log('  pnpm test:i18n-auto');
  process.exit(1);
}

