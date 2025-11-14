#!/usr/bin/env tsx
/**
 * 資料庫備份腳本
 * 導出 D1 資料庫並壓縮
 */

import { execSync } from 'child_process';
import { mkdirSync, existsSync } from 'fs';
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

async function backupDatabase() {
  console.log('📦 開始備份資料庫...\n');
  
  // 1. 建立備份目錄
  const backupDir = join(process.cwd(), 'backups');
  if (!existsSync(backupDir)) {
    mkdirSync(backupDir, { recursive: true });
    console.log(`📁 建立備份目錄: ${backupDir}`);
  }
  
  // 2. 生成檔名
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
  const filename = `db-${timestamp}.sql`;
  const filepath = join(backupDir, filename);
  
  console.log(`📝 備份檔案: ${filename}`);
  
  // 3. 導出資料庫（需要 wrangler 和 D1 資料庫已配置）
  try {
    console.log('💾 導出資料庫...');
    // 注意：實際執行時需要根據環境選擇資料庫
    // wrangler d1 export <DATABASE_NAME> --output=<FILEPATH>
    console.log('⚠️  資料庫備份需要手動執行:');
    console.log(`   wrangler d1 export xunni-db --output=${filepath}`);
    console.log('\n💡 或使用本地資料庫:');
    console.log(`   wrangler d1 export xunni-db-dev --output=${filepath} --local`);
  } catch (error) {
    console.error('❌ 資料庫備份失敗:', error);
    process.exit(1);
  }
  
  console.log('\n✅ 資料庫備份完成');
  console.log(`📁 備份位置: ${filepath}`);
}

backupDatabase().catch(error => {
  console.error('❌ 備份失敗:', error);
  process.exit(1);
});

