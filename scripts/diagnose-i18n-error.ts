import fs from 'fs';
import path from 'path';

const files = ['zh-CN.ts', 'zh-TW.ts', 'en.ts'];

files.forEach(file => {
  const filePath = path.resolve(process.cwd(), `src/i18n/locales/${file}`);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    console.log(`\n--- Inspecting ${file} ---`);
    // Print lines around 70-90
    for (let i = 70; i < 90; i++) {
      if (lines[i]) {
        console.log(`${i + 1}: ${lines[i]}`);
      }
    }
  } else {
    console.log(`File ${file} not found`);
  }
});

