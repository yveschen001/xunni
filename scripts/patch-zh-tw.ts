
import fs from 'fs';
import path from 'path';

const filePath = path.resolve(process.cwd(), 'src/i18n/locales/zh-TW.ts');
let content = fs.readFileSync(filePath, 'utf-8');

const anchor = `text: \`/maintenance_status - 查看維護狀態\`,`;
const insertion = `
    admin_ads: \`\\n/admin_ads - 管理官方廣告\\n\`,
    admin_tasks: \`\\n/admin_tasks - 管理社群任務\`,`;

if (content.includes('admin_ads:')) {
  console.log('Keys already exist, skipping patch.');
} else if (content.includes(anchor)) {
  content = content.replace(anchor, anchor + insertion);
  fs.writeFileSync(filePath, content, 'utf-8');
  console.log('✅ Successfully patched zh-TW.ts');
} else {
  console.error('❌ Could not find anchor text in zh-TW.ts');
  process.exit(1);
}

