/**
 * Broadcast Domain Logic
 * Pure functions for broadcast business logic
 */

export interface Broadcast {
  id: number;
  message: string;
  targetType: 'all' | 'vip' | 'non_vip' | 'filtered';
  status: 'pending' | 'sending' | 'completed' | 'failed' | 'cancelled';
  totalUsers: number;
  sentCount: number;
  failedCount: number;
  createdBy: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  errorMessage?: string;
  filterJson?: string; // JSON string of BroadcastFilters
}

export interface BroadcastTarget {
  type: 'all' | 'vip' | 'non_vip' | 'filtered';
  userIds: string[];
}

/**
 * Validate broadcast message
 */
export function validateBroadcastMessage(message: string, i18n?: any): {
  valid: boolean;
  error?: string;
  errorCode?: string;
  errorParams?: Record<string, any>;
} {
  if (!message || message.trim().length === 0) {
    return {
      valid: false,
      error: i18n?.t('broadcast.empty') || '廣播訊息不能為空', // 保留，向后兼容
      errorCode: 'broadcast.empty', // 新增
    };
  }

  if (message.length > 4000) {
    return {
      valid: false,
      error: i18n?.t('broadcast.tooLong', { max: 4000, current: message.length }) || '廣播訊息不能超過 4000 個字符', // 保留
      errorCode: 'broadcast.tooLong', // 新增
      errorParams: { max: 4000, current: message.length }, // 新增
    };
  }

  return { valid: true };
}

/**
 * Calculate broadcast progress
 */
export function calculateBroadcastProgress(broadcast: Broadcast, i18n?: any): {
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
    status = i18n?.t('broadcast.status.completed') || '已完成';
  } else if (broadcast.status === 'sending') {
    status = i18n?.t('broadcast.status.sending') || '發送中';
  } else if (broadcast.status === 'failed') {
    status = i18n?.t('broadcast.status.failed') || '失敗';
  } else if (broadcast.status === 'cancelled') {
    status = i18n?.t('broadcast.status.cancelled') || '已取消';
  } else {
    status = i18n?.t('broadcast.status.pending') || '等待中';
  }

  return { percentage, remaining, status };
}

/**
 * Format broadcast status message
 */
export function formatBroadcastStatus(broadcast: Broadcast, i18n?: any): string {
  const progress = calculateBroadcastProgress(broadcast, i18n);
  const targetName = getBroadcastTargetName(broadcast.targetType, i18n);
  const language = i18n?.locale || 'zh-TW';

  if (i18n) {
    let message = i18n.t('broadcast.statusTitle') + '\n\n';
    message += i18n.t('broadcast.id', { id: broadcast.id }) + '\n';
    message += i18n.t('broadcast.status', { status: progress.status }) + '\n';
    message += i18n.t('broadcast.target', { target: targetName }) + '\n';
    message += i18n.t('broadcast.progress', { sent: broadcast.sentCount, total: broadcast.totalUsers, percentage: progress.percentage }) + '\n';

    if (broadcast.failedCount > 0) {
      message += i18n.t('broadcast.failed', { count: broadcast.failedCount }) + '\n';
    }

    if (broadcast.startedAt) {
      message += i18n.t('broadcast.startedAt', { time: new Date(broadcast.startedAt).toLocaleString(language) }) + '\n';
    }

    if (broadcast.completedAt) {
      message += i18n.t('broadcast.completedAt', { time: new Date(broadcast.completedAt).toLocaleString(language) }) + '\n';
    }

    if (broadcast.errorMessage) {
      message += '\n' + i18n.t('broadcast.error', { error: broadcast.errorMessage });
    }

    return message;
  }

  // Fallback to default Chinese (向后兼容)
  const fallbackLanguage = 'zh-TW';
  let message = (i18n?.t('broadcast.statusTitle') || '📊 廣播狀態') + '\n\n';
  message += (i18n?.t('broadcast.id', { id: broadcast.id }) || `ID: ${broadcast.id}\n`);
  message += (i18n?.t('broadcast.status', { status: progress.status }) || `狀態: ${progress.status}\n`);
  message += (i18n?.t('broadcast.target', { target: targetName }) || `目標: ${targetName}\n`);
  message += (i18n?.t('broadcast.progress', { sent: broadcast.sentCount, total: broadcast.totalUsers, percentage: progress.percentage }) || `進度: ${broadcast.sentCount}/${broadcast.totalUsers} (${progress.percentage}%)\n`);

  if (broadcast.failedCount > 0) {
    message += (i18n?.t('broadcast.failed', { count: broadcast.failedCount }) || `失敗: ${broadcast.failedCount}\n`);
  }

  if (broadcast.startedAt) {
    message += (i18n?.t('broadcast.startedAt', { time: new Date(broadcast.startedAt).toLocaleString(fallbackLanguage) }) || `開始時間: ${new Date(broadcast.startedAt).toLocaleString(fallbackLanguage)}\n`);
  }

  if (broadcast.completedAt) {
    message += (i18n?.t('broadcast.completedAt', { time: new Date(broadcast.completedAt).toLocaleString(fallbackLanguage) }) || `完成時間: ${new Date(broadcast.completedAt).toLocaleString(fallbackLanguage)}\n`);
  }

  if (broadcast.errorMessage) {
    message += '\n' + (i18n?.t('broadcast.error', { error: broadcast.errorMessage }) || `錯誤: ${broadcast.errorMessage}`);
  }

  return message;
}

