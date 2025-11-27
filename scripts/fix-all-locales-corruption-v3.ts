
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const localesDir = resolve(process.cwd(), 'src/i18n/locales');
const files = readdirSync(localesDir).filter(f => f.endsWith('.ts'));

// Updated regex to handle both ${var, and {var,
const regex = /((?:\${)|(?:\{))([a-zA-Z0-9_]+),\s*\n\s*([a-zA-Z0-9_]+):\s*`([^`]*)`}\s*([^`]*?)`,/g;

files.forEach(file => {
  const filePath = resolve(localesDir, file);
  let content = readFileSync(filePath, 'utf8');
  let modified = false;

  if (regex.test(content)) {
      console.log(`Found corruption in ${file}`);
      content = content.replace(regex, (match, startToken, varName, nextKey, nextVal, suffix) => {
          console.log(`  Fixing: ${varName}, ${nextKey}`);
          
          // startToken is "${" or "{"
          // We need to close it with "}" 
          // If startToken is "${", we want `${varName}`
          // If startToken is "{", we want `{varName}`
          
          // Wait, the corruption closing brace "}" is matched at the end of sucked keys.
          // We want to reuse that closing brace?
          // Original: `{inviterName, \n ... } 的邀請`
          // We want: `{inviterName} 的邀請`
          
          // Replacement: `${startToken}${varName}}${suffix}`, \n    ${nextKey}: `${nextVal}`,`
          // Note double } if we use interpolation in template string for script logic.
          // But startToken already has {
          
          return `${startToken}${varName}}${suffix}\`,\n    ${nextKey}: \`${nextVal}\`,`;
      });
      modified = true;
  }
  
  if (modified) {
      writeFileSync(filePath, content);
      console.log(`✅ Fixed ${file}`);
  }
});

