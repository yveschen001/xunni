
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOCALES_DIR = path.resolve(__dirname, '../src/i18n/locales');

// Translations map
const TRANSLATIONS: Record<string, string> = {
  'zh-TW': '請選擇您的配對偏好：',
  'zh-CN': '请选择您的配对偏好：',
  'en': 'Please select your matching preference:',
  'ja': 'マッチングの好みを選択してください：',
  'ko': '매칭 선호도를 선택해주세요:',
  // Fallback for others
};

function addKeyToFile(filePath: string, locale: string) {
  if (!fs.existsSync(filePath)) return;

  let content = fs.readFileSync(filePath, 'utf-8');
  
  if (content.includes('"matchPrefInstruction":')) {
    console.log(`Skipped (exists): ${locale}`);
    return;
  }

  // Find insertion point (before closing brace)
  const lastBraceIndex = content.lastIndexOf('};');
  if (lastBraceIndex === -1) return;

  const translation = TRANSLATIONS[locale] || TRANSLATIONS['en'];
  const newEntry = `  "matchPrefInstruction": "${translation}"`;

  // Check if previous line has comma
  const beforeBrace = content.substring(0, lastBraceIndex).trimEnd();
  const needsComma = !beforeBrace.endsWith(',') && !beforeBrace.endsWith('{');
  
  const insertString = (needsComma ? ',' : '') + '\n' + newEntry + '\n';
  
  const newContent = content.slice(0, lastBraceIndex) + insertString + content.slice(lastBraceIndex);
  
  fs.writeFileSync(filePath, newContent, 'utf-8');
  console.log(`Added to: ${locale}`);
}

async function main() {
  const locales = fs.readdirSync(LOCALES_DIR);

  for (const locale of locales) {
    const filePath = path.join(LOCALES_DIR, locale, 'edit_profile.ts');
    addKeyToFile(filePath, locale);
  }
  
  console.log('Done!');
}

main();

