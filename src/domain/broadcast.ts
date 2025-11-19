/**
 * Broadcast Domain Logic
 * Pure functions for broadcast business logic
 */

export interface Broadcast {
  id: number;
  message: string;
  targetType: 'all' | 'vip' | 'non_vip';
  status: 'pending' | 'sending' | 'completed' | 'failed' | 'cancelled';
  totalUsers: number;
  sentCount: number;
  failedCount: number;
  createdBy: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  errorMessage?: string;
}

export interface BroadcastTarget {
  type: 'all' | 'vip' | 'non_vip';
  userIds: string[];
}

/**
 * Validate broadcast message
 */
export function validateBroadcastMessage(message: string): {
  valid: boolean;
  error?: string;
} {
  if (!message || message.trim().length === 0) {
    return { valid: false, error: '廣播訊息不能為空' };
  }

  if (message.length > 4000) {
    return { valid: false, error: '廣播訊息不能超過 4000 個字符' };
  }

  return { valid: true };
}

/**
 * Calculate broadcast progress
 */
export function calculateBroadcastProgress(broadcast: Broadcast): {
  percentage: number;
  remaining: number;
  status: string;
} {
  const total = broadcast.totalUsers;
  const sent = broadcast.sentCount;
  const failed = broadcast.failedCount;
  const processed = sent + failed;
  const remaining = total - processed;
  const percentage = total > 0 ? Math.round((processed / total) * 100) : 0;

  let status: string;
  if (broadcast.status === 'completed') {
    status = '已完成';
  } else if (broadcast.status === 'sending') {
    status = '發送中';
  } else if (broadcast.status === 'failed') {
    status = '失敗';
  } else if (broadcast.status === 'cancelled') {
    status = '已取消';
  } else {
    status = '等待中';
  }

  return { percentage, remaining, status };
}

/**
 * Format broadcast status message
 */
export function formatBroadcastStatus(broadcast: Broadcast): string {
  const progress = calculateBroadcastProgress(broadcast);

  let message = `📊 廣播狀態\n\n`;
  message += `ID: ${broadcast.id}\n`;
  message += `狀態: ${progress.status}\n`;
  message += `目標: ${getBroadcastTargetName(broadcast.targetType)}\n`;
  message += `進度: ${broadcast.sentCount}/${broadcast.totalUsers} (${progress.percentage}%)\n`;

  if (broadcast.failedCount > 0) {
    message += `失敗: ${broadcast.failedCount}\n`;
  }

  if (broadcast.startedAt) {
    message += `開始時間: ${new Date(broadcast.startedAt).toLocaleString('zh-TW')}\n`;
  }

  if (broadcast.completedAt) {
    message += `完成時間: ${new Date(broadcast.completedAt).toLocaleString('zh-TW')}\n`;
  }

  if (broadcast.errorMessage) {
    message += `\n錯誤: ${broadcast.errorMessage}`;
  }

  return message;
}

/**
 * Get broadcast target name
 */
export function getBroadcastTargetName(targetType: 'all' | 'vip' | 'non_vip'): string {
  switch (targetType) {
    case 'all':
      return '所有用戶';
    case 'vip':
      return 'VIP 用戶';
    case 'non_vip':
      return '非 VIP 用戶';
    default:
      return '未知';
  }
}

/**
 * Check if broadcast can be cancelled
 */
export function canCancelBroadcast(broadcast: Broadcast): boolean {
  return broadcast.status === 'pending' || broadcast.status === 'sending';
}

/**
 * Calculate batch size for rate limiting
 * 
 * 根據用戶數量動態調整延遲：
 * - 1-25 用戶：立即發送（0ms 延遲）
 * - 26-100 用戶：500ms 延遲
 * - 101+ 用戶：1000ms 延遲
 */
export function calculateBatchSize(totalUsers: number): {
  batchSize: number;
  batchCount: number;
  delayMs: number;
} {
  const batchSize = 25; // Telegram rate limit: 30 messages/second
  const batchCount = Math.ceil(totalUsers / batchSize);
  
  // 動態調整延遲時間
  let delayMs: number;
  if (totalUsers <= 25) {
    // 單批次，立即發送
    delayMs = 0;
  } else if (totalUsers <= 100) {
    // 小規模廣播，500ms 延遲
    delayMs = 500;
  } else {
    // 大規模廣播，1000ms 延遲（更安全）
    delayMs = 1000;
  }

  return { batchSize, batchCount, delayMs };
}

/**
 * 估算廣播完成時間
 * 
 * @param totalUsers 總用戶數
 * @returns 預估時間描述
 */
export function estimateBroadcastTime(totalUsers: number): string {
  const { batchCount, delayMs } = calculateBatchSize(totalUsers);
  
  // 計算總時間（秒）
  // 每批次發送時間約 1 秒 + 批次間延遲
  const totalSeconds = batchCount + ((batchCount - 1) * delayMs) / 1000;
  
  if (totalUsers <= 25) {
    return '立即發送（約 1-2 秒）';
  } else if (totalSeconds < 60) {
    return `約 ${Math.ceil(totalSeconds)} 秒`;
  } else {
    const minutes = Math.ceil(totalSeconds / 60);
    return `約 ${minutes} 分鐘`;
  }
}
