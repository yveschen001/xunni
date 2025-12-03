const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../src/i18n/locales/zh-TW.ts');
let content = fs.readFileSync(filePath, 'utf8');

const oldContent = `    push: {
      throwReminder: '🌊 嘿！好久沒丟瓶子了，海邊很安靜呢...',
      catchReminder: '🎣 海邊漂來了一些新瓶子，要不要去看看？',
      onboardingReminder: '👋 你的註冊還沒完成，只差一點點了！(步驟: {step})',
    },`;

const newContent = `    push: {
      throwReminder: '🌊 嘿！好久沒丟瓶子了，海邊很安靜呢...',
      catchReminder: '🎣 海邊漂來了一些新瓶子，要不要去看看？',
      onboardingReminder: '👋 你的註冊還沒完成，只差一點點了！(步驟: {step})',
      messageReminderA: '👋 Hey {masked_partner_name} 還在等你回覆喔！別讓對話冷掉了～',
      messageReminderB: '📩 你有一則來自 {masked_partner_name} 的未讀訊息：\\n> "{last_message_preview}..."\\n(已經過了 24 小時囉！)',
      messageReminderC: '⏳ {masked_partner_name} 正在等待你的回覆...',
      actionReply: '💬 回覆 {masked_partner_name}',
      actionHistory: '📜 查看上下文',
    },`;

if (content.includes(oldContent)) {
    content = content.replace(oldContent, newContent);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Successfully updated zh-TW.ts');
} else {
    console.error('Could not find the target string to replace.');
    process.exit(1);
}

