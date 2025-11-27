
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const filePath = resolve(process.cwd(), 'src/i18n/locales/zh-TW.ts');
const content = readFileSync(filePath, 'utf8');

// extract ban object
const match = content.match(/ban:\s*\{([^}]+)\}/s);
if (match) {
    console.log(match[0]);
} else {
    console.log("Ban object not found via regex");
}

