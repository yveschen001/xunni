
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const localesDir = resolve(process.cwd(), 'src/i18n/locales');
const files = readdirSync(localesDir).filter(f => f.endsWith('.ts'));

files.forEach(file => {
  const filePath = resolve(localesDir, file);
  let content = readFileSync(filePath, 'utf8');
  
  // Fix double commas
  if (content.includes(',,')) {
      console.log(`Fixing double commas in ${file}`);
      content = content.replace(/,,/g, ',');
      writeFileSync(filePath, content);
  }
  
  // Fix "Expected } but found ban" in ar.ts (specific)
  // Likely missing comma or brace before ban
  if (file === 'ar.ts') {
      // Check context around "ban:"
      // It's usually "ban: {" or "ban: `"
      // If previous entry didn't close properly?
      
      // Let's find "ban:" and look before it.
      const banIndex = content.indexOf('ban:');
      if (banIndex !== -1) {
          const before = content.substring(banIndex - 20, banIndex);
          // console.log('ar.ts ban context:', before);
          // If it lacks comma?
      }
  }
  
  // General fix for missing commas between properties
  // Regex: ` (quote) \n (whitespace) key:
  // Look for `\n\s*[a-zA-Z0-9_]+:` where previous line ends with ` or ' or } or ] but NO comma.
  
  const missingCommaRegex = /([`'}\]])\s*\n\s*([a-zA-Z0-9_]+):/g;
  if (missingCommaRegex.test(content)) {
      // This is risky as it might match valid code if we are not careful about context.
      // But in locale files it's mostly big object.
      // content = content.replace(missingCommaRegex, '$1,\n$2:');
      // Let's do it only if we are sure.
  }
});

