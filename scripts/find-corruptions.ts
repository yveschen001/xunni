
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const filePath = resolve(process.cwd(), 'src/i18n/locales/zh-TW.ts');
const content = readFileSync(filePath, 'utf8');

// Find all occurrences of ${var, or {var,
// Allowing dot in var name
const regex = /((?:\${)|(?:\{))([a-zA-Z0-9_.]+),/g;

let match;
while ((match = regex.exec(content)) !== null) {
  const index = match.index;
  const context = content.substring(index, index + 200);
  console.log(`Found potential corruption at index ${index}:`);
  console.log(context.split('\n').slice(0, 5).join('\n'));
  console.log('---');
}

