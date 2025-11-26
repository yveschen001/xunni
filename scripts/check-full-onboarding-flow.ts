/**
 * 完整检查整个注册流程的所有页面和 i18n key
 */

import { createI18n } from '../src/i18n';
import { readFileSync } from 'fs';
import { glob } from 'glob';

console.log('🔍 完整检查整个注册流程\n');
console.log('='.repeat(80));

const i18n = createI18n('zh-TW');
const issues: Array<{ step: string; key: string; issue: string }> = [];

// 注册流程步骤
const onboardingSteps = [
  { name: '语言选择', keys: ['onboarding.welcome', 'onboarding.startRegistration'] },
  { name: '昵称设置', keys: ['onboarding.useTelegramNickname', 'onboarding.customNickname', 'nickname.genderSelection', 'nickname.genderHint'] },
  { name: '性别选择', keys: ['onboarding.gender.male', 'onboarding.gender.female', 'onboarding.genderWarning', 'success.confirm3'] },
  { name: '生日输入', keys: ['onboarding.birthdayError', 'onboarding.birthdayRetry', 'onboarding.confirmBirthday', 'onboarding.age', 'onboarding.zodiac', 'onboarding.birthdayWarning', 'warnings.birthday', 'onboarding.birthdayFormatError', 'errors.error.birthday3'] },
  { name: '血型选择', keys: ['onboarding.bloodType', 'common.bloodType3'] },
  { name: 'MBTI 选择', keys: ['onboarding.settings2', 'onboarding.mbti2', 'onboarding.text5'] },
  { name: 'MBTI 测试', keys: ['mbti.quick.question1', 'mbti.quick.question1.option1', 'mbti.quick.question1.option2'] },
  { name: '反欺诈确认', keys: ['onboarding.antiFraud.question1', 'onboarding.antiFraud.question2', 'onboarding.antiFraud.question3', 'onboarding.antiFraud.confirm_button'] },
  { name: '服务条款', keys: ['onboarding.terms.agree_button', 'onboarding.terms.privacy_policy_button'] },
];

console.log('1. 检查注册流程关键 key：\n');

for (const step of onboardingSteps) {
  console.log(`\n📋 ${step.name}:`);
  for (const key of step.keys) {
    try {
      const value = i18n.t(key);
      if (value.startsWith('[') && value.endsWith(']')) {
        console.log(`  ❌ ${key}: 占位符`);
        issues.push({ step: step.name, key, issue: '占位符' });
      } else if (value.includes('${') && !value.includes('\\${')) {
        console.log(`  ⚠️  ${key}: 未转义的模板字符串`);
        issues.push({ step: step.name, key, issue: '未转义的模板字符串' });
      } else {
        console.log(`  ✅ ${key}`);
      }
    } catch (e: any) {
      console.log(`  ❌ ${key}: 不存在 - ${e.message}`);
      issues.push({ step: step.name, key, issue: '不存在' });
    }
  }
}

// 2. 检查所有 handler 文件中使用的 i18n key
console.log('\n\n2. 扫描所有 handler 文件中的 i18n key：\n');

const handlerFiles = glob.sync('src/telegram/handlers/*.ts');
const allKeys = new Set<string>();

for (const file of handlerFiles) {
  const content = readFileSync(file, 'utf-8');
  const matches = content.matchAll(/i18n\.t\(['"]([^'"]+)['"]/g);
  for (const match of matches) {
    allKeys.add(match[1]);
  }
}

console.log(`找到 ${allKeys.size} 个不同的 i18n key`);

// 检查这些 key 是否存在
let missingCount = 0;
let placeholderCount = 0;
let templateCount = 0;

for (const key of Array.from(allKeys).slice(0, 50)) { // 先检查前 50 个
  try {
    const value = i18n.t(key);
    if (value.startsWith('[') && value.endsWith(']')) {
      placeholderCount++;
      if (placeholderCount <= 5) {
        console.log(`  ❌ ${key}: 占位符`);
      }
    } else if (value.includes('${') && !value.includes('\\${')) {
      templateCount++;
      if (templateCount <= 5) {
        console.log(`  ⚠️  ${key}: 未转义的模板字符串`);
      }
    }
  } catch (e) {
    missingCount++;
    if (missingCount <= 5) {
      console.log(`  ❌ ${key}: 不存在`);
    }
  }
}

if (missingCount > 5 || placeholderCount > 5 || templateCount > 5) {
  console.log(`\n... 还有更多问题（缺失: ${missingCount}, 占位符: ${placeholderCount}, 模板: ${templateCount}）`);
}

// 3. 检查图片中显示的问题
console.log('\n\n3. 检查图片中显示的占位符：\n');

const imageKeys = [
  'onboarding.birthday',
  'onboarding.bio',
  'onboarding.city',
  'onboarding.interests',
  'warnings.birthday',
];

for (const key of imageKeys) {
  try {
    const value = i18n.t(key);
    if (value.includes('${updatedUser.bio') || value.includes('${updatedUser.city') || value.includes('${user.interests')) {
      console.log(`❌ ${key}: 包含未转义的模板字符串`);
      console.log(`   值: ${value.substring(0, 100)}`);
      issues.push({ step: '生日确认', key, issue: '未转义的模板字符串' });
    }
  } catch (e) {
    console.log(`❌ ${key}: 不存在`);
    issues.push({ step: '生日确认', key, issue: '不存在' });
  }
}

// 总结
console.log('\n\n' + '='.repeat(80));
if (issues.length === 0) {
  console.log('✅ 所有检查通过！');
  process.exit(0);
} else {
  console.log(`❌ 发现 ${issues.length} 个问题：\n`);
  issues.forEach((issue, i) => {
    console.log(`${i + 1}. [${issue.step}] ${issue.key}: ${issue.issue}`);
  });
  process.exit(1);
}

