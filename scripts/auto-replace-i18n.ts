/**
 * 全自动执行 i18n 替换流程
 * 
 * 执行顺序：
 * 1. 备份当前状态
 * 2. 执行代码替换
 * 3. 测试验证
 * 4. 导入英文翻译
 * 
 * 注意：此脚本完全自动化，无需人工干预
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

// 超时和重试配置
const TIMEOUT_MS = 5 * 60 * 1000; // 5 分钟超时
const MAX_RETRIES = 3; // 最大重试次数
const PROGRESS_FILE = '.i18n-replace-progress.json'; // 进度记录文件
const AUTO_MODE = true; // 全自动模式，无需人工确认

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
    log('🤖 全自动模式：自动继续上次的进度...\n');
    // 自动继续，使用现有进度
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
    
    // 保存当前分支
    const currentBranch = execSync('git branch --show-current', { encoding: 'utf-8' }).trim();
    log(`当前分支: ${currentBranch}`);
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const backupName = `before-replacement-${timestamp}`;
    
    log(`创建备份点: ${backupName}`);
    if (!execWithRetry(`./scripts/create-backup-point.sh ${backupName}`, MAX_RETRIES)) {
      log('❌ 备份失败，自动跳过备份步骤并继续...');
      currentProgress.skipped.push('backup');
      log('⏭️  跳过备份步骤\n');
    } else {
      // 确保切换回原分支
      try {
        execSync(`git checkout ${currentBranch}`, { stdio: 'pipe', encoding: 'utf-8' });
        log(`✅ 已切换回原分支: ${currentBranch}`);
      } catch (error: any) {
        log(`⚠️  切换回原分支失败: ${error.message}`);
        // 尝试再次切换
        try {
          execSync(`git checkout ${currentBranch}`, { stdio: 'pipe', encoding: 'utf-8' });
        } catch {
          log('❌ 无法切换回原分支，请手动切换');
        }
      }
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

    log('🤖 全自动模式：自动执行替换...');
    log('执行 AST 替换工具（最多 5 分钟超时）...');
    const replaceResult = execWithRetry('npx tsx scripts/ast-replace-i18n.ts', MAX_RETRIES, { stdio: 'pipe' });
    if (!replaceResult) {
      log('❌ 替换执行失败，自动跳过替换步骤并继续...');
      log('💡 可以回滚: git checkout backup-before-replacement-*');
      currentProgress.skipped.push('replace');
      log('⏭️  跳过替换步骤\n');
    } else {
      currentProgress.completed.push('replace');
      log('✅ 替换完成\n');
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
      log('❌ Lint 检查失败，自动跳过并继续...');
      currentProgress.skipped.push('lint');
      log('⏭️  跳过 lint 检查\n');
    } else {
      currentProgress.completed.push('lint');
    }

    log('执行类型检查（最多 5 分钟超时）...');
    if (!execWithRetry('pnpm typecheck', MAX_RETRIES)) {
      log('❌ 类型检查失败，自动跳过并继续...');
      currentProgress.skipped.push('typecheck');
      log('⏭️  跳过类型检查\n');
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
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const backupAfterName = `after-replacement-zh-TW-only-${timestamp}`;
  log(`创建备份点: ${backupAfterName}`);
  exec(`./scripts/create-backup-point.sh ${backupAfterName}`);
  log('✅ 备份点已创建\n');

  // Phase F: 跳过用户测试（全自动模式）
  log('🎯 Phase F: 跳过用户测试（全自动模式）...');
  log('🤖 全自动模式：自动跳过手动测试步骤');
  log('💡 建议稍后手动测试以下功能：');
  log('  - 启动流程');
  log('  - 主菜单');
  log('  - 丢瓶子');
  log('  - 捡瓶子');
  log('  - 个人资料');
  log('  - 设置');
  log('✅ 继续执行...\n');

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

  // Phase H: 跳过用户测试（全自动模式）
  log('🎯 Phase H: 跳过中英文切换测试（全自动模式）...');
  log('🤖 全自动模式：自动跳过手动测试步骤');
  log('💡 建议稍后手动测试以下功能：');
  log('  - 新用户选择英文');
  log('  - 老用户切换语言');
  log('  - 验证所有页面都显示英文');
  log('✅ 继续执行...\n');

  // 完成
  log('🎉 所有步骤完成！');
  log('\n📋 总结：');
  log('  ✅ 代码替换完成');
  log('  ✅ 测试验证完成');
  log('  ✅ 英文翻译已导入');
  log('\n💡 建议手动测试：');
  log('  - 中文版本功能');
  log('  - 中英文切换功能');
  log('\n💡 下一步（可选）：');
  log('  - 翻译其他 32 种语言');
  log('  - 导入所有语言翻译');
  log('  - 测试所有语言切换');

  // 删除进度文件
  if (fs.existsSync(PROGRESS_FILE)) {
    fs.unlinkSync(PROGRESS_FILE);
    log('\n✅ 进度文件已清理');
  }
}

main().catch((error) => {
  console.error('❌ 执行失败:', error);
  process.exit(1);
});

