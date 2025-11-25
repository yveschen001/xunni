/**
 * 修复所有语言文件中的 JavaScript 表达式
 * 移除 i18n 字符串中的三元运算符、|| 表达式等
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

  // 修复模式
  const patterns = [
    // 三元运算符: ${var === 'x' ? 'a' : 'b'}
    {
      regex: /(\$\{[^}]*)\s*===\s*['"][^'"]+['"]\s*\?\s*['"][^'"]+['"]\s*:\s*['"][^'"]+['"]\s*\}/g,
      replacement: (match, prefix) => {
        // 提取变量名
        const varMatch = prefix.match(/(\w+(?:\.\w+)*)/);
        if (varMatch) {
          return `\${${varMatch[1]}}`;
        }
        return match;
      }
    },
    // || 表达式: ${var || 'default'}
    {
      regex: /(\$\{[^}]*)\s*\|\|\s*['"][^'"]+['"]\s*\}/g,
      replacement: (match, prefix) => {
        // 提取变量名
        const varMatch = prefix.match(/(\w+(?:\.\w+)*)/);
        if (varMatch) {
          return `\${${varMatch[1]}}`;
        }
        return match;
      }
    },
    // 复杂的三元运算符（多行）
    {
      regex: /(\$\{[^}]*)\s*===\s*['"][^'"]+['"]\s*\?\s*[^:]+:\s*[^}]+===\s*['"][^'"]+['"]\s*\?\s*[^:]+:\s*[^}]+}/g,
      replacement: (match, prefix) => {
        const varMatch = prefix.match(/(\w+(?:\.\w+)*)/);
        if (varMatch) {
          return `\${${varMatch[1]}}`;
        }
        return match;
      }
    }
  ];

  patterns.forEach(({ regex, replacement }) => {
    const matches = content.match(regex);
    if (matches) {
      count += matches.length;
      if (typeof replacement === 'function') {
        content = content.replace(regex, replacement);
      } else {
        content = content.replace(regex, replacement);
      }
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

