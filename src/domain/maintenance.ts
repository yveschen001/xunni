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
export function calculateRemainingTime(maintenance: MaintenanceMode): {
  remainingMinutes: number;
  remainingText: string;
} {
  if (!maintenance.endTime) {
    return { remainingMinutes: 0, remainingText: '未知' };
  }

  const now = new Date();
  const end = new Date(maintenance.endTime);
  const diffMs = end.getTime() - now.getTime();
  const remainingMinutes = Math.max(0, Math.floor(diffMs / 1000 / 60));

  let remainingText: string;
  if (remainingMinutes === 0) {
    remainingText = '即將完成';
  } else if (remainingMinutes < 60) {
    remainingText = `約 ${remainingMinutes} 分鐘`;
  } else {
    const hours = Math.floor(remainingMinutes / 60);
    const mins = remainingMinutes % 60;
    remainingText = `約 ${hours} 小時 ${mins} 分鐘`;
  }

  return { remainingMinutes, remainingText };
}

/**
 * Format maintenance notification message
 */
export function formatMaintenanceNotification(maintenance: MaintenanceMode): string {
  const remaining = calculateRemainingTime(maintenance);
  
  let message = '🛠️ 系統維護通知\n\n';
  
  if (maintenance.maintenanceMessage) {
    message += `${maintenance.maintenanceMessage}\n\n`;
  } else {
    message += '系統正在進行維護，暫時無法使用。\n\n';
  }
  
  if (maintenance.startTime) {
    message += `開始時間：${new Date(maintenance.startTime).toLocaleString('zh-TW')}\n`;
  }
  
  if (maintenance.endTime) {
    message += `預計完成：${new Date(maintenance.endTime).toLocaleString('zh-TW')}\n`;
    message += `剩餘時間：${remaining.remainingText}\n`;
  } else if (maintenance.estimatedDuration) {
    message += `預計時長：${maintenance.estimatedDuration} 分鐘\n`;
  }
  
  message += '\n感謝您的耐心等待！';
  
  return message;
}

/**
 * Format maintenance status for admin
 */
export function formatMaintenanceStatus(maintenance: MaintenanceMode): string {
  let message = '🛠️ 維護模式狀態\n\n';
  
  message += `狀態：${maintenance.isActive ? '✅ 維護中' : '❌ 未啟用'}\n`;
  
  if (maintenance.isActive) {
    if (maintenance.startTime) {
      message += `開始時間：${new Date(maintenance.startTime).toLocaleString('zh-TW')}\n`;
    }
    
    if (maintenance.endTime) {
      const remaining = calculateRemainingTime(maintenance);
      message += `預計完成：${new Date(maintenance.endTime).toLocaleString('zh-TW')}\n`;
      message += `剩餘時間：${remaining.remainingText}\n`;
    }
    
    if (maintenance.enabledBy) {
      message += `啟用者：${maintenance.enabledBy}\n`;
    }
  }
  
  return message;
}

/**
 * Validate maintenance duration
 */
export function validateMaintenanceDuration(duration: number): {
  valid: boolean;
  error?: string;
} {
  if (duration <= 0) {
    return { valid: false, error: '維護時長必須大於 0' };
  }
  
  if (duration > 1440) { // 24 hours
    return { valid: false, error: '維護時長不能超過 24 小時（1440 分鐘）' };
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

