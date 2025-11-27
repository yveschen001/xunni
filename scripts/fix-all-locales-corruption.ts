
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const localesDir = resolve(process.cwd(), 'src/i18n/locales');
const files = readdirSync(localesDir).filter(f => f.endsWith('.ts'));

files.forEach(file => {
  const filePath = resolve(localesDir, file);
  let content = readFileSync(filePath, 'utf8');
  let modified = false;

  // Fix 1: bottle5 corruption (already done, but keep for safety or new files)
  // ... (omitted for brevity, focusing on new issue)

  // Fix 2: Generic corruption with interpolation `${var, \n key: ... }`
  // Regex to find `${var,` followed by newlines and keys until `}`
  // Example: `(\${remaining,\n    verify: `驗證`}/20)`
  // We want: `(\${remaining}/20)` and move `verify` out?
  // Or maybe `verify` was supposed to be a separate key NEXT to `bottle`?
  // Yes, looking at indentation:
  // bottle: `...`
  // verify: `...`
  // But verify got sucked into bottle's string.
  
  // We need to extract the keys that got sucked in.
  
  // Regex: `([^`]*)(\${[a-zA-Z0-9_]+),\s*([\s\S]*?)}`
  // This matches the start of string, the variable start, the comma, the sucked content, and closing brace.
  // But this is inside a backtick string.
  
  // Let's look for the specific signature: `\${[a-zA-Z0-9_]+,\n`
  const regex = /\${([a-zA-Z0-9_]+),\s*\n\s*([a-zA-Z0-9_]+):\s*`([^`]*)`}\s*(.*?)`,/g;
  
  // Explanation:
  // \${([a-zA-Z0-9_]+),  -> captures variable name (e.g. 'remaining') and matches comma
  // \s*\n\s*             -> whitespace and newline
  // ([a-zA-Z0-9_]+):     -> captures the next key (e.g. 'verify')
  // \s*`([^`]*)`         -> captures the value of next key
  // }                    -> closing brace of interpolation (corruption artifact?)
  // \s*(.*?)`,           -> remainder of the string (e.g. '/20)') and end of entry
  
  // The corrupted text: `... (\${remaining,\n    verify: `驗證`}/20)`,
  // We want:
  // bottle: `... (${remaining}/20)`,
  // verify: `驗證`,
  
  // So we need to close the first string, add the second key.
  
  // We need to match the WHOLE line of the first key to preserve prefix.
  // But regex search on full file is easier.
  
  // Let's try to replace:
  // `... ${var, \n nextKey: `val` } suffix `,`
  // with:
  // `... ${var} suffix `, \n nextKey: `val`,
  
  if (regex.test(content)) {
      console.log(`Found generic interpolation corruption in ${file}`);
      content = content.replace(regex, (match, varName, nextKey, nextVal, suffix) => {
          console.log(`  Fixing: ${varName}, ${nextKey}`);
          // The prefix is not in the match, it's before.
          // The match starts at `${`.
          // So we replace `${...}` with `${varName}${suffix}`, \n ${nextKey}: `${nextVal}`,
          
          // Wait, suffix might contain `/20)` or similar.
          // And the closing backtick is at the end of match.
          
          // Original: `${remaining,\n    verify: `驗證`}/20)`,
          // Match: `${remaining,\n    verify: `驗證`}/20)`,
          // varName: remaining
          // nextKey: verify
          // nextVal: 驗證
          // suffix: /20)
          
          // Replacement: `${remaining}${suffix}`, \n    ${nextKey}: `${nextVal}`,
          
          // We need to preserve indentation.
          // We can assume standard indentation (4 spaces) or try to guess.
          return `\${${varName}}${suffix}\`,\n    ${nextKey}: \`${nextVal}\`,`;
      });
      modified = true;
  } else {
      // console.log(`No generic corruption in ${file}`);
  }
  
  if (modified) {
      writeFileSync(filePath, content);
      console.log(`✅ Fixed ${file}`);
  }
});
