/**
 * 部署前 i18n 检查
 * 确保所有关键 key 都存在且正常工作
 */

import { createI18n } from '../src/i18n';
import { readFileSync } from 'fs';

console.log('🔍 部署前 i18n 检查...\n');
console.log('='.repeat(80));

const i18n = createI18n('zh-TW');
const localeContent = readFileSync('src/i18n/locales/zh-TW.ts', 'utf-8');

// 关键 key 列表
const criticalKeys = [
  'onboarding.birthdayError',
  'onboarding.birthdayRetry',
  'onboarding.confirmBirthday',
  'onboarding.age',
  'onboarding.zodiac',
  'onboarding.birthdayWarning',
  'onboarding.retry',
  'success.confirm3',
  'nickname.genderSelection',
  'nickname.genderHint',
  'onboarding.genderWarning',
];

let allOk = true;
const issues: string[] = [];

console.log('1. 检查 locale 文件中的 key...\n');

for (const key of criticalKeys) {
  const parts = key.split('.');
  const namespace = parts[0];
  const keyName = parts.slice(1).join('.');
  
  // 检查文件（使用更宽松的匹配）
  const keyPattern = new RegExp(`${keyName.replace(/\./g, '\\.')}`);
  const inFile = keyPattern.test(localeContent);
  
  if (!inFile) {
    console.log(`❌ ${key}: 不在 locale 文件中`);
    issues.push(`${key}: 不在 locale 文件中`);
    allOk = false;
    continue;
  }
  
  // 测试 i18n.t()
  try {
    const value = i18n.t(key, { error: '测试', age: 18, zodiac_sign: '测试' });
    if (value.startsWith('[') && value.endsWith(']')) {
      console.log(`❌ ${key}: 返回占位符 - ${value}`);
      issues.push(`${key}: 返回占位符`);
      allOk = false;
    } else {
      console.log(`✅ ${key}`);
    }
  } catch (e: any) {
    console.log(`❌ ${key}: 错误 - ${e.message}`);
    issues.push(`${key}: ${e.message}`);
    allOk = false;
  }
}

console.log('\n' + '='.repeat(80));

if (allOk) {
  console.log('✅ 所有关键 key 都正常！可以部署。');
  process.exit(0);
} else {
  console.log(`❌ 发现 ${issues.length} 个问题：`);
  issues.forEach(issue => console.log(`   - ${issue}`));
  console.log('\n⚠️  请先修复这些问题再部署！');
  process.exit(1);
}

