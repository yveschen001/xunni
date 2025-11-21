/**
 * Conversation History Domain Logic
 *
 * Pure functions for managing conversation history posts
 */

// Maximum characters per history post (留 200 字符緩衝)
export const MAX_HISTORY_POST_CHARS = 3800;

/**
 * Format a message entry for history post
 */
export function formatMessageEntry(
  time: Date,
  direction: 'sent' | 'received',
  content: string
): string {
  const timeStr = formatTime(time);
  const directionLabel = direction === 'sent' ? '你' : '對方';
  return `[${timeStr}] ${directionLabel}：${content}`;
}

/**
 * Format time as HH:MM
 */
function formatTime(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Format date as YYYY-MM-DD HH:MM
 */
function formatDateTime(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

/**
 * Build history post content
 */
export function buildHistoryPostContent(
  identifier: string,
  postNumber: number,
  messages: string[],
  totalMessages: number,
  partnerInfo?: {
    maskedNickname: string;
    mbti: string;
    bloodType: string;
    zodiac: string;
    matchScore?: number;
  },
  isVip?: boolean
): string {
  let content = `💬 與 #${identifier} 的對話記錄（第 ${postNumber} 頁）\n\n`;

  // Add partner info at the top if provided
  if (partnerInfo) {
    content += `👤 對方資料：\n`;
    content += `📝 暱稱：${partnerInfo.maskedNickname}\n`;
    content += `🧠 MBTI：${partnerInfo.mbti}\n`;
    content += `🩸 血型：${partnerInfo.bloodType}\n`;
    content += `⭐ 星座：${partnerInfo.zodiac}\n`;
    if (partnerInfo.matchScore) {
      content += `💫 配對度：${Math.round(partnerInfo.matchScore)}分\n`;
    }
    content += `\n`;
  }

  content += `━━━━━━━━━━━━━━━━\n\n`;

  content += messages.join('\n') + '\n\n';

  content += `━━━━━━━━━━━━━━━━\n\n`;
  content += `💡 這是對話的歷史記錄\n`;
  content += `📊 總訊息數：${totalMessages} 則\n`;
  content += `📅 最後更新：${formatDateTime(new Date())}\n\n`;

  content += `💬 直接按 /reply 回覆訊息聊天\n`;
  
  // Add VIP upgrade hint for free users
  if (isVip === false) {
    content += `\n🔒 升級 VIP 解鎖對方清晰頭像\n`;
    content += `💎 使用 /vip 了解更多`;
  }

  return content;
}

/**
 * Build new message post content
 */
export function buildNewMessagePostContent(
  identifier: string,
  messageContent: string,
  messageTime: Date,
  _conversationId: number,
  partnerInfo?: {
    maskedNickname: string;
    mbti: string;
    bloodType: string;
    zodiac: string;
    matchScore?: number;
  }
): string {
  const timeStr = formatTime(messageTime);

  let content = `💬 來自 #${identifier} 的新訊息：\n\n`;

  // Add partner info
  if (partnerInfo) {
    content += `👤 對方資料：\n`;
    content += `📝 暱稱：${partnerInfo.maskedNickname}\n`;
    content += `🧠 MBTI：${partnerInfo.mbti}\n`;
    content += `🩸 血型：${partnerInfo.bloodType}\n`;
    content += `⭐ 星座：${partnerInfo.zodiac}\n`;
    if (partnerInfo.matchScore) {
      content += `💫 配對度：${Math.round(partnerInfo.matchScore)}分\n`;
    }
    content += `\n`;
  }

  content += `[${timeStr}] 對方：\n${messageContent}\n\n`;
  content += `━━━━━━━━━━━━━━━━\n\n`;
  content += `💬 直接按 /reply 回覆訊息聊天\n`;
  content += `📜 查看歷史記錄：#${identifier}\n`;
  content += `🏠 返回主選單：/menu`;

  return content;
}

/**
 * Check if adding a new message would exceed the character limit
 */
export function wouldExceedLimit(currentContent: string, newMessage: string): boolean {
  const newLength = currentContent.length + newMessage.length + 1; // +1 for newline
  return newLength > MAX_HISTORY_POST_CHARS;
}

/**
 * Extract messages array from history post content
 */
export function extractMessages(content: string): string[] {
  const lines = content.split('\n');
  const messages: string[] = [];
  let inMessageSection = false;

  for (const line of lines) {
    if (line.includes('━━━━━━━━━━━━━━━━')) {
      if (!inMessageSection) {
        inMessageSection = true;
        continue;
      } else {
        break;
      }
    }

    if (inMessageSection && line.trim()) {
      messages.push(line);
    }
  }

  return messages;
}
