/**
 * i18n Complete Sentences Extraction
 * 提取完整的句子和段落（不要切太细！）
 */

import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';

interface ExtractedString {
  text: string;
  file: string;
  line: number;
  context: string;
  type: 'string' | 'template' | 'multiline';
  length: number;
}

const SCAN_DIRS = [
  'src/telegram',
  'src/domain',
  'src/services',
  'src/utils',
  'src/config',
  'src/db/queries',
  'src',
];

const SKIP_PATTERNS = [
  /\.test\.ts$/,
  /node_modules/,
  /\.d\.ts$/,
];

const CHINESE_REGEX = /[\u4e00-\u9fa5]/;

const extracted: ExtractedString[] = [];
const scannedFiles: string[] = [];

/**
 * 检查是否应该跳过此节点
 */
function shouldSkip(node: ts.Node, sourceFile: ts.SourceFile): boolean {
  const text = node.getText(sourceFile);
  
  // 跳过 import 语句
  if (ts.isImportDeclaration(node)) return true;
  
  // 跳过 console.log/console.error
  if (ts.isCallExpression(node)) {
    const expr = node.expression.getText(sourceFile);
    if (expr.startsWith('console.')) return true;
  }
  
  // 跳过已经使用 i18n.t() 的
  if (text.includes('i18n.t(')) return true;
  
  // 跳过 callback_data（业务逻辑标识符）
  if (node.parent && ts.isPropertyAssignment(node.parent)) {
    const propName = node.parent.name.getText(sourceFile);
    if (propName === 'callback_data') return true;
  }
  
  return false;
}

/**
 * 检查是否是按钮文字（可以单独提取）
 */
function isButtonText(text: string, context: string): boolean {
  // 短文本（< 15 字符）且包含常见按钮词汇
  if (text.length < 15) {
    const buttonKeywords = [
      '按鈕', '設定', '幫助', '統計', '個人資料', '對話',
      '丟', '撿', '瓶子', '確認', '取消', '返回', '下一步',
      '送出', '編輯', '刪除', '分享', '查看'
    ];
    return buttonKeywords.some(kw => text.includes(kw));
  }
  
  // 在 button 相关的上下文中
  if (context.includes('button') || context.includes('Button')) {
    return text.length < 30;
  }
  
  return false;
}

/**
 * 获取节点的上下文信息
 */
function getContext(node: ts.Node, sourceFile: ts.SourceFile): string {
  let current: ts.Node | undefined = node;
  
  while (current) {
    if (ts.isFunctionDeclaration(current) && current.name) {
      return `function ${current.name.text}`;
    }
    if (ts.isVariableDeclaration(current) && current.name) {
      return `const ${current.name.getText(sourceFile)}`;
    }
    if (ts.isMethodDeclaration(current) && current.name) {
      return `method ${current.name.getText(sourceFile)}`;
    }
    current = current.parent;
  }
  
  return 'unknown';
}

/**
 * 清理文本（移除多余空白，但保持结构）
 */
function cleanText(text: string): string {
  return text
    .replace(/\n\s*\n/g, '\n') // 多个换行符合并为一个
    .trim();
}

/**
 * 访问 AST 节点
 */
function visit(node: ts.Node, sourceFile: ts.SourceFile) {
  if (shouldSkip(node, sourceFile)) {
    return;
  }
  
  // 字符串字面量
  if (ts.isStringLiteral(node)) {
    const text = node.text;
    if (CHINESE_REGEX.test(text)) {
      const cleanedText = cleanText(text);
      const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
      const context = getContext(node, sourceFile);
      
      extracted.push({
        text: cleanedText,
        file: sourceFile.fileName,
        line: line + 1,
        context,
        type: 'string',
        length: cleanedText.length,
      });
    }
  }
  
  // 模板字符串（保持完整）
  if (ts.isTemplateExpression(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    const text = node.getText(sourceFile);
    if (CHINESE_REGEX.test(text)) {
      const cleanedText = cleanText(text);
      const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
      const context = getContext(node, sourceFile);
      
      extracted.push({
        text: cleanedText,
        file: sourceFile.fileName,
        line: line + 1,
        context,
        type: 'template',
        length: cleanedText.length,
      });
    }
  }
  
  ts.forEachChild(node, (child) => visit(child, sourceFile));
}

/**
 * 扫描单个文件
 */
function scanFile(filePath: string) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const sourceFile = ts.createSourceFile(
    filePath,
    content,
    ts.ScriptTarget.Latest,
    true
  );
  
  visit(sourceFile, sourceFile);
  scannedFiles.push(filePath);
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
      scanFile(fullPath);
    }
  }
}

