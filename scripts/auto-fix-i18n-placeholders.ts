/**
 * 自动检测并修复 i18n 占位符问题
 * 1. 扫描所有代码中使用的 i18n key
 * 2. 检查这些 key 是否存在且不是占位符
 * 3. 如果发现占位符，尝试从 git 历史或 CSV 中恢复
 * 4. 自动修复代码中的错误 key 使用
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { parse } from 'csv-parse/sync';
import { execSync } from 'child_process';

interface PlaceholderIssue {
  file: string;
  line: number;
  key: string;
  currentValue: string;
  type: 'missing' | 'placeholder' | 'wrong_usage';
  suggestion?: string;
}

// 扫描所有代码中使用的 i18n key
function scanI18nKeys(): Map<string, Array<{ file: string; line: number; context: string }>> {
  const keyUsage = new Map<string, Array<{ file: string; line: number; context: string }>>();
  const handlersDir = join(process.cwd(), 'src/telegram/handlers');
  const files = readdirSync(handlersDir).filter(f => f.endsWith('.ts'));

  for (const file of files) {
    const filePath = join(handlersDir, file);
    const content = readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    const pattern = /i18n\.t\(['"]([^'"]+)['"]/g;
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const key = match[1];
      const lineNumber = content.substring(0, match.index).split('\n').length;
      const context = lines.slice(Math.max(0, lineNumber - 2), Math.min(lines.length, lineNumber + 2)).join('\n');

      if (!keyUsage.has(key)) {
        keyUsage.set(key, []);
      }
      keyUsage.get(key)!.push({ file, line: lineNumber, context });
    }
  }

  return keyUsage;
}

// 检查 key 是否存在且不是占位符
async function checkKeyStatus(key: string): Promise<{ exists: boolean; isPlaceholder: boolean; value?: string }> {
  try {
    const { createI18n } = await import('./src/i18n/index.js');
    const i18n = createI18n('zh-TW');
    const value = i18n.t(key);

    if (value.startsWith('[') && value.endsWith(']')) {
      return { exists: true, isPlaceholder: true, value };
    }

    return { exists: true, isPlaceholder: false, value };
  } catch (e) {
    return { exists: false, isPlaceholder: false };
  }
}

// 从 CSV 中查找 key
function findKeyInCSV(key: string): { found: boolean; value?: string } {
  try {
    const csvPath = join(process.cwd(), 'i18n_for_translation.csv');
    const csvContent = readFileSync(csvPath, 'utf-8');
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      relax_quotes: true,
      relax_column_count: true,
    });

    const record = records.find((r: any) => r.key === key);
    if (record) {
      const value = record['zh-TW'] || '';
      if (value && !value.includes('[需要翻译') && !value.includes('[Translation')) {
        return { found: true, value };
      }
    }

    return { found: false };
  } catch (e) {
    return { found: false };
  }
}

// 从 git 历史中查找 key
function findKeyInGitHistory(key: string): { found: boolean; value?: string } {
  try {
    const result = execSync(`git log --all -p --grep="${key}" -S "${key}" -- "i18n_for_translation.csv" | head -100`, {
      encoding: 'utf-8',
      stdio: 'pipe',
    });

    // 尝试从 HEAD 版本获取
    try {
      const headCsv = execSync('git show HEAD:i18n_for_translation.csv', { encoding: 'utf-8' });
      const headRecords = parse(headCsv, {
        columns: true,
        skip_empty_lines: true,
        relax_quotes: true,
        relax_column_count: true,
      });

      const record = headRecords.find((r: any) => r.key === key);
      if (record) {
        const value = record['zh-TW'] || '';
        if (value && !value.includes('[需要翻译') && !value.includes('[Translation')) {
          return { found: true, value };
        }
      }
    } catch (e) {
      // 忽略
    }

    return { found: false };
  } catch (e) {
    return { found: false };
  }
}

// 检查 key 使用是否正确（基于上下文）
function checkKeyUsage(key: string, context: string): { correct: boolean; suggestion?: string } {
  // Key 使用规则
  const rules: Record<string, { allowed: string[]; forbidden: string[]; correct?: string }> = {
    'warnings.settings': {
      allowed: ['MBTI', 'mbti', 'bottle.mbti_result'],
      forbidden: ['gender', '性别', 'gender_confirm', 'gender_male', 'gender_female'],
      correct: 'onboarding.genderWarning',
    },
  };

  const rule = rules[key];
  if (!rule) {
    return { correct: true };
  }

  const contextLower = context.toLowerCase();
  const isForbidden = rule.forbidden.some(f => contextLower.includes(f.toLowerCase()));

  if (isForbidden && rule.correct) {
    return { correct: false, suggestion: rule.correct };
  }

  return { correct: true };
}

// 自动修复代码中的错误 key
function fixWrongKeyUsage(file: string, line: number, oldKey: string, newKey: string): boolean {
  try {
    const filePath = join(process.cwd(), 'src/telegram/handlers', file);
    const content = readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    // 修复这一行的 key
    const lineIndex = line - 1;
    if (lineIndex >= 0 && lineIndex < lines.length) {
      const oldLine = lines[lineIndex];
      const newLine = oldLine.replace(
        new RegExp(`i18n\\.t\\(['"]${oldKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]\\)`, 'g'),
        `i18n.t('${newKey}')`
      );

      if (oldLine !== newLine) {
        lines[lineIndex] = newLine;
        writeFileSync(filePath, lines.join('\n'), 'utf-8');
        return true;
      }
    }

    return false;
  } catch (e) {
    console.error(`修复 ${file}:${line} 时出错:`, e);
    return false;
  }
}

// 主函数
async function main() {
  console.log('🔍 自动检测并修复 i18n 占位符问题...\n');
  console.log('='.repeat(80));

  // 1. 扫描所有使用的 key
  console.log('1️⃣  扫描代码中使用的 i18n key...');
  const keyUsage = scanI18nKeys();
  console.log(`   找到 ${keyUsage.size} 个不同的 key\n`);

  // 2. 检查每个 key
  console.log('2️⃣  检查 key 状态...');
  const issues: PlaceholderIssue[] = [];

  for (const [key, usages] of keyUsage.entries()) {
    const status = await checkKeyStatus(key);

    if (!status.exists || status.isPlaceholder) {
      for (const usage of usages) {
        // 检查使用是否正确
        const usageCheck = checkKeyUsage(key, usage.context);
        if (!usageCheck.correct && usageCheck.suggestion) {
          issues.push({
            file: usage.file,
            line: usage.line,
            key,
            currentValue: status.value || '[missing]',
            type: 'wrong_usage',
            suggestion: usageCheck.suggestion,
          });
        } else if (status.isPlaceholder) {
          issues.push({
            file: usage.file,
            line: usage.line,
            key,
            currentValue: status.value || '[missing]',
            type: 'placeholder',
          });
        } else if (!status.exists) {
          issues.push({
            file: usage.file,
            line: usage.line,
            key,
            currentValue: '[missing]',
            type: 'missing',
          });
        }
      }
    }
  }

  if (issues.length === 0) {
    console.log('✅ 没有发现占位符或错误使用！\n');
    return;
  }

  console.log(`❌ 发现 ${issues.length} 个问题：\n`);

  // 3. 尝试修复
  console.log('3️⃣  尝试自动修复...\n');
  let fixed = 0;

  for (const issue of issues) {
    if (issue.type === 'wrong_usage' && issue.suggestion) {
      console.log(`修复 ${issue.file}:${issue.line}`);
      console.log(`  ${issue.key} → ${issue.suggestion}`);
      if (fixWrongKeyUsage(issue.file, issue.line, issue.key, issue.suggestion)) {
        console.log('  ✅ 已修复\n');
        fixed++;
      } else {
        console.log('  ❌ 修复失败\n');
      }
    } else if (issue.type === 'placeholder' || issue.type === 'missing') {
      // 尝试从 CSV 或 git 历史中恢复
      console.log(`检查 ${issue.key}...`);
      const csvResult = findKeyInCSV(issue.key);
      const gitResult = findKeyInGitHistory(issue.key);

      if (csvResult.found && csvResult.value) {
        console.log(`  ✅ 在 CSV 中找到: ${csvResult.value.substring(0, 50)}`);
        console.log('  ⚠️  需要重新导入 CSV\n');
      } else if (gitResult.found && gitResult.value) {
        console.log(`  ✅ 在 git 历史中找到: ${gitResult.value.substring(0, 50)}`);
        console.log('  ⚠️  需要从 git 历史恢复\n');
      } else {
        console.log(`  ❌ 未找到，需要手动添加\n`);
      }
    }
  }

  console.log('='.repeat(80));
  console.log(`修复完成：${fixed} 个错误使用已修复`);
  console.log(`剩余问题：${issues.length - fixed} 个需要手动处理`);

  if (fixed > 0) {
    console.log('\n⚠️  已修复代码，请重新运行导入和测试！');
    process.exit(1); // 退出码 1 表示需要重新导入
  } else {
    process.exit(issues.length > 0 ? 1 : 0);
  }
}

main().catch(error => {
  console.error('❌ 错误:', error);
  process.exit(1);
});

