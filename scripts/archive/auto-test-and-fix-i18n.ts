/**
 * 自动测试并修复 i18n 问题
 * 1. 扫描所有代码中使用的 key
 * 2. 检查占位符
 * 3. 检查错误使用
 * 4. 自动修复
 * 5. 重新导入
 * 6. 验证修复
 */

import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';

async function main() {
  console.log('🤖 自动测试并修复 i18n 问题...\n');
  console.log('='.repeat(80));

  let fixed = false;

  // 1. 运行自动修复脚本
  console.log('1️⃣  运行自动检测和修复...\n');
  try {
    execSync('pnpm tsx scripts/auto-fix-i18n-placeholders.ts', {
      stdio: 'inherit',
      cwd: process.cwd(),
    });
  } catch (e: any) {
    if (e.status === 1) {
      // 退出码 1 表示需要重新导入
      fixed = true;
      console.log('\n✅ 检测到需要修复的问题');
    } else {
      throw e;
    }
  }

  // 2. 如果修复了代码，重新导入
  if (fixed) {
    console.log('\n2️⃣  重新导入 i18n...\n');
    execSync('pnpm tsx scripts/i18n-import-from-csv-v2.ts', {
      stdio: 'inherit',
      cwd: process.cwd(),
    });
  }

  // 3. 检查关键注册流程 key
  console.log('\n3️⃣  验证关键 key...\n');
  const { createI18n } = await import('../src/i18n/index.js');
  const i18n = createI18n('zh-TW');

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
  for (const key of criticalKeys) {
    try {
      const value = i18n.t(key);
      if (value.startsWith('[') && value.endsWith(']')) {
        console.log(`❌ ${key}: 占位符 - ${value}`);
        allOk = false;
      } else {
        console.log(`✅ ${key}`);
      }
    } catch (e) {
      console.log(`❌ ${key}: 错误`);
      allOk = false;
    }
  }

  // 4. 运行 key 使用检查
  console.log('\n4️⃣  检查 key 使用是否正确...\n');
  try {
    execSync('pnpm tsx scripts/verify-i18n-key-usage.ts', {
      stdio: 'inherit',
      cwd: process.cwd(),
    });
  } catch (e: any) {
    console.log('❌ Key 使用检查失败');
    allOk = false;
  }

  console.log('\n' + '='.repeat(80));
  if (allOk) {
    console.log('✅ 所有检查通过！');
    process.exit(0);
  } else {
    console.log('❌ 仍有问题需要修复');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('❌ 错误:', error);
  process.exit(1);
});

