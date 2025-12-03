/**
 * Extract All User-Visible Content
 * 提取所有用户可见的内容（全面覆盖）
 */

import * as fs from 'fs';
import * as path from 'path';

interface ExtractedContent {
  text: string;
  file: string;
  line: number;
  type: 'message' | 'button' | 'placeholder' | 'error' | 'template' | 'db_content';
  context: string;
  category: string;
  length: number;
}

const SCAN_DIRS = [
  'src/telegram/handlers',
  'src/telegram/middleware',
  'src/domain',
  'src/services',
  'src/db',
];

const CHINESE_REGEX = /[\u4e00-\u9fa5]/;

const extracted: ExtractedContent[] = [];
const scannedFiles: string[] = [];

/**
 * 提取文件中的所有用户可见内容
 */
function extractFromFile(filePath: string) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNumber = i + 1;
    
    // 跳过注释
    if (line.trim().startsWith('//') || line.trim().startsWith('*')) {
      continue;
    }
    
    // 跳过 console.log
    if (line.includes('console.log') || line.includes('console.error')) {
      continue;
    }
    
    // 跳过 import
    if (line.trim().startsWith('import ')) {
      continue;
    }
    
    // 跳过已经使用 i18n.t() 的
    if (line.includes('i18n.t(')) {
      continue;
    }
    
    // 跳过 callback_data（业务逻辑标识符）
    if (line.includes('callback_data:') && !CHINESE_REGEX.test(line)) {
      continue;
    }
    
    // 1. 提取 sendMessage/editMessageText/reply 中的消息
    if (line.match(/sendMessage|editMessageText|\.reply\(/)) {
      extractMessagesFromLine(line, filePath, lineNumber, i, lines);
    }
    
    // 2. 提取按钮文字
    if (line.match(/text:\s*['"`]/)) {
      extractButtonText(line, filePath, lineNumber);
    }
    
    // 3. 提取 input_field_placeholder
    if (line.includes('input_field_placeholder')) {
      extractPlaceholder(line, filePath, lineNumber);
    }
    
    // 4. 提取模板字符串（报表、统计等）
    if (line.includes('`') && CHINESE_REGEX.test(line)) {
      extractTemplateString(line, filePath, lineNumber, i, lines);
    }
    
    // 5. 提取字符串字面量（可能是消息）
    if (CHINESE_REGEX.test(line) && !line.includes('i18n.t(')) {
      extractStringLiteral(line, filePath, lineNumber);
    }
  }
  
  scannedFiles.push(filePath);
}

/**
 * 提取消息（可能跨多行）
 */
function extractMessagesFromLine(line: string, filePath: string, lineNumber: number, startIndex: number, lines: string[]) {
  // 尝试提取完整的消息内容
  let fullContent = line;
  let depth = (line.match(/\(/g) || []).length - (line.match(/\)/g) || []).length;
  
  // 如果括号未闭合，继续读取后续行
  for (let j = startIndex + 1; j < Math.min(startIndex + 50, lines.length) && depth > 0; j++) {
    const nextLine = lines[j];
    fullContent += '\n' + nextLine;
    depth += (nextLine.match(/\(/g) || []).length - (nextLine.match(/\)/g) || []).length;
  }
  
  // 提取字符串内容
  const stringMatches = fullContent.match(/['"`]([^'"`]*[\u4e00-\u9fa5][^'"`]*)['"`]/g);
  if (stringMatches) {
    for (const match of stringMatches) {
      const text = match.slice(1, -1).trim();
      if (text.length > 3 && CHINESE_REGEX.test(text)) {
        addExtracted({
          text,
          file: filePath,
          line: lineNumber,
          type: 'message',
          context: 'sendMessage/reply',
          category: determineCategory(filePath, text),
          length: text.length,
        });
      }
    }
  }
  
  // 提取模板字符串
  const templateMatches = fullContent.match(/`([^`]*[\u4e00-\u9fa5][^`]*)`/g);
  if (templateMatches) {
    for (const match of templateMatches) {
      const text = match.slice(1, -1).trim();
      if (text.length > 10 && CHINESE_REGEX.test(text)) {
        addExtracted({
          text,
          file: filePath,
          line: lineNumber,
          type: 'template',
          context: 'template in message',
          category: determineCategory(filePath, text),
          length: text.length,
        });
      }
    }
  }
}

/**
 * 提取按钮文字
 */
function extractButtonText(line: string, filePath: string, lineNumber: number) {
  const match = line.match(/text:\s*['"`]([^'"`]*[\u4e00-\u9fa5][^'"`]*)['"`]/);
  if (match && match[1]) {
    const text = match[1].trim();
    if (text.length > 0) {
      addExtracted({
        text,
        file: filePath,
        line: lineNumber,
        type: 'button',
        context: 'button text',
        category: 'buttons',
        length: text.length,
      });
    }
  }
}

/**
 * 提取占位符文字
 */
function extractPlaceholder(line: string, filePath: string, lineNumber: number) {
  const match = line.match(/input_field_placeholder:\s*['"`]([^'"`]*[\u4e00-\u9fa5][^'"`]*)['"`]/);
  if (match && match[1]) {
    const text = match[1].trim();
    if (text.length > 0) {
      addExtracted({
        text,
        file: filePath,
        line: lineNumber,
        type: 'placeholder',
        context: 'input placeholder',
        category: 'forms',
        length: text.length,
      });
    }
  }
}

/**
 * 提取模板字符串（可能跨多行）
 */
function extractTemplateString(line: string, filePath: string, lineNumber: number, startIndex: number, lines: string[]) {
  // 检查是否是模板字符串的开始
  if (!line.includes('`')) return;
  
  let fullTemplate = line;
  let openBackticks = (line.match(/`/g) || []).length;
  
  // 如果模板字符串未闭合，继续读取
  if (openBackticks % 2 !== 0) {
    for (let j = startIndex + 1; j < Math.min(startIndex + 100, lines.length); j++) {
      const nextLine = lines[j];
      fullTemplate += '\n' + nextLine;
      openBackticks += (nextLine.match(/`/g) || []).length;
      if (openBackticks % 2 === 0) break;
    }
  }
  
  // 提取完整的模板字符串
  const templateMatch = fullTemplate.match(/`([^`]*[\u4e00-\u9fa5][^`]*)`/);
  if (templateMatch && templateMatch[1]) {
    const text = templateMatch[1].trim();
    if (text.length > 20 && CHINESE_REGEX.test(text)) {
      addExtracted({
        text,
        file: filePath,
        line: lineNumber,
        type: 'template',
        context: 'template string',
        category: determineCategory(filePath, text),
        length: text.length,
      });
    }
  }
}

