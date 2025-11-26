/**
 * CSV Key 保护机制
 * 在修改 CSV 前检查关键 key 是否存在
 * 防止意外删除重要的 key
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { parse } from 'csv-parse/sync';
import { execSync } from 'child_process';

// 关键 key 列表（这些 key 绝对不能丢失）
const CRITICAL_KEYS = [
  // 注册流程核心 key
  'onboarding.welcome',
  'onboarding.startRegistration',
  'onboarding.useTelegramNickname',
  'onboarding.customNickname',
  'onboarding.gender.male',
  'onboarding.gender.female',
  'onboarding.gender3',
  'onboarding.genderMale',
  'onboarding.genderFemale',
  'onboarding.genderWarning',
  'onboarding.nicknameGood',
  'onboarding.nowSelectGender',
  'onboarding.nicknameError',
  
  // 昵称相关
  'nickname.genderSelection',
  'nickname.genderHint',
  'nickname.nicknameSet',
  'nickname.userNotFound',
  'nickname.cannotGetNickname',
  
  // 性别相关
  'warnings.gender',
  'warnings.warning.short4',
  'warnings.settings',
  'success.message8',
  'success.confirm3',
  'common.male',
  'common.female',
  'common.confirm7',
  'errors.error.short12',
  
  // 生日相关
  'onboarding.birthday3',
  'onboarding.birthdayCheck',
  'warnings.birthday',
  'success.birthday',
  
  // MBTI 相关
  'onboarding.settings2',
  'onboarding.help',
  'onboarding.settings7',
  'onboarding.mbti2',
  'onboarding.text5',
  'onboarding.short',
  
  // 反诈骗相关
  'onboarding.confirm2',
  'onboarding.confirm',
  'onboarding.antiFraud.question1',
  'onboarding.antiFraud.question2',
  'onboarding.antiFraud.question3',
  'onboarding.confirm3',
  'onboarding.antiFraud.confirm_button',
  'onboarding.antiFraud.learn_button',
  
  // 条款相关
  'onboarding.start',
  'onboarding.text21',
  'onboarding.text19',
  'onboarding.terms.english_only_note',
  'onboarding.text7',
  'onboarding.terms.agree_button',
  'onboarding.terms.privacy_policy_button',
  'onboarding.terms.terms_of_service_button',
  
  // 错误相关
  'errors.error.short9',
  'errors.userNotFound4',
  'errors.systemErrorRetry',
];

interface ProtectionResult {
  passed: boolean;
  missingKeys: string[];
  totalKeys: number;
  headVersionKeys: number;
}

/**
 * 检查 CSV 中的关键 key
 */
export function checkCriticalKeys(csvPath: string = 'i18n_for_translation.csv'): ProtectionResult {
  console.log('🛡️  检查 CSV 关键 key 保护...\n');
  
  if (!existsSync(csvPath)) {
    console.error(`❌ CSV 文件不存在: ${csvPath}`);
    process.exit(1);
  }
  
  // 读取当前 CSV
  const csvContent = readFileSync(csvPath, 'utf-8');
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
    relax_column_count: true,
  });
  
  const currentKeys = new Set(records.map((r: any) => r.key));
  
  // 检查 HEAD 版本
  let headKeys: Set<string>;
  try {
    const headCsv = execSync('git show HEAD:i18n_for_translation.csv', { encoding: 'utf-8' });
    const headRecords = parse(headCsv, {
      columns: true,
      skip_empty_lines: true,
      relax_quotes: true,
      relax_column_count: true,
    });
    headKeys = new Set(headRecords.map((r: any) => r.key));
  } catch (e) {
    console.warn('⚠️  无法读取 HEAD 版本，跳过对比');
    headKeys = new Set();
  }
  
  // 检查关键 key
  const missingKeys = CRITICAL_KEYS.filter(k => !currentKeys.has(k));
  
  console.log(`📊 统计：`);
  console.log(`   当前 CSV key 数量: ${currentKeys.size}`);
  if (headKeys.size > 0) {
    console.log(`   HEAD 版本 key 数量: ${headKeys.size}`);
    const missingFromHead = [...headKeys].filter(k => !currentKeys.has(k));
    if (missingFromHead.length > 0) {
      console.log(`   ⚠️  从 HEAD 版本丢失: ${missingFromHead.length} 个 key`);
    }
  }
  console.log(`   关键 key 总数: ${CRITICAL_KEYS.length}`);
  console.log(`   缺失的关键 key: ${missingKeys.length}\n`);
  
  if (missingKeys.length > 0) {
    console.log('❌ 发现缺失的关键 key：\n');
    missingKeys.forEach(k => console.log(`  - ${k}`));
    console.log('\n⚠️  这些 key 的缺失可能导致注册流程显示占位符！');
    return {
      passed: false,
      missingKeys,
      totalKeys: currentKeys.size,
      headVersionKeys: headKeys.size,
    };
  }
  
  console.log('✅ 所有关键 key 都存在！\n');
  return {
    passed: true,
    missingKeys: [],
    totalKeys: currentKeys.size,
    headVersionKeys: headKeys.size,
  };
}

/**
 * 备份 CSV 文件
 */
export function backupCSV(csvPath: string = 'i18n_for_translation.csv'): string {
  const timestamp = Date.now();
  const backupPath = `${csvPath}.backup.${timestamp}`;
  const content = readFileSync(csvPath, 'utf-8');
  require('fs').writeFileSync(backupPath, content, 'utf-8');
  console.log(`✅ CSV 已备份到: ${backupPath}`);
  return backupPath;
}

// Main execution
const isMainModule = import.meta.url === `file://${process.argv[1]}` || 
                      process.argv[1]?.endsWith('protect-csv-keys.ts');
if (isMainModule) {
  const result = checkCriticalKeys();
  if (!result.passed) {
    console.error('\n❌ 关键 key 检查失败！');
    process.exit(1);
  }
}

