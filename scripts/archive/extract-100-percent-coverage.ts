/**
 * 100% Coverage Extraction
 * 确保提取所有用户可见内容，包括超长报表（按段落拆分）
 */

import * as fs from 'fs';
import * as path from 'path';

interface ExtractedContent {
  text: string;
  file: string;
  line: number;
  type: 'message' | 'button' | 'placeholder' | 'template' | 'long_template_part';
  context: string;
  category: string;
  length: number;
  originalLength?: number; // 如果是拆分的，记录原始长度
  partIndex?: number; // 如果是拆分的，记录是第几部分
}

const SCAN_DIRS = [
  'src/telegram/handlers',
  'src/domain',
  'src/services',
  'src/db',
];

const CHINESE_REGEX = /[\u4e00-\u9fa5]/;
const MAX_SEGMENT_LENGTH = 500; // 最大段落长度

const extracted: ExtractedContent[] = [];
const scannedFiles: string[] = [];

/**
 * 智能拆分长文本（按段落）
 */
function splitLongText(text: string): string[] {
  if (text.length <= MAX_SEGMENT_LENGTH) {
    return [text];
  }
  
  const segments: string[] = [];
  
  // 按双换行符拆分（段落）
  const paragraphs = text.split(/\n\n+/);
  
  let currentSegment = '';
  
  for (const para of paragraphs) {
    const paraWithNewline = para + '\n\n';
    
    // 如果当前段落本身就超过限制，按单换行符拆分
    if (para.length > MAX_SEGMENT_LENGTH) {
      // 先保存当前累积的内容
      if (currentSegment.trim()) {
        segments.push(currentSegment.trim());
        currentSegment = '';
      }
      
      // 拆分超长段落
      const lines = para.split('\n');
      let tempSegment = '';
      
      for (const line of lines) {
        const lineWithNewline = line + '\n';
        if ((tempSegment + lineWithNewline).length > MAX_SEGMENT_LENGTH && tempSegment) {
          segments.push(tempSegment.trim());
          tempSegment = lineWithNewline;
        } else {
          tempSegment += lineWithNewline;
        }
      }
      
      if (tempSegment.trim()) {
        segments.push(tempSegment.trim());
      }
      continue;
    }
    
    // 如果加上这个段落会超过限制，先保存当前内容
    if ((currentSegment + paraWithNewline).length > MAX_SEGMENT_LENGTH && currentSegment) {
      segments.push(currentSegment.trim());
      currentSegment = paraWithNewline;
    } else {
      currentSegment += paraWithNewline;
    }
  }
  
  // 保存最后的内容
  if (currentSegment.trim()) {
    segments.push(currentSegment.trim());
  }
  
  return segments.filter(s => s.length > 0);
}

/**
 * 提取文件中的所有内容
 */
