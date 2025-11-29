import fs from 'fs';

const path = 'src/i18n/locales/zh-TW.ts';
let content = fs.readFileSync(path, 'utf-8');

// Check if geo key exists
if (!content.includes('"geo": {')) {
  // Find insertion point (before last "};")
  const lastBrace = content.lastIndexOf('};');
  if (lastBrace !== -1) {
    const patch = `,
  "geo": {
    "select_continent": "請選擇您所在的地區 🌍",
    "select_country": "請選擇國家",
    "search_city_prompt": "請輸入城市名稱（例如：Taipei）",
    "city_not_found": "找不到該城市，請嘗試英文名稱。",
    "confirm_city": "您選擇的是：{city} ({country}) 嗎？",
    "continent": {
      "asia": "亞洲",
      "europe": "歐洲",
      "north_america": "北美洲",
      "south_america": "南美洲",
      "africa": "非洲",
      "oceania": "大洋洲"
    },
    "btn_search_manually": "🔍 手動搜尋城市"
  }
`;
    content = content.slice(0, lastBrace) + patch + content.slice(lastBrace);
    fs.writeFileSync(path, content);
    console.log('Patched zh-TW.ts');
  } else {
    console.log('Could not find insertion point');
  }
} else {
  console.log('geo key already exists');
}

