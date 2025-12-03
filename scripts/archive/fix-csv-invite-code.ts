import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const csvPath = path.resolve(__dirname, '../i18n_for_translation.csv');

try {
  let content = fs.readFileSync(csvPath, 'utf-8');
  console.log('Read CSV file, length:', content.length);

  let fixedCount = 0;
  const lines = content.split('\n');
  const newLines = lines.map(line => {
    if (line.startsWith('menu.invite2,')) {
      console.log('Found menu.invite2 line');
      // Replace "\," with "{inviteCode}," globally in this line
      // This handles all columns except potentially the last one if it doesn't end with comma
      let newLine = line.replace(/\\,/g, '{inviteCode},');
      
      // Handle end of line case (if the last column ends with \)
      // Note: split('\n') removes newlines, so we check end of string
      // Also handle potential \r from CRLF
      if (newLine.trimEnd().endsWith('\\')) {
         // Find the last backslash and replace it
         const lastBackslashIndex = newLine.lastIndexOf('\\');
         if (lastBackslashIndex !== -1) {
             newLine = newLine.substring(0, lastBackslashIndex) + '{inviteCode}' + newLine.substring(lastBackslashIndex + 1);
         }
      }
      
      // Verify fix
      if (newLine !== line) {
        fixedCount++;
        console.log('Fixed line');
      }
      return newLine;
    }
    return line;
  });

  if (fixedCount > 0) {
    fs.writeFileSync(csvPath, newLines.join('\n'));
    console.log('✅ Successfully fixed menu.invite2 in CSV');
  } else {
    console.log('⚠️ No fix needed or line not found');
  }

} catch (error) {
  console.error('❌ Error fixing CSV:', error);
}