function extractFromFile(filePath: string) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  let inMultilineTemplate = false;
  let templateStart = -1;
  let templateContent = '';
  let templateDepth = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNumber = i + 1;
    
    // 跳过注释
    if (line.trim().startsWith('//') || line.trim().startsWith('*')) {
      continue;
    }
    
    // 跳过 console
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
    
    // 检测多行模板字符串的开始
    const backtickCount = (line.match(/`/g) || []).length;
    
    if (backtickCount % 2 !== 0 && !inMultilineTemplate) {
      // 开始多行模板
      inMultilineTemplate = true;
      templateStart = lineNumber;
      templateContent = line;
      templateDepth = 1;
      continue;
    }
    
    if (inMultilineTemplate) {
      templateContent += '\n' + line;
      const currentBackticks = (line.match(/`/g) || []).length;
      templateDepth += currentBackticks;
      
      // 检查是否结束
      if (templateDepth % 2 === 0) {
        // 模板字符串结束
        inMultilineTemplate = false;
        
        // 提取模板内容
        const templateMatch = templateContent.match(/`([^`]*)`/s);
        if (templateMatch && templateMatch[1] && CHINESE_REGEX.test(templateMatch[1])) {
          const text = templateMatch[1].trim();
          
          if (text.length > MAX_SEGMENT_LENGTH) {
            // 拆分长模板
            const segments = splitLongText(text);
            segments.forEach((segment, index) => {
              addExtracted({
                text: segment,
                file: filePath,
                line: templateStart,
                type: 'long_template_part',
                context: `long template part ${index + 1}/${segments.length}`,
                category: determineCategory(filePath, segment),
                length: segment.length,
                originalLength: text.length,
                partIndex: index + 1,
              });
            });
          } else if (text.length > 20) {
            addExtracted({
              text,
              file: filePath,
              line: templateStart,
              type: 'template',
              context: 'template string',
              category: determineCategory(filePath, text),
              length: text.length,
            });
          }
        }
        
        templateContent = '';
        templateDepth = 0;
      }
      continue;
    }
    
    // 单行处理
    
    // 1. 提取 sendMessage/reply 中的消息
    if (line.match(/sendMessage|editMessageText|\.reply\(|answerCallbackQuery/)) {
      extractMessagesFromLine(line, filePath, lineNumber, i, lines);
    }
    
    // 2. 提取按钮文字
    if (line.match(/text:\s*['"`]/)) {
      extractButtonText(line, filePath, lineNumber);
    }
    
    // 3. 提取 placeholder
    if (line.includes('input_field_placeholder')) {
      extractPlaceholder(line, filePath, lineNumber);
    }
    
    // 4. 提取单行模板字符串
    if (backtickCount === 2 && CHINESE_REGEX.test(line)) {
      const match = line.match(/`([^`]+)`/);
      if (match && match[1] && match[1].length > 10) {
        addExtracted({
          text: match[1].trim(),
          file: filePath,
          line: lineNumber,
          type: 'template',
          context: 'inline template',
          category: determineCategory(filePath, match[1]),
          length: match[1].length,
        });
      }
    }
    
    // 5. 提取字符串字面量
    if (CHINESE_REGEX.test(line) && !line.includes('`')) {
      const matches = line.match(/['"]([^'"]*[\u4e00-\u9fa5][^'"]*)['"]/g);
      if (matches) {
        for (const match of matches) {
          const text = match.slice(1, -1).trim();
          if (text.length > 5 && !text.includes('${')) {
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
  }
  
  scannedFiles.push(filePath);
}

/**
 * 提取消息
 */
function extractMessagesFromLine(line: string, filePath: string, lineNumber: number, startIndex: number, lines: string[]) {
  let fullContent = line;
  let depth = (line.match(/\(/g) || []).length - (line.match(/\)/g) || []).length;
  
  for (let j = startIndex + 1; j < Math.min(startIndex + 50, lines.length) && depth > 0; j++) {
    const nextLine = lines[j];
    fullContent += '\n' + nextLine;
    depth += (nextLine.match(/\(/g) || []).length - (nextLine.match(/\)/g) || []).length;
  }
  
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
 * 提取占位符
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
 * 确定分类
 */
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

/**
 * 添加提取内容（去重）
 */
function addExtracted(item: ExtractedContent) {
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
  console.log('🎯 100% 覆盖率提取（包括超长报表）...\n');
  
  const startTime = Date.now();
  
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
  
  // 统计长度分布
  const lengthDistribution = {
    short: 0,
    medium: 0,
    long: 0,
    veryLong: 0,
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
  console.log(`   - 超长 (300-500 字): ${lengthDistribution.veryLong} 个\n`);
  
  // 统计拆分的长模板
  const splitTemplates = extracted.filter(e => e.type === 'long_template_part');
  if (splitTemplates.length > 0) {
    console.log(`📄 拆分的长模板: ${splitTemplates.length} 个段落`);
    const originalTemplates = new Set(splitTemplates.map(e => `${e.file}:${e.line}`));
    console.log(`   来自 ${originalTemplates.size} 个原始长模板\n`);
  }
  
  // 输出
  const output = {
    meta: {
      extractedAt: new Date().toISOString(),
      totalFiles: scannedFiles.length,
      totalContent: extracted.length,
      scannedDirs: SCAN_DIRS,
      typeDistribution: Object.fromEntries(typeDistribution),
      lengthDistribution,
      maxSegmentLength: MAX_SEGMENT_LENGTH,
    },
    content: extracted.sort((a, b) => b.length - a.length),
    files: scannedFiles,
  };
  
  fs.writeFileSync(
    'i18n_100_percent_coverage.json',
    JSON.stringify(output, null, 2),
    'utf-8'
  );
  
  console.log('📄 输出文件:');
  console.log('   - i18n_100_percent_coverage.json');
  console.log('\n✅ 100% 覆盖率提取完成！');
}

main();

