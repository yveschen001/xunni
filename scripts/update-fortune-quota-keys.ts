import { translations } from '../src/i18n/locales/zh-TW';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.resolve(__dirname, '../src/i18n/locales/zh-TW.ts');

const f = translations.fortune as any;

f.getMoreInfo = `🔮 *如何獲取算命瓶？*

1. **每週免費**：普通用戶每週 1 個，VIP 每日 1 個。
2. **邀請獎勵**：邀請朋友加入，可獲得獎勵。
3. **漂流瓶獎勵**：發送 10 個漂流瓶，有機會獲得算命瓶。
4. **直接購買**：
   • 小包 {{smallAmount}} 個 - {{smallPrice}} Stars
   • 大包 {{largeAmount}} 個 - {{largePrice}} Stars`;

const content = `import type { Translations } from '../types';

export const translations: Translations = ${JSON.stringify(translations, null, 2)};
`;

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Updated zh-TW.ts with Fortune Quota keys (removed ad)');

