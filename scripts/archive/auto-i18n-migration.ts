/**
 * Automated i18n Migration Tool
 * 
 * This script uses AST parsing to automatically:
 * 1. Extract all hardcoded Chinese strings
 * 2. Generate i18n keys
 * 3. Replace strings with i18n.t() calls
 * 4. Export to CSV for translation
 * 
 * Based on industry best practices (Babel/TypeScript AST)
 */

import * as ts from 'typescript';
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

interface ExtractedString {
  file: string;
  line: number;
  column: number;
  text: string;
  key: string;
  replacement: string;
}

const HANDLERS_DIR = join(process.cwd(), 'src', 'telegram', 'handlers');
const extractedStrings: ExtractedString[] = [];
let keyCounter = 0;

/**
 * Check if string contains Chinese characters
 */
function containsChinese(text: string): boolean {
  return /[\u4e00-\u9fa5]/.test(text);
}

/**
 * Generate i18n key from Chinese text
 */
function generateKey(text: string, filename: string): string {
  // Remove file extension
  const baseName = filename.replace('.ts', '');
  
  // Extract meaningful words (first 3 Chinese characters)
  const chineseChars = text.match(/[\u4e00-\u9fa5]+/g);
  if (!chineseChars) return `${baseName}.text${++keyCounter}`;
  
  const firstChars = chineseChars[0].substring(0, 3);
  
  // Convert to pinyin-like key (simplified)
  const keyMap: Record<string, string> = {
    '用戶': 'user',
    '註冊': 'register',
    '登入': 'login',
    '錯誤': 'error',
    '成功': 'success',
    '失敗': 'failed',
    '請': 'please',
    '確認': 'confirm',
    '取消': 'cancel',
    '保存': 'save',
    '刪除': 'delete',
    '編輯': 'edit',
    '查看': 'view',
    '返回': 'back',
    '下一步': 'next',
    '上一步': 'prev',
    '完成': 'complete',
    '開始': 'start',
    '結束': 'end',
  };
  
  const keyPart = keyMap[firstChars] || `text${++keyCounter}`;
  return `${baseName}.${keyPart}`;
}

/**
 * Visit AST nodes and extract Chinese strings
 */
function visitNode(node: ts.Node, sourceFile: ts.SourceFile, filename: string) {
  if (ts.isStringLiteral(node)) {
    const text = node.text;
    
    if (containsChinese(text)) {
      const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
      
      // Skip if already using i18n
      const parent = node.parent;
      if (parent && ts.isCallExpression(parent)) {
        const expression = parent.expression;
        if (ts.isPropertyAccessExpression(expression) && 
            expression.name.text === 't') {
          return;
        }
      }
      
      const key = generateKey(text, filename);
      const replacement = `i18n.t('${key}')`;
      
      extractedStrings.push({
        file: filename,
        line: line + 1,
        column: character + 1,
        text,
        key,
        replacement,
      });
    }
  }
  
  ts.forEachChild(node, (child) => visitNode(child, sourceFile, filename));
}

/**
 * Process a single file
 */
function processFile(filename: string): void {
  const filePath = join(HANDLERS_DIR, filename);
  const content = readFileSync(filePath, 'utf-8');
  
  const sourceFile = ts.createSourceFile(
    filename,
    content,
    ts.ScriptTarget.Latest,
    true
  );
  
  visitNode(sourceFile, sourceFile, filename);
}

/**
 * Generate replacement script
 */
