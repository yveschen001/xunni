/**
 * Check Code Status
 * 检查代码状态：硬编码是否还在
 */

import * as fs from 'fs';

console.log('🔍 检查代码状态：硬编码是否还在代码中...\n');

// 检查几个关键文件
const keyFiles = [
  'src/telegram/handlers/menu.ts',
  'src/telegram/handlers/catch.ts',
  'src/telegram/handlers/throw.ts',
  'src/telegram/handlers/profile.ts',
];

let totalHardcoded = 0;

for (const file of keyFiles) {
  if (!fs.existsSync(file)) {
    console.log(`⚠️  文件不存在: ${file}`);
    continue;
  }
  
  const content = fs.readFileSync(file, 'utf-8');
  const lines = content.split('\n');
  
  let count = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // 跳过注释、import、console、i18n.t
    if (
      line.trim().startsWith('//') ||
      line.trim().startsWith('import ') ||
      line.includes('console.') ||
      line.includes('i18n.t(')
    ) {
      continue;
    }
    
    // 检查是否有中文
    if (/[\u4e00-\u9fa5]/.test(line)) {
      count++;
      totalHardcoded++;
    }
  }
  
  if (count > 0) {
    console.log(`📄 ${file}: ${count} 处硬编码中文`);
  }
}

console.log(`\n📊 总计: ${totalHardcoded} 处硬编码中文\n`);

if (totalHardcoded > 0) {
  console.log('❌ 硬编码还在代码中！');
  console.log('   我们只做了提取，还没有应用替换。');
  console.log('   下一步需要：将硬编码替换为 i18n.t(key)');
} else {
  console.log('✅ 代码中没有硬编码了！');
  console.log('   所有内容都已替换为 i18n.t()');
}
