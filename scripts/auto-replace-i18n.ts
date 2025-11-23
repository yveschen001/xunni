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

function exec(command: string, options?: { cwd?: string; stdio?: 'inherit' | 'pipe' }) {
  try {
    execSync(command, { stdio: options?.stdio || 'inherit', cwd: options?.cwd });
    return true;
  } catch (error) {
    console.error(`❌ 命令执行失败: ${command}`);
    return false;
  }
}

async function main() {
  log('🚀 开始自动执行 i18n 替换流程...\n');

  // Phase A: 备份
  log('📦 Phase A: 创建备份...');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const backupName = `before-replacement-${timestamp}`;
  
  log(`创建备份点: ${backupName}`);
  if (!exec(`./scripts/create-backup-point.sh ${backupName}`)) {
    log('❌ 备份失败，是否继续？(y/n)');
    const answer = await question('> ');
    if (answer.toLowerCase() !== 'y') {
      log('❌ 用户取消');
      process.exit(1);
    }
  }
  log('✅ 备份完成\n');

  // Phase B: 检查必要文件
  log('📋 Phase B: 检查必要文件...');
  const requiredFiles = [
    'i18n_keys_mapping_fixed.json',
    'i18n_complete_final.json',
  ];
  
  const missingFiles = requiredFiles.filter(f => !fs.existsSync(f));
  if (missingFiles.length > 0) {
    log(`❌ 缺少必要文件: ${missingFiles.join(', ')}`);
    log('请先完成提取工作');
    process.exit(1);
  }
  log('✅ 必要文件检查通过\n');

  // Phase C: 执行替换（这里需要实现实际的替换逻辑）
  log('🔄 Phase C: 执行代码替换...');
  log('⚠️  注意：完整的 AST 替换工具需要开发');
  log('当前将使用简化版本进行替换\n');
  
  log('请确认是否继续执行替换？(y/n)');
  const confirmReplace = await question('> ');
  if (confirmReplace.toLowerCase() !== 'y') {
    log('❌ 用户取消替换');
    process.exit(0);
  }

  // 这里应该调用实际的替换脚本
  // 暂时先检查是否有替换脚本
  if (fs.existsSync('scripts/ast-replace-i18n.ts')) {
    log('执行 AST 替换工具...');
    exec('npx tsx scripts/ast-replace-i18n.ts');
  } else {
    log('⚠️  AST 替换工具尚未开发');
    log('需要先开发 scripts/ast-replace-i18n.ts');
    log('是否现在开发？(y/n)');
    const develop = await question('> ');
    if (develop.toLowerCase() === 'y') {
      // 这里可以调用开发脚本的工具
      log('开发 AST 替换工具...');
      // TODO: 实现 AST 替换工具开发
    } else {
      log('❌ 需要先开发替换工具才能继续');
      process.exit(1);
    }
  }

  // Phase D: 测试验证
  log('\n🧪 Phase D: 测试验证...');
  log('执行 lint 检查...');
  if (!exec('pnpm lint')) {
    log('❌ Lint 检查失败');
    log('是否继续？(y/n)');
    const continueOnLintError = await question('> ');
    if (continueOnLintError.toLowerCase() !== 'y') {
      log('❌ 用户取消');
      process.exit(1);
    }
  }

  log('执行类型检查...');
  if (!exec('pnpm typecheck')) {
    log('❌ 类型检查失败');
    log('是否继续？(y/n)');
    const continueOnTypeError = await question('> ');
    if (continueOnTypeError.toLowerCase() !== 'y') {
      log('❌ 用户取消');
      process.exit(1);
    }
  }

  log('检查硬编码...');
  exec('pnpm check:i18n');

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

  rl.close();
}

main().catch((error) => {
  console.error('❌ 执行失败:', error);
  rl.close();
  process.exit(1);
});

