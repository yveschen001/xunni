/**
 * 验证 i18n key 的使用是否正确
 * 检查代码中使用的 key 是否与预期用途匹配
 */

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { parse } from 'csv-parse/sync';

// Key 使用规则：key -> 预期用途/上下文
const KEY_USAGE_RULES: Record<string, { allowed: string[]; forbidden: string[] }> = {
  'warnings.settings': {
    allowed: [
      'MBTI',
      'mbti',
      'bottle.mbti_result',
      'MBTI 显示',
      'mbti_result',
    ],
    forbidden: [
      'gender',
      '性别',
      'onboarding.gender',
      'gender_confirm',
      'gender_male',
      'gender_female',
      'gender selection',
      '性别选择',
      '性别确认',
    ],
  },
  'onboarding.genderWarning': {
    allowed: [
      'gender',
      '性别',
      'gender confirmation',
      'gender selection',
      '性别确认',
      '性别选择',
      'gender_confirm',
      'gender_male',
      'gender_female',
    ],
    forbidden: [
      'MBTI',
      'mbti',
      'bottle.mbti_result',
    ],
  },
  'warnings.birthday': {
    allowed: [
      'birthday',
      '生日',
      'birthday confirmation',
      '生日确认',
    ],
    forbidden: [],
  },
};

// 检查代码中 key 的使用上下文
function checkKeyUsage(filePath: string, key: string, lineNumber: number, context: string): { valid: boolean; reason?: string } {
  const rule = KEY_USAGE_RULES[key];
  if (!rule) {
    return { valid: true }; // 没有规则，允许使用
  }

  const contextLower = context.toLowerCase();

  // 检查是否在禁止的上下文中使用
  const isForbidden = rule.forbidden.some(forbidden => 
    contextLower.includes(forbidden.toLowerCase())
  );

  if (isForbidden) {
    // 根据 key 提供正确的替代建议
    let suggestion = '';
    if (key === 'warnings.settings') {
      suggestion = '应该使用 onboarding.genderWarning';
    } else if (key === 'onboarding.genderWarning') {
      suggestion = '不应该用于 MBTI 相关上下文';
    }

    return {
      valid: false,
      reason: `❌ ${key} 在禁止的上下文中使用。${suggestion}`,
    };
  }

  // 检查是否在允许的上下文中使用（可选，不强制）
  const isAllowed = rule.allowed.length === 0 || rule.allowed.some(allowed => 
    contextLower.includes(allowed.toLowerCase())
  );

  // 如果没有匹配允许的上下文，给出警告但不阻止（因为可能在其他地方使用）
  if (!isAllowed && rule.allowed.length > 0) {
    // 只警告，不阻止
    console.warn(`⚠️  ${filePath}:${lineNumber} - ${key} 可能不在预期的上下文中使用`);
  }

  return { valid: true };
}

// 提取代码中使用的 i18n key 及其上下文
function extractI18nKeysWithContext(filePath: string): Array<{ key: string; line: number; context: string }> {
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const keys: Array<{ key: string; line: number; context: string }> = [];
  
  const pattern = /i18n\.t\(['"]([^'"]+)['"]/g;
  let match;
  
  while ((match = pattern.exec(content)) !== null) {
    const key = match[1];
    const lineNumber = content.substring(0, match.index).split('\n').length;
    
    // 获取上下文（前后各 3 行）
    const start = Math.max(0, lineNumber - 4);
    const end = Math.min(lines.length, lineNumber + 3);
    const context = lines.slice(start, end).join('\n');
    
    keys.push({ key, line: lineNumber, context });
  }
  
  return keys;
}

// 主函数
function main() {
  console.log('🔍 检查 i18n key 使用是否正确...\n');
  console.log('='.repeat(80));

  const handlersDir = join(process.cwd(), 'src/telegram/handlers');
  const files = readdirSync(handlersDir).filter(f => f.endsWith('.ts'));

  const errors: Array<{ file: string; key: string; line: number; reason: string }> = [];

  for (const file of files) {
    const filePath = join(handlersDir, file);
    const keys = extractI18nKeysWithContext(filePath);

    for (const { key, line, context } of keys) {
      const check = checkKeyUsage(filePath, key, line, context);
      if (!check.valid) {
        errors.push({
          file,
          key,
          line,
          reason: check.reason || '未知错误',
        });
      }
    }
  }

  if (errors.length > 0) {
    console.log(`❌ 发现 ${errors.length} 个 key 使用错误：\n`);
    errors.forEach(({ file, key, line, reason }) => {
      console.log(`  ${file}:${line}`);
      console.log(`    ${reason}`);
      console.log();
    });
    process.exit(1);
  } else {
    console.log('✅ 所有 key 使用都正确！');
    process.exit(0);
  }
}

main();

