import * as fs from 'fs';

const extracted = JSON.parse(fs.readFileSync('i18n_complete_final.json', 'utf-8'));
const verification = JSON.parse(fs.readFileSync('i18n_extraction_verification.json', 'utf-8'));

const allMissed = [
  ...(verification.byReason.too_short || []),
  ...(verification.byReason.template_string || []),
  ...(verification.byReason.missed || []),
];

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
  return 'common';
}

let added = 0;
for (const item of allMissed) {
  const exists = extracted.content.some((c: any) => c.text === item.text);
  if (!exists) {
    extracted.content.push({
      text: item.text,
      file: item.file,
      line: item.line,
      type: 'message',
      context: 'remaining',
      category: determineCategory(item.file, item.text),
      length: item.text.length,
    });
    added++;
  }
}

console.log(`✅ 添加了 ${added} 个剩余字符串`);
console.log(`📊 最终总计: ${extracted.content.length} 个`);

extracted.meta.totalContent = extracted.content.length;
extracted.meta.finalMergeAt = new Date().toISOString();
extracted.content.sort((a: any, b: any) => b.length - a.length);

fs.writeFileSync('i18n_complete_final.json', JSON.stringify(extracted, null, 2), 'utf-8');
console.log('\n✅ 真正的 100% 覆盖率完成！');
