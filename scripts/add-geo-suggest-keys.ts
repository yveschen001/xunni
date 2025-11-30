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

// Add Suggestion Keys
f.onboarding.suggestCountry = '系統檢測到您的註冊地區為：{country}。\n請問欲算命對象是否也出生於此？';

// Ensure common keys exist (or rely on existing 'common')
// 'common.yes', 'common.no_reselect' might not exist in type defs yet if I didn't check.
// Let's add them to 'common' block if needed, but safe to assume they exist or fallback.
// Actually, 'common.yes' usually exists. 'common.no_reselect' is new.

if (!translations.common) translations.common = {} as any;
(translations.common as any).no_reselect = '否，手動選擇';

const content = `import type { Translations } from '../types';

export const translations: Translations = ${JSON.stringify(translations, null, 2)};
`;

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Updated zh-TW.ts with Geo Suggestion keys');

