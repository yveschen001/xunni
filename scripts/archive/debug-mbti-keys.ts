/**
 * Debug MBTI quick test keys
 */

import { createI18n } from '../src/i18n';
import { readFileSync } from 'fs';

console.log('🔍 Debug: 检查 MBTI quick test 的 key\n');

const i18n = createI18n('zh-TW');
const localeContent = readFileSync('src/i18n/locales/zh-TW.ts', 'utf-8');

// 测试第一题的 key
const keys = [
  'mbti.quick.question1',
  'mbti.quick.question1.option1',
  'mbti.quick.question1.option2',
];

console.log('1. 测试 i18n.t() 解析：\n');

for (const key of keys) {
  try {
    const value = i18n.t(key);
    if (value.startsWith('[') && value.endsWith(']')) {
      console.log(`❌ ${key}: 占位符 - ${value}`);
    } else {
      console.log(`✅ ${key}: ${value.substring(0, 60)}`);
    }
  } catch (e: any) {
    console.log(`❌ ${key}: 错误 - ${e.message}`);
  }
}

console.log('\n2. 检查 locale 文件：\n');

// 检查 locale 文件中是否存在
const hasMbti = /mbti:\s*\{/.test(localeContent);
console.log(`mbti 命名空间存在: ${hasMbti ? '✅' : '❌'}`);

if (hasMbti) {
  // 检查 quick 命名空间
  const hasQuick = /quick:\s*\{/.test(localeContent);
  console.log(`mbti.quick 命名空间存在: ${hasQuick ? '✅' : '❌'}`);
  
  if (hasQuick) {
    // 检查 question1
    const hasQ1 = /question1/.test(localeContent);
    console.log(`mbti.quick.question1 存在: ${hasQ1 ? '✅' : '❌'}`);
    
    // 提取 question1 的值
    const q1Match = localeContent.match(/question1:\s*`([^`]+)`/);
    if (q1Match) {
      console.log(`question1 值: ${JSON.stringify(q1Match[1].substring(0, 50))}`);
    }
    
    // 检查 option1 和 option2
    const hasOpt1 = /question1\.option1/.test(localeContent);
    const hasOpt2 = /question1\.option2/.test(localeContent);
    console.log(`mbti.quick.question1.option1 存在: ${hasOpt1 ? '✅' : '❌'}`);
    console.log(`mbti.quick.question1.option2 存在: ${hasOpt2 ? '✅' : '❌'}`);
    
    if (hasOpt1) {
      const opt1Match = localeContent.match(/question1\.option1:\s*`([^`]+)`/);
      if (opt1Match) {
        console.log(`option1 值: ${JSON.stringify(opt1Match[1])}`);
      }
    }
    if (hasOpt2) {
      const opt2Match = localeContent.match(/question1\.option2:\s*`([^`]+)`/);
      if (opt2Match) {
        console.log(`option2 值: ${JSON.stringify(opt2Match[1])}`);
      }
    }
  }
}

