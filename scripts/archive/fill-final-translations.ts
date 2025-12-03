/**
 * 填入最后剩余的缺失翻译
 */

import * as fs from 'fs';
import * as path from 'path';

// 最后剩余的翻译
const finalTranslations: Record<string, string> = {
  // broadcast
  'broadcast.statusTitle': '📊 廣播狀態',
  'broadcast.upgradeRequired': '💎 升級 VIP 以使用此功能',

  // common
  'common.anonymous': '匿名用戶',
  'common.none': '無',
  'common.userNotFound': '用戶不存在',

  // conversation
  'conversation.message77': '💬 使用 /reply 回覆訊息',

  // conversationHistory
  'conversationHistory.backToMenu': '🏠 返回主選單：/menu',
};

/**
 * 更新 CSV 文件
 */
function updateCSV(): void {
  const csvPath = path.join(process.cwd(), 'i18n_for_translation.csv');
  let content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.split('\n');
  
  let updated = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('[需要翻译:')) {
      const match = line.match(/^([^,]+),\[需要翻译:([^\]]+)\]/);
      if (match) {
        const key = match[1];
        const translation = finalTranslations[key];
        if (translation) {
          lines[i] = line.replace(/\[需要翻译:[^\]]+\]/, translation);
          updated++;
        }
      }
    }
  }
  
  fs.writeFileSync(csvPath, lines.join('\n'), 'utf-8');
  console.log(`✅ 已更新 CSV 中的 ${updated} 个翻译`);
}

/**
 * 更新 zh-TW.ts 文件
 */
function updateZhTW(): void {
  const zhTWPath = path.join(process.cwd(), 'src', 'i18n', 'locales', 'zh-TW.ts');
  let content = fs.readFileSync(zhTWPath, 'utf-8');
  
  let updated = 0;
  for (const [key, translation] of Object.entries(finalTranslations)) {
    // 解析 key 路径
    const parts = key.split('.');
    const namespace = parts[0];
    const keyName = parts.slice(1).join('.');
    
    // 构建匹配模式
    let pattern: RegExp;
    let replacement: string;
    
    // 匹配格式：keyName: `[需要翻译: ...]`
    pattern = new RegExp(
      `${keyName.replace(/\./g, '\\.')}:\\s*\`\\[需要翻译:[^\\]]+\\]\``,
      'g'
    );
    replacement = `${keyName}: \`${translation}\``;
    
    if (pattern.test(content)) {
      content = content.replace(pattern, replacement);
      updated++;
    }
  }
  
  fs.writeFileSync(zhTWPath, content, 'utf-8');
  console.log(`✅ 已更新 zh-TW.ts 中的 ${updated} 个翻译`);
}

/**
 * 主函数
 */
function main(): void {
  console.log('🔍 开始填入最后剩余的缺失翻译...\n');
  
  updateCSV();
  updateZhTW();
  
  console.log('\n✅ 完成！');
}

main();

