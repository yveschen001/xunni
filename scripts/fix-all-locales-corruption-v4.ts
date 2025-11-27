
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const localesDir = resolve(process.cwd(), 'src/i18n/locales');
const files = readdirSync(localesDir).filter(f => f.endsWith('.ts'));

// Regex to find ${var, ... } suffix `,
const regex = /((?:\${)|(?:\{))([a-zA-Z0-9_]+),([\s\S]*?)}\s*([^`]*?)`,/g;

files.forEach(file => {
  const filePath = resolve(localesDir, file);
  let content = readFileSync(filePath, 'utf8');
  let modified = false;

  if (regex.test(content)) {
      console.log(`Found deep corruption in ${file}`);
      content = content.replace(regex, (match, startToken, varName, suckedContent, suffix) => {
          console.log(`  Fixing: ${varName}`);
          // suckedContent contains:
          // \n    key1: `val1`,
          // \n    key2: `val2`
          
          // We want to return:
          // `${startToken}${varName}}${suffix}`,
          // ${suckedContent},
          
          // Note: suckedContent might lack trailing comma for last item?
          // In the corruption: `inviteeSuccess: `...`}`
          // The `}` was consumed by regex.
          // So `inviteeSuccess: `...`` remains in suckedContent.
          // We need to ensure comma.
          
          // Let's just append suckedContent.
          // But we need to make sure indentation is correct.
          // And we need to remove the `}` which was matched by regex but not in suckedContent.
          
          // Result:
          // codeAccepted: `... {inviterName} suffix`,
          // suckedContent
          
          // We need to add a comma to the fixed entry line.
          
          return `${startToken}${varName}}${suffix}\`,${suckedContent},`;
      });
      modified = true;
  }
  
  if (modified) {
      writeFileSync(filePath, content);
      console.log(`✅ Fixed ${file}`);
  }
});

