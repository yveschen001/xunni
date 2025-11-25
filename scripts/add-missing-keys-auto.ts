/**
 * 自动添加缺失的 i18n keys 到 CSV 和 zh-TW.ts
 * 
 * 从代码中提取缺失的 keys，自动添加到：
 * 1. src/i18n/locales/zh-TW.ts
 * 2. i18n_for_translation.csv
 */

import * as fs from 'fs';
import * as path from 'path';

interface MissingKey {
  key: string;
  namespace: string;
  suggestedTranslation: string;
}

/**
 * 从代码中提取缺失的 keys 及其上下文
 */
async function extractMissingKeys(): Promise<MissingKey[]> {
  const missingKeys: MissingKey[] = [];
  const srcDir = path.join(process.cwd(), 'src');
  
  // 先运行检查脚本获取缺失的 keys
  const { execSync } = await import('child_process');
  let missingKeysList: string[] = [];
  
  try {
    const output = execSync('pnpm check:i18n', { encoding: 'utf-8', cwd: process.cwd() });
    const lines = output.split('\n');
    let inMissingSection = false;
    
    for (const line of lines) {
      if (line.includes('發現') && line.includes('個 i18n keys')) {
        inMissingSection = true;
        continue;
      }
      if (inMissingSection && line.trim().startsWith('-')) {
        const key = line.trim().replace(/^-\s*/, '');
        if (key && !key.includes('還有')) {
          missingKeysList.push(key);
        }
      }
      if (inMissingSection && line.trim() === '') {
        // 跳过空行，继续收集
      }
    }
  } catch (error) {
    console.error('无法运行检查脚本，尝试直接提取...');
  }
  
  // 如果检查脚本失败，直接从代码中提取所有使用的 keys
  if (missingKeysList.length === 0) {
    const codeKeys = new Set<string>();
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
              codeKeys.add(match[1]);
            }
          } catch (error) {
            // 忽略错误
          }
        }
      }
    }
    scanDirectory(srcDir);
    missingKeysList = Array.from(codeKeys);
  }
  
  // 提取 CSV 中的 keys
  const csvPath = path.join(process.cwd(), 'i18n_for_translation.csv');
  const csvKeys = new Set<string>();
  if (fs.existsSync(csvPath)) {
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.split('\n');
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line) {
        const key = line.split(',')[0];
        if (key) {
          csvKeys.add(key);
        }
      }
    }
  }
  
  // 找出缺失的 keys
  const missing: string[] = [];
  for (const key of missingKeysList) {
    if (!csvKeys.has(key)) {
      missing.push(key);
    }
  }
  
  // 为每个缺失的 key 推测翻译
  for (const key of missing) {
    const namespace = key.split('.')[0];
    const translation = suggestTranslation(key, srcDir);
    missingKeys.push({
      key,
      namespace,
      suggestedTranslation: translation,
    });
  }
  
  return missingKeys;
}

/**
 * 从代码中提取 key 的上下文，推测翻译
 */
function suggestTranslation(key: string, srcDir: string): string {
  // 尝试从代码中找到使用这个 key 的地方，提取上下文
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
                // 查找同一行的注释
                const lineMatch = lines[i].match(/\/\/\s*([^\n]+)/);
                if (lineMatch && /[\u4e00-\u9fa5]/.test(lineMatch[1])) {
                  return lineMatch[1].trim();
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
    'notRegistered': '未注册',
    'systemError': '系统错误',
    'male': '男',
    'female': '女',
    'backToMainMenu': '返回主选单',
    'banUsageError': '使用方式错误',
    'cannotBanAdmin': '无法封禁管理员',
    'banUserNotFound': '用户不存在',
    'unbanUsageError': '解封使用方式错误',
    'unbanUserNotFound': '解封用户不存在',
    'unbanNotBanned': '用户未被封禁',
    'onlyAdmin': '仅管理员可用',
    'onlySuperAdmin': '仅超级管理员可用',
    'listNotRegistered': '未注册',
    'listRoleAdmin': '管理员',
    'listRoleSuperAdmin': '超级管理员',
    'listTitle': '管理员列表',
    'listFooter': '---',
    'conversationError': '对话创建失败',
    'bottle5': '使用 /catch 捡新的漂流瓶',
    'bottle': '目前没有适合你的漂流瓶',
    'bottle2': '或者自己丢一个瓶子：/throw',
    'bottle4': '🎣 有人捡到你的漂流瓶了！',
    'short3': '匿名用户',
    'settings10': '未设定',
    'replyMethods': '💡 **两种回复方式**：',
    'message5': '• 直接发送消息回复',
    'message4': '• 点击「💬 回复消息」按钮',
    'catch': '今日已捡：${newCatchesCount}/${quota} 个',
    'safetyTips': '💡 安全提示：',
    'conversation2': '💬 对话标识符：${conversationIdentifier}',
    'report': '• 如有不当内容可使用 /report 举报',
    'block': '• 不想再聊可使用 /block 封锁',
    'replyButton': '💬 回复消息',
    'conversation3': '💬 查看所有对话',
    'quotaExhausted': '今日配额已用完：${quotaDisplay}',
    'nickname': '👤 昵称：${ownerMaskedNickname}',
    'nickname2': '👤 昵称：${catcherNickname}',
    'settings': '🧠 MBTI：${bottle.mbti_result}',
    'language': '🗣️ 语言：${language}',
    'mbti': '🧠 MBTI：${mbti}',
    'message2': '👤 性别：${catcherGender} | 年龄：${catcherAge}',
    'message': '💝 匹配度：${matchScore}%',
    'unknown': '未知',
    'short4': '♂️ 男',
    'short5': '♀️ 女',
    'bottle13': '瓶子内容',
    'aiModerationFailed': 'AI 内容审核失败',
  };
  
  if (commonMappings[lastPart]) {
    return commonMappings[lastPart];
  }
  
  // 默认返回 key 本身（需要手动翻译）
  return `[需要翻译: ${key}]`;
}

