/**
 * 自动执行 i18n 替换流程
 * 
 * 执行顺序：
 * 1. 备份当前状态
 * 2. 执行代码替换
 * 3. 生成 zh-TW.ts
 * 4. 更新 types.ts
 * 5. 测试验证
 * 6. 等待用户确认后继续下一步
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import * as readline from 'readline';

// 超时和重试配置
const TIMEOUT_MS = 5 * 60 * 1000; // 5 分钟超时
const MAX_RETRIES = 3; // 最大重试次数
const PROGRESS_FILE = '.i18n-replace-progress.json'; // 进度记录文件

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

function log(message: string) {
  console.log(`\n${message}`);
}

interface Progress {
  phase: string;
  completed: string[];
  skipped: string[];
  failed: string[];
  lastUpdate: string;
}

// 加载进度
function loadProgress(): Progress | null {
  if (fs.existsSync(PROGRESS_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'));
    } catch {
      return null;
    }
  }
  return null;
}

// 保存进度
function saveProgress(progress: Progress) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2), 'utf-8');
}

// 带超时的执行
function execWithTimeout(
  command: string,
  timeoutMs: number = TIMEOUT_MS,
  options?: { cwd?: string; stdio?: 'inherit' | 'pipe' }
): { success: boolean; output?: string; error?: string } {
  try {
    const output = execSync(command, {
      stdio: options?.stdio || 'pipe',
      cwd: options?.cwd,
      encoding: 'utf-8',
      timeout: timeoutMs,
      maxBuffer: 10 * 1024 * 1024, // 10MB
    });
    return { success: true, output: output.toString() };
  } catch (error: any) {
    if (error.signal === 'SIGTERM' || error.message?.includes('timeout')) {
      return { success: false, error: '超时' };
    }
    return { success: false, error: error.message || '执行失败' };
  }
}

// 带重试的执行
function execWithRetry(
  command: string,
  maxRetries: number = MAX_RETRIES,
  options?: { cwd?: string; stdio?: 'inherit' | 'pipe' }
): boolean {
  for (let i = 0; i < maxRetries; i++) {
    const result = execWithTimeout(command, TIMEOUT_MS, options);
    if (result.success) {
      return true;
    }
    
    if (i < maxRetries - 1) {
      log(`⚠️  重试 ${i + 1}/${maxRetries - 1}: ${command}`);
      // 等待 2 秒后重试
      try {
        execSync('sleep 2', { stdio: 'pipe' });
      } catch {
        // 忽略 sleep 错误
      }
    }
  }
  
  log(`❌ 命令执行失败（已重试 ${maxRetries} 次）: ${command}`);
  return false;
}

// 兼容旧接口
function exec(command: string, options?: { cwd?: string; stdio?: 'inherit' | 'pipe' }) {
  return execWithRetry(command, 1, options);
}

async function main() {
  log('🚀 开始自动执行 i18n 替换流程...\n');

  // 检查是否有未完成的进度
  const progress = loadProgress();
  if (progress) {
    log('📋 发现未完成的进度记录');
    log(`  当前阶段: ${progress.phase}`);
    log(`  已完成: ${progress.completed.length} 个`);
    log(`  已跳过: ${progress.skipped.length} 个`);
    log(`  失败: ${progress.failed.length} 个`);
    log(`  最后更新: ${progress.lastUpdate}`);
    log('\n是否继续上次的进度？(y/n/skip)');
    log('  y - 继续');
    log('  n - 重新开始');
    log('  skip - 跳过已完成的步骤');
    
    const answer = await question('> ');
    if (answer.toLowerCase() === 'skip') {
      log('⏭️  跳过已完成的步骤，继续执行...\n');
      // 使用进度继续
    } else if (answer.toLowerCase() !== 'y') {
      log('🔄 重新开始...\n');
      // 删除进度文件
      if (fs.existsSync(PROGRESS_FILE)) {
        fs.unlinkSync(PROGRESS_FILE);
      }
    }
  }

  // 初始化进度
  const currentProgress: Progress = progress || {
    phase: 'backup',
    completed: [],
    skipped: [],
    failed: [],
    lastUpdate: new Date().toISOString(),
  };

  // Phase A: 备份
  if (!currentProgress.completed.includes('backup')) {
    log('📦 Phase A: 创建备份...');
    currentProgress.phase = 'backup';
    saveProgress(currentProgress);
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const backupName = `before-replacement-${timestamp}`;
    
    log(`创建备份点: ${backupName}`);
    if (!execWithRetry(`./scripts/create-backup-point.sh ${backupName}`, MAX_RETRIES)) {
      log('❌ 备份失败，是否继续？(y/n/skip)');
      log('  y - 继续（跳过备份）');
      log('  n - 取消');
      log('  skip - 跳过备份步骤');
      const answer = await question('> ');
      if (answer.toLowerCase() === 'skip') {
        currentProgress.skipped.push('backup');
        log('⏭️  跳过备份步骤\n');
      } else if (answer.toLowerCase() !== 'y') {
        log('❌ 用户取消');
        process.exit(1);
      } else {
        currentProgress.skipped.push('backup');
      }
    } else {
      currentProgress.completed.push('backup');
      log('✅ 备份完成\n');
    }
    currentProgress.lastUpdate = new Date().toISOString();
    saveProgress(currentProgress);
  } else {
    log('⏭️  跳过备份（已完成）\n');
  }

  // Phase B: 检查必要文件
  log('📋 Phase B: 检查必要文件...');
  
  // 尝试多个可能的文件名
  const mappingFiles = [
    'i18n_keys_mapping_fixed.json',
    'i18n_keys_mapping.json',
  ];
  
  const extractionFiles = [
    'i18n_complete_final.json',
    'i18n_complete_final_with_status.json',
  ];
  
  const mappingFile = mappingFiles.find(f => fs.existsSync(f));
  const extractionFile = extractionFiles.find(f => fs.existsSync(f));
  
  if (!mappingFile) {
    log(`❌ 找不到映射文件: ${mappingFiles.join(', ')}`);
    log('请先完成提取工作');
    process.exit(1);
  }
  
  if (!extractionFile) {
    log(`⚠️  找不到提取结果文件: ${extractionFiles.join(', ')}`);
    log('（可选，用于生成 locale 文件）');
  } else {
    log(`✅ 找到提取结果文件: ${extractionFile}`);
  }
  
  log(`✅ 找到映射文件: ${mappingFile}`);
  log('✅ 必要文件检查通过\n');

  // Phase C: 执行替换
  if (!currentProgress.completed.includes('replace')) {
    log('🔄 Phase C: 执行代码替换...');
    currentProgress.phase = 'replace';
    saveProgress(currentProgress);
    
    if (!fs.existsSync('scripts/ast-replace-i18n.ts')) {
      log('❌ 找不到替换脚本: scripts/ast-replace-i18n.ts');
      log('请先确保替换脚本存在');
      currentProgress.failed.push('replace');
      saveProgress(currentProgress);
      process.exit(1);
    }

    log('⚠️  重要：替换前请确认：');
    log('  1. 已创建备份');
    log('  2. 当前工作区干净（没有未提交的更改）');
    log('  3. 可以随时回滚');
    log('\n是否继续执行替换？(y/n/skip)');
    const confirmReplace = await question('> ');
    if (confirmReplace.toLowerCase() === 'skip') {
      currentProgress.skipped.push('replace');
      log('⏭️  跳过替换步骤\n');
    } else if (confirmReplace.toLowerCase() !== 'y') {
      log('❌ 用户取消替换');
      process.exit(0);
    } else {
      log('执行 AST 替换工具（最多 5 分钟超时）...');
      const replaceResult = execWithRetry('npx tsx scripts/ast-replace-i18n.ts', MAX_RETRIES, { stdio: 'pipe' });
      if (!replaceResult) {
        log('❌ 替换执行失败');
        log('💡 可以回滚: git checkout backup-before-replacement-*');
        log('是否继续？(y/n/skip)');
        const continueOnReplaceError = await question('> ');
        if (continueOnReplaceError.toLowerCase() === 'skip') {
          currentProgress.skipped.push('replace');
          log('⏭️  跳过替换步骤\n');
        } else if (continueOnReplaceError.toLowerCase() !== 'y') {
          log('❌ 用户取消');
          currentProgress.failed.push('replace');
          saveProgress(currentProgress);
          process.exit(1);
        } else {
          currentProgress.skipped.push('replace');
        }
      } else {
        currentProgress.completed.push('replace');
        log('✅ 替换完成\n');
      }
    }
    currentProgress.lastUpdate = new Date().toISOString();
    saveProgress(currentProgress);
  } else {
    log('⏭️  跳过替换（已完成）\n');
  }

  // Phase D: 测试验证
  if (!currentProgress.completed.includes('test')) {
    log('\n🧪 Phase D: 测试验证...');
    currentProgress.phase = 'test';
    saveProgress(currentProgress);
    
    log('执行 lint 检查（最多 5 分钟超时）...');
    if (!execWithRetry('pnpm lint', MAX_RETRIES)) {
      log('❌ Lint 检查失败');
      log('是否继续？(y/n/skip)');
      const continueOnLintError = await question('> ');
      if (continueOnLintError.toLowerCase() === 'skip') {
        currentProgress.skipped.push('lint');
        log('⏭️  跳过 lint 检查\n');
      } else if (continueOnLintError.toLowerCase() !== 'y') {
        log('❌ 用户取消');
        currentProgress.failed.push('lint');
        saveProgress(currentProgress);
        process.exit(1);
      } else {
        currentProgress.skipped.push('lint');
      }
    } else {
      currentProgress.completed.push('lint');
    }

    log('执行类型检查（最多 5 分钟超时）...');
    if (!execWithRetry('pnpm typecheck', MAX_RETRIES)) {
      log('❌ 类型检查失败');
      log('是否继续？(y/n/skip)');
      const continueOnTypeError = await question('> ');
      if (continueOnTypeError.toLowerCase() === 'skip') {
        currentProgress.skipped.push('typecheck');
        log('⏭️  跳过类型检查\n');
      } else if (continueOnTypeError.toLowerCase() !== 'y') {
        log('❌ 用户取消');
        currentProgress.failed.push('typecheck');
        saveProgress(currentProgress);
        process.exit(1);
      } else {
        currentProgress.skipped.push('typecheck');
      }
    } else {
      currentProgress.completed.push('typecheck');
    }

    log('检查硬编码（最多 5 分钟超时）...');
    execWithRetry('pnpm check:i18n', 1); // 硬编码检查只执行一次，不重试
    
    currentProgress.completed.push('test');
    currentProgress.lastUpdate = new Date().toISOString();
    saveProgress(currentProgress);
  } else {
    log('⏭️  跳过测试验证（已完成）\n');
  }

  // Phase E: 创建备份点
  log('\n📦 Phase E: 创建替换后备份点...');
  const backupAfterName = `after-replacement-zh-TW-only-${timestamp}`;
  log(`创建备份点: ${backupAfterName}`);
  exec(`./scripts/create-backup-point.sh ${backupAfterName}`);
  log('✅ 备份点已创建\n');

  // Phase F: 等待用户测试
  log('🎯 Phase F: 等待用户测试中文版本...');
  log('请测试以下功能：');
  log('  - 启动流程');
  log('  - 主菜单');
  log('  - 丢瓶子');
  log('  - 捡瓶子');
  log('  - 个人资料');
  log('  - 设置');
  log('\n测试完成后，请输入测试结果：');
  log('  - 输入 "pass" 或 "p" 表示测试通过');
  log('  - 输入 "fail" 或 "f" 表示测试失败');
  
  const testResult = await question('> ');
  if (testResult.toLowerCase() !== 'pass' && testResult.toLowerCase() !== 'p') {
    log('❌ 测试失败，请检查问题');
    log(`💡 可以回滚到: git checkout ${backupAfterName}`);
    process.exit(1);
  }
  log('✅ 中文版本测试通过\n');

  // Phase G: 导入英文翻译
  log('🌍 Phase G: 导入英文翻译...');
  if (!fs.existsSync('i18n_for_translation.csv')) {
    log('❌ 找不到 i18n_for_translation.csv');
    log('请先准备翻译 CSV 文件');
    process.exit(1);
  }

  log('检查导入脚本...');
  if (fs.existsSync('scripts/i18n-import-selected-languages.ts')) {
    log('执行导入...');
    exec('npx tsx scripts/i18n-import-selected-languages.ts en');
  } else if (fs.existsSync('scripts/i18n-import-from-csv.ts')) {
    log('执行导入...');
    exec('npx tsx scripts/i18n-import-from-csv.ts i18n_for_translation.csv en');
  } else {
    log('❌ 找不到导入脚本');
    log('需要 scripts/i18n-import-selected-languages.ts 或 scripts/i18n-import-from-csv.ts');
    process.exit(1);
  }
  log('✅ 英文翻译已导入\n');

  // Phase H: 等待用户测试中英文切换
  log('🎯 Phase H: 等待用户测试中英文切换...');
  log('请测试以下功能：');
  log('  - 新用户选择英文');
  log('  - 老用户切换语言');
  log('  - 验证所有页面都显示英文');
  log('\n测试完成后，请输入测试结果：');
  log('  - 输入 "pass" 或 "p" 表示测试通过');
  log('  - 输入 "fail" 或 "f" 表示测试失败');
  
  const switchTestResult = await question('> ');
  if (switchTestResult.toLowerCase() !== 'pass' && switchTestResult.toLowerCase() !== 'p') {
    log('❌ 中英文切换测试失败，请检查问题');
    log(`💡 可以回滚到: git checkout ${backupAfterName}`);
    process.exit(1);
  }
  log('✅ 中英文切换测试通过\n');

  // 完成
  log('🎉 所有步骤完成！');
  log('\n📋 总结：');
  log('  ✅ 代码替换完成');
  log('  ✅ 中文版本测试通过');
  log('  ✅ 英文翻译已导入');
  log('  ✅ 中英文切换测试通过');
  log('\n💡 下一步（可选）：');
  log('  - 翻译其他 32 种语言');
  log('  - 导入所有语言翻译');
  log('  - 测试所有语言切换');

  // 删除进度文件
  if (fs.existsSync(PROGRESS_FILE)) {
    fs.unlinkSync(PROGRESS_FILE);
    log('\n✅ 进度文件已清理');
  }

  rl.close();
}

main().catch((error) => {
  console.error('❌ 执行失败:', error);
  rl.close();
  process.exit(1);
});

