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
export function formatDailyStatsReport(stats: DailyStats, previousStats?: DailyStats): string {
  const date = new Date(stats.statDate);
  const dateStr = date.toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
  });

  let message = `📊 XunNi Bot 每日數據報告\n`;
  message += `日期：${dateStr}\n\n`;

  // 漂流瓶統計
  message += `🎈 漂流瓶統計\n`;
  message += `• 總數：${stats.totalBottles}`;
  if (previousStats) {
    const diff = stats.totalBottles - previousStats.totalBottles;
    message += ` (${diff >= 0 ? '+' : ''}${diff})`;
  }
  message += `\n`;
  message += `• 昨日新增：${stats.newBottles}\n`;
  message += `• 昨日被撿：${stats.caughtBottles}\n\n`;

  // 對話統計
  message += `💬 對話統計\n`;
  message += `• 總對話數：${stats.totalConversations}`;
  if (previousStats) {
    const diff = stats.totalConversations - previousStats.totalConversations;
    message += ` (${diff >= 0 ? '+' : ''}${diff})`;
  }
  message += `\n`;
  message += `• 總訊息數：${stats.totalMessages}`;
  if (previousStats) {
    const diff = stats.totalMessages - previousStats.totalMessages;
    message += ` (${diff >= 0 ? '+' : ''}${diff})`;
  }
  message += `\n`;
  message += `• 昨日新增訊息：${stats.newMessages}\n\n`;

  // 用戶統計
  message += `👥 用戶統計\n`;
  message += `• 總註冊數：${stats.totalUsers}`;
  if (previousStats) {
    const diff = stats.totalUsers - previousStats.totalUsers;
    message += ` (${diff >= 0 ? '+' : ''}${diff})`;
  }
  message += `\n`;
  message += `• 昨日新增：${stats.newUsers}\n`;
  message += `• 昨日活躍：${stats.activeUsers}\n\n`;

  // VIP 統計
  message += `💎 VIP 統計\n`;
  message += `• 總 VIP 數：${stats.totalVip}`;
  if (previousStats) {
    const diff = stats.totalVip - previousStats.totalVip;
    message += ` (${diff >= 0 ? '+' : ''}${diff})`;
  }
  message += `\n`;
  message += `• 昨日新增：${stats.newVip}\n\n`;

  message += `---\n`;
  message += `報告生成時間：${new Date().toLocaleString('zh-TW')}`;

  return message;
}

/**
 * Calculate growth rate
 */
export function calculateGrowthRate(current: number, previous: number): {
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
export function validateStatsData(stats: Partial<DailyStats>): {
  valid: boolean;
  error?: string;
} {
  if (!stats.statDate) {
    return { valid: false, error: '統計日期不能為空' };
  }

  // Check date format (YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(stats.statDate)) {
    return { valid: false, error: '日期格式錯誤，應為 YYYY-MM-DD' };
  }

  return { valid: true };
}