/**
 * 添加 key 到 zh-TW.ts
 */
function addKeyToZhTW(key: string, translation: string): void {
  const zhTWPath = path.join(process.cwd(), 'src', 'i18n', 'locales', 'zh-TW.ts');
  const content = fs.readFileSync(zhTWPath, 'utf-8');
  
  // 解析 key 的路径（如 'admin.banUsageError' -> ['admin', 'banUsageError']）
  // 注意：有些 key 是扁平化的，如 'catch.anonymousUser' 在 bottle 命名空间下
  const parts = key.split('.');
  const namespace = parts[0];
  const keyName = parts.slice(1).join('.');
  
  // 特殊处理：catch.* 在 bottle 命名空间下
  let actualNamespace = namespace;
  let actualKeyName = key;
  if (namespace === 'catch') {
    actualNamespace = 'bottle';
    actualKeyName = key; // 保持完整 key，如 'catch.anonymousUser'
  }
  
  // 查找命名空间的位置
  const namespaceRegex = new RegExp(`^\\s*${actualNamespace}:\\s*\\{`, 'm');
  const namespaceMatch = content.match(namespaceRegex);
  
  if (!namespaceMatch) {
    console.error(`❌ 无法找到命名空间 ${actualNamespace} 在 zh-TW.ts 中`);
    return;
  }
  
  const namespaceStart = namespaceMatch.index!;
  // 找到命名空间的结束位置（匹配对应的 }）
  let braceCount = 1;
  let namespaceEnd = namespaceStart;
  for (let i = namespaceStart + namespaceMatch[0].length; i < content.length; i++) {
    if (content[i] === '{') braceCount++;
    if (content[i] === '}') braceCount--;
    if (braceCount === 0) {
      namespaceEnd = i;
      break;
    }
  }
  
  // 检查 key 是否已存在（支持扁平化 key，如 'catch.anonymousUser'）
  const namespaceContent = content.substring(namespaceStart, namespaceEnd);
  const keyPattern = namespace === 'catch' 
    ? `'${actualKeyName}'` 
    : `${keyName}:`;
  if (namespaceContent.includes(keyPattern)) {
    console.log(`  ⚠️  ${key} 已存在于 zh-TW.ts，跳过`);
    return;
  }
  
  // 在命名空间结束前插入新 key
  const indent = '    ';
  // 对于扁平化 key，使用字符串 key 格式
  const newProperty = namespace === 'catch'
    ? `${indent}'${actualKeyName}': \`${translation}\`,\n`
    : `${indent}${keyName}: \`${translation}\`,\n`;
  
  // 在最后一个 } 之前插入
  const newContent = 
    content.slice(0, namespaceEnd) + 
    newProperty + 
    content.slice(namespaceEnd);
  
  fs.writeFileSync(zhTWPath, newContent, 'utf-8');
  console.log(`  ✅ 已添加 ${key} 到 zh-TW.ts`);
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
  
  // 检查是否已存在
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line) {
      const existingKey = line.split(',')[0];
      if (existingKey === key) {
        console.log(`  ⚠️  ${key} 已存在于 CSV，跳过`);
        return;
      }
    }
  }
  
  lines.splice(insertIndex, 0, newRow);
  fs.writeFileSync(csvPath, lines.join('\n'), 'utf-8');
  console.log(`  ✅ 已添加 ${key} 到 CSV`);
}

/**
 * 主函数
 */
async function main() {
  console.log('🔍 开始自动添加缺失的 i18n keys...\n');
  
  // 1. 提取缺失的 keys
  console.log('📊 提取缺失的 keys...');
  const missing = await extractMissingKeys();
  
  if (missing.length === 0) {
    console.log('✅ 所有 keys 都在 CSV 中！\n');
    return;
  }
  
  console.log(`⚠️  发现 ${missing.length} 个缺失的 keys\n`);
  
  // 2. 按命名空间分组
  const byNamespace = new Map<string, MissingKey[]>();
  for (const item of missing) {
    if (!byNamespace.has(item.namespace)) {
      byNamespace.set(item.namespace, []);
    }
    byNamespace.get(item.namespace)!.push(item);
  }
  
  console.log('📋 按命名空间分组：\n');
  for (const [namespace, keys] of Array.from(byNamespace.entries()).sort()) {
    console.log(`  ${namespace}: ${keys.length} 个`);
  }
  console.log('');
  
  // 3. 为每个 key 添加翻译并添加到文件
  console.log('🔧 开始添加 keys...\n');
  let addedZhTW = 0;
  let addedCSV = 0;
  let skipped = 0;
  
  for (const item of missing.sort((a, b) => a.key.localeCompare(b.key))) {
    try {
      console.log(`处理 ${item.key}: ${item.suggestedTranslation}`);
      
      addKeyToZhTW(item.key, item.suggestedTranslation);
      addedZhTW++;
      
      addKeyToCSV(item.key, item.suggestedTranslation);
      addedCSV++;
      
      console.log('');
    } catch (error) {
      console.error(`  ❌ 添加 ${item.key} 失败:`, error);
      skipped++;
    }
  }
  
  console.log(`\n✅ 完成！`);
  console.log(`  - 已添加 ${addedZhTW} 个 keys 到 zh-TW.ts`);
  console.log(`  - 已添加 ${addedCSV} 个 keys 到 CSV`);
  if (skipped > 0) {
    console.log(`  - 跳过 ${skipped} 个 keys（已存在或错误）`);
  }
  console.log('');
}

main().catch(console.error);

