/**
 * 修复所有语言文件中的 JavaScript 表达式
 * 移除 i18n 字符串中的 || '未設定' 等表达式
 */

const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '../src/i18n/locales');
const files = fs.readdirSync(localesDir).filter(f => f.endsWith('.ts'));

console.log('🔍 修复所有语言文件中的 JavaScript 表达式...\n');

let totalFixed = 0;

files.forEach(file => {
  const filePath = path.join(localesDir, file);
  let content = fs.readFileSync(filePath, 'utf-8');
  let fixed = false;
  let count = 0;

  // 修复 menu.settings 和 menu.settings2
  const patterns = [
    // menu.settings: MBTI
    {
      regex: /(settings:\s*`[^`]*MBTI[^`]*\\\$\{user\.mbti_result)\s*\|\|\s*['"`][^'"`]+['"`]\}/g,
      replacement: '$1}'
    },
    // menu.settings2: 星座/Zodiac
    {
      regex: /(settings2:\s*`[^`]*(?:星座|Zodiac)[^`]*\\\$\{user\.zodiac_sign)\s*\|\|\s*['"`][^'"`]+['"`]\}/g,
      replacement: '$1}'
    },
    // 其他类似的表达式
    {
      regex: /(\\\$\{[^}]+\})\s*\|\|\s*['"`][^'"`]+['"`]/g,
      replacement: '$1'
    }
  ];

  patterns.forEach(({ regex, replacement }) => {
    const matches = content.match(regex);
    if (matches) {
      count += matches.length;
      content = content.replace(regex, replacement);
      fixed = true;
    }
  });

  if (fixed) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`✅ ${file}: 修复了 ${count} 处表达式`);
    totalFixed += count;
  }
});

console.log(`\n✅ 总共修复了 ${totalFixed} 处表达式\n`);

