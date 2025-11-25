// Fix all language files: remove || 'zh-TW' from message3 and message4
const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '../src/i18n/locales');
const localeFiles = fs.readdirSync(localesDir).filter(f => f.endsWith('.ts') && f !== 'en.ts');

console.log('🔧 Fixing all language files...\n');

let totalFixed = 0;

localeFiles.forEach(file => {
  const filePath = path.join(localesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let fixed = false;
  
  // Fix message3: remove || 'zh-TW' or || 'zh-CN' etc
  const message3Pattern = /(message3:\s*`[^`]*)\$\{user\.language_pref\s*\|\|\s*['"][^'"]+['"]\}([^`]*`)/g;
  if (message3Pattern.test(content)) {
    content = content.replace(message3Pattern, (match, before, after) => {
      return before + '${user.language_pref}' + after;
    });
    fixed = true;
    totalFixed++;
  }
  
  // Fix message4: remove || 'zh-TW' or || 'zh-CN' etc
  const message4Pattern = /(message4:\s*`[^`]*)\$\{user\.language_pref\s*\|\|\s*['"][^'"]+['"]\}([^`]*`)/g;
  if (message4Pattern.test(content)) {
    content = content.replace(message4Pattern, (match, before, after) => {
      return before + '${user.language_pref}' + after;
    });
    fixed = true;
    totalFixed++;
  }
  
  if (fixed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed ${file}`);
  }
});

console.log(`\n📊 Total files fixed: ${totalFixed / 2} (${totalFixed} occurrences)`);

