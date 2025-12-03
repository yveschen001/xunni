/**
 * i18n Clean Extraction Script
 * 使用 AST 提取所有硬编码中文字符串
 */

import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';

interface ExtractedString {
  text: string;
  file: string;
  line: number;
  context: string; // 上下文（函数名、变量名等）
  type: 'string' | 'template'; // 字符串类型
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
 * 获取节点的上下文信息
 */
function getContext(node: ts.Node, sourceFile: ts.SourceFile): string {
  let current: ts.Node | undefined = node;
  
  while (current) {
    // 函数声明
    if (ts.isFunctionDeclaration(current) && current.name) {
      return `function ${current.name.text}`;
    }
    // 箭头函数赋值
    if (ts.isVariableDeclaration(current) && current.name) {
      return `const ${current.name.getText(sourceFile)}`;
    }
    // 方法
    if (ts.isMethodDeclaration(current) && current.name) {
      return `method ${current.name.getText(sourceFile)}`;
    }
    current = current.parent;
  }
  
  return 'unknown';
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
      const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
      extracted.push({
        text,
        file: sourceFile.fileName,
        line: line + 1,
        context: getContext(node, sourceFile),
        type: 'string',
      });
    }
  }
  
  // 模板字符串
  if (ts.isTemplateExpression(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    const text = node.getText(sourceFile);
    if (CHINESE_REGEX.test(text)) {
      const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
      extracted.push({
        text,
        file: sourceFile.fileName,
        line: line + 1,
        context: getContext(node, sourceFile),
        type: 'template',
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
      // 检查是否应该跳过
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
  console.log('🔍 开始扫描中文字符串...\n');
  
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
  
  // 去重
  const uniqueTexts = new Set<string>();
  const uniqueExtracted: ExtractedString[] = [];
  
  for (const item of extracted) {
    if (!uniqueTexts.has(item.text)) {
      uniqueTexts.add(item.text);
      uniqueExtracted.push(item);
    }
  }
  
  console.log(`   - 去重后: ${uniqueExtracted.length} 个\n`);
  
  // 输出到 JSON
  const output = {
    meta: {
      extractedAt: new Date().toISOString(),
      totalFiles: scannedFiles.length,
      totalStrings: extracted.length,
      uniqueStrings: uniqueExtracted.length,
      scannedDirs: SCAN_DIRS,
    },
    strings: uniqueExtracted,
    files: scannedFiles,
  };
  
  fs.writeFileSync(
    'i18n_extracted_clean.json',
    JSON.stringify(output, null, 2),
    'utf-8'
  );
  
  console.log('📄 输出文件:');
  console.log('   - i18n_extracted_clean.json');
  
  // 生成扫描报告
  const report = `# i18n 提取报告

**提取时间**: ${new Date().toISOString()}

## 统计

- **扫描文件**: ${scannedFiles.length} 个
- **提取字符串**: ${extracted.length} 个
- **去重后**: ${uniqueExtracted.length} 个
- **耗时**: ${duration} 秒

## 扫描目录

${SCAN_DIRS.map((dir) => `- \`${dir}\``).join('\n')}

## 扫描的文件

${scannedFiles.map((file) => `- ${file}`).join('\n')}

## 下一步

1. 运行 \`npx tsx scripts/generate-semantic-keys.ts\` 生成语义化 key
2. 运行 \`npx tsx scripts/ai-review-i18n-keys.ts\` 进行 AI 审核
`;
  
  fs.writeFileSync('I18N_EXTRACTION_REPORT.md', report, 'utf-8');
  console.log('   - I18N_EXTRACTION_REPORT.md\n');
  
  console.log('🎯 下一步: 运行 `npx tsx scripts/generate-semantic-keys.ts`');
}

main();

