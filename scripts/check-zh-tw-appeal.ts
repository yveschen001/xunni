
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const filePath = resolve(process.cwd(), 'src/i18n/locales/zh-TW.ts');
try {
  const content = readFileSync(filePath, 'utf8');
  // Find 'appeal:' key
  const match = content.match(/appeal:\s*`([^`]+)`/);
  if (match) {
    console.log(`zh-TW appeal: ${match[1]}`);
  } else {
    // maybe it's inside an object?
    const matchObj = content.match(/appeal:\s*\{/); 
    if (matchObj) {
         // It might be a simple key too
         console.log("Found appeal object or key");
         // dump around line 100 just in case
         const lines = content.split('\n');
         for (let i = 0; i < lines.length; i++) {
             if (lines[i].includes('appeal:')) {
                 console.log(`${i+1}: ${lines[i]}`);
                 if (lines[i+1]) console.log(`${i+2}: ${lines[i+1]}`);
                 break;
             }
         }
    }
  }
} catch (e) {
  console.error(e);
}

