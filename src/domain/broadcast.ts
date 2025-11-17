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
 */
export function calculateBatchSize(totalUsers: number): {
  batchSize: number;
  batchCount: number;
  delayMs: number;
} {
  const batchSize = 25; // Telegram rate limit
  const batchCount = Math.ceil(totalUsers / batchSize);
  const delayMs = 1000; // 1 second between batches

  return { batchSize, batchCount, delayMs };
}

