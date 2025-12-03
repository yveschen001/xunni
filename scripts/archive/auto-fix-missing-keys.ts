/**
 * 自动添加缺失的 i18n keys 到 CSV 和 zh-TW.ts
 * 
 * 从代码中提取缺失的 keys，自动添加到：
 * 1. i18n_for_translation.csv
 * 2. src/i18n/locales/zh-TW.ts
 */

import * as fs from 'fs';
import * as path from 'path';

interface MissingKey {
  key: string;
  namespace: string;
  suggestedTranslation: string;
}

/**
 * 提取代码中使用的所有 i18n keys
 */
function extractCodeKeys(): Set<string> {
  const keys = new Set<string>();
  const srcDir = path.join(process.cwd(), 'src');
  
  function scanDirectory(dir: string) {
    const entries = fs.readdirSync(dir);
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        if (entry !== 'node_modules' && !entry.includes('test')) {
          scanDirectory(fullPath);
        }
      } else if (entry.endsWith('.ts') && !entry.endsWith('.test.ts')) {
        try {
          const content = fs.readFileSync(fullPath, 'utf-8');
          const matches = content.matchAll(/i18n\.t\(['"]([^'"]+)['"]\)/g);
          for (const match of matches) {
            keys.add(match[1]);
          }
        } catch (error) {
          // 忽略错误
        }
      }
    }
  }
  
  scanDirectory(srcDir);
  return keys;
}

/**
 * 提取 CSV 中的所有 keys
 */
function extractCSVKeys(): Set<string> {
  const csvPath = path.join(process.cwd(), 'i18n_for_translation.csv');
  if (!fs.existsSync(csvPath)) {
    return new Set();
  }
  
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const keys = new Set<string>();
  const lines = csvContent.split('\n');
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line) {
      const key = line.split(',')[0];
      if (key) {
        keys.add(key);
      }
    }
  }
  
  return keys;
}

/**
 * 从代码中提取 key 的上下文，推测翻译
 */
function suggestTranslation(key: string, codeKeys: Set<string>): string {
  // 尝试从代码中找到使用这个 key 的地方，提取上下文
  const srcDir = path.join(process.cwd(), 'src');
  
  function findKeyUsage(dir: string): string | null {
    const entries = fs.readdirSync(dir);
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        if (entry !== 'node_modules' && !entry.includes('test')) {
          const result = findKeyUsage(fullPath);
          if (result) return result;
        }
      } else if (entry.endsWith('.ts') && !entry.endsWith('.test.ts')) {
        try {
          const content = fs.readFileSync(fullPath, 'utf-8');
          const regex = new RegExp(`i18n\\.t\\(['"]${key.replace(/\./g, '\\.')}['"]\\)`, 'g');
          if (regex.test(content)) {
            // 尝试找到附近的注释或上下文
            const lines = content.split('\n');
            for (let i = 0; i < lines.length; i++) {
              if (lines[i].includes(key)) {
                // 查找前几行的注释
                for (let j = Math.max(0, i - 5); j < i; j++) {
                  if (lines[j].trim().startsWith('//')) {
                    const comment = lines[j].trim().replace(/^\/\/\s*/, '');
                    if (/[\u4e00-\u9fa5]/.test(comment)) {
                      return comment;
                    }
                  }
                }
              }
            }
          }
        } catch (error) {
          // 忽略错误
        }
      }
    }
    return null;
  }
  
  const context = findKeyUsage(srcDir);
  if (context) {
    return context;
  }
  
  // 如果没有找到上下文，根据 key 的命名推测
  const parts = key.split('.');
  const lastPart = parts[parts.length - 1];
  
  // 简单的命名到中文映射（可以根据需要扩展）
  const commonMappings: Record<string, string> = {
    'cancel': '取消',
    'back': '返回',
    'confirm': '确认',
    'error': '错误',
    'success': '成功',
    'loading': '加载中',
    'notFound': '未找到',
    'notSet': '未设定',
    'anonymousUser': '匿名用户',
    'banned': '已封禁',
    'block': '封锁',
    'report': '举报',
  };
  
  if (commonMappings[lastPart]) {
    return commonMappings[lastPart];
  }
  
  // 默认返回 key 本身（需要手动翻译）
  return `[需要翻译: ${key}]`;
}

/**
 * 添加 key 到 CSV
 */
