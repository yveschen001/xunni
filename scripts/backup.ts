#!/usr/bin/env tsx
/**
 * 智能備份腳本
 * 只備份核心代碼，跳過構建產物和已存在於遠程的大文件
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

function exec(command: string, options: { stdio?: 'inherit' | 'pipe' } = {}) {
  try {
    return execSync(command, { 
      encoding: 'utf-8',
      stdio: options.stdio || 'pipe',
      cwd: process.cwd(),
    });
  } catch (error) {
    console.error(`執行命令失敗: ${command}`);
    throw error;
  }
}

async function backup() {
  console.log('🔄 開始智能備份...\n');
  
  // 1. 檢查是否在 Git 倉庫中
  if (!existsSync('.git')) {
    console.error('❌ 當前目錄不是 Git 倉庫');
    console.log('💡 請先執行: git init');
    process.exit(1);
  }
  
  // 2. 檢查 Git 狀態
  try {
    const status = exec('git status --porcelain');
    if (!status.trim()) {
      console.log('✅ 沒有需要備份的變更');
      return;
    }
    console.log('📝 發現變更檔案:\n' + status);
  } catch (error) {
    console.error('❌ Git 狀態檢查失敗');
    process.exit(1);
  }
  
  // 3. 添加核心文件（只添加變更的文件）
  console.log('\n📦 添加核心文件...');
  
  try {
    // 添加所有變更的源代碼文件
    exec('git add src/ tests/ doc/ scripts/', { stdio: 'inherit' });
    
    // 添加配置文件
    exec('git add package.json tsconfig.json wrangler.toml .gitignore README.md', { stdio: 'inherit' });
    
    console.log('✅ 文件已添加到暫存區');
  } catch (error) {
    console.error('❌ 添加文件失敗');
    process.exit(1);
  }
  
  // 4. 檢查暫存區狀態
  try {
    const staged = exec('git diff --cached --name-only');
    if (!staged.trim()) {
      console.log('⚠️  暫存區為空，沒有文件需要提交');
      return;
    }
    
    console.log('\n📋 將要提交的文件:');
    console.log(staged);
  } catch (error) {
    console.error('❌ 檢查暫存區失敗');
    process.exit(1);
  }
  
  console.log('\n✅ 備份準備完成！');
  console.log('💡 使用 "pnpm backup:push" 推送到遠程倉庫');
}

backup().catch(error => {
  console.error('❌ 備份失敗:', error);
  process.exit(1);
});

