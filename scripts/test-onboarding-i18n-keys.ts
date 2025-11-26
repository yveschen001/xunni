/**
 * 测试注册流程关键 i18n key
 * 确保所有注册流程相关的 key 都存在且正确
 */

import { createI18n } from '../src/i18n';

const criticalKeys = [
  'onboarding.startRegistration',
  'onboarding.useTelegramNickname',
  'onboarding.customNickname',
  'onboarding.gender.male',
  'onboarding.gender.female',
  'onboarding.gender3',
  'warnings.warning.short4',
  'warnings.gender',
  'success.message8',
  'common.male',
  'common.female',
  'onboarding.nicknameGood',
  'onboarding.nowSelectGender',
  'onboarding.genderWarning',
  'onboarding.genderMale',
  'onboarding.genderFemale',
];

console.log('🔍 最终测试注册流程关键 i18n key：\n');
console.log('='.repeat(80));

const languages = ['zh-TW', 'zh-CN', 'en', 'ar'] as const;
let allPass = true;

for (const key of criticalKeys) {
  const missing: string[] = [];
  
  for (const lang of languages) {
    try {
      const i18n = createI18n(lang);
      const value = i18n.t(key);
      const exists = !value.startsWith('[') && !value.endsWith(']');
      if (!exists) {
        missing.push(lang);
      }
    } catch (e) {
      missing.push(lang);
    }
  }
  
  if (missing.length > 0) {
    console.log(`❌ ${key} - 缺失: ${missing.join(', ')}`);
    allPass = false;
  } else {
    const i18n = createI18n('zh-TW');
    const value = i18n.t(key);
    console.log(`✅ ${key}: ${value.substring(0, 50)}`);
  }
}

console.log('\n' + '='.repeat(80));
if (allPass) {
  console.log('✅ 所有关键 key 都存在且正确！');
  console.log('\n📊 测试通过，可以建立保护机制了。');
  process.exit(0);
} else {
  console.log('❌ 发现缺失的 key！');
  process.exit(1);
}

