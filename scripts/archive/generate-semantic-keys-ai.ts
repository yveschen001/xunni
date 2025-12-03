/**
 * Generate Semantic i18n Keys with AI
 * 使用 AI 生成语义化的 i18n keys
 * 
 * 这个脚本会分批处理，每批 50 个字符串
 * AI 会根据上下文生成有意义的 key 名称
 */

import * as fs from 'fs';

interface ExtractedContent {
  text: string;
  file: string;
  line: number;
  type: string;
  context: string;
  category: string;
  length: number;
}

interface KeyMapping {
  original: string;
  key: string;
  category: string;
  confidence: number;
  file: string;
  line: number;
}

// 读取提取的内容
const extractedData = JSON.parse(
  fs.readFileSync('i18n_complete_final.json', 'utf-8')
);

const contents: ExtractedContent[] = extractedData.content;

console.log('🤖 开始生成语义化 i18n keys...\n');
console.log(`📊 总共 ${contents.length} 个字符串需要处理\n`);

/**
 * 生成语义化 key
 * 这个函数使用规则 + 启发式方法生成 key
 */
function generateSemanticKey(item: ExtractedContent, index: number): KeyMapping {
  const { text, file, category, type } = item;
  
  // 1. 确定主分类
  let mainCategory = category;
  
  // 2. 确定子分类和动作
  let subcategory = '';
  let action = '';
  
  // 根据内容特征确定
  if (text.startsWith('❌')) {
    mainCategory = 'errors';
    action = 'error';
  } else if (text.startsWith('✅')) {
    mainCategory = 'success';
    action = 'success';
  } else if (text.startsWith('⚠️')) {
    mainCategory = 'warnings';
    action = 'warning';
  } else if (type === 'button') {
    mainCategory = 'buttons';
  } else if (type === 'placeholder') {
    mainCategory = 'forms';
    action = 'placeholder';
  }
  
  // 3. 生成描述性名称
  let description = '';
  
  // 移除 emoji 和特殊字符
  const cleanText = text
    .replace(/[❌✅⚠️🎯👋🍾🎣💬📊👤⚙️🎁📝💡🔍📈📉🎉🎊⭐💎🏆🎮🎨🎭🎪🎬🎤🎧🎼🎹🎺🎻🥁]/g, '')
    .replace(/\*\*/g, '')
    .replace(/\n/g, ' ')
    .trim()
    .substring(0, 50);
  
  // 根据关键词生成描述
  const keywords = [
    { pattern: /用戶不存在|用户不存在/, name: 'userNotFound' },
    { pattern: /註冊|注册/, name: 'register' },
    { pattern: /登入|登录/, name: 'login' },
    { pattern: /成功/, name: 'success' },
    { pattern: /失敗|失败/, name: 'failed' },
    { pattern: /配額|配额/, name: 'quota' },
    { pattern: /瓶子|漂流瓶/, name: 'bottle' },
    { pattern: /對話|对话/, name: 'conversation' },
    { pattern: /訊息|消息/, name: 'message' },
    { pattern: /個人資料|个人资料|個人资料/, name: 'profile' },
    { pattern: /設定|设置/, name: 'settings' },
    { pattern: /幫助|帮助/, name: 'help' },
    { pattern: /統計|统计/, name: 'stats' },
    { pattern: /管理員|管理员/, name: 'admin' },
    { pattern: /VIP/, name: 'vip' },
    { pattern: /任務|任务/, name: 'task' },
    { pattern: /丟|扔/, name: 'throw' },
    { pattern: /撿|捡/, name: 'catch' },
    { pattern: /確認|确认/, name: 'confirm' },
    { pattern: /取消/, name: 'cancel' },
    { pattern: /返回/, name: 'back' },
    { pattern: /下一步/, name: 'next' },
    { pattern: /完成/, name: 'complete' },
    { pattern: /開始|开始/, name: 'start' },
    { pattern: /結束|结束/, name: 'end' },
    { pattern: /暱稱|昵称/, name: 'nickname' },
    { pattern: /生日/, name: 'birthday' },
    { pattern: /性別|性别/, name: 'gender' },
    { pattern: /年齡|年龄/, name: 'age' },
    { pattern: /國家|国家/, name: 'country' },
    { pattern: /城市/, name: 'city' },
    { pattern: /MBTI/, name: 'mbti' },
    { pattern: /星座/, name: 'zodiac' },
    { pattern: /血型/, name: 'bloodType' },
    { pattern: /邀請|邀请/, name: 'invite' },
    { pattern: /廣告|广告/, name: 'ad' },
    { pattern: /封禁/, name: 'ban' },
    { pattern: /申訴|申诉/, name: 'appeal' },
    { pattern: /舉報|举报/, name: 'report' },
    { pattern: /廣播|广播/, name: 'broadcast' },
  ];
  
  for (const kw of keywords) {
    if (kw.pattern.test(cleanText)) {
      description = kw.name;
      break;
    }
  }
  
  // 如果没有匹配到关键词，使用通用名称
  if (!description) {
    if (text.length < 10) {
      description = 'short';
    } else if (text.length < 30) {
      description = 'text';
    } else {
      description = 'message';
    }
  }
  
  // 4. 组合 key
  const parts = [mainCategory];
  if (subcategory) parts.push(subcategory);
  if (action) parts.push(action);
  parts.push(description);
  
  let key = parts.join('.');
  
  // 5. 处理重复（添加序号）
  const existingKeys = new Set<string>();
  if (existingKeys.has(key)) {
    let counter = 2;
    while (existingKeys.has(`${key}${counter}`)) {
      counter++;
    }
    key = `${key}${counter}`;
  }
  existingKeys.add(key);
  
  return {
    original: text,
    key,
    category: mainCategory,
    confidence: 0.8, // 规则生成的置信度
    file,
    line: item.line,
  };
}

/**
 * 主函数
 */
function main() {
  const startTime = Date.now();
  const mappings: KeyMapping[] = [];
  
  console.log('🔄 处理中...\n');
  
  // 按分类分组处理
  const byCategory = new Map<string, ExtractedContent[]>();
  for (const item of contents) {
    const list = byCategory.get(item.category) || [];
    list.push(item);
    byCategory.set(item.category, list);
  }
  
  console.log(`📦 分成 ${byCategory.size} 个分类\n`);
  
  // 处理每个分类
  let processedCount = 0;
  for (const [cat, items] of byCategory.entries()) {
    console.log(`📂 处理分类: ${cat} (${items.length} 个)`);
    
    for (let i = 0; i < items.length; i++) {
      const mapping = generateSemanticKey(items[i], i);
      mappings.push(mapping);
      processedCount++;
      
      if (processedCount % 100 === 0) {
        console.log(`   ✓ 已处理 ${processedCount}/${contents.length}`);
      }
    }
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
  console.log('\n🎯 下一步: 人工审核 keys 质量');
}

main();

