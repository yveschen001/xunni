
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const filePath = resolve(process.cwd(), 'src/i18n/locales/ar.ts');
let content = readFileSync(filePath, 'utf8');

// Fix missing comma before "ban: {"
// Look for `...`\n    ban: {
const regex = /(`\s*)\n\s*ban: \{/g;

if (regex.test(content)) {
  console.log('Found missing comma before ban: { in ar.ts');
  content = content.replace(regex, '$1,\n    ban: {');
  writeFileSync(filePath, content);
  console.log('✅ Fixed ar.ts missing comma');
} else {
  // Try generalized missing comma
  // Match quote ending, newline, indentation, key, colon
  const generalRegex = /(`)\s*\n(\s*[a-zA-Z0-9_]+:)/g;
  // This is risky as it matches every key.
  // Only replace if NO comma.
  // JS regex doesn't support lookbehind well in all envs, but we can capture and check.
  // But wait, `\s*` includes newline.
  
  // Let's match `[not comma] \n key:`
  // content = content.replace(/([^,])\n\s*([a-zA-Z0-9_]+):/g, '$1,\n$2:');
  // This is too aggressive.
}

