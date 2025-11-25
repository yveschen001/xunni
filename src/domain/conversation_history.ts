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
  content: string,
  i18n?: any
): string {
  const timeStr = formatTime(time);
  const directionLabel = direction === 'sent'
    ? (i18n?.t('conversationHistory.you') || '你')
    : (i18n?.t('conversationHistory.other') || '對方');
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
  isVip?: boolean,
  i18n?: any
): string {
  if (i18n) {
    let content = i18n.t('conversationHistory.title', { identifier, postNumber }) + '\n\n';

    // Add partner info at the top if provided
    if (partnerInfo) {
      content += i18n.t('conversationHistory.partnerInfo') + '\n';
      content += i18n.t('conversationHistory.nickname', { nickname: partnerInfo.maskedNickname }) + '\n';
      content += i18n.t('conversationHistory.mbti', { mbti: partnerInfo.mbti }) + '\n';
      content += i18n.t('conversationHistory.bloodType', { bloodType: partnerInfo.bloodType }) + '\n';
      content += i18n.t('conversationHistory.zodiac', { zodiac: partnerInfo.zodiac }) + '\n';
      if (partnerInfo.matchScore) {
        content += i18n.t('conversationHistory.matchScore', { score: Math.round(partnerInfo.matchScore) }) + '\n';
      }
      content += '\n';
    }

    content += '━━━━━━━━━━━━━━━━\n\n';
    content += messages.join('\n') + '\n\n';
    content += '━━━━━━━━━━━━━━━━\n\n';
    content += i18n.t('conversationHistory.historyNote') + '\n';
    content += i18n.t('conversationHistory.totalMessages', { count: totalMessages }) + '\n';
    content += i18n.t('conversationHistory.lastUpdated', { time: formatDateTime(new Date()) }) + '\n\n';
    content += i18n.t('conversationHistory.replyHint') + '\n';

    // Add VIP upgrade hint for free users
    if (isVip === false) {
      content += '\n' + i18n.t('conversationHistory.vipUnlockAvatar') + '\n';
      content += i18n.t('conversationHistory.vipLearnMore');
    }

    return content;
  }

  // Fallback to default Chinese (向后兼容) - 使用硬編碼作為最後的 fallback
  // 注意：這部分應該很少被使用，因為調用方應該總是傳入 i18n
  // 以下所有 fallback 字符串都應該使用 i18n.t() 替代，這些僅作為最後的備用方案
  const fallbackTitle = `💬 與 #${identifier} 的對話記錄（第 ${postNumber} 頁）\n\n`; // Fallback only, should use i18n.t('conversationHistory.title')
  const fallbackPartnerInfo = partnerInfo
    ? `👤 對方資料：\n` + // Fallback only, should use i18n.t('conversationHistory.partnerInfo')
      `📝 暱稱：${partnerInfo.maskedNickname}\n` + // Fallback only, should use i18n.t('conversationHistory.nickname')
      `🧠 MBTI：${partnerInfo.mbti}\n` + // Fallback only, should use i18n.t('conversationHistory.mbti')
      `🩸 血型：${partnerInfo.bloodType}\n` + // Fallback only, should use i18n.t('conversationHistory.bloodType')
      `⭐ 星座：${partnerInfo.zodiac}\n` + // Fallback only, should use i18n.t('conversationHistory.zodiac')
      (partnerInfo.matchScore ? `💫 配對度：${Math.round(partnerInfo.matchScore)}分\n` : '') + // Fallback only, should use i18n.t('conversationHistory.matchScore')
      `\n`
    : '';
  const fallbackSeparator = `━━━━━━━━━━━━━━━━\n\n`; // Fallback only
  const fallbackHistoryNote = `💡 這是對話的歷史記錄\n`; // Fallback only, should use i18n.t('conversationHistory.historyNote')
  const fallbackTotalMessages = `📊 總訊息數：${totalMessages} 則\n`; // Fallback only, should use i18n.t('conversationHistory.totalMessages')
  const fallbackLastUpdated = `📅 最後更新：${formatDateTime(new Date())}\n\n`; // Fallback only, should use i18n.t('conversationHistory.lastUpdated')
  const fallbackReplyHint = `💬 直接按 /reply 回覆訊息聊天\n`; // Fallback only, should use i18n.t('conversationHistory.replyHint')
  const fallbackVipUnlock = isVip === false ? `\n🔒 升級 VIP 解鎖對方清晰頭像\n💎 使用 /vip 了解更多` : ''; // Fallback only, should use i18n.t('conversationHistory.vipUnlockAvatar') + i18n.t('conversationHistory.vipLearnMore')

  return (
    fallbackTitle +
    fallbackPartnerInfo +
    fallbackSeparator +
    messages.join('\n') +
    '\n\n' +
    fallbackSeparator +
    fallbackHistoryNote +
    fallbackTotalMessages +
    fallbackLastUpdated +
    fallbackReplyHint +
    fallbackVipUnlock
  );
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
  },
  i18n?: any
): string {
  const timeStr = formatTime(messageTime);

  if (i18n) {
    let content = i18n.t('conversationHistory.newMessage', { identifier }) + '\n\n';

    // Add partner info
    if (partnerInfo) {
      content += i18n.t('conversationHistory.partnerInfo') + '\n';
      content += i18n.t('conversationHistory.nickname', { nickname: partnerInfo.maskedNickname }) + '\n';
      content += i18n.t('conversationHistory.mbti', { mbti: partnerInfo.mbti }) + '\n';
      content += i18n.t('conversationHistory.bloodType', { bloodType: partnerInfo.bloodType }) + '\n';
      content += i18n.t('conversationHistory.zodiac', { zodiac: partnerInfo.zodiac }) + '\n';
      if (partnerInfo.matchScore) {
        content += i18n.t('conversationHistory.matchScore', { score: Math.round(partnerInfo.matchScore) }) + '\n';
      }
      content += '\n';
    }

    const otherLabel = i18n.t('conversationHistory.other');
    content += `[${timeStr}] ${otherLabel}：\n${messageContent}\n\n`;
    content += '━━━━━━━━━━━━━━━━\n\n';
    content += i18n.t('conversationHistory.replyHint') + '\n';
    content += i18n.t('conversationHistory.viewHistory', { identifier }) + '\n';
    content += i18n.t('conversationHistory.backToMenu');

    return content;
  }

  // Fallback to default Chinese (向后兼容) - 使用硬編碼作為最後的 fallback
  // 注意：這部分應該很少被使用，因為調用方應該總是傳入 i18n
  const fallbackTitle = `💬 來自 #${identifier} 的新訊息：\n\n`;
  const fallbackPartnerInfo = partnerInfo
    ? `👤 對方資料：\n` +
      `📝 暱稱：${partnerInfo.maskedNickname}\n` +
      `🧠 MBTI：${partnerInfo.mbti}\n` +
      `🩸 血型：${partnerInfo.bloodType}\n` +
      `⭐ 星座：${partnerInfo.zodiac}\n` +
      (partnerInfo.matchScore ? `💫 配對度：${Math.round(partnerInfo.matchScore)}分\n` : '') +
      `\n`
    : '';
  const fallbackMessage = `[${timeStr}] 對方：\n${messageContent}\n\n`;
  const fallbackSeparator = `━━━━━━━━━━━━━━━━\n\n`;
  const fallbackReplyHint = `💬 直接按 /reply 回覆訊息聊天\n`;
  const fallbackViewHistory = `📜 查看歷史記錄：#${identifier}\n`;
  const fallbackBackToMenu = `🏠 返回主選單：/menu`;

  return (
    fallbackTitle +
    fallbackPartnerInfo +
    fallbackMessage +
    fallbackSeparator +
    fallbackReplyHint +
    fallbackViewHistory +
    fallbackBackToMenu
  );
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
