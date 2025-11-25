const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/i18n/locales/zh-TW.ts');
let content = fs.readFileSync(filePath, 'utf-8');

// Fix menu.settings
content = content.replace(
  /(settings:\s*`• MBTI：\\\$\{user\.mbti_result)\s*\|\|\s*['"]未設定['"]\}/g,
  '$1}'
);

// Fix menu.settings2
content = content.replace(
  /(settings2:\s*`• 星座：\\\$\{user\.zodiac_sign)\s*\|\|\s*['"]未設定['"]\}/g,
  '$1}'
);

fs.writeFileSync(filePath, content, 'utf-8');
console.log('✅ Fixed menu.settings and menu.settings2 in zh-TW.ts');

