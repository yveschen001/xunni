
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const filePath = resolve(process.cwd(), 'src/i18n/locales/zh-TW.ts');
let content = readFileSync(filePath, 'utf8');

const startMarker = 'bottle5: `瓶子 ID：#';
const endMarker = 'bottle6: `';

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker, startIndex);

if (startIndex !== -1 && endIndex !== -1) {
  console.log(`Found corruption block from index ${startIndex} to ${endIndex}`);
  
  const before = content.substring(0, startIndex);
  const after = content.substring(endIndex);
  
  // Determine indentation from the line start
  // Look back from startIndex to find newline
  const lastNewline = content.lastIndexOf('\n', startIndex);
  const indentation = content.substring(lastNewline + 1, startIndex);
  
  const fixedEntry = `bottle5: \`瓶子 ID：#\${bottleId}\`,\n\n${indentation}`;
  
  const newContent = before + fixedEntry + after;
  
  writeFileSync(filePath, newContent);
  console.log('✅ Fixed zh-TW.ts by splicing');
} else {
  console.log('Could not find start/end markers for splicing.');
  console.log('Start index:', startIndex);
  console.log('End index:', endIndex);
}
