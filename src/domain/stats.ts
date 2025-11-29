/**
 * Statistics Domain Logic
 * Pure functions for statistics business logic
 */

export interface DailyStats {
  id?: number;
  statDate: string; // YYYY-MM-DD
  totalBottles: number;
  newBottles: number;
  caughtBottles: number;
  totalConversations: number;
  newConversations: number;
  totalMessages: number;
  newMessages: number;
  totalUsers: number;
  newUsers: number;
  activeUsers: number;
  totalVip: number;
  newVip: number;
  createdAt?: string;
}

/**
 * Format daily stats report for admin
 */
export function formatDailyStatsReport(
  stats: DailyStats,
  previousStats?: DailyStats,
  i18n?: any
): string {
  const date = new Date(stats.statDate);
  const language = i18n?.language || 'zh-TW';
  const dateStr = date.toLocaleDateString(language, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
  });

  const formatDiff = (diff: number) => (diff >= 0 ? `+${diff}` : `${diff}`);

  let message = (i18n?.t('stats.title') || '📊 XunNi Bot 每日數據報告') + '\n';
  message += i18n?.t('stats.date', { date: dateStr }) || `日期：${dateStr}\n\n`;

  // 漂流瓶統計
  message += (i18n?.t('stats.bottles') || '🎈 漂流瓶統計') + '\n';
  const bottlesDiff = previousStats ? stats.totalBottles - previousStats.totalBottles : null;
  if (bottlesDiff !== null) {
    message +=
      i18n?.t('stats.totalWithDiff', {
        total: stats.totalBottles,
        diff: formatDiff(bottlesDiff),
      }) || `• 總數：${stats.totalBottles} (${formatDiff(bottlesDiff)})`;
  } else {
    message +=
      i18n?.t('stats.total', { total: stats.totalBottles }) || `• 總數：${stats.totalBottles}`;
  }
  message += '\n';
  message += i18n?.t('stats.new', { new: stats.newBottles }) || `• 昨日新增：${stats.newBottles}\n`;
  message +=
    i18n?.t('stats.caught', { caught: stats.caughtBottles }) ||
    `• 昨日被撿：${stats.caughtBottles}\n\n`;

  // 對話統計
  message += (i18n?.t('stats.conversations') || '💬 對話統計') + '\n';
  const conversationsDiff = previousStats
    ? stats.totalConversations - previousStats.totalConversations
    : null;
  if (conversationsDiff !== null) {
    message +=
      i18n?.t('stats.totalWithDiff', {
        total: stats.totalConversations,
        diff: formatDiff(conversationsDiff),
      }) || `• 總對話數：${stats.totalConversations} (${formatDiff(conversationsDiff)})`;
  } else {
    message +=
      i18n?.t('stats.totalConversations', { total: stats.totalConversations }) ||
      `• 總對話數：${stats.totalConversations}`;
  }
  message += '\n';
  const messagesDiff = previousStats ? stats.totalMessages - previousStats.totalMessages : null;
  if (messagesDiff !== null) {
    message +=
      i18n?.t('stats.totalWithDiff', {
        total: stats.totalMessages,
        diff: formatDiff(messagesDiff),
      }) || `• 總訊息數：${stats.totalMessages} (${formatDiff(messagesDiff)})`;
  } else {
    message +=
      i18n?.t('stats.totalMessages', { total: stats.totalMessages }) ||
      `• 總訊息數：${stats.totalMessages}`;
  }
  message += '\n';
  message +=
    i18n?.t('stats.newMessages', { new: stats.newMessages }) ||
    `• 昨日新增訊息：${stats.newMessages}\n\n`;

  // 用戶統計
  message += (i18n?.t('stats.users') || '👥 用戶統計') + '\n';
  const usersDiff = previousStats ? stats.totalUsers - previousStats.totalUsers : null;
  if (usersDiff !== null) {
    message +=
      i18n?.t('stats.totalWithDiff', { total: stats.totalUsers, diff: formatDiff(usersDiff) }) ||
      `• 總註冊數：${stats.totalUsers} (${formatDiff(usersDiff)})`;
  } else {
    message +=
      i18n?.t('stats.totalUsers', { total: stats.totalUsers }) || `• 總註冊數：${stats.totalUsers}`;
  }
  message += '\n';
  message +=
    i18n?.t('stats.newUsers', { new: stats.newUsers }) || `• 昨日新增：${stats.newUsers}\n`;
  message +=
    i18n?.t('stats.activeUsers', { active: stats.activeUsers }) ||
    `• 昨日活躍：${stats.activeUsers}\n\n`;

  // VIP 統計
  message += (i18n?.t('stats.vip') || '💎 VIP 統計') + '\n';
  const vipDiff = previousStats ? stats.totalVip - previousStats.totalVip : null;
  if (vipDiff !== null) {
    message +=
      i18n?.t('stats.totalWithDiff', { total: stats.totalVip, diff: formatDiff(vipDiff) }) ||
      `• 總 VIP 數：${stats.totalVip} (${formatDiff(vipDiff)})`;
  } else {
    message +=
      i18n?.t('stats.totalVip', { total: stats.totalVip }) || `• 總 VIP 數：${stats.totalVip}`;
  }
  message += '\n';
  message += i18n?.t('stats.newVip', { new: stats.newVip }) || `• 昨日新增：${stats.newVip}\n\n`;

  message += i18n?.t('stats.separator') || '---\n';
  message +=
    i18n?.t('stats.reportTime', { time: new Date().toLocaleString(language) }) ||
    `報告生成時間：${new Date().toLocaleString(language)}`;

  return message;
}

/**
 * Calculate growth rate
 */
export function calculateGrowthRate(
  current: number,
  previous: number
): {
  rate: number;
  rateText: string;
} {
  if (previous === 0) {
    return { rate: 0, rateText: 'N/A' };
  }

  const rate = ((current - previous) / previous) * 100;
  const rateText = `${rate >= 0 ? '+' : ''}${rate.toFixed(2)}%`;

  return { rate, rateText };
}

/**
 * Get today's date string (YYYY-MM-DD)
 */
export function getTodayDateString(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

/**
 * Get yesterday's date string (YYYY-MM-DD)
 */
export function getYesterdayDateString(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split('T')[0];
}

/**
 * Validate stats data
 */
export function validateStatsData(
  stats: Partial<DailyStats>,
  i18n?: any
): {
  valid: boolean;
  error?: string;
} {
  if (!stats.statDate) {
    return { valid: false, error: i18n?.t('stats.statDateEmpty') || '統計日期不能為空' };
  }

  // Check date format (YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(stats.statDate)) {
    return {
      valid: false,
      error: i18n?.t('stats.dateFormatError') || '日期格式錯誤，應為 YYYY-MM-DD',
    };
  }

  return { valid: true };
}
