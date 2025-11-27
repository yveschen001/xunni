
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const filePath = resolve(process.cwd(), 'src/i18n/locales/ar.ts');
const content = readFileSync(filePath, 'utf8');
const lines = content.split('\n');

// Print lines 80-150
console.log(lines.slice(80, 150).join('\n'));

