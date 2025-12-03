import fs from 'fs';
import path from 'path';

const filePath = path.resolve(process.cwd(), 'src/i18n/locales/zh-TW.ts');
const content = fs.readFileSync(filePath, 'utf-8');

const target = 'provideAppealId';
const idx = content.indexOf(target);

if (idx !== -1) {
  console.log(`Found '${target}' at ${idx}`);
  const snippet = content.substring(idx, idx + 100);
  console.log('Snippet:', snippet);
  console.log('Char codes:', snippet.split('').map(c => c.charCodeAt(0)));
} else {
  console.log('Target not found');
}
