/**
 * 增强的注册流程测试
 * 检查所有占位符，确保没有 [key] 格式的占位符显示
 */

import { createI18n } from '../src/i18n';

// 所有注册流程中使用的关键 key
const onboardingKeys = [
  // 语言选择
  'onboarding.welcome',
  'onboarding.moreLanguages',
  
  // 注册开始
  'onboarding.startRegistration',
  'onboarding.useTelegramNickname',
  'onboarding.customNickname',
  
  // 昵称相关
  'nickname.genderSelection',
  'nickname.genderHint',
  'nickname.nicknameSet',
  'nickname.userNotFound',
  'nickname.cannotGetNickname',
  'onboarding.nicknameGood',
  'onboarding.nowSelectGender',
  'onboarding.genderWarning',
  'onboarding.nicknameError',
  
  // 性别相关
  'onboarding.gender.male',
  'onboarding.gender.female',
  'onboarding.gender3',
  'onboarding.genderMale',
  'onboarding.genderFemale',
  'warnings.gender',
  'success.message8',
  'warnings.settings',
  'success.confirm3',
  'common.male',
  'common.female',
  'common.confirm7',
  'errors.error.short12',
  
  // 生日相关
  'onboarding.birthday3',
  'onboarding.birthdayCheck',
  'warnings.birthday',
  'success.birthday',
  
  // MBTI 相关
  'onboarding.settings2',
  'onboarding.help',
  'onboarding.settings7',
  'onboarding.mbti2',
  'onboarding.text5',
  'onboarding.short',
  
  // 反诈骗相关
  'onboarding.confirm2',
  'onboarding.confirm',
  'onboarding.antiFraud.question1',
  'onboarding.antiFraud.question2',
  'onboarding.antiFraud.question3',
  'onboarding.confirm3',
  'onboarding.antiFraud.confirm_button',
  'onboarding.antiFraud.learn_button',
  
  // 条款相关
  'onboarding.start',
  'onboarding.text21',
  'onboarding.text19',
  'onboarding.terms.english_only_note',
  'onboarding.text7',
  'onboarding.terms.agree_button',
  'onboarding.terms.privacy_policy_button',
  'onboarding.terms.terms_of_service_button',
  
  // 警告相关
  'warnings.warning.short4',
  
  // 错误相关
  'errors.error.short9',
  'errors.userNotFound4',
  'errors.systemErrorRetry',
];

console.log('🔍 增强的注册流程 i18n key 检查：\n');
console.log('='.repeat(80));

const languages = ['zh-TW', 'zh-CN', 'en', 'ar'] as const;
let allPass = true;
const missingKeys: Array<{ key: string; languages: string[] }> = [];

for (const key of onboardingKeys) {
  const missing: string[] = [];
  
  for (const lang of languages) {
    try {
      const i18n = createI18n(lang);
      const value = i18n.t(key);
      // 检查是否是占位符
      if (value.startsWith('[') && value.endsWith(']')) {
        missing.push(lang);
      }
    } catch (e) {
      missing.push(lang);
    }
  }
  
  if (missing.length > 0) {
    console.log(`❌ ${key} - 缺失: ${missing.join(', ')}`);
    missingKeys.push({ key, languages: missing });
    allPass = false;
  } else {
    const i18n = createI18n('zh-TW');
    const value = i18n.t(key);
    // 只显示前几个作为示例
    if (onboardingKeys.indexOf(key) < 10) {
      console.log(`✅ ${key}: ${value.substring(0, 40)}`);
    }
  }
}

console.log('\n' + '='.repeat(80));
if (allPass) {
  console.log(`✅ 所有 ${onboardingKeys.length} 个注册流程 key 都存在且正确！`);
  process.exit(0);
} else {
  console.log(`❌ 发现 ${missingKeys.length} 个缺失的 key！`);
  console.log('\n缺失的 key 列表：');
  missingKeys.forEach(({ key, languages }) => {
    console.log(`  - ${key} (缺失: ${languages.join(', ')})`);
  });
  process.exit(1);
}