/**
 * 主函数
 */
function main() {
  console.log('🔍 开始扫描中文字符串（完整句子/段落）...\n');
  
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
  console.log(`   - 提取字符串: ${extracted.length} 个`);
  console.log(`   - 耗时: ${duration} 秒`);
  
  // 去重（保留最长的版本）
  const textMap = new Map<string, ExtractedString>();
  
  for (const item of extracted) {
    const existing = textMap.get(item.text);
    if (!existing || item.length > existing.length) {
      textMap.set(item.text, item);
    }
  }
  
  const uniqueExtracted = Array.from(textMap.values());
  
  console.log(`   - 去重后: ${uniqueExtracted.length} 个\n`);
  
  // 统计长度分布
  const lengthDistribution = {
    short: 0,      // < 20 字符（按钮）
    medium: 0,     // 20-100 字符（短消息）
    long: 0,       // 100-300 字符（完整说明）
    veryLong: 0,   // > 300 字符（长段落）
  };
  
  for (const item of uniqueExtracted) {
    if (item.length < 20) lengthDistribution.short++;
    else if (item.length < 100) lengthDistribution.medium++;
    else if (item.length < 300) lengthDistribution.long++;
    else lengthDistribution.veryLong++;
  }
  
  console.log('📏 长度分布:');
  console.log(`   - 短文本 (< 20 字): ${lengthDistribution.short} 个 (按钮)`);
  console.log(`   - 中等 (20-100 字): ${lengthDistribution.medium} 个 (短消息)`);
  console.log(`   - 长文本 (100-300 字): ${lengthDistribution.long} 个 (完整说明)`);
  console.log(`   - 超长 (> 300 字): ${lengthDistribution.veryLong} 个 (长段落)\n`);
  
  // 输出到 JSON
  const output = {
    meta: {
      extractedAt: new Date().toISOString(),
      totalFiles: scannedFiles.length,
      totalStrings: extracted.length,
      uniqueStrings: uniqueExtracted.length,
      scannedDirs: SCAN_DIRS,
      lengthDistribution,
    },
    strings: uniqueExtracted.sort((a, b) => b.length - a.length), // 按长度排序
    files: scannedFiles,
  };
  
  fs.writeFileSync(
    'i18n_extracted_complete.json',
    JSON.stringify(output, null, 2),
    'utf-8'
  );
  
  console.log('📄 输出文件:');
  console.log('   - i18n_extracted_complete.json');
  
  // 生成报告
  const report = `# i18n 提取报告（完整句子/段落）

**提取时间**: ${new Date().toISOString()}

## 统计

- **扫描文件**: ${scannedFiles.length} 个
- **提取字符串**: ${extracted.length} 个
- **去重后**: ${uniqueExtracted.length} 个
- **耗时**: ${duration} 秒

## 长度分布

- **短文本 (< 20 字)**: ${lengthDistribution.short} 个（按钮文字）
- **中等 (20-100 字)**: ${lengthDistribution.medium} 个（短消息）
- **长文本 (100-300 字)**: ${lengthDistribution.long} 个（完整说明）
- **超长 (> 300 字)**: ${lengthDistribution.veryLong} 个（长段落）

## 扫描目录

${SCAN_DIRS.map((dir) => `- \`${dir}\``).join('\n')}

## 提取原则

✅ **保持完整性**：一整个句子或段落作为一个 key
✅ **500 字以内都保持完整**
✅ **只有按钮文字可以单独提取**

## 下一步

使用 Cursor AI 生成语义化 keys（免费，使用月费额度）
`;
  
  fs.writeFileSync('I18N_EXTRACTION_REPORT.md', report, 'utf-8');
  console.log('   - I18N_EXTRACTION_REPORT.md\n');
  
  console.log('🎯 下一步: 使用 Cursor AI 审核和生成语义化 keys');
}

main();

