import * as fs from 'fs';
import * as path from 'path';

const csvPath = path.join(process.cwd(), 'i18n_for_translation.csv');

const newKeys = [
  // Tasks (re-adding just in case, script filters existing)
  { key: 'tasks.name.interests', zh: '填寫興趣標籤' },
  { key: 'tasks.description.interests', zh: '讓別人更了解你' },
  { key: 'tasks.name.bio', zh: '完善自我介紹' },
  { key: 'tasks.description.bio', zh: '寫下你的故事（至少 20 字）' },
  { key: 'tasks.name.city', zh: '設定地區' },
  { key: 'tasks.description.city', zh: '找到同城的朋友' },
  { key: 'tasks.name.join_channel', zh: '加入官方頻道' },
  { key: 'tasks.description.join_channel', zh: '獲取最新消息和活動' },
  { key: 'tasks.name.first_bottle', zh: '丟出第一個瓶子' },
  { key: 'tasks.description.first_bottle', zh: '開始你的交友之旅' },
  { key: 'tasks.name.first_catch', zh: '撿起第一個瓶子' },
  { key: 'tasks.description.first_catch', zh: '看看別人的故事' },
  { key: 'tasks.name.first_conversation', zh: '開始第一次對話' },
  { key: 'tasks.description.first_conversation', zh: '建立你的第一個連接（長按訊息 → 選擇「回覆」）' },
  { key: 'tasks.name.invite_progress', zh: '邀請好友' },
  { key: 'tasks.description.invite_progress', zh: '每邀請 1 人，每日額度永久 +1（免費最多 10 人，VIP 最多 100 人）' },
  { key: 'tasks.name.confirm_country', zh: '確認所屬國家' },
  { key: 'tasks.description.confirm_country', zh: '讓其他用戶更了解你' },

  // Push Notifications (New)
  { key: 'push.actionHistory', zh: '📜 查看上下文' },
  { key: 'push.actionReply', zh: '💬 回覆 {masked_partner_name}' },
  { key: 'push.throwReminder', zh: '🌊 嘿！好久沒丟瓶子了，海邊很安靜呢...' },
  { key: 'push.catchReminder', zh: '🎣 海邊漂來了一些新瓶子，要不要去看看？' },
  { key: 'push.onboardingReminder', zh: '👋 你的註冊還沒完成，只差一點點了！(步驟: {step})' },
  { key: 'push.messageReminderA', zh: '👋 Hey {masked_partner_name} 還在等你回覆喔！別讓對話冷掉了～' },
  { key: 'push.messageReminderB', zh: '📩 你有一則來自 {masked_partner_name} 的未讀訊息：\n> "{last_message_preview}..."\n(已經過了 24 小時囉！)' },
  { key: 'push.messageReminderC', zh: '⏳ {masked_partner_name} 正在等待你的回覆...' },

  // Success messages (Missing)
  { key: 'success.bottleThrown', zh: '🍾 漂流瓶已丟出！' },
  { key: 'success.saved', zh: '✅ 設定已保存' },
];

const content = fs.readFileSync(csvPath, 'utf-8');
const lines = content.split('\n');
const header = lines[0];
const columns = header.split(',');
const zhIndex = columns.indexOf('zh-TW');

if (zhIndex === -1) {
  console.error('zh-TW column not found');
  process.exit(1);
}

const existingKeys = new Set(lines.map(l => l.split(',')[0]));

const newRows = newKeys.filter(k => !existingKeys.has(k.key)).map(k => {
  const row = new Array(columns.length).fill('');
  row[0] = k.key;
  // Handle potentially missing values for other columns, default to empty string
  // Ensure we quote the value properly
  row[zhIndex] = `"${k.zh.replace(/"/g, '""')}"`; 
  return row.join(',');
});

if (newRows.length > 0) {
  // Ensure we start on a new line if file doesn't end with one
  const prefix = content.endsWith('\n') ? '' : '\n';
  fs.appendFileSync(csvPath, prefix + newRows.join('\n') + '\n');
  console.log(`Added ${newRows.length} keys to CSV.`);
} else {
  console.log('No new keys to add.');
}
