/**
 * Debug script to test birthdayError and birthdayRetry keys
 */

import { createI18n } from '../src/i18n';

console.log('🔍 Debug: 测试 birthdayError 和 birthdayRetry keys\n');

const i18n = createI18n('zh-TW');

// 测试 birthdayError
console.log('1. 测试 onboarding.birthdayError:');
try {
  const errorValue = i18n.t('onboarding.birthdayError', { error: '测试错误' });
  console.log(`   返回值: ${JSON.stringify(errorValue)}`);
  console.log(`   显示: ${errorValue}`);
  console.log(`   是占位符: ${errorValue.startsWith('[') && errorValue.endsWith(']')}`);
  
  if (errorValue.startsWith('[') && errorValue.endsWith(']')) {
    console.log('   ❌ 返回了占位符！key 不存在或解析失败');
  } else {
    console.log('   ✅ 正常');
  }
} catch (e: any) {
  console.log(`   ❌ 错误: ${e.message}`);
}

console.log();

// 测试 birthdayRetry
console.log('2. 测试 onboarding.birthdayRetry:');
try {
  const retryValue = i18n.t('onboarding.birthdayRetry');
  console.log(`   返回值: ${JSON.stringify(retryValue)}`);
  console.log(`   显示: ${retryValue}`);
  console.log(`   是占位符: ${retryValue.startsWith('[') && retryValue.endsWith(']')}`);
  
  if (retryValue.startsWith('[') && retryValue.endsWith(']')) {
    console.log('   ❌ 返回了占位符！key 不存在或解析失败');
  } else {
    console.log('   ✅ 正常');
  }
} catch (e: any) {
  console.log(`   ❌ 错误: ${e.message}`);
}

console.log();

// 检查 locale 文件
console.log('3. 检查 locale 文件:');
import { readFileSync } from 'fs';
const localeContent = readFileSync('src/i18n/locales/zh-TW.ts', 'utf-8');

const hasError = /birthdayError/.test(localeContent);
const hasRetry = /birthdayRetry/.test(localeContent);

console.log(`   birthdayError 在文件中: ${hasError ? '✅' : '❌'}`);
console.log(`   birthdayRetry 在文件中: ${hasRetry ? '✅' : '❌'}`);

if (hasError && hasRetry) {
  // 提取值
  const errorMatch = localeContent.match(/birthdayError:\s*`([^`]+)`/s);
  const retryMatch = localeContent.match(/birthdayRetry:\s*`([^`]+)`/s);
  
  if (errorMatch) {
    console.log(`   birthdayError 值: ${JSON.stringify(errorMatch[1])}`);
  }
  if (retryMatch) {
    console.log(`   birthdayRetry 值: ${JSON.stringify(retryMatch[1])}`);
  }
}

