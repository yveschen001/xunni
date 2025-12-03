
import fs from 'fs';
import path from 'path';

const filePath = path.resolve(process.cwd(), 'src/i18n/locales/zh-TW.ts');
let content = fs.readFileSync(filePath, 'utf-8');

function insertKey(objName: string, key: string, value: string) {
  // Regex to match the start of the object (e.g., buttons: {) and capture content until closing brace
  // This is tricky with nested objects. 
  // Simpler approach: Find "  objName: {" and insert at the beginning of it?
  // Or find "  objName: {" and insert after it.
  
  const regex = new RegExp(`(  ${objName}: \\{)`);
  if (!regex.test(content)) {
    console.error(`❌ Object '${objName}' not found in zh-TW.ts`);
    return;
  }
  
  if (content.includes(`${key}:`)) {
    console.log(`ℹ️ Key '${key}' already exists in ${objName}, skipping.`);
    return;
  }

  // Insert after the opening brace
  content = content.replace(regex, `$1\n    ${key}: '${value}',`);
  console.log(`✅ Inserted '${key}' into '${objName}'`);
}

// Apply patches
insertKey('officialAd', 'rewardTemporary', '🎁 恭喜獲得 +1 臨時額度 (今日有效)');
insertKey('report', 'aiAutoBan', '🤖 AI 自動封禁');
insertKey('buttons', 'claim', '領取');
insertKey('buttons', 'verify', '驗證');
insertKey('common', 'open', '打開');

fs.writeFileSync(filePath, content, 'utf-8');
console.log('🎉 Patch complete.');

