/**
 * 测试图片中显示的占位符 key
 */

import { createI18n } from '../src/i18n';

const keys = [
  'nickname.genderSelection',
  'nickname.genderHint',
  'warnings.settings',
  'success.confirm3',
];

console.log('🔍 检查图片中显示的占位符 key：\n');
console.log('='.repeat(80));

const languages = ['zh-TW', 'zh-CN', 'en', 'ar'] as const;
let allOk = true;

for (const key of keys) {
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
    allOk = false;
  } else {
    const i18n = createI18n('zh-TW');
    const value = i18n.t(key);
    console.log(`✅ ${key}: ${value.substring(0, 50)}`);
  }
}

console.log('\n' + '='.repeat(80));
if (allOk) {
  console.log('✅ 所有 key 都正常！');
  process.exit(0);
} else {
  console.log('❌ 发现占位符，需要修复！');
  process.exit(1);
}

