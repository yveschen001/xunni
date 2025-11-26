/**
 * 测试 onboarding.gender.male 和 onboarding.gender.female 的解析
 */

import { createI18n } from '../src/i18n';

const i18n = createI18n('zh-TW');

// 手动测试解析过程
const key = 'onboarding.gender.male';
console.log('测试 key:', key);

// 获取 translations
import { getTranslations } from '../src/i18n';
const translations = getTranslations('zh-TW');
const onboarding = translations.onboarding as any;

console.log('\n调试信息:');
console.log('  onboarding 类型:', typeof onboarding);
console.log('  onboarding.gender 类型:', typeof onboarding.gender);
console.log('  onboarding.gender 值:', onboarding.gender?.substring(0, 50));
console.log('  onboarding 有 "gender.male"?', 'gender.male' in onboarding);
console.log('  onboarding["gender.male"]:', onboarding['gender.male']);

// 测试直接访问
console.log('\n测试 i18n.t():');
try {
  const value = i18n.t(key);
  console.log(`  ✅ ${key}: ${value}`);
} catch (e) {
  console.log(`  ❌ ${key}: ${e}`);
}

// 测试另一个 key
const key2 = 'onboarding.gender.female';
console.log(`\n测试 ${key2}:`);
try {
  const value2 = i18n.t(key2);
  console.log(`  ✅ ${key2}: ${value2}`);
} catch (e) {
  console.log(`  ❌ ${key2}: ${e}`);
}

