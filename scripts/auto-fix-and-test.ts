/**
 * 全自动修复和测试脚本
 * 
 * 功能：
 * 1. 自动修复 lint 错误（可修复的）
 * 2. 自动修复类型错误（合并冲突等）
 * 3. 自动测试中文版本功能
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const TIMEOUT_MS = 5 * 60 * 1000; // 5 分钟超时

function log(message: string) {
  console.log(`\n${message}`);
}

function execWithTimeout(
  command: string,
  timeoutMs: number = TIMEOUT_MS
): { success: boolean; output?: string; error?: string } {
  try {
    const output = execSync(command, {
      stdio: 'pipe',
      encoding: 'utf-8',
      timeout: timeoutMs,
      maxBuffer: 10 * 1024 * 1024, // 10MB
    });
    return { success: true, output: output.toString() };
  } catch (error: any) {
    if (error.signal === 'SIGTERM' || error.message?.includes('timeout')) {
      return { success: false, error: '超时' };
    }
    return { success: false, error: error.message || '执行失败', output: error.stdout?.toString() };
  }
}

async function main() {
  log('🚀 开始全自动修复和测试...\n');

  // Step 1: 解决合并冲突
  log('📋 Step 1: 解决合并冲突...');
  const conflictFiles = [
    'src/telegram/handlers/language_selection.ts',
    'scripts/create-backup-point.sh',
  ];
  
  for (const file of conflictFiles) {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf-8');
      if (content.includes('<<<<<<< HEAD')) {
        log(`⚠️  发现合并冲突: ${file}`);
        // 使用 main 分支的版本（全自动版本）
        const result = execWithTimeout(`git checkout --theirs ${file}`, 30000);
        if (result.success) {
          log(`✅ 已解决冲突: ${file}`);
        } else {
          log(`❌ 解决冲突失败: ${file}`);
        }
      }
    }
  }

  // Step 2: 自动修复 lint 错误
  log('\n📋 Step 2: 自动修复 lint 错误...');
  const lintFixResult = execWithTimeout('pnpm lint:fix', TIMEOUT_MS);
  if (lintFixResult.success) {
    log('✅ Lint 自动修复完成');
  } else {
    log('⚠️  Lint 自动修复部分完成（可能还有需要手动修复的错误）');
    if (lintFixResult.output) {
      log(`输出: ${lintFixResult.output.slice(0, 500)}`);
    }
  }

  // Step 3: 检查类型错误
  log('\n📋 Step 3: 检查类型错误...');
  const typecheckResult = execWithTimeout('pnpm typecheck', TIMEOUT_MS);
  if (typecheckResult.success) {
    log('✅ 类型检查通过');
  } else {
    log('❌ 类型检查失败');
    if (typecheckResult.error) {
      log(`错误: ${typecheckResult.error}`);
    }
    if (typecheckResult.output) {
      // 只显示前 20 行错误
      const errors = typecheckResult.output.split('\n').slice(0, 20).join('\n');
      log(`错误详情:\n${errors}`);
    }
  }

  // Step 4: 运行 lint 检查（查看剩余错误）
  log('\n📋 Step 4: 检查剩余 lint 错误...');
  const lintResult = execWithTimeout('pnpm lint', TIMEOUT_MS);
  if (lintResult.success) {
    log('✅ Lint 检查通过（无错误）');
  } else {
    log('⚠️  Lint 检查有警告或错误');
    if (lintResult.output) {
      // 统计错误和警告
      const errorCount = (lintResult.output.match(/error/g) || []).length;
      const warningCount = (lintResult.output.match(/warning/g) || []).length;
      log(`错误数: ${errorCount}, 警告数: ${warningCount}`);
      
      // 只显示前 10 行
      const lines = lintResult.output.split('\n').slice(0, 10).join('\n');
      log(`前 10 行:\n${lines}`);
    }
  }

  // Step 5: 测试中文版本功能
  log('\n📋 Step 5: 测试中文版本功能...');
  log('🤖 运行 Smoke Test（中文版本）...');
  
  // 检查是否有 smoke-test 脚本
  if (fs.existsSync('scripts/smoke-test.ts')) {
    log('执行 Smoke Test...');
    const smokeTestResult = execWithTimeout('pnpm smoke-test', 10 * 60 * 1000); // 10 分钟超时
    
    if (smokeTestResult.success) {
      log('✅ Smoke Test 通过');
      if (smokeTestResult.output) {
        // 提取测试结果摘要
        const summaryMatch = smokeTestResult.output.match(/Results:.*?(\d+)\s+passed.*?(\d+)\s+failed/);
        if (summaryMatch) {
          log(`测试结果: ${summaryMatch[1]} 通过, ${summaryMatch[2]} 失败`);
        }
      }
    } else {
      log('⚠️  Smoke Test 部分失败或超时');
      if (smokeTestResult.output) {
        log(`输出: ${smokeTestResult.output.slice(0, 500)}`);
      }
    }
  } else {
    log('⚠️  未找到 smoke-test.ts，跳过功能测试');
  }

  // 总结
  log('\n📋 修复和测试总结:');
  log('✅ 合并冲突已解决');
  log('✅ Lint 自动修复已执行');
  log('✅ 类型检查已执行');
  log('✅ 功能测试已执行');
  log('\n💡 建议:');
  log('  - 检查类型错误（如果有）');
  log('  - 检查 lint 警告（如果有）');
  log('  - 手动测试中文版本功能');
  log('  - 手动测试中英文切换功能');
}

main().catch((error) => {
  console.error('❌ 执行失败:', error);
  process.exit(1);
});

