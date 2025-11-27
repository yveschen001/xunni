import fs from 'fs';
import path from 'path';
import { SUPPORTED_LANGUAGES } from '../src/i18n/languages';

async function repairFile(langCode: string) {
  const filePath = path.resolve(process.cwd(), `src/i18n/locales/${langCode}.ts`);
  if (!fs.existsSync(filePath)) {
    return;
  }

  let content = fs.readFileSync(filePath, 'utf-8');
  
  const startMarker = '3. 添加用戶 ID：\\`{userId,';
  const endMarker = '},}\\`';
  
  const startIndex = content.indexOf(startMarker);
  if (startIndex !== -1) {
    console.log(`Found start marker in ${langCode}.ts at ${startIndex}`);
    
    // Find the end of the corruption
    // It ends with `},}` before `4. 格式`?
    // In cat output: `},}\`\n4. 格式`
    
    // Let's look for `},}` after startMarker
    const corruptionEndIndex = content.indexOf(endMarker, startIndex);
    
    if (corruptionEndIndex !== -1) {
       console.log(`Found end marker in ${langCode}.ts at ${corruptionEndIndex}`);
       
       const corruptedPart = content.substring(startIndex, corruptionEndIndex + endMarker.length);
       console.log('Corrupted part sample:', corruptedPart.substring(0, 50) + '...');
       
       // Replace with correct string
       // Original was `3. 添加用戶 ID：\`{userId}\``
       // Wait, the cat output showed `3. 添加用戶 ID：\`{userId,`
       // The backtick before {userId} is part of the code string `\`{userId...` ? 
       // "添加用戶 ID：\`{userId}\`"
       // So I should replace everything from `{userId,` to `},}` with `{userId}`?
       
       // Let's replace the whole block `startMarker ... endMarker` with `3. 添加用戶 ID：\`{userId}\``
       
       const newContent = content.replace(
         content.substring(startIndex, corruptionEndIndex + endMarker.length),
         '3. 添加用戶 ID：`{userId}`'
       );
       
       fs.writeFileSync(filePath, newContent, 'utf-8');
       console.log(`✅ Repaired ${langCode}.ts`);
       return;
    }
  }
  
  // Try regex again with looser constraints if exact string match failed
  // Maybe `\` vs backtick
  // In cat: `3. 添加用戶 ID：\`{userId,`
  // The backslash escapes the backtick in the template string.
  // So in file content it is `\\` then backtick? No, cat output processes escapes?
  
  // Let's try to find just `{userId,` inside `addInstructions`
  
  const badStart = '{userId,';
  const badEnd = '},}`'; // The ending sequence I saw
  
  const idx = content.indexOf(badStart);
  if (idx !== -1) {
     // Check context
     const context = content.substring(idx - 20, idx + 200);
     if (context.includes('addInstructions')) {
        // It's the one
        const endIdx = content.indexOf(badEnd, idx);
        if (endIdx !== -1) {
           const toReplace = content.substring(idx, endIdx + badEnd.length);
           content = content.replace(toReplace, '{userId}`');
           fs.writeFileSync(filePath, content, 'utf-8');
           console.log(`✅ Repaired ${langCode}.ts (method 2)`);
        }
     }
  } else {
    console.log(`No corruption found in ${langCode}.ts`);
  }
}

async function runRepair() {
  for (const lang of SUPPORTED_LANGUAGES) {
    await repairFile(lang.code);
  }
}

runRepair();
