/**
 * Apply i18n Replacements
 * 应用 i18n 替换到代码
 */

import * as fs from 'fs';
import * as path from 'path';

interface KeyMapping {
  original: string;
  key: string;
  category: string;
  confidence: number;
  file: string;
  line: number;
}

const mappings: KeyMapping[] = JSON.parse(
  fs.readFileSync('i18n_keys_mapping_fixed.json', 'utf-8')
);

console.log('🔄 开始应用 i18n 替换...\n');
console.log(`📊 总共 ${mappings.length} 个替换\n`);

// 按文件分组
const byFile = new Map<string, KeyMapping[]>();
for (const mapping of mappings) {
  const list = byFile.get(mapping.file) || [];
  list.push(mapping);
  byFile.set(mapping.file, list);
}

console.log(`📂 涉及 ${byFile.size} 个文件\n`);

let totalReplacements = 0;
let filesModified = 0;

// 处理每个文件
for (const [filePath, fileMappings] of byFile.entries()) {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  文件不存在: ${filePath}`);
    continue;
  }
  
  let content = fs.readFileSync(filePath, 'utf-8');
  let modified = false;
  let replacements = 0;
  
  // 按原始文本长度排序（从长到短，避免短文本被误替换）
  const sorted = fileMappings.sort((a, b) => b.original.length - a.original.length);
  
  for (const mapping of sorted) {
    const { original, key } = mapping;
    
    // 转义特殊字符
    const escaped = original
      .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      .replace(/\n/g, '\\n');
    
    // 创建正则表达式（匹配字符串字面量中的内容）
    const patterns = [
      new RegExp(`(['"\`])${escaped}\\1`, 'g'),
      new RegExp(`(['"\`])${escaped}\\n\\1`, 'g'),
    ];
    
    for (const pattern of patterns) {
      if (pattern.test(content)) {
        // 替换为 i18n.t() 调用
        content = content.replace(pattern, `i18n.t('${key}')`);
        replacements++;
        modified = true;
      }
    }
  }
  
  if (modified) {
    // 确保文件有 i18n import
    if (!content.includes('import') || !content.includes('i18n')) {
      // 在文件开头添加 import
      const lines = content.split('\n');
      let insertIndex = 0;
      
      // 找到最后一个 import 语句
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim().startsWith('import ')) {
          insertIndex = i + 1;
        }
      }
      
      lines.splice(insertIndex, 0, "import { createI18n } from '~/i18n';");
      content = lines.join('\n');
    }
    
    fs.writeFileSync(filePath, content, 'utf-8');
    filesModified++;
    totalReplacements += replacements;
    console.log(`✓ ${filePath}: ${replacements} 个替换`);
  }
}

console.log(`\n✅ 替换完成！`);
console.log(`📊 统计:`);
console.log(`   - 修改文件: ${filesModified} 个`);
console.log(`   - 总替换数: ${totalReplacements} 个`);
console.log(`\n⚠️  注意: 这只是一个简化版本`);
console.log(`   实际替换需要更复杂的 AST 操作`);
console.log(`   建议手动检查关键文件`);

