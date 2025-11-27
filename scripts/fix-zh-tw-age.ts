
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const localesDir = resolve(process.cwd(), 'src/i18n/locales');
const files = readdirSync(localesDir).filter(f => f.endsWith('.ts'));

// Pattern: age: `... ${updatedUser.age \n terms: { ... } \n ... } 歲 \n `,
// We want: age: `... ${updatedUser.age} 歲`, \n terms: { ... }, ...

files.forEach(file => {
  const filePath = resolve(localesDir, file);
  let content = readFileSync(filePath, 'utf8');
  
  // Look for age: `...${updatedUser.age
  const startRegex = /(age: `[^\n]*\${updatedUser\.age)\s*\n\s*(terms: \{[\s\S]*?\},?)\s*(.*?)}\s*([^`]*?)`,/g;
  
  // Explanation:
  // (age: `[^\n]*\${updatedUser\.age)  -> Capture start (Group 1)
  // \s*\n\s*                           -> Newline before terms
  // (terms: \{[\s\S]*?\},?)            -> Capture terms object (Group 2) - non-greedy match until },?
  // \s*(.*?)                           -> Capture other keys if any (e.g. notCompleted) - but wait, terms might contain notCompleted
  // }                                  -> Closing brace of interpolation
  // \s*([^`]*?)`,                      -> Suffix (e.g. " 歲") and end of entry
  
  // In the corruption:
  // terms: { ... notCompleted: ... },} 歲
  // The `},` is end of terms? Or `notCompleted` is outside?
  // The indentation suggests `notCompleted` is at same level as `terms` keys?
  // terms: { ... }, notCompleted: ... }
  // Let's check the snippet again.
  // terms: { ... terms_of_service_button: ... , notCompleted: ... }
  // It seems `notCompleted` is INSIDE `terms`.
  // So `terms` object ends at `},`.
  
  if (startRegex.test(content)) {
      console.log(`Found age corruption in ${file}`);
      content = content.replace(startRegex, (match, startPart, termsPart, otherKeys, suffix) => {
          console.log('Fixing age corruption');
          // startPart: age: `... ${updatedUser.age
          // termsPart: terms: { ... }
          // suffix:  歲
          
          // Result:
          // age: `... ${updatedUser.age}${suffix}`,
          // terms: { ... },
          // otherKeys (if any)
          
          return `${startPart}}${suffix}\`,\n    ${termsPart}\n    ${otherKeys}`;
      });
      writeFileSync(filePath, content);
      console.log(`✅ Fixed ${file}`);
  }
});

