import { translations } from '../src/i18n/locales/zh-TW';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.resolve(__dirname, '../src/i18n/locales/zh-TW.ts');

// Ensure common exists
if (!translations.common) translations.common = {} as any;
const common = translations.common as any;
common.fortuneBottle = '算命瓶';

// Ensure profile exists
if (!translations.profile) translations.profile = {} as any;
const profile = translations.profile as any;
profile.fortuneQuota = '🔮 {fortuneBottle}: {total} (本週免費: {weekly}/{limit} | 額外: {additional})';

// Ensure stats exists
if (!translations.stats) translations.stats = {} as any;
const stats = translations.stats as any;
stats.fortuneTitle = '\n🔮 **{fortuneBottle}**\n';
stats.fortuneReadings = '• 算命次數 : {count}\n';
stats.fortuneQuota = '• 剩餘額度 : {quota}';

const content = `import type { Translations } from '../types';

export const translations: Translations = ${JSON.stringify(translations, null, 2)};
`;

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Updated zh-TW.ts with Fortune Bottle UI keys');

