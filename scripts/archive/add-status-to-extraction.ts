/**
 * 为现有提取结果添加 status 字段
 * 
 * 分析当前代码状态，标记：
 * - extracted: 已提取但未替换
 * - replaced: 已替换（通过检查代码中是否有 i18n.t()）
 * - pending: 待处理
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

interface ExtractedContent {
  text: string;
  file: string;
  line: number;
  type: string;
  context?: string;
  category?: string;
  length?: number;
  originalLength?: number;
  partIndex?: number;
  status?: 'extracted' | 'replaced' | 'pending';
  key?: string;
}

interface ExtractionFile {
  meta: {
    extractedAt: string;
    totalFiles: number;
    totalContent: number;
    [key: string]: any;
  };
  content: ExtractedContent[];
  files?: string[];
}

/**
 * 检查文件是否包含 i18n.t() 调用
 */
function hasI18nUsage(filePath: string): boolean {
  if (!fs.existsSync(filePath)) {
    return false;
  }
  
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return content.includes('i18n.t(') || content.includes("i18n.t('") || content.includes('i18n.t("');
  } catch {
    return false;
  }
}

/**
 * 检查文本是否在文件中被替换为 i18n.t()
 */
function isTextReplaced(filePath: string, text: string, key?: string): boolean {
  if (!fs.existsSync(filePath)) {
    return false;
  }
  
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // 方法1: 检查是否还有原始文本（硬编码）
    const hasOriginalText = content.includes(text);
    
    // 方法2: 如果有 key，检查是否有对应的 i18n.t() 调用
    if (key) {
      const hasI18nKey = content.includes(`i18n.t('${key}')`) || content.includes(`i18n.t("${key}")`);
      if (hasI18nKey) {
        return true; // 已替换
      }
    }
    
    // 方法3: 如果文件有 i18n.t() 调用，且没有原始文本，可能已替换
    if (hasI18nUsage(filePath) && !hasOriginalText) {
      return true; // 可能已替换（需要进一步验证）
    }
    
    return false;
  } catch {
    return false;
  }
}

/**
 * 加载 key 映射文件
 */
function loadKeyMapping(): Map<string, string> {
  const mapping = new Map<string, string>();
  
  // 尝试加载 i18n_keys_mapping_fixed.json
  const mappingFiles = [
    'i18n_keys_mapping_fixed.json',
    'i18n_keys_mapping.json',
  ];
  
  for (const file of mappingFiles) {
    if (fs.existsSync(file)) {
      try {
        const data = JSON.parse(fs.readFileSync(file, 'utf-8'));
        
        // 处理不同的格式
        if (Array.isArray(data)) {
          for (const item of data) {
            if (item.original && item.key) {
              mapping.set(item.original, item.key);
            }
          }
        } else if (typeof data === 'object') {
          // 可能是 { original: key } 格式
          for (const [original, key] of Object.entries(data)) {
            mapping.set(original, key as string);
          }
        }
        
        console.log(`✅ 加载映射文件: ${file} (${mapping.size} 个映射)`);
        break;
      } catch (error) {
        console.warn(`⚠️  无法加载映射文件: ${file}`);
      }
    }
  }
  
  return mapping;
}

/**
 * 主函数
 */
async function main() {
  console.log('🔍 分析提取结果并添加 status 字段...\n');
  
  // 加载提取结果
  const extractionFile = 'i18n_complete_final.json';
  if (!fs.existsSync(extractionFile)) {
    console.error(`❌ 提取结果文件不存在: ${extractionFile}`);
    process.exit(1);
  }
  
  const data: ExtractionFile = JSON.parse(fs.readFileSync(extractionFile, 'utf-8'));
  console.log(`📄 加载提取结果: ${data.content.length} 个内容\n`);
  
  // 加载 key 映射
  const keyMapping = loadKeyMapping();
  console.log(`📋 加载 key 映射: ${keyMapping.size} 个映射\n`);
  
  // 统计
  let extractedCount = 0;
  let replacedCount = 0;
  let pendingCount = 0;
  
  // 处理每个内容
  for (const item of data.content) {
    const filePath = item.file;
    const text = item.text;
    const key = keyMapping.get(text) || item.key;
    
    // 检查是否已替换
    if (key && isTextReplaced(filePath, text, key)) {
      item.status = 'replaced';
      item.key = key;
      replacedCount++;
    } else if (hasI18nUsage(filePath)) {
      // 文件有 i18n 使用，但此文本可能未替换
      item.status = 'extracted';
      if (key) item.key = key;
      extractedCount++;
    } else {
      // 未替换
      item.status = 'extracted';
      if (key) item.key = key;
      extractedCount++;
    }
  }
  
  // 更新 meta
  data.meta.statusAddedAt = new Date().toISOString();
  data.meta.statusDistribution = {
    extracted: extractedCount,
    replaced: replacedCount,
    pending: pendingCount,
  };
  
  // 保存结果
  const outputFile = 'i18n_complete_final_with_status.json';
  fs.writeFileSync(outputFile, JSON.stringify(data, null, 2), 'utf-8');
  
  console.log('\n✅ 状态分析完成！\n');
  console.log('📊 统计:');
  console.log(`   - extracted (已提取但未替换): ${extractedCount}`);
  console.log(`   - replaced (已替换): ${replacedCount}`);
  console.log(`   - pending (待处理): ${pendingCount}`);
  console.log(`\n📄 输出文件: ${outputFile}`);
  
  // 创建替换状态文件
  const replacementStatus = {
    createdAt: new Date().toISOString(),
    totalExtracted: data.content.length,
    totalReplaced: replacedCount,
    totalPending: extractedCount,
    replaced: data.content
      .filter(item => item.status === 'replaced')
      .map(item => ({
        file: item.file,
        line: item.line,
        original: item.text,
        key: item.key,
        replacedAt: new Date().toISOString(),
      })),
    pending: data.content
      .filter(item => item.status === 'extracted')
      .map(item => ({
        file: item.file,
        line: item.line,
        original: item.text,
        key: item.key,
        extractedAt: data.meta.extractedAt,
      })),
  };
  
  const statusFile = 'i18n_replacement_status.json';
  fs.writeFileSync(statusFile, JSON.stringify(replacementStatus, null, 2), 'utf-8');
  console.log(`📄 替换状态文件: ${statusFile}`);
  
  console.log('\n✅ 完成！');
}

main().catch(console.error);