/**
 * Get broadcast target name
 */
export function getBroadcastTargetName(targetType: 'all' | 'vip' | 'non_vip', i18n?: any): string {
  if (i18n) {
    switch (targetType) {
      case 'all':
        return i18n.t('broadcast.target.all');
      case 'vip':
        return i18n.t('broadcast.target.vip');
      case 'non_vip':
        return i18n.t('broadcast.target.nonVip');
      default:
        return i18n.t('broadcast.target.unknown');
    }
  }

  // Fallback to default Chinese (向后兼容)
  // Note: These fallbacks should rarely be used as i18n should always be provided
  switch (targetType) {
    case 'all':
      return '所有用戶'; // Fallback only, should use i18n.t('broadcast.target.all')
    case 'vip':
      return 'VIP 用戶'; // Fallback only, should use i18n.t('broadcast.target.vip')
    case 'non_vip':
      return '非 VIP 用戶'; // Fallback only, should use i18n.t('broadcast.target.nonVip')
    default:
      return '未知'; // Fallback only, should use i18n.t('broadcast.target.unknown')
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
 * 支援優先級：
 * - high: 瓶子通知（25 msg/batch, 動態延遲）- 保持原有邏輯
 * - low: 廣播/生日祝福（10 msg/batch, 2s 延遲）- 不影響瓶子推送
 *
 * 根據用戶數量動態調整延遲（僅 high priority）：
 * - 1-25 用戶：立即發送（0ms 延遲）
 * - 26-100 用戶：500ms 延遲
 * - 101+ 用戶：1000ms 延遲
 */
export function calculateBatchSize(
  totalUsers: number,
  priority: 'high' | 'low' = 'high'
): {
  batchSize: number;
  batchCount: number;
  delayMs: number;
} {
  // 低優先級：廣播、生日祝福（不影響瓶子推送）
  if (priority === 'low') {
    const batchSize = 10; // 降低批次大小
    const batchCount = Math.ceil(totalUsers / batchSize);
    const delayMs = 2000; // 增加延遲（5 msg/sec）
    return { batchSize, batchCount, delayMs };
  }

  // 高優先級：瓶子通知（保持原有邏輯）
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
 * @param priority 優先級（high: 瓶子通知, low: 廣播）
 * @returns 預估時間描述
 */
export function estimateBroadcastTime(
  totalUsers: number,
  priority: 'high' | 'low' = 'high',
  i18n?: any
): string {
  const { batchCount, delayMs } = calculateBatchSize(totalUsers, priority);

  // 計算總時間（秒）
  // 每批次發送時間約 1 秒 + 批次間延遲
  const totalSeconds = batchCount + ((batchCount - 1) * delayMs) / 1000;

  if (i18n) {
    if (totalUsers <= 25 && priority === 'high') {
      return i18n.t('broadcast.estimate.immediate');
    } else if (totalSeconds < 60) {
      return i18n.t('broadcast.estimate.seconds', { seconds: Math.ceil(totalSeconds) });
    } else {
      const minutes = Math.ceil(totalSeconds / 60);
      return i18n.t('broadcast.estimate.minutes', { minutes });
    }
  }

  // Fallback to default Chinese (向后兼容)
  if (totalUsers <= 25 && priority === 'high') {
    return '立即發送（約 1-2 秒）';
  } else if (totalSeconds < 60) {
    return `約 ${Math.ceil(totalSeconds)} 秒`;
  } else {
    const minutes = Math.ceil(totalSeconds / 60);
    return `約 ${minutes} 分鐘`;
  }
}
