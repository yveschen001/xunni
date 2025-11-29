import fs from 'fs';

const CSV_PATH = 'i18n_for_translation.csv';
let content = fs.readFileSync(CSV_PATH, 'utf-8');

// Identify the start of the last known good record
const lastGoodKey = 'mbti.share.resultDesc';
const lastGoodIndex = content.lastIndexOf(lastGoodKey);

if (lastGoodIndex !== -1) {
  // Find the end of that line. Since we saw it in tail, it ends with "Sinun kannattaa myös kokeilla testiä～"
  // We scan for the next newline that is NOT inside quotes.
  // Simple heuristic: read until next newline.
  let p = lastGoodIndex;
  while (p < content.length && content[p] !== '\n') {
    p++;
  }
  
  // Truncate
  const validContent = content.substring(0, p + 1);
  
  // Re-append the keys that were broken + the new Geo keys
  const missingKeys = [
    // Previously added keys
    { key: 'vip.retentionNotice', 'zh-TW': '\n\n📌 數據保留說明：\n• VIP 用戶聊天記錄保留 3 年\n• 普通用戶聊天記錄保留 1 年' },
    { key: 'messageForward.urlVipOnly', 'zh-TW': '🔒 檢測到社群媒體連結\n此類連結僅限 VIP 用戶發送：' },
    { key: 'messageForward.upgradeVipLink', 'zh-TW': '💡 升級 VIP 即可解鎖發送 YouTube, Instagram, X 等社群連結！' },
    { key: 'messageForward.upgradeToUnlock', 'zh-TW': '💎 立即升級 VIP 解鎖權限' },
    
    // New Geo Keys
    { key: 'geo.select_continent', 'zh-TW': '請選擇您所在的地區 🌍', en: 'Select your region 🌍' },
    { key: 'geo.select_country', 'zh-TW': '請選擇國家', en: 'Select Country' },
    { key: 'geo.search_city_prompt', 'zh-TW': '請輸入城市名稱（例如：Taipei）', en: 'Enter city name (e.g. Taipei)' },
    { key: 'geo.city_not_found', 'zh-TW': '找不到該城市，請嘗試英文名稱。', en: 'City not found. Try English name.' },
    { key: 'geo.confirm_city', 'zh-TW': '您選擇的是：{city} ({country}) 嗎？', en: 'Did you select: {city} ({country})?' },
    { key: 'geo.continent.asia', 'zh-TW': '亞洲', en: 'Asia' },
    { key: 'geo.continent.europe', 'zh-TW': '歐洲', en: 'Europe' },
    { key: 'geo.continent.north_america', 'zh-TW': '北美洲', en: 'North America' },
    { key: 'geo.continent.south_america', 'zh-TW': '南美洲', en: 'South America' },
    { key: 'geo.continent.africa', 'zh-TW': '非洲', en: 'Africa' },
    { key: 'geo.continent.oceania', 'zh-TW': '大洋洲', en: 'Oceania' },
    { key: 'geo.btn_search_manually', 'zh-TW': '🔍 手動搜尋城市', en: '🔍 Search Manually' },
    { key: 'common.back', 'zh-TW': '🔙 返回', en: '🔙 Back' },
    { key: 'common.confirm', 'zh-TW': '✅ 確認', en: '✅ Confirm' },
    { key: 'common.cancel', 'zh-TW': '❌ 取消', en: '❌ Cancel' }
  ];
  
  // Total columns = 41. Key + zh-TW + zh-CN + en + ... (37 others)
  // We need to fill columns correctly.
  // The header is: key,zh-TW,zh-CN,en,ja,ko,vi,th,id,ms,tl,hi,ar,ur,fa,he,tr,ru,uk,pl,cs,ro,hu,bn,hr,sk,sl,sr,mk,sq,el,de,fr,es,it,pt,nl,sv,no,da,fi
  
  // Mapping for known langs in missingKeys
  const colIndex = {
    'zh-TW': 1,
    'en': 3
  };
  
  let appendStr = '';
  
  for (const item of missingKeys) {
    const row = new Array(41).fill('');
    row[0] = item.key;
    
    if (item['zh-TW']) row[1] = item['zh-TW'];
    if (item['en']) row[3] = item['en'];
    
    // CSV escape
    const escapedRow = row.map(cell => {
      if (cell === undefined || cell === null) return '';
      const str = String(cell);
      if (str.includes(',') || str.includes('\n') || str.includes('"')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    });
    
    appendStr += escapedRow.join(',') + '\n';
  }
  
  fs.writeFileSync(CSV_PATH, validContent + appendStr);
  console.log('Fixed and updated CSV file.');
} else {
  console.error('Could not find anchor line.');
}

