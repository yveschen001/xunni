
import * as fs from 'fs';
import * as path from 'path';

const CSV_PATH = path.join(process.cwd(), 'i18n_for_translation.csv');

// Keys to append
const newEntries = [
  { key: 'tasks.name.mars049_bot', zh: '發射-Mars2049-殖民火星' },
  { key: 'tasks.desc.mars049_bot', zh: '發射-Mars2049-殖民火星' },
  { key: 'tasks.name.moonpacket_bot', zh: '紅包-moonpacket-社交' },
  { key: 'tasks.desc.moonpacket_bot', zh: '紅包-moonpacket-社交' },
  { key: 'tasks.name.moonpacket_group', zh: '加入moonpacket交流群' },
  { key: 'tasks.desc.moonpacket_group', zh: 'moonpacket 紅包群' },
  { key: 'tasks.name.moonpacket_channel', zh: '訂閱moonpacket官方頻道' },
  { key: 'tasks.desc.moonpacket_channel', zh: '訂閱moonpacket 紅包頻道' },
];

async function appendKeys() {
  console.log('📖 Reading CSV file...');
  let content = fs.readFileSync(CSV_PATH, 'utf-8');
  
  // Basic CSV validation (check header row count to know how many commas to add)
  const lines = content.split('\n');
  const header = lines[0];
  const totalColumns = header.split(',').length;
  // First column is key, second is zh-TW. We need totalColumns - 2 commas to fill empty slots
  const emptyCommas = ','.repeat(totalColumns - 2);

  console.log(`📊 Total columns detected: ${totalColumns}`);

  let addedCount = 0;
  for (const entry of newEntries) {
    // Check if key already exists
    if (content.includes(`"${entry.key}"`) || content.includes(`${entry.key},`)) {
      console.log(`⚠️ Key ${entry.key} already exists, skipping.`);
      continue;
    }

    // Append new line
    // Format: key, zh-TW, (empty others)
    // Note: Assuming standard CSV escaping if needed, but these keys/values are simple.
    // If values contain commas, they should be quoted.
    const cleanZh = entry.zh.includes(',') ? `"${entry.zh}"` : entry.zh;
    const newLine = `${entry.key},${cleanZh}${emptyCommas}`;
    
    content += '\n' + newLine;
    addedCount++;
    console.log(`✅ Added: ${entry.key}`);
  }

  if (addedCount > 0) {
    fs.writeFileSync(CSV_PATH, content, 'utf-8');
    console.log(`🎉 Successfully appended ${addedCount} new keys to ${CSV_PATH}`);
  } else {
    console.log('ℹ️ No new keys to add.');
  }
}

appendKeys().catch(console.error);