function generateReplacementScript(): string {
  let script = '#!/bin/bash\n\n';
  script += '# Auto-generated i18n replacement script\n';
  script += '# This script replaces hardcoded Chinese strings with i18n.t() calls\n\n';
  
  // Group by file
  const byFile = extractedStrings.reduce((acc, str) => {
    if (!acc[str.file]) {
      acc[str.file] = [];
    }
    acc[str.file].push(str);
    return acc;
  }, {} as Record<string, ExtractedString[]>);
  
  for (const [file, strings] of Object.entries(byFile)) {
    script += `echo "Processing ${file}..."\n`;
    
    for (const str of strings) {
      // Escape special characters for sed
      const escaped = str.text
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "\\'")
        .replace(/"/g, '\\"')
        .replace(/\//g, '\\/')
        .replace(/\n/g, '\\n');
      
      script += `sed -i.bak "s/'${escaped}'/${str.replacement}/g" "src/telegram/handlers/${file}"\n`;
    }
    
    script += '\n';
  }
  
  return script;
}

/**
 * Export to CSV
 */
function exportToCSV(): void {
  const csvPath = join(process.cwd(), 'i18n_extracted.csv');
  
  let csv = 'key,zh-TW,zh-CN,en\n';
  
  // Deduplicate by key
  const uniqueStrings = new Map<string, string>();
  for (const str of extractedStrings) {
    if (!uniqueStrings.has(str.key)) {
      uniqueStrings.set(str.key, str.text);
    }
  }
  
  for (const [key, text] of uniqueStrings) {
    // Escape CSV special characters
    const escapedText = text.replace(/"/g, '""');
    csv += `"${key}","${escapedText}","",""\n`;
  }
  
  writeFileSync(csvPath, csv, 'utf-8');
  console.log(`\n✅ Exported ${uniqueStrings.size} unique strings to: i18n_extracted.csv`);
}

/**
 * Main execution
 */
console.log('🚀 Starting automated i18n migration...\n');
console.log('📖 Using TypeScript AST parser (industry best practice)\n');

const files = readdirSync(HANDLERS_DIR).filter(f => f.endsWith('.ts'));

for (const file of files) {
  console.log(`📄 Processing ${file}...`);
  processFile(file);
}

console.log(`\n📊 Summary:`);
console.log(`  Total files processed: ${files.length}`);
console.log(`  Total strings extracted: ${extractedStrings.length}`);
console.log(`  Unique keys generated: ${new Set(extractedStrings.map(s => s.key)).size}`);

// Generate outputs
const scriptPath = join(process.cwd(), 'scripts', 'apply-i18n-replacements.sh');
const script = generateReplacementScript();
writeFileSync(scriptPath, script, 'utf-8');
console.log(`\n✅ Generated replacement script: scripts/apply-i18n-replacements.sh`);

exportToCSV();

// Generate summary report
const reportPath = join(process.cwd(), 'I18N_MIGRATION_REPORT.md');
let report = '# i18n Migration Report\n\n';
report += `## Summary\n\n`;
report += `- **Total files**: ${files.length}\n`;
report += `- **Total strings**: ${extractedStrings.length}\n`;
report += `- **Unique keys**: ${new Set(extractedStrings.map(s => s.key)).size}\n\n`;
report += `## Top 10 Files\n\n`;

const byFile = extractedStrings.reduce((acc, str) => {
  acc[str.file] = (acc[str.file] || 0) + 1;
  return acc;
}, {} as Record<string, number>);

const sorted = Object.entries(byFile).sort((a, b) => b[1] - a[1]).slice(0, 10);
for (const [file, count] of sorted) {
  report += `- ${file}: ${count} strings\n`;
}

report += `\n## Next Steps\n\n`;
report += `1. Review \`i18n_extracted.csv\`\n`;
report += `2. Add missing translations\n`;
report += `3. Run \`bash scripts/apply-i18n-replacements.sh\`\n`;
report += `4. Test all pages\n`;
report += `5. Deploy\n`;

writeFileSync(reportPath, report, 'utf-8');
console.log(`✅ Generated report: I18N_MIGRATION_REPORT.md`);

console.log(`\n🎉 Migration preparation complete!`);
console.log(`\n📋 Next steps:`);
console.log(`   1. Review i18n_extracted.csv`);
console.log(`   2. Translate the strings`);
console.log(`   3. Run: bash scripts/apply-i18n-replacements.sh`);
console.log(`   4. Test and deploy`);

