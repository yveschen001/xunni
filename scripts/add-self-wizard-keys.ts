import { translations } from '../src/i18n/locales/zh-TW';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.resolve(__dirname, '../src/i18n/locales/zh-TW.ts');

if (!translations.fortune) translations.fortune = {} as any;
const f = translations.fortune as any;

if (!f.onboarding) f.onboarding = {};

// Add Self Welcome Key
f.onboarding.selfWelcome = '👋 歡迎 {name}！\n系統已自動帶入您的註冊資料（生日：{date}）。\n為了提高準確度，請補充以下資訊：';

const content = `import type { Translations } from '../types';

export const translations: Translations = ${JSON.stringify(translations, null, 2)};
`;

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Updated zh-TW.ts with Self Wizard keys');

