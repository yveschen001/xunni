/**
 * Generate Semantic i18n Keys (Rule-Based)
 * 使用规则生成语义化的 i18n keys（不需要 API）
 */

import * as fs from 'fs';

interface ExtractedString {
  text: string;
  file: string;
  line: number;
  context: string;
  type: 'string' | 'template';
}

interface KeyMapping {
  original: string;
  key: string;
  category: string;
  subcategory?: string;
  action?: string;
  confidence: number;
}

/**
 * 基于规则生成 key
 */
function generateKey(str: ExtractedString): KeyMapping {
  const text = str.text;
  const file = str.file;
  
  // 1. 确定分类
  let category = 'common';
  let subcategory: string | undefined;
  let action: string | undefined;
  
  // 根据文件路径确定分类
  if (file.includes('/handlers/admin')) {
    category = 'admin';
  } else if (file.includes('/handlers/vip')) {
    category = 'vip';
  } else if (file.includes('/handlers/throw')) {
    category = 'bottle';
    subcategory = 'throw';
  } else if (file.includes('/handlers/catch')) {
    category = 'bottle';
    subcategory = 'catch';
  } else if (file.includes('/handlers/profile')) {
    category = 'profile';
  } else if (file.includes('/handlers/settings')) {
    category = 'settings';
  } else if (file.includes('/handlers/menu')) {
    category = 'menu';
  } else if (file.includes('/handlers/onboarding')) {
    category = 'onboarding';
  } else if (file.includes('/handlers/help')) {
    category = 'help';
  } else if (file.includes('/handlers/stats')) {
    category = 'stats';
  } else if (file.includes('/handlers/conversation') || file.includes('/handlers/chats')) {
    category = 'conversation';
  } else if (file.includes('/handlers/task')) {
    category = 'tasks';
  }
  
  // 根据内容确定分类
  if (text.startsWith('❌') || text.includes('錯誤') || text.includes('失敗')) {
    category = 'errors';
  } else if (text.startsWith('✅') || text.includes('成功')) {
    category = 'success';
  } else if (text.startsWith('⚠️') || text.includes('警告') || text.includes('注意')) {
    category = 'warnings';
  } else if (text.includes('按鈕') || str.context.includes('button')) {
    category = 'buttons';
  }
  
  // 2. 生成 key 名称
  let keyName = text
    .replace(/[❌✅⚠️🎯👋🍾🎣💬📊👤⚙️🎁]/g, '') // 移除 emoji
    .replace(/[\n\r]/g, ' ') // 换行符替换为空格
    .trim()
    .slice(0, 50); // 限制长度
  
  // 简化为英文 key（基于常见词汇）
  const keyWords: string[] = [];
  
  if (keyName.includes('用戶不存在') || keyName.includes('用户不存在')) {
    keyWords.push('userNotFound');
  } else if (keyName.includes('註冊') || keyName.includes('注册')) {
    keyWords.push('register');
  } else if (keyName.includes('登入') || keyName.includes('登录')) {
    keyWords.push('login');
  } else if (keyName.includes('成功')) {
    keyWords.push('success');
  } else if (keyName.includes('失敗') || keyName.includes('失败')) {
    keyWords.push('failed');
  } else if (keyName.includes('配額') || keyName.includes('配额')) {
    keyWords.push('quota');
  } else if (keyName.includes('瓶子') || keyName.includes('漂流瓶')) {
    keyWords.push('bottle');
  } else if (keyName.includes('對話') || keyName.includes('对话')) {
    keyWords.push('conversation');
  } else if (keyName.includes('訊息') || keyName.includes('消息')) {
    keyWords.push('message');
  } else if (keyName.includes('個人資料') || keyName.includes('个人资料')) {
    keyWords.push('profile');
  } else if (keyName.includes('設定') || keyName.includes('设置')) {
    keyWords.push('settings');
  } else if (keyName.includes('幫助') || keyName.includes('帮助')) {
    keyWords.push('help');
  } else if (keyName.includes('統計') || keyName.includes('统计')) {
    keyWords.push('stats');
  } else if (keyName.includes('管理員') || keyName.includes('管理员')) {
    keyWords.push('admin');
  } else if (keyName.includes('VIP')) {
    keyWords.push('vip');
  } else if (keyName.includes('任務') || keyName.includes('任务')) {
    keyWords.push('task');
  } else {
    // 生成通用 key
    keyWords.push('text');
  }
  
  // 3. 组合 key
  const parts = [category];
  if (subcategory) parts.push(subcategory);
  parts.push(...keyWords);
  
  const key = parts.join('.');
  
  return {
    original: text,
    key,
    category,
    subcategory,
    action,
    confidence: 0.7, // 规则生成的置信度较低
  };
}

/**
 * 主函数
 */
function main() {
  console.log('🔧 开始生成语义化 i18n keys (基于规则)...\n');

  // 读取提取的字符串
  const extractedData = JSON.parse(
    fs.readFileSync('i18n_extracted_clean.json', 'utf-8')
  );

  const strings: ExtractedString[] = extractedData.strings;
  console.log(`📊 总共 ${strings.length} 个唯一字符串`);

  const startTime = Date.now();
  const mappings: KeyMapping[] = [];
  const keyCount = new Map<string, number>();

  for (const str of strings) {
    const mapping = generateKey(str);
    
    // 处理重复 key
    const baseKey = mapping.key;
    const count = keyCount.get(baseKey) || 0;
    keyCount.set(baseKey, count + 1);
    
    if (count > 0) {
      mapping.key = `${baseKey}${count + 1}`;
    }
    
    mappings.push(mapping);
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log(`\n✅ 生成完成！`);
  console.log(`📊 统计:`);
  console.log(`   - 生成 keys: ${mappings.length} 个`);
  console.log(`   - 耗时: ${duration} 秒`);
  console.log(`   - 平均置信度: ${(mappings.reduce((sum, m) => sum + m.confidence, 0) / mappings.length).toFixed(2)}`);

  // 按分类统计
  const categoryCount = new Map<string, number>();
  for (const m of mappings) {
    categoryCount.set(m.category, (categoryCount.get(m.category) || 0) + 1);
  }

  console.log(`\n📊 分类统计:`);
  for (const [cat, count] of Array.from(categoryCount.entries()).sort((a, b) => b[1] - a[1])) {
    console.log(`   - ${cat}: ${count} 个`);
  }

  // 输出到 JSON
  fs.writeFileSync(
    'i18n_keys_mapping.json',
    JSON.stringify(mappings, null, 2),
    'utf-8'
  );

  console.log('\n📄 输出文件:');
  console.log('   - i18n_keys_mapping.json');
  console.log('\n⚠️  注意: 这是基于规则生成的 keys，质量可能不如 AI 生成');
  console.log('💡 建议: 设置 ANTHROPIC_API_KEY 后运行 `npx tsx scripts/generate-semantic-keys.ts` 使用 AI 生成');
  console.log('\n🎯 下一步: 运行 `npx tsx scripts/ai-review-i18n-keys.ts`（可选）');
  console.log('   或直接运行 `npx tsx scripts/apply-i18n-replacements-clean.ts`');
}

main();

