/**
 * Verify No Hardcoded Chinese
 * 验证是否还有硬编码中文
 */

import * as fs from 'fs';
import * as path from 'path';

const CHINESE_REGEX = /[\u4e00-\u9fa5]/;
const SCAN_DIRS = ['src/telegram/handlers', 'src/domain', 'src/services', 'src/utils', 'src/config'];

const found: Array<{file: string, line: number, text: string, context: string}> = [];

function checkFile(filePath: string) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNumber = i + 1;
    
    // 跳过注释
    if (line.trim().startsWith('//') || line.trim().startsWith('*') || line.trim().startsWith('/*')) {
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
    
    // 跳过 callback_data（业务逻辑）
    if (line.includes('callback_data:') && !CHINESE_REGEX.test(line)) {
      continue;
    }
    
    // 检查是否包含中文
    if (CHINESE_REGEX.test(line)) {
      // 提取中文字符串
      const matches = [
        ...Array.from(line.matchAll(/['"]([^'"]*[\u4e00-\u9fa5][^'"]*)['"]/g)),
        ...Array.from(line.matchAll(/`([^`]*[\u4e00-\u9fa5][^`]*)`/g)),
      ];
      
      for (const match of matches) {
        const text = match[1].trim();
        if (text.length > 2) {
          found.push({
            file: filePath,
            line: lineNumber,
            text: text.substring(0, 100),
            context: line.trim().substring(0, 80),
          });
        }
      }
    }
  }
}

function scanDirectory(dir: string) {
  if (!fs.existsSync(dir)) return;
  
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanDirectory(fullPath);
    } else if (entry.isFile() && entry.name.endsWith('.ts') && !entry.name.includes('.test.')) {
      checkFile(fullPath);
    }
  }
}

console.log('🔍 检查是否还有硬编码中文...\n');

for (const dir of SCAN_DIRS) {
  scanDirectory(dir);
}

console.log(`\n📊 检查结果:`);
console.log(`   - 发现硬编码中文: ${found.length} 处\n`);

if (found.length === 0) {
  console.log('✅ 完美！没有发现硬编码中文！\n');
} else {
  console.log('⚠️  发现以下硬编码中文:\n');
  
  // 按文件分组
  const byFile = new Map<string, typeof found>();
  for (const item of found) {
    const list = byFile.get(item.file) || [];
    list.push(item);
    byFile.set(item.file, list);
  }
  
  console.log(`涉及 ${byFile.size} 个文件:\n`);
  
  for (const [file, items] of Array.from(byFile.entries()).slice(0, 20)) {
    console.log(`📄 ${file} (${items.length} 处)`);
    for (const item of items.slice(0, 3)) {
      console.log(`   Line ${item.line}: ${item.text.substring(0, 60)}...`);
    }
    if (items.length > 3) {
      console.log(`   ... 还有 ${items.length - 3} 处`);
    }
    console.log();
  }
  
  if (byFile.size > 20) {
    console.log(`... 还有 ${byFile.size - 20} 个文件\n`);
  }
}

// 保存报告
fs.writeFileSync(
  'hardcoded_chinese_check.json',
  JSON.stringify({ found, total: found.length, files: Array.from(new Set(found.map(f => f.file))).length }, null, 2),
  'utf-8'
);

console.log('📄 详细报告: hardcoded_chinese_check.json');
