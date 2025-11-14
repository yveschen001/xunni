#!/usr/bin/env tsx
/**
 * 推送到遠程倉庫腳本
 * 遵循單向備份原則：只推送，不拉取
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';

function exec(command: string, options: { stdio?: 'inherit' | 'pipe'; encoding?: BufferEncoding } = {}) {
  try {
    return execSync(command, { 
      encoding: options.encoding || 'utf-8',
      stdio: options.stdio || 'pipe',
      cwd: process.cwd(),
    });
  } catch (error) {
    console.error(`執行命令失敗: ${command}`);
    throw error;
  }
}

async function backupPush() {
  console.log('🚀 開始推送到遠程倉庫...\n');
  
  // 1. 檢查是否在 Git 倉庫中
  if (!existsSync('.git')) {
    console.error('❌ 當前目錄不是 Git 倉庫');
    process.exit(1);
  }
  
  // 2. 檢查是否有未提交的變更
  try {
    const status = exec('git status --porcelain');
    if (status.trim()) {
      console.log('⚠️  發現未提交的變更:');
      console.log(status);
      console.log('\n💡 請先執行 "pnpm backup" 提交變更');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ 檢查 Git 狀態失敗');
    process.exit(1);
  }
  
  // 3. 檢查是否有未推送的提交
  try {
    // 檢查遠程倉庫是否存在
    let remoteExists = false;
    try {
      exec('git remote get-url origin', { stdio: 'pipe' });
      remoteExists = true;
    } catch {
      remoteExists = false;
    }
    
    if (!remoteExists) {
      console.log('⚠️  遠程倉庫未設置');
      console.log('💡 請先設置遠程倉庫: git remote add origin <URL>');
      process.exit(1);
    }
    
    // 檢查當前分支
    const currentBranch = exec('git branch --show-current').trim();
    console.log(`📌 當前分支: ${currentBranch}`);
    
    // 檢查是否有未推送的提交（使用 git log，不拉取）
    try {
      const localCommit = exec('git rev-parse HEAD').trim();
      const remoteCommit = exec(`git ls-remote origin ${currentBranch}`).trim().split('\t')[0];
      
      if (!remoteCommit) {
        console.log('📤 首次推送，將推送所有提交');
      } else if (localCommit !== remoteCommit) {
        // 檢查本地是否有新的提交
        const hasNewCommits = exec(`git rev-list ${remoteCommit}..HEAD`).trim();
        if (hasNewCommits) {
          console.log(`📤 發現 ${hasNewCommits.split('\n').length} 個未推送的提交`);
        } else {
          console.log('✅ 所有提交已推送');
          return;
        }
      } else {
        console.log('✅ 所有提交已推送');
        return;
      }
    } catch (error) {
      // 如果遠程分支不存在，則首次推送
      console.log('📤 首次推送到遠程倉庫');
    }
  } catch (error) {
    console.error('❌ 檢查提交狀態失敗');
    process.exit(1);
  }
  
  // 4. 推送到遠程（單向，不拉取）
  try {
    const currentBranch = exec('git branch --show-current').trim();
    console.log(`\n🚀 推送到遠程倉庫 (${currentBranch})...`);
    
    exec(`git push -u origin ${currentBranch}`, { stdio: 'inherit' });
    
    console.log('\n✅ 推送完成！');
  } catch (error) {
    console.error('\n❌ 推送失敗');
    console.error('💡 請檢查：');
    console.error('   1. 遠程倉庫 URL 是否正確');
    console.error('   2. 是否有推送權限');
    console.error('   3. 網路連接是否正常');
    process.exit(1);
  }
}

backupPush().catch(error => {
  console.error('❌ 推送失敗:', error);
  process.exit(1);
});

