/**
 * 验证 i18n Keys 是否存在
 * 
 * 检查所有 handler 文件中使用的 i18n keys 是否真的存在于翻译文件中
 * 这是关键测试，防止部署后显示 [key] 而不是翻译值
 */

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { createI18n } from '../src/i18n';

interface KeyUsage {
  file: string;
  line: number;
  key: string;
  code: string;
}

interface KeyValidation {
  key: string;
  exists: boolean;
  languages: {
    'zh-TW': boolean;
    'zh-CN': boolean;
    'en': boolean;
    'ar': boolean;
  };
  usages: KeyUsage[];
}

// 提取 i18n.t() 调用中的 key
function extractI18nKeys(content: string, filePath: string): KeyUsage[] {
  const usages: KeyUsage[] = [];
  const lines = content.split('\n');
  
  // 匹配 i18n.t('key') 或 i18n.t("key")
  const i18nPattern = /i18n\.t\(['"]([^'"]+)['"]/g;
  
  lines.forEach((line, index) => {
    let match;
    while ((match = i18nPattern.exec(line)) !== null) {
      const key = match[1];
      usages.push({
        file: filePath,
        line: index + 1,
        key,
        code: line.trim(),
      });
    }
  });
  
  return usages;
}

// 检查 key 是否存在于翻译文件中
function checkKeyExists(key: string, language: string): boolean {
  try {
    const i18n = createI18n(language);
    const value = i18n.t(key);
    // 如果返回 [key] 格式，说明 key 不存在
    return !value.startsWith('[') && !value.endsWith(']');
  } catch (e) {
    return false;
  }
}

async function main() {
  console.log('🔍 验证 i18n Keys 是否存在\n');
  console.log('='.repeat(80));
  console.log();
  
  const handlersDir = join(process.cwd(), 'src/telegram/handlers');
  const handlers = readdirSync(handlersDir).filter(f => f.endsWith('.ts'));
  
  // 收集所有使用的 keys
  const allUsages: KeyUsage[] = [];
  
  console.log('📂 扫描 handler 文件...\n');
  
  handlers.forEach(handler => {
    const filePath = join(handlersDir, handler);
    const content = readFileSync(filePath, 'utf-8');
    const usages = extractI18nKeys(content, handler);
    allUsages.push(...usages);
  });
  
  console.log(`   找到 ${allUsages.length} 个 i18n.t() 调用\n`);
  
  // 按 key 分组
  const keyMap = new Map<string, KeyUsage[]>();
  allUsages.forEach(usage => {
    if (!keyMap.has(usage.key)) {
      keyMap.set(usage.key, []);
    }
    keyMap.get(usage.key)!.push(usage);
  });
  
  console.log(`   发现 ${keyMap.size} 个不同的 keys\n`);
  
  // 验证每个 key
  const validations: KeyValidation[] = [];
  const languages: Array<'zh-TW' | 'zh-CN' | 'en' | 'ar'> = ['zh-TW', 'zh-CN', 'en', 'ar'];
  
  console.log('🔍 验证 keys 是否存在...\n');
  
  for (const [key, usages] of keyMap.entries()) {
    const validation: KeyValidation = {
      key,
      exists: true,
      languages: {
        'zh-TW': false,
        'zh-CN': false,
        'en': false,
        'ar': false,
      },
      usages,
    };
    
    // 检查每个语言
    for (const lang of languages) {
      const exists = checkKeyExists(key, lang);
      validation.languages[lang] = exists;
      if (!exists) {
        validation.exists = false;
      }
    }
    
    validations.push(validation);
  }
  
  // 找出有问题的 keys
  const missingKeys = validations.filter(v => !v.exists);
  const partialKeys = validations.filter(v => {
    const langCount = Object.values(v.languages).filter(Boolean).length;
    return langCount > 0 && langCount < languages.length;
  });
  
  // 输出结果
  console.log('📊 验证结果:\n');
  console.log(`   总 keys: ${validations.length}`);
  console.log(`   ✅ 完全存在: ${validations.length - missingKeys.length - partialKeys.length}`);
  console.log(`   ⚠️  部分存在: ${partialKeys.length}`);
  console.log(`   ❌ 完全缺失: ${missingKeys.length}\n`);
  
  if (missingKeys.length > 0) {
    console.log('❌ 完全缺失的 keys:\n');
    missingKeys.forEach(validation => {
      console.log(`   [${validation.key}]`);
      validation.usages.forEach(usage => {
        console.log(`      ${usage.file}:${usage.line}`);
        console.log(`      ${usage.code.substring(0, 80)}${usage.code.length > 80 ? '...' : ''}`);
      });
      console.log();
    });
  }
  
  if (partialKeys.length > 0) {
    console.log('⚠️  部分缺失的 keys:\n');
    partialKeys.forEach(validation => {
      const missingLangs = languages.filter(lang => !validation.languages[lang]);
      console.log(`   [${validation.key}] - 缺失: ${missingLangs.join(', ')}`);
      validation.usages.forEach(usage => {
        console.log(`      ${usage.file}:${usage.line}`);
      });
      console.log();
    });
  }
  
  if (missingKeys.length === 0 && partialKeys.length === 0) {
    console.log('✅ 所有 keys 都存在！\n');
  } else {
    console.log('='.repeat(80));
    console.log('\n❌ 发现缺失的 keys，请修复后再部署！\n');
    process.exit(1);
  }
  
  console.log('='.repeat(80));
  console.log('\n✅ 验证完成！\n');
}

main().catch(error => {
  console.error('❌ 验证失败:', error);
  process.exit(1);
});

