/**
 * Smart i18n Extraction
 * 智能提取完整的消息块（识别 sendMessage, reply 等调用）
 */

import * as fs from 'fs';
import * as path from 'path';

interface ExtractedMessage {
  text: string;
  file: string;
  line: number;
  context: string;
  category: string;
  length: number;
}

const SCAN_DIRS = [
  'src/telegram/handlers',
  'src/domain',
  'src/services',
];

const SKIP_PATTERNS = [
  /\.test\.ts$/,
  /node_modules/,
  /\.d\.ts$/,
];

const CHINESE_REGEX = /[\u4e00-\u9fa5]/;

const extracted: ExtractedMessage[] = [];
const scannedFiles: string[] = [];

/**
 * 提取 sendMessage/reply 调用中的完整消息
 */
function extractMessagesFromFile(filePath: string) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  // 识别消息发送调用
  const messagePatterns = [
    /sendMessage\s*\(/,
    /\.reply\s*\(/,
    /editMessageText\s*\(/,
    /answerCallbackQuery\s*\(/,
  ];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // 检查是否是消息发送调用
    const isMessageCall = messagePatterns.some(pattern => pattern.test(line));
    
    if (isMessageCall && CHINESE_REGEX.test(line)) {
      // 提取完整的消息内容（可能跨多行）
      let message = '';
      let depth = 0;
      let startLine = i;
      let inString = false;
      let inTemplate = false;
      
      for (let j = i; j < Math.min(i + 100, lines.length); j++) {
        const currentLine = lines[j];
        message += currentLine + '\n';
        
        // 简单的括号匹配
        for (const char of currentLine) {
          if (char === '(' && !inString && !inTemplate) depth++;
          if (char === ')' && !inString && !inTemplate) depth--;
          if (char === '"' || char === "'") inString = !inString;
          if (char === '`') inTemplate = !inTemplate;
        }
        
        if (depth === 0 && j > i) {
          // 找到完整的调用
          break;
        }
      }
      
      // 提取字符串内容
      const stringMatches = message.match(/['"`]([^'"`]*[\u4e00-\u9fa5][^'"`]*)['"`]/g);
      if (stringMatches) {
        for (const match of stringMatches) {
          const text = match.slice(1, -1); // 移除引号
          if (CHINESE_REGEX.test(text) && text.length > 5) {
            // 确定分类
            let category = 'common';
            if (filePath.includes('/admin')) category = 'admin';
            else if (filePath.includes('/vip')) category = 'vip';
            else if (filePath.includes('/throw')) category = 'bottle.throw';
            else if (filePath.includes('/catch')) category = 'bottle.catch';
            else if (filePath.includes('/profile')) category = 'profile';
            else if (filePath.includes('/settings')) category = 'settings';
            else if (filePath.includes('/menu')) category = 'menu';
            else if (filePath.includes('/onboarding')) category = 'onboarding';
            else if (filePath.includes('/help')) category = 'help';
            else if (filePath.includes('/stats')) category = 'stats';
            else if (filePath.includes('/conversation') || filePath.includes('/chats')) category = 'conversation';
            
            if (text.startsWith('❌') || text.includes('錯誤') || text.includes('失敗')) {
              category = 'errors';
            } else if (text.startsWith('✅') || text.includes('成功')) {
              category = 'success';
            } else if (text.startsWith('⚠️') || text.includes('警告')) {
              category = 'warnings';
            }
            
            extracted.push({
              text: text.trim(),
              file: filePath,
              line: startLine + 1,
              context: `sendMessage at line ${startLine + 1}`,
              category,
              length: text.length,
            });
          }
        }
      }
    }
  }
}

/**
 * 递归扫描目录
 */
function scanDirectory(dir: string) {
  if (!fs.existsSync(dir)) {
    console.error(`⚠️  目录不存在: ${dir}`);
    return;
  }
  
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      scanDirectory(fullPath);
    } else if (entry.isFile() && entry.name.endsWith('.ts')) {
      if (SKIP_PATTERNS.some((pattern) => pattern.test(fullPath))) {
        continue;
      }
      extractMessagesFromFile(fullPath);
      scannedFiles.push(fullPath);
    }
  }
}

/**
 * 主函数
 */
function main() {
  console.log('🧠 智能提取完整消息块...\n');
  
  const startTime = Date.now();
  
  // 扫描所有目录
  for (const dir of SCAN_DIRS) {
    console.log(`📂 扫描目录: ${dir}`);
    scanDirectory(dir);
  }
  
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  
  console.log(`\n✅ 扫描完成！`);
  console.log(`📊 统计:`);
  console.log(`   - 扫描文件: ${scannedFiles.length} 个`);
  console.log(`   - 提取消息: ${extracted.length} 个`);
  console.log(`   - 耗时: ${duration} 秒`);
  
  // 去重
  const uniqueTexts = new Set<string>();
  const uniqueExtracted: ExtractedMessage[] = [];
  
  for (const item of extracted) {
    if (!uniqueTexts.has(item.text)) {
      uniqueTexts.add(item.text);
      uniqueExtracted.push(item);
    }
  }
  
  console.log(`   - 去重后: ${uniqueExtracted.length} 个\n`);
  
  // 统计长度分布
  const lengthDistribution = {
    short: 0,      // < 30 字符
    medium: 0,     // 30-100 字符
    long: 0,       // 100-300 字符
    veryLong: 0,   // > 300 字符
  };
  
  for (const item of uniqueExtracted) {
    if (item.length < 30) lengthDistribution.short++;
    else if (item.length < 100) lengthDistribution.medium++;
    else if (item.length < 300) lengthDistribution.long++;
    else lengthDistribution.veryLong++;
  }
  
  console.log('📏 长度分布:');
  console.log(`   - 短消息 (< 30 字): ${lengthDistribution.short} 个`);
  console.log(`   - 中等 (30-100 字): ${lengthDistribution.medium} 个`);
  console.log(`   - 长消息 (100-300 字): ${lengthDistribution.long} 个`);
  console.log(`   - 超长 (> 300 字): ${lengthDistribution.veryLong} 个\n`);
  
  // 按分类统计
  const categoryCount = new Map<string, number>();
  for (const m of uniqueExtracted) {
    categoryCount.set(m.category, (categoryCount.get(m.category) || 0) + 1);
  }
  
  console.log('📊 分类统计:');
  for (const [cat, count] of Array.from(categoryCount.entries()).sort((a, b) => b[1] - a[1])) {
    console.log(`   - ${cat}: ${count} 个`);
  }
  
  // 输出到 JSON
  const output = {
    meta: {
      extractedAt: new Date().toISOString(),
      totalFiles: scannedFiles.length,
      totalMessages: extracted.length,
      uniqueMessages: uniqueExtracted.length,
      scannedDirs: SCAN_DIRS,
      lengthDistribution,
      categoryDistribution: Object.fromEntries(categoryCount),
    },
    messages: uniqueExtracted.sort((a, b) => b.length - a.length),
    files: scannedFiles,
  };
  
  fs.writeFileSync(
    'i18n_messages_smart.json',
    JSON.stringify(output, null, 2),
    'utf-8'
  );
  
  console.log('\n📄 输出文件:');
  console.log('   - i18n_messages_smart.json');
  console.log('\n🎯 这个结果更接近我们想要的！');
}

main();

