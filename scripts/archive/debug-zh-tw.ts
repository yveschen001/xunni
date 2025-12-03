
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const filePath = resolve(process.cwd(), 'src/i18n/locales/zh-TW.ts');
try {
  const content = readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  for (let i = 1010; i < 1020; i++) {
    console.log(`${i + 1}: ${lines[i]}`);
  }
} catch (e) {
  console.error(e);
}

