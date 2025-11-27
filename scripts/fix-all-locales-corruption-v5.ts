
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const localesDir = resolve(process.cwd(), 'src/i18n/locales');
const files = readdirSync(localesDir).filter(f => f.endsWith('.ts'));

// Regex to find ${var, ... } suffix `,
// Added . to var name character class
const regex = /((?:\${)|(?:\{))([a-zA-Z0-9_.]+),([\s\S]*?)}\s*([^`]*?)`,/g;

files.forEach(file => {
  const filePath = resolve(localesDir, file);
  let content = readFileSync(filePath, 'utf8');
  let modified = false;

  if (regex.test(content)) {
      console.log(`Found deep corruption in ${file}`);
      content = content.replace(regex, (match, startToken, varName, suckedContent, suffix) => {
          console.log(`  Fixing: ${varName}`);
          return `${startToken}${varName}}${suffix}\`,${suckedContent},`;
      });
      modified = true;
  }
  
  if (modified) {
      writeFileSync(filePath, content);
      console.log(`✅ Fixed ${file}`);
  }
});

