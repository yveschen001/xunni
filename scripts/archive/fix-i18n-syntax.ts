import { translations } from '../src/i18n/locales/zh-TW';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.resolve(__dirname, '../src/i18n/locales/zh-TW.ts');

const f = translations.fortune as any;

// Fix interpolation to use single braces {}
f.quotaDisplay = '🔮 算命瓶: {total} (本週免費: {weekly}/{limit} | 額外: {additional})';

f.getMoreInfo = `🔮 *如何獲取算命瓶？*

1. **每週免費**：普通用戶每週 1 個，VIP 每日 1 個。
2. **邀請獎勵**：邀請朋友加入，可獲得獎勵。
3. **漂流瓶獎勵**：發送 10 個漂流瓶，有機會獲得算命瓶。
4. **直接購買**：
   • 小包 {smallAmount} 個 - {smallPrice} Stars
   • 大包 {largeAmount} 個 - {largePrice} Stars`;

f.buySmall = '購買 {amount} 個 ({price} Stars)';
f.buyLarge = '購買 {amount} 個 ({price} Stars)';
f.invoiceTitle = '購買 {amount} 個算命瓶';
f.purchaseSuccess = '🎉 購買成功！已增加 {amount} 個算命瓶。';

// Add missing VIP key
if (!translations.vip) translations.vip = {} as any;
(translations.vip as any).upgrade = '升級 VIP';

const content = `import type { Translations } from '../types';

export const translations: Translations = ${JSON.stringify(translations, null, 2)};
`;

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Updated zh-TW.ts with fixed interpolation syntax and missing keys');

