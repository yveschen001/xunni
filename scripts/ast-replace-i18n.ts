/**
 * AST 替换工具
 * 使用 TypeScript Compiler API 精确替换硬编码中文为 i18n.t()
 */

import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';

interface Replacement {
  original: string;
  key: string;
  file: string;
  line: number;
}

// 加载映射表
function loadMappings(): Map<string, string> {
  const mappingFile = 'i18n_keys_mapping_fixed.json';
  if (!fs.existsSync(mappingFile)) {
    console.error(`❌ 找不到映射文件: ${mappingFile}`);
    process.exit(1);
  }

  const content = fs.readFileSync(mappingFile, 'utf-8');
  const data = JSON.parse(content);
  const mappings = new Map<string, string>();

  // 根据实际文件结构解析
  if (Array.isArray(data)) {
    for (const item of data) {
      if (item.original && item.key) {
        mappings.set(item.original, item.key);
      }
    }
  } else if (typeof data === 'object') {
    // 如果是对象，遍历所有属性
    for (const [original, key] of Object.entries(data)) {
      if (typeof key === 'string') {
        mappings.set(original, key);
      }
    }
  }

  console.log(`✅ 已加载 ${mappings.size} 个映射`);
  return mappings;
}

// 获取所有需要处理的文件
function getAllTsFiles(dir: string, fileList: string[] = []): string[] {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (!['node_modules', '.git', 'dist', 'build', 'tests'].includes(file)) {
        getAllTsFiles(filePath, fileList);
      }
    } else if (file.endsWith('.ts') && !file.endsWith('.test.ts') && !file.endsWith('.spec.ts')) {
      fileList.push(filePath);
    }
  }
  
  return fileList;
}

// 替换文件中的硬编码
function replaceInFile(filePath: string, mappings: Map<string, string>): { replaced: number; errors: string[] } {
  let replaced = 0;
  const errors: string[] = [];
  
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const sourceFile = ts.createSourceFile(
      filePath,
      content,
      ts.ScriptTarget.Latest,
      true
    );

    const replacements: Array<{ start: number; end: number; key: string }> = [];

    // 遍历 AST 查找字符串字面量
    function visit(node: ts.Node) {
      if (ts.isStringLiteral(node) || ts.isTemplateExpression(node)) {
        const text = node.getText(sourceFile);
        const cleanText = text.replace(/^['"`]|['"`]$/g, '').replace(/\\n/g, '\n');
        
        // 检查是否在映射表中
        if (mappings.has(cleanText)) {
          const key = mappings.get(cleanText)!;
          const start = node.getStart(sourceFile);
          const end = node.getEnd();
          
          // 检查是否已经在 i18n.t() 调用中
          const parent = node.parent;
          if (parent && ts.isCallExpression(parent) && 
              ts.isPropertyAccessExpression(parent.expression) &&
              parent.expression.name.text === 't') {
            // 已经在 i18n.t() 中，跳过
            return;
          }
          
          replacements.push({ start, end, key });
        }
      }
      
      ts.forEachChild(node, visit);
    }

    visit(sourceFile);

    // 从后往前替换（避免位置偏移）
    let newContent = content;
    for (let i = replacements.length - 1; i >= 0; i--) {
      const { start, end, key } = replacements[i];
      const before = newContent.substring(0, start);
      const after = newContent.substring(end);
      
      // 检查是否需要添加 i18n 实例
      const needsI18n = !before.includes('i18n.t(') && !before.includes('const i18n');
      
      if (needsI18n) {
        // 简单替换：直接替换为 i18n.t('key')
        // 注意：这里需要更智能的处理，确保 i18n 实例存在
        newContent = before + `i18n.t('${key}')` + after;
      } else {
        newContent = before + `i18n.t('${key}')` + after;
      }
      
      replaced++;
    }

    // 确保文件有 i18n import
    if (replaced > 0 && !newContent.includes("import { createI18n }")) {
      // 找到最后一个 import
      const lastImportMatch = newContent.match(/^import .* from .*;$/gm);
      if (lastImportMatch) {
        const lastImport = lastImportMatch[lastImportMatch.length - 1];
        const lastImportIndex = newContent.lastIndexOf(lastImport);
        const insertIndex = lastImportIndex + lastImport.length;
        newContent = newContent.substring(0, insertIndex) + 
          "\nimport { createI18n } from '~/i18n';" + 
          newContent.substring(insertIndex);
      } else {
        // 没有 import，在文件开头添加
        newContent = "import { createI18n } from '~/i18n';\n" + newContent;
      }
    }

    // 写回文件
    if (replaced > 0) {
      fs.writeFileSync(filePath, newContent, 'utf-8');
    }

  } catch (error) {
    errors.push(`${filePath}: ${error}`);
  }

  return { replaced, errors };
}

async function main() {
  console.log('🔄 开始 AST 替换...\n');

  // 加载映射表
  const mappings = loadMappings();
  if (mappings.size === 0) {
    console.error('❌ 映射表为空');
    process.exit(1);
  }

  // 获取所有文件
  const files = getAllTsFiles('src');
  console.log(`📂 找到 ${files.length} 个文件\n`);

  let totalReplaced = 0;
  const allErrors: string[] = [];

  // 处理每个文件
  for (const file of files) {
    const { replaced, errors } = replaceInFile(file, mappings);
    if (replaced > 0) {
      console.log(`✅ ${file}: 替换了 ${replaced} 处`);
      totalReplaced += replaced;
    }
    allErrors.push(...errors);
  }

  console.log(`\n✅ 完成！总共替换了 ${totalReplaced} 处`);
  
  if (allErrors.length > 0) {
    console.log(`\n⚠️  有 ${allErrors.length} 个错误：`);
    allErrors.forEach(err => console.error(`  - ${err}`));
  }
}

main().catch(console.error);

