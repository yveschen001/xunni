/**
 * Supplement Extraction
 * 补充提取遗漏的 172 处
 */

import * as fs from 'fs';

// 读取现有提取结果
const existing = JSON.parse(fs.readFileSync('i18n_complete_final.json', 'utf-8'));

// 读取遗漏的内容
const missed = JSON.parse(fs.readFileSync('not_extracted_strings.json', 'utf-8'));

console.log('🔍 开始补充提取遗漏内容...\n');
console.log(`📊 现有提取: ${existing.content.length} 个`);
console.log(`📊 遗漏内容: ${missed.notExtracted.length} 个\n`);

// 确定分类
function determineCategory(filePath: string, text: string): string {
  // 国家名称特殊处理
  if (filePath.includes('country_flag')) {
    return 'countries';
  }
  
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
  if (filePath.includes('ad_reward')) return 'ad';
  if (filePath.includes('broadcast')) return 'broadcast';
  if (filePath.includes('maintenance')) return 'maintenance';
  
  // 根据内容
  if (text.startsWith('❌') || text.includes('錯誤') || text.includes('失敗')) return 'errors';
  if (text.startsWith('✅') || text.includes('成功')) return 'success';
  if (text.startsWith('⚠️') || text.includes('警告')) return 'warnings';
  
  // 短标签
  if (text === '是' || text === '否') return 'common';
  if (text === '未設定' || text === '未設置' || text === '未生成') return 'common';
  if (text === '待處理' || text === '等待中') return 'common';
  
  return 'common';
}

// 确定类型
function determineType(text: string, filePath: string): string {
  if (filePath.includes('country_flag')) return 'data';
  if (text.length < 10) return 'label';
  if (text.includes('${')) return 'template';
  return 'message';
}

// 补充提取
const supplemented: typeof existing.content = [];
let addedCount = 0;

for (const item of missed.notExtracted) {
  // 检查是否已存在
  const exists = existing.content.some((c: any) => c.text === item.text);
  
  if (!exists) {
    supplemented.push({
      text: item.text,
      file: item.file,
      line: item.line,
      type: determineType(item.text, item.file),
      context: 'supplemented',
      category: determineCategory(item.file, item.text),
      length: item.text.length,
    });
    addedCount++;
  }
}

console.log(`✅ 补充了 ${addedCount} 个遗漏内容\n`);

// 合并到现有结果
const merged = {
  ...existing,
  content: [...existing.content, ...supplemented],
  meta: {
    ...existing.meta,
    totalContent: existing.content.length + supplemented.length,
    supplementedAt: new Date().toISOString(),
    supplementedCount: addedCount,
  },
};

// 保存
fs.writeFileSync(
  'i18n_complete_final.json',
  JSON.stringify(merged, null, 2),
  'utf-8'
);

console.log(`📊 合并后总计: ${merged.content.length} 个\n`);

// 统计
const byCategory = new Map<string, number>();
for (const item of supplemented) {
  byCategory.set(item.category, (byCategory.get(item.category) || 0) + 1);
}

console.log('📊 补充内容分类:');
for (const [cat, count] of Array.from(byCategory.entries()).sort((a, b) => b[1] - a[1])) {
  console.log(`   - ${cat}: ${count} 个`);
}

console.log('\n✅ 补充提取完成！');
console.log('📄 输出文件: i18n_complete_final.json');