function addKeyToCSV(key: string, translation: string): void {
  const csvPath = path.join(process.cwd(), 'i18n_for_translation.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = csvContent.split('\n');
  
  // 获取标题行，确定列数
  const header = lines[0];
  const columnCount = header.split(',').length;
  
  // 构建新行：key,zh-TW,zh-CN,en,...（其他列为空）
  const newRow = [key, translation, '', '', ...Array(columnCount - 4).fill('')].join(',');
  
  // 按命名空间排序插入
  const namespace = key.split('.')[0];
  let insertIndex = lines.length;
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line) {
      const existingKey = line.split(',')[0];
      const existingNamespace = existingKey.split('.')[0];
      
      if (existingNamespace > namespace) {
        insertIndex = i;
        break;
      } else if (existingNamespace === namespace) {
        if (existingKey > key) {
          insertIndex = i;
          break;
        }
      }
    }
  }
  
  lines.splice(insertIndex, 0, newRow);
  fs.writeFileSync(csvPath, lines.join('\n'), 'utf-8');
}

/**
 * 添加 key 到 zh-TW.ts
 */
function addKeyToZhTW(key: string, translation: string): void {
  const zhTWPath = path.join(process.cwd(), 'src', 'i18n', 'locales', 'zh-TW.ts');
  const content = fs.readFileSync(zhTWPath, 'utf-8');
  
  // 解析 key 的路径（如 'admin.banUsageError' -> ['admin', 'banUsageError']）
  const parts = key.split('.');
  
  // 简单的添加逻辑：在文件末尾添加
  // 注意：这是一个简化版本，实际应该解析 TypeScript 对象结构
  // 为了安全，我们只在文件末尾的 translations 对象中添加
  
  // 查找 translations 对象的结束位置
  const lastBraceIndex = content.lastIndexOf('};');
  if (lastBraceIndex === -1) {
    console.error('❌ 无法找到 translations 对象的结束位置');
    return;
  }
  
  // 构建新的属性（简化版本，假设是扁平结构）
  // 实际应该根据命名空间嵌套结构添加
  const indent = '  ';
  const newProperty = `${indent}${key}: \`${translation}\`,\n`;
  
  // 在最后一个 } 之前插入
  const newContent = 
    content.slice(0, lastBraceIndex) + 
    newProperty + 
    content.slice(lastBraceIndex);
  
  fs.writeFileSync(zhTWPath, newContent, 'utf-8');
}

/**
 * 主函数
 */
function main() {
  console.log('🔍 开始自动添加缺失的 i18n keys...\n');
  
  // 1. 提取代码中的 keys
  console.log('📊 提取代码中使用的 keys...');
  const codeKeys = extractCodeKeys();
  console.log(`   找到 ${codeKeys.size} 个 keys\n`);
  
  // 2. 提取 CSV 中的 keys
  console.log('📊 提取 CSV 中的 keys...');
  const csvKeys = extractCSVKeys();
  console.log(`   找到 ${csvKeys.size} 个 keys\n`);
  
  // 3. 找出缺失的 keys
  const missing: string[] = [];
  for (const key of codeKeys) {
    if (!csvKeys.has(key)) {
      missing.push(key);
    }
  }
  
  if (missing.length === 0) {
    console.log('✅ 所有 keys 都在 CSV 中！\n');
    return;
  }
  
  console.log(`⚠️  发现 ${missing.length} 个缺失的 keys\n`);
  
  // 4. 按命名空间分组
  const byNamespace = new Map<string, string[]>();
  for (const key of missing) {
    const namespace = key.split('.')[0];
    if (!byNamespace.has(namespace)) {
      byNamespace.set(namespace, []);
    }
    byNamespace.get(namespace)!.push(key);
  }
  
  console.log('📋 按命名空间分组：\n');
  for (const [namespace, keys] of Array.from(byNamespace.entries()).sort()) {
    console.log(`  ${namespace}: ${keys.length} 个`);
  }
  console.log('');
  
  // 5. 为每个 key 推测翻译并添加
  console.log('🔧 开始添加 keys...\n');
  let added = 0;
  
  for (const key of missing.sort()) {
    try {
      const translation = suggestTranslation(key, codeKeys);
      console.log(`  ${key}: ${translation}`);
      
      addKeyToCSV(key, translation);
      // 注意：addKeyToZhTW 需要更复杂的解析，暂时跳过
      // addKeyToZhTW(key, translation);
      
      added++;
    } catch (error) {
      console.error(`  ❌ 添加 ${key} 失败:`, error);
    }
  }
  
  console.log(`\n✅ 已添加 ${added}/${missing.length} 个 keys 到 CSV`);
  console.log('⚠️  注意：zh-TW.ts 需要手动更新（或使用更复杂的解析工具）\n');
}

main();

