import fs from 'fs';
import path from 'path';

const zhCNPath = path.resolve(process.cwd(), 'src/i18n/locales/zh-CN.ts');
const enPath = path.resolve(process.cwd(), 'src/i18n/locales/en.ts');

function fixZhCN() {
  if (!fs.existsSync(zhCNPath)) return;
  let content = fs.readFileSync(zhCNPath, 'utf-8');
  
  // Find start of addInstructions
  const startMarker = 'addInstructions: `⚠️ **注意**';
  const startIdx = content.indexOf(startMarker);
  
  if (startIdx === -1) {
    console.log('zh-CN: Start marker not found');
    return;
  }
  
  // Find end of addInstructions (look for the next key 'addUsageError' or end of string logic)
  // In the corrupted file, the string might go on for a while.
  // But we know what the *correct* string should look like roughly at the end.
  // The corrupted block has injected 'appealReviewCommands'.
  
  // Let's find where the injected garbage ends.
  // It seems to end around line 84: `},}`
  // But then the rest of the original string continues: `4. 格式：...`
  
  // Let's just find the START of the NEXT valid key, which is likely `addUsageError:`
  const endMarker = 'addUsageError:';
  const endIdx = content.indexOf(endMarker, startIdx);
  
  if (endIdx === -1) {
    console.log('zh-CN: End marker not found');
    return;
  }
  
  // Replace everything between start and end (exclusive of endMarker)
  // We need to back up from endMarker to the comma before it.
  
  const replacement = `addInstructions: \`⚠️ **注意**

此命令需要手动修改配置文件。

**步骤：**
1. 编辑 \\\`wrangler.toml\\\`
2. 找到 \\\`ADMIN_USER_IDS\\\` 变数
3. 添加用户 ID：\\\`{userId}\\\`
4. 格式：\\\`ADMIN_USER_IDS = "ID1,ID2,{userId}"\\\`
5. 重新部署：\\\`pnpm deploy:staging\\\`

**用户资讯：**
• ID: \\\`{userId}\\\`
• 昵称: {nickname}
• 用户名: @{username}

💡 或在 Cloudflare Dashboard 中修改环境变量\`,
    appealReviewCommands: \`/admin_approve <appeal_id> [備註]\\n/admin_reject <appeal_id> [備註]\`,
    ban_admin_ops: {
      usageApprove: \`用法: /admin_approve <appeal_id> [備註]\`,
      usageReject: \`用法: /admin_reject <appeal_id> [備註]\`,
      provideAppealId: \`❌ 請提供申訴 ID\\n\\n\`
    },
    `;
    
  // We are replacing from startIdx up to endIdx
  // But wait, we need to be careful about the comma before addUsageError
  const originalBlock = content.substring(startIdx, endIdx);
  
  // Verify it's actually corrupted
  if (!originalBlock.includes('appealReviewCommands')) {
    console.log('zh-CN: Block does not seem corrupted (no appealReviewCommands inside)');
    // return; // Force update anyway just in case
  }
  
  const newContent = content.substring(0, startIdx) + replacement + content.substring(endIdx);
  fs.writeFileSync(zhCNPath, newContent, 'utf-8');
  console.log('✅ Fixed zh-CN.ts');
}

function fixEn() {
  if (!fs.existsSync(enPath)) return;
  let content = fs.readFileSync(enPath, 'utf-8');
  
  const startMarker = 'addInstructions: `⚠️ **Note**';
  const startIdx = content.indexOf(startMarker);
  
  if (startIdx === -1) {
    console.log('en: Start marker not found');
    return;
  }
  
  const endMarker = 'addUsageError:';
  const endIdx = content.indexOf(endMarker, startIdx);
  
  if (endIdx === -1) {
    console.log('en: End marker not found');
    return;
  }
  
  const replacement = `addInstructions: \`⚠️ **Note**

This command requires manual modification of the configuration file.

**Steps:**
1. Edit \\\`wrangler.toml\\\`
2. Find the \\\`ADMIN_USER_IDS\\\` variable
3. Add user ID: \\\`{userId}\\\`
4. Format: \\\`ADMIN_USER_IDS = "ID1,ID2,{userId}"\\\`
5. Redeploy: \\\`pnpm deploy:staging\\\`

**User Information:**
• ID: \\\`{userId}\\\`
• Nickname: {nickname}
• Username: @{username}

💡 Or modify environment variables in Cloudflare Dashboard\`,
    appealReviewCommands: \`/admin_approve <appeal_id> [Note]\\n/admin_reject <appeal_id> [Note]\`,
    ban_admin_ops: {
      usageApprove: \`Usage: /admin_approve <appeal_id> [Note]\`,
      usageReject: \`Usage: /admin_reject <appeal_id> [Note]\`,
      provideAppealId: \`❌ Please provide Appeal ID\\n\\n\`
    },
    `;
    
  const newContent = content.substring(0, startIdx) + replacement + content.substring(endIdx);
  fs.writeFileSync(enPath, newContent, 'utf-8');
  console.log('✅ Fixed en.ts');
}

fixZhCN();
fixEn();
