const fs = require('fs');
const path = 'src/i18n/locales/zh-TW.ts';
let content = fs.readFileSync(path, 'utf8');
const search = '"vip": {';
const replace = `"vip": {
    "retentionNotice": "⚠️ **重要提示**：VIP 會員對話記錄將保存 3 年。若停止續費，您的對話記錄將在會員過期後 **30 天** 被刪除。請注意備份重要資訊。",`;

if (content.includes(search)) {
    content = content.replace(search, replace);
    fs.writeFileSync(path, content);
    console.log('Patched zh-TW.ts');
} else {
    console.error('Could not find vip block');
    process.exit(1);
}

