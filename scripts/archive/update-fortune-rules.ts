import { translations } from '../src/i18n/locales/zh-TW';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.resolve(__dirname, '../src/i18n/locales/zh-TW.ts');

const f = translations.fortune as any;

// Update rules text
f.getMoreInfo = `🔮 *如何獲取算命瓶？*

1. **每週免費**：普通用戶每週 1 個，VIP 每日 1 個。
2. **邀請獎勵**：邀請一位朋友加入，而該朋友也成功邀請一位朋友加入時，您將獲得獎勵（朋友的朋友）。
3. **漂流瓶獎勵**：每發送 10 個漂流瓶，必得 1 個算命瓶。
4. **直接購買**：
   • 小包 {smallAmount} 個 - {smallPrice} Stars
   • 大包 {largeAmount} 個 - {largePrice} Stars`;

// Add new reward notifications
f.bottleReward = '🎉 恭喜！您已發送 {count} 個漂流瓶，獲得 1 個算命瓶獎勵！';
f.inviteChainReward = '🎉 恭喜！您邀請的朋友成功邀請了新朋友加入，您獲得 1 個算命瓶獎勵！';

const content = `import type { Translations } from '../types';

export const translations: Translations = ${JSON.stringify(translations, null, 2)};
`;

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Updated zh-TW.ts with corrected Fortune rules and new reward keys');

