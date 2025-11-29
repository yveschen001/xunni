import fs from 'fs';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';

const CSV_PATH = 'i18n_for_translation.csv';

const NEW_KEYS = [
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
  // Common Buttons
  { key: 'common.back', 'zh-TW': '🔙 返回', en: '🔙 Back' },
  { key: 'common.confirm', 'zh-TW': '✅ 確認', en: '✅ Confirm' },
  { key: 'common.cancel', 'zh-TW': '❌ 取消', en: '❌ Cancel' }
];

const fileContent = fs.readFileSync(CSV_PATH, 'utf-8');
const records = parse(fileContent, { columns: true, skip_empty_lines: true });

let addedCount = 0;
for (const newItem of NEW_KEYS) {
  const exists = records.find((r: any) => r.key === newItem.key);
  if (!exists) {
    // Create a record with all columns empty except key and translations we have
    const newRecord: any = { key: newItem.key };
    // Fill known languages
    if (newItem['zh-TW']) newRecord['zh-TW'] = newItem['zh-TW'];
    if (newItem['en']) newRecord['en'] = newItem['en'];
    // Fill others with empty string to match schema
    for (const header of Object.keys(records[0])) {
      if (!newRecord[header]) newRecord[header] = '';
    }
    records.push(newRecord);
    addedCount++;
  }
}

if (addedCount > 0) {
  const output = stringify(records, { header: true });
  fs.writeFileSync(CSV_PATH, output);
  console.log(`Added ${addedCount} new keys to CSV.`);
} else {
  console.log('No new keys to add.');
}

