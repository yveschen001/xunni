import { translations } from '../src/i18n/locales/zh-TW';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.resolve(__dirname, '../src/i18n/locales/zh-TW.ts');

// Add the key manually
if (!translations.vip) translations.vip = {};
(translations.vip as any).retentionNotice = '\n\n📌 數據保留說明：\n• VIP 用戶聊天記錄保留 3 年\n• 普通用戶聊天記錄保留 1 年';

const content = `import type { Translations } from '../types';

export const translations: Translations = ${JSON.stringify(translations, null, 2)};
`;

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Force updated zh-TW.ts');

