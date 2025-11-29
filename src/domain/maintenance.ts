/**
 * Maintenance Mode Domain Logic
 * Pure functions for maintenance mode business logic
 */

export interface MaintenanceMode {
  id: number;
  isActive: boolean;
  startTime?: string;
  endTime?: string;
  estimatedDuration?: number; // minutes
  maintenanceMessage?: string;
  enabledBy?: string;
  enabledAt?: string;
  updatedAt: string;
}

/**
 * Check if system is in maintenance mode
 */
export function isInMaintenanceMode(maintenance: MaintenanceMode | null): boolean {
  if (!maintenance) return false;
  return maintenance.isActive === 1 || maintenance.isActive === true;
}

/**
 * Calculate remaining time
 */
export function calculateRemainingTime(
  maintenance: MaintenanceMode,
  i18n?: any
): {
  remainingMinutes: number;
  remainingText: string;
} {
  if (!maintenance.endTime) {
    return { remainingMinutes: 0, remainingText: i18n?.t('maintenance.unknown') || '未知' };
  }

  const now = new Date();
  const end = new Date(maintenance.endTime);
  const diffMs = end.getTime() - now.getTime();
  const remainingMinutes = Math.max(0, Math.floor(diffMs / 1000 / 60));

  let remainingText: string;
  if (remainingMinutes === 0) {
    remainingText = i18n?.t('maintenance.completingSoon') || '即將完成';
  } else if (remainingMinutes < 60) {
    remainingText =
      i18n?.t('maintenance.remainingMinutes', { minutes: remainingMinutes }) ||
      `約 ${remainingMinutes} 分鐘`;
  } else {
    const hours = Math.floor(remainingMinutes / 60);
    const mins = remainingMinutes % 60;
    remainingText =
      i18n?.t('maintenance.remainingHours', { hours, minutes: mins }) ||
      `約 ${hours} 小時 ${mins} 分鐘`;
  }

  return { remainingMinutes, remainingText };
}

/**
 * Format maintenance notification message
 */
export function formatMaintenanceNotification(maintenance: MaintenanceMode, i18n?: any): string {
  const remaining = calculateRemainingTime(maintenance, i18n);
  const language = i18n?.language || 'zh-TW';

  let message = (i18n?.t('maintenance.notificationTitle') || '🛠️ 系統維護通知') + '\n\n';

  if (maintenance.maintenanceMessage) {
    message += `${maintenance.maintenanceMessage}\n\n`;
  } else {
    message +=
      (i18n?.t('maintenance.defaultMessage') || '系統正在進行維護，暫時無法使用。') + '\n\n';
  }

  if (maintenance.startTime) {
    message +=
      i18n?.t('maintenance.startTime', {
        time: new Date(maintenance.startTime).toLocaleString(language),
      }) || `開始時間：${new Date(maintenance.startTime).toLocaleString(language)}\n`;
  }

  if (maintenance.endTime) {
    message +=
      i18n?.t('maintenance.estimatedEnd', {
        time: new Date(maintenance.endTime).toLocaleString(language),
      }) || `預計完成：${new Date(maintenance.endTime).toLocaleString(language)}\n`;
    message +=
      i18n?.t('maintenance.remainingTime', { time: remaining.remainingText }) ||
      `剩餘時間：${remaining.remainingText}\n`;
  } else if (maintenance.estimatedDuration) {
    message +=
      i18n?.t('maintenance.estimatedDuration', { duration: maintenance.estimatedDuration }) ||
      `預計時長：${maintenance.estimatedDuration} 分鐘\n`;
  }

  message += '\n' + (i18n?.t('maintenance.thanks') || '感謝您的耐心等待！');

  return message;
}

/**
 * Format maintenance status for admin
 */
export function formatMaintenanceStatus(maintenance: MaintenanceMode, i18n?: any): string {
  const statusText = maintenance.isActive
    ? i18n?.t('maintenance.statusActive') || '✅ 維護中'
    : i18n?.t('maintenance.statusInactive') || '❌ 未啟用';

  const language = i18n?.language || 'zh-TW';
  let message = (i18n?.t('maintenance.statusTitle') || '🛠️ 維護模式狀態') + '\n\n';

  message += i18n?.t('maintenance.status', { status: statusText }) || `狀態：${statusText}\n`;

  if (maintenance.isActive) {
    if (maintenance.startTime) {
      message +=
        i18n?.t('maintenance.startTime', {
          time: new Date(maintenance.startTime).toLocaleString(language),
        }) || `開始時間：${new Date(maintenance.startTime).toLocaleString(language)}\n`;
    }

    if (maintenance.endTime) {
      const remaining = calculateRemainingTime(maintenance, i18n);
      message +=
        i18n?.t('maintenance.estimatedEnd', {
          time: new Date(maintenance.endTime).toLocaleString(language),
        }) || `預計完成：${new Date(maintenance.endTime).toLocaleString(language)}\n`;
      message +=
        i18n?.t('maintenance.remainingTime', { time: remaining.remainingText }) ||
        `剩餘時間：${remaining.remainingText}\n`;
    }

    if (maintenance.enabledBy) {
      message +=
        i18n?.t('maintenance.enabledBy', { user: maintenance.enabledBy }) ||
        `啟用者：${maintenance.enabledBy}\n`;
    }
  }

  return message;
}

/**
 * Validate maintenance duration
 */
export function validateMaintenanceDuration(
  duration: number,
  i18n?: any
): {
  valid: boolean;
  error?: string;
} {
  // Minimum: 5 minutes (to allow time for cron job to check)
  if (duration < 5) {
    return { valid: false, error: i18n?.t('maintenance.durationMin') || '維護時長最少 5 分鐘' };
  }

  // Maximum: 24 hours
  if (duration > 1440) {
    return {
      valid: false,
      error: i18n?.t('maintenance.durationMax') || '維護時長不能超過 24 小時（1440 分鐘）',
    };
  }

  return { valid: true };
}

/**
 * Calculate end time
 */
export function calculateEndTime(startTime: Date, durationMinutes: number): Date {
  const endTime = new Date(startTime);
  endTime.setMinutes(endTime.getMinutes() + durationMinutes);
  return endTime;
}
