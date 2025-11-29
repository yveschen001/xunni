import fs from 'fs';

const path = 'src/i18n/locales/zh-TW.ts';
let content = fs.readFileSync(path, 'utf-8');

// Update geo object to include confirm_button
if (content.includes('"geo": {')) {
  content = content.replace(
    '"btn_search_manually": "🔍 手動搜尋城市"',
    '"btn_search_manually": "🔍 手動搜尋城市",\n    "confirm_button": "✅ 確認"'
  );
  fs.writeFileSync(path, content);
  console.log('Updated zh-TW.ts with confirm_button');
} else {
  console.log('geo key not found, please run previous patch first');
}