/**
 * 提取字符串字面量
 */
function extractStringLiteral(line: string, filePath: string, lineNumber: number) {
  // 提取单引号或双引号字符串
  const matches = line.match(/['"]([^'"]*[\u4e00-\u9fa5][^'"]*)['"]/g);
  if (matches) {
    for (const match of matches) {
      const text = match.slice(1, -1).trim();
      if (text.length > 5 && CHINESE_REGEX.test(text) && !text.includes('${')) {
        addExtracted({
          text,
          file: filePath,
          line: lineNumber,
          type: 'message',
          context: 'string literal',
          category: determineCategory(filePath, text),
          length: text.length,
        });
      }
    }
  }
}

/**
 * 确定分类
 */
function determineCategory(filePath: string, text: string): string {
  // 根据文件路径
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
  
  // 根据内容
  if (text.startsWith('❌') || text.includes('錯誤') || text.includes('失敗')) return 'errors';
  if (text.startsWith('✅') || text.includes('成功')) return 'success';
  if (text.startsWith('⚠️') || text.includes('警告') || text.includes('注意')) return 'warnings';
  
  return 'common';
}

/**
 * 添加提取的内容（去重）
 */
function addExtracted(item: ExtractedContent) {
  // 检查是否已存在
  const exists = extracted.some(e => e.text === item.text);
  if (!exists) {
    extracted.push(item);
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
    } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.sql'))) {
      if (entry.name.includes('.test.')) continue;
      extractFromFile(fullPath);
    }
  }
}

/**
 * 主函数
 */
function main() {
  console.log('🔍 全面提取所有用户可见内容...\n');
  
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
  console.log(`   - 提取内容: ${extracted.length} 个`);
  console.log(`   - 耗时: ${duration} 秒\n`);
  
  // 统计类型分布
  const typeDistribution = new Map<string, number>();
  for (const item of extracted) {
    typeDistribution.set(item.type, (typeDistribution.get(item.type) || 0) + 1);
  }
  
  console.log('📊 类型分布:');
  for (const [type, count] of Array.from(typeDistribution.entries()).sort((a, b) => b[1] - a[1])) {
    console.log(`   - ${type}: ${count} 个`);
  }
  
  // 统计分类分布
  const categoryDistribution = new Map<string, number>();
  for (const item of extracted) {
    categoryDistribution.set(item.category, (categoryDistribution.get(item.category) || 0) + 1);
  }
  
  console.log('\n📊 分类分布:');
  for (const [cat, count] of Array.from(categoryDistribution.entries()).sort((a, b) => b[1] - a[1])) {
    console.log(`   - ${cat}: ${count} 个`);
  }
  
  // 统计长度分布
  const lengthDistribution = {
    short: 0,      // < 30 字符
    medium: 0,     // 30-100 字符
    long: 0,       // 100-300 字符
    veryLong: 0,   // > 300 字符
  };
  
  for (const item of extracted) {
    if (item.length < 30) lengthDistribution.short++;
    else if (item.length < 100) lengthDistribution.medium++;
    else if (item.length < 300) lengthDistribution.long++;
    else lengthDistribution.veryLong++;
  }
  
  console.log('\n📏 长度分布:');
  console.log(`   - 短文本 (< 30 字): ${lengthDistribution.short} 个`);
  console.log(`   - 中等 (30-100 字): ${lengthDistribution.medium} 个`);
  console.log(`   - 长文本 (100-300 字): ${lengthDistribution.long} 个`);
  console.log(`   - 超长 (> 300 字): ${lengthDistribution.veryLong} 个\n`);
  
  // 输出到 JSON
  const output = {
    meta: {
      extractedAt: new Date().toISOString(),
      totalFiles: scannedFiles.length,
      totalContent: extracted.length,
      scannedDirs: SCAN_DIRS,
      typeDistribution: Object.fromEntries(typeDistribution),
      categoryDistribution: Object.fromEntries(categoryDistribution),
      lengthDistribution,
    },
    content: extracted.sort((a, b) => b.length - a.length),
    files: scannedFiles,
  };
  
  fs.writeFileSync(
    'i18n_all_user_visible.json',
    JSON.stringify(output, null, 2),
    'utf-8'
  );
  
  console.log('📄 输出文件:');
  console.log('   - i18n_all_user_visible.json');
  console.log('\n✅ 所有用户可见内容已提取！');
}

main();

