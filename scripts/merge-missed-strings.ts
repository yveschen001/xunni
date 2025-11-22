/**
 * Merge Missed Strings
 * 将遗漏的字符串合并到提取结果中
 */

import * as fs from 'fs';

// 读取原始提取结果
const extracted = JSON.parse(fs.readFileSync('i18n_100_percent_coverage.json', 'utf-8'));

// 读取遗漏的字符串
const missed = JSON.parse(fs.readFileSync('missed_strings.json', 'utf-8'));

console.log(`📊 原始提取: ${extracted.content.length} 个`);
console.log(`📊 遗漏字符串: ${missed.length} 个\n`);

// 确定分类
function determineCategory(filePath: string, text: string): string {
  if (filePath.includes('/admin')) return 'admin';
  if (filePath.includes('/vip')) return 'vip';
  if (filePath.includes('/throw')) return 'bottle.throw';
  if (filePath.includes('/catch')) return 'bottle.catch';
  if (filePath.includes('/profile')) return 'profile';
  if (filePath.includes('/settings')) return 'settings';
  if (filePath.includes('/menu')) return 'menu';
  if (filePath.includes('/onboarding')) return 'onboarding';
  if (filePath.includes('/help')) return 'help';
  if (filePath.includes('/stats')) return 'stats';
  if (filePath.includes('/conversation') || filePath.includes('/chats')) return 'conversation';
  if (filePath.includes('/task')) return 'tasks';
  if (filePath.includes('analytics')) return 'analytics';
  
  if (text.startsWith('❌') || text.includes('錯誤') || text.includes('失敗')) return 'errors';
  if (text.startsWith('✅') || text.includes('成功')) return 'success';
  if (text.startsWith('⚠️') || text.includes('警告')) return 'warnings';
  
  return 'common';
}

// 合并遗漏的字符串
let addedCount = 0;
for (const item of missed) {
  // 检查是否已存在
  const exists = extracted.content.some((c: any) => c.text === item.text);
  
  if (!exists) {
    extracted.content.push({
      text: item.text,
      file: item.file,
      line: item.line,
      type: 'message',
      context: 'missed_string',
      category: determineCategory(item.file, item.text),
      length: item.text.length,
    });
    addedCount++;
  }
}

console.log(`✅ 添加了 ${addedCount} 个遗漏的字符串`);
console.log(`📊 合并后总计: ${extracted.content.length} 个\n`);

// 更新元数据
extracted.meta.totalContent = extracted.content.length;
extracted.meta.mergedAt = new Date().toISOString();
extracted.meta.missedStringsAdded = addedCount;

// 重新排序（按长度）
extracted.content.sort((a: any, b: any) => b.length - a.length);

// 保存
fs.writeFileSync(
  'i18n_complete_final.json',
  JSON.stringify(extracted, null, 2),
  'utf-8'
);

console.log('📄 输出文件:');
console.log('   - i18n_complete_final.json');
console.log('\n✅ 合并完成！现在覆盖率应该是 100%');

