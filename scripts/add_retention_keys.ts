import { appendFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CSV_PATH = path.resolve(__dirname, '../i18n_for_translation.csv');

const newKeys = [
  { 
    key: 'messageForward.urlVipOnly', 
    zh: '🔒 檢測到社群媒體連結\\n此類連結僅限 VIP 用戶發送：' 
  },
  { 
    key: 'messageForward.upgradeVipLink', 
    zh: '💡 升級 VIP 即可解鎖發送 YouTube, Instagram, X 等社群連結！' 
  },
  { 
    key: 'messageForward.upgradeToUnlock', 
    zh: '💎 立即升級 VIP 解鎖權限' 
  }
];

// ...

for (const newKey of newKeys) {
  const csvLine = `\n${newKey.key},"${newKey.zh}",,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,`;
  try {
    appendFileSync(CSV_PATH, csvLine, 'utf8');
    console.log(`✅ Appended: ${newKey.key}`);
  } catch (error) {
    console.error('Failed to append:', error);
  }
}


