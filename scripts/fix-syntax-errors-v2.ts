
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const localesDir = resolve(process.cwd(), 'src/i18n/locales');
const files = readdirSync(localesDir).filter(f => f.endsWith('.ts'));

files.forEach(file => {
  const filePath = resolve(localesDir, file);
  let content = readFileSync(filePath, 'utf8');
  
  // Fix double commas with whitespace
  if (/,\s*,/.test(content)) {
      console.log(`Fixing spaced double commas in ${file}`);
      content = content.replace(/,\s*,/g, ',');
      writeFileSync(filePath, content);
  }
});

