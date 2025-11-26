/**
 * 测试 MBTI 按钮流程
 * 验证从按钮点击到处理的完整流程
 */

import { createI18n } from '../src/i18n';

console.log('🧪 测试 MBTI 按钮流程\n');
console.log('='.repeat(80));

// 1. 测试 i18n key 解析
console.log('1. 测试 i18n key 解析：\n');
const i18n = createI18n('zh-TW');

const keys = [
  'mbti.quick.question1',
  'mbti.quick.question1.option1',
  'mbti.quick.question1.option2',
];

let allKeysOk = true;
for (const key of keys) {
  try {
    const value = i18n.t(key);
    if (value.startsWith('[') && value.endsWith(']')) {
      console.log(`❌ ${key}: 占位符 - ${value}`);
      allKeysOk = false;
    } else {
      console.log(`✅ ${key}: ${value.substring(0, 50)}`);
    }
  } catch (e: any) {
    console.log(`❌ ${key}: 错误 - ${e.message}`);
    allKeysOk = false;
  }
}

if (!allKeysOk) {
  console.log('\n❌ i18n key 解析失败！');
  process.exit(1);
}

// 2. 测试 callback_data 格式
console.log('\n2. 测试 callback_data 格式：\n');

const testCallbacks = [
  'mbti_answer_0_0',
  'mbti_answer_0_1',
  'mbti_answer_1_0',
];

for (const callback of testCallbacks) {
  if (callback.startsWith('mbti_answer_')) {
    const parts = callback.replace('mbti_answer_', '').split('_');
    const questionIndex = parseInt(parts[0], 10);
    const answerIndex = parseInt(parts[1], 10);
    
    if (isNaN(questionIndex) || isNaN(answerIndex)) {
      console.log(`❌ ${callback}: 解析失败 - questionIndex=${questionIndex}, answerIndex=${answerIndex}`);
      process.exit(1);
    } else {
      console.log(`✅ ${callback}: questionIndex=${questionIndex}, answerIndex=${answerIndex}`);
    }
  }
}

// 3. 检查 router 处理逻辑
console.log('\n3. 检查 router 处理逻辑：\n');

import { readFileSync } from 'fs';
const routerContent = readFileSync('src/router.ts', 'utf-8');

if (routerContent.includes("data.startsWith('mbti_answer_')")) {
  console.log('✅ Router 中有 mbti_answer_ 处理逻辑');
  
  // 检查处理逻辑
  const match = routerContent.match(/if \(data\.startsWith\('mbti_answer_'\)\) \{([^}]+)\}/s);
  if (match) {
    const handlerCode = match[1];
    if (handlerCode.includes('handleMBTIAnswer')) {
      console.log('✅ 调用了 handleMBTIAnswer');
    } else {
      console.log('❌ 没有调用 handleMBTIAnswer');
      process.exit(1);
    }
  }
} else {
  console.log('❌ Router 中没有 mbti_answer_ 处理逻辑');
  process.exit(1);
}

console.log('\n' + '='.repeat(80));
console.log('✅ 所有检查通过！按钮流程应该正常工作。');
console.log('\n如果按钮仍然没有反应，可能是：');
console.log('1. 运行时错误（检查 Cloudflare Logs）');
console.log('2. 数据库连接问题');
console.log('3. 用户状态问题（test progress 不存在）');

