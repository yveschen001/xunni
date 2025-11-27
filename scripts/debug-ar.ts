
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const filePath = resolve(process.cwd(), 'src/i18n/locales/ar.ts');
try {
  const content = readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  // Error was around line 101
  for (let i = 90; i < 110; i++) {
    console.log(`${i + 1}: ${lines[i]}`);
  }
} catch (e) {
  console.error(e);
}
