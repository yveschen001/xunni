
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const localesDir = resolve(process.cwd(), 'src/i18n/locales');
const files = readdirSync(localesDir).filter(f => f.endsWith('.ts'));

const regex = /\${([a-zA-Z0-9_]+),\s*\n\s*([a-zA-Z0-9_]+):\s*`([^`]*)`}\s*([^`]*?)`,/g;

files.forEach(file => {
  const filePath = resolve(localesDir, file);
  let content = readFileSync(filePath, 'utf8');
  let modified = false;

  if (regex.test(content)) {
      console.log(`Found corruption in ${file}`);
      content = content.replace(regex, (match, varName, nextKey, nextVal, suffix) => {
          console.log(`  Fixing: ${varName}, ${nextKey}`);
          // Reconstruct:
          // value for first key: `... ${varName}${suffix}`
          // next key: nextKey: `nextVal`
          
          // We need to check indentation of nextKey to prepend it with correct newline/spaces?
          // The regex consumes the newline before nextKey.
          // We should probably put nextKey on a new line with indentation.
          // Let's assume 4 spaces indentation relative to start? No, we don't know start.
          // But usually these files use 2 or 4 spaces.
          // Let's use \n    (4 spaces) or just reuse what was likely there.
          
          return `\${${varName}}${suffix}\`,\n    ${nextKey}: \`${nextVal}\`,`;
      });
      modified = true;
  }
  
  if (modified) {
      writeFileSync(filePath, content);
      console.log(`✅ Fixed ${file}`);
  }
});

