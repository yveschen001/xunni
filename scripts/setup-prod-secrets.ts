import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const envFile = join(process.cwd(), '.env.production');

if (!existsSync(envFile)) {
  console.error('❌ 找不到文件 .env.production');
  console.log('💡 請先將 secrets-production.example 複製為 .env.production 並填寫您的真實密鑰。');
  process.exit(1);
}

const content = readFileSync(envFile, 'utf-8');
const lines = content.split('\n');

console.log('🚀 開始配置生產環境 Secrets...');

let count = 0;

for (const line of lines) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;

  const firstEquals = trimmed.indexOf('=');
  if (firstEquals === -1) continue;

  const key = trimmed.slice(0, firstEquals).trim();
  let value = trimmed.slice(firstEquals + 1).trim();

  // Remove quotes if present
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1);
  }

  if (key && value) {
    console.log(`🔑 正在設置 ${key}...`);
    try {
      // Mac/Linux compatible piping
      execSync(`echo "${value}" | pnpm exec wrangler secret put ${key} --env production`, { 
        stdio: ['pipe', 'inherit', 'inherit'] 
      });
      count++;
    } catch (e) {
      console.error(`❌ 設置 ${key} 失敗`);
    }
  }
}

if (count === 0) {
  console.log('⚠️ 未找到有效的環境變量配置');
} else {
  console.log(`✅ 成功設置了 ${count} 個 Secrets！`);
}

