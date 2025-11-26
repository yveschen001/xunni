/**
 * 完整的自动测试和修复流程
 * 1. 测试所有注册流程 key
 * 2. 检测占位符
 * 3. 自动修复
 * 4. 验证修复
 */

import { createI18n } from '../src/i18n';
import { execSync } from 'child_process';

// 所有注册流程中使用的 key（从代码中提取）
const onboardingKeys = [
  // 语言和开始
  'onboarding.welcome',
  'onboarding.startRegistration',
  'onboarding.useTelegramNickname',
  'onboarding.customNickname',
  
  // 昵称
  'nickname.genderSelection',
  'nickname.genderHint',
  'nickname.nicknameSet',
  'onboarding.nicknameGood',
  'onboarding.nowSelectGender',
  'onboarding.genderWarning',
  
  // 性别
  'onboarding.gender.male',
  'onboarding.gender.female',
  'onboarding.gender3',
  'onboarding.genderMale',
  'onboarding.genderFemale',
  'onboarding.genderWarning',
  'warnings.gender',
  'success.message8',
  'success.confirm3',
  'common.male',
  'common.female',
  'common.confirm7',
  
  // 生日
  'onboarding.birthdayError',
  'onboarding.birthdayRetry',
  'onboarding.confirmBirthday',
  'onboarding.age',
  'onboarding.zodiac',
  'onboarding.birthdayWarning',
  'onboarding.retry',
  'warnings.birthday',
  'common.birthday3',
  'common.text10',
  'common.settings6',
  'common.text9',
  
  // 其他
  'onboarding.ageRestriction',
  'onboarding.birthdayFormatError',
];

console.log('🤖 完整的自动测试和修复流程...\n');
console.log('='.repeat(80));

// 1. 测试所有 key
console.log('1️⃣  测试所有注册流程 key...\n');
const i18n = createI18n('zh-TW');
const missing: string[] = [];
const placeholders: string[] = [];

for (const key of onboardingKeys) {
  try {
    const value = i18n.t(key);
    if (value.startsWith('[') && value.endsWith(']')) {
      placeholders.push(key);
      console.log(`❌ ${key}: 占位符 - ${value}`);
    }
  } catch (e) {
    missing.push(key);
    console.log(`❌ ${key}: 不存在`);
  }
}

if (missing.length > 0 || placeholders.length > 0) {
  console.log(`\n❌ 发现 ${missing.length} 个缺失的 key，${placeholders.length} 个占位符`);
  
  // 2. 尝试自动修复
  console.log('\n2️⃣  尝试自动修复...\n');
  try {
    execSync('pnpm tsx scripts/auto-fix-i18n-placeholders.ts', {
      stdio: 'inherit',
      cwd: process.cwd(),
    });
  } catch (e: any) {
    if (e.status === 1) {
      // 需要重新导入
      console.log('\n3️⃣  重新导入 i18n...\n');
      execSync('pnpm tsx scripts/i18n-import-from-csv-v2.ts', {
        stdio: 'inherit',
        cwd: process.cwd(),
      });
      
      // 再次验证
      console.log('\n4️⃣  再次验证...\n');
      let allOk = true;
      for (const key of onboardingKeys) {
        try {
          const value = i18n.t(key);
          if (value.startsWith('[') && value.endsWith(']')) {
            console.log(`❌ ${key}: 仍然是占位符`);
            allOk = false;
          }
        } catch (e) {
          console.log(`❌ ${key}: 仍然不存在`);
          allOk = false;
        }
      }
      
      if (allOk) {
        console.log('\n✅ 所有 key 都已修复！');
        process.exit(0);
      } else {
        console.log('\n❌ 仍有问题需要手动修复');
        process.exit(1);
      }
    } else {
      throw e;
    }
  }
} else {
  console.log('\n✅ 所有 key 都正常！');
  process.exit(0);
}

