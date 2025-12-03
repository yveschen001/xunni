
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const files = ['src/i18n/locales/zh-TW.ts', 'src/i18n/locales/ar.ts', 'src/i18n/locales/zh-CN.ts', 'src/i18n/locales/en.ts'];

for (const file of files) {
  const filePath = resolve(process.cwd(), file);
  try {
    let content = readFileSync(filePath, 'utf8');
    let fixed = false;

    // Pattern: unescaped ${variable}
    // We look for ${ that is NOT preceded by \
    // Regex: /(?<!\\)\$\{([a-zA-Z0-9_.]+)\}/g
    // We want to replace it with \${$1}
    
    // Note: Node.js regex supports lookbehind.
    
    const regex = /(?<!\\)\$\{([a-zA-Z0-9_.]+)\}/g;
    
    if (regex.test(content)) {
      content = content.replace(regex, '\\${$1}');
      fixed = true;
    }
    
    // Also check for broken ones like ${bottleId (without closing brace) if any
    
    if (fixed) {
      writeFileSync(filePath, content);
      console.log(`✅ Fixed unescaped variables in ${file}`);
    } else {
      console.log(`No unescaped variables found in ${file}`);
    }
  } catch (e) {
    console.error(`Error processing ${file}:`, e);
  }
}

