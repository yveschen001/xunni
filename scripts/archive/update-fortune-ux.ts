import { translations } from '../src/i18n/locales/zh-TW';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.resolve(__dirname, '../src/i18n/locales/zh-TW.ts');

// Ensure fortune object exists
if (!translations.fortune) translations.fortune = {} as any;
const f = translations.fortune as any;

// Update onboarding keys for better UX (Subject vs User distinction)
f.onboarding = {
  askName: '請輸入欲算命對象的名字（或暱稱）：',
  askGender: '請選擇該對象的性別：',
  askDate: '請輸入該對象的出生日期 (YYYY-MM-DD)：',
  askTime: '請輸入該對象的出生時間 (HH:mm)，若不確定請點擊下方按鈕：',
  askCity: '請選擇該對象的出生城市：'
};

// Also update menu title to be more specific if needed, or leave as is.
// f.menuTitle = 'AI 算命 (命盤管理)'; 

const content = `import type { Translations } from '../types';

export const translations: Translations = ${JSON.stringify(translations, null, 2)};
`;

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Updated zh-TW.ts with clearer Fortune UX text');

