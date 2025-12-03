
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOCALES_DIR = path.join(__dirname, '../src/i18n/locales');

const REPLACEMENTS = [
  { from: /\$\{provider\.total_requests\}/g, to: '{requests}' },
  { from: /\$\{provider\.total_completions\}/g, to: '{completions}' },
  { from: /\$\{provider\.completion_rate\.toFixed\(1\)\}/g, to: '{rate}' },
  { from: /\$\{provider\.error_rate\.toFixed\(1\)\}/g, to: '{rate}' },
  { from: /\$\{report\.overall_conversion_rate\.toFixed\(1\)\}/g, to: '{rate}' },
  { from: /\$\{step\.conversion_rate\.toFixed\(1\)\}/g, to: '{rate}' },
  { from: /\$\{step\.user_count\}/g, to: '{userCount}' },
  // Handle escaped versions just in case
  { from: /\\\$\{provider\.total_requests\}/g, to: '{requests}' },
  { from: /\\\$\{provider\.total_completions\}/g, to: '{completions}' },
  { from: /\\\$\{provider\.completion_rate\.toFixed\(1\)\}/g, to: '{rate}' },
  { from: /\\\$\{provider\.error_rate\.toFixed\(1\)\}/g, to: '{rate}' },
  { from: /\\\$\{report\.overall_conversion_rate\.toFixed\(1\)\}/g, to: '{rate}' },
  { from: /\\\$\{step\.conversion_rate\.toFixed\(1\)\}/g, to: '{rate}' },
  { from: /\\\$\{step\.user_count\}/g, to: '{userCount}' },
];

function fixFile(filePath: string) {
  console.log(`Processing ${filePath}...`);
  let content = fs.readFileSync(filePath, 'utf-8');
  let originalContent = content;

  for (const { from, to } of REPLACEMENTS) {
    content = content.replace(from, to);
  }

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Fixed ${path.basename(filePath)}`);
  } else {
    console.log(`- No changes in ${path.basename(filePath)}`);
  }
}

function main() {
  if (!fs.existsSync(LOCALES_DIR)) {
    console.error(`Directory not found: ${LOCALES_DIR}`);
    return;
  }

  const files = fs.readdirSync(LOCALES_DIR).filter(f => f.endsWith('.ts'));
  
  for (const file of files) {
    fixFile(path.join(LOCALES_DIR, file));
  }
}

main();

