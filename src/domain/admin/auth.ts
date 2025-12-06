import type { Env } from '~/types';

// Hardcoded fallback for safety
const FALLBACK_SUPER_ADMIN_ID = '396943893';

/**
 * Get all admin IDs (including Super Admin)
 */
export function getAdminIds(env: Env): string[] {
  const superAdminId = env.SUPER_ADMIN_USER_ID || FALLBACK_SUPER_ADMIN_ID;
  const adminIdsStr = env.ADMIN_USER_IDS || '';
  
  const regularAdmins = adminIdsStr
    .split(',')
    .map((id) => id.trim())
    .filter((id) => id.length > 0 && id !== superAdminId && id !== FALLBACK_SUPER_ADMIN_ID);

  // Ensure unique list containing super admin(s)
  const admins = new Set([superAdminId, ...regularAdmins]);
  // Always include fallback super admin for safety
  admins.add(FALLBACK_SUPER_ADMIN_ID);
  
  return Array.from(admins);
}

/**
 * Check if user has admin permissions (Angel or God)
 * @param env Environment variables
 * @param telegramId User Telegram ID
 * @returns True if user is admin
 */
export function isAdmin(env: Env, telegramId: string): boolean {
  return getAdminIds(env).includes(telegramId);
}

/**
 * Check if user has super admin permissions (God)
 * @param env Environment variables
 * @param telegramId User Telegram ID
 * @returns True if user is super admin
 */
export function isSuperAdmin(env: Env, telegramId: string): boolean {
  if (env.SUPER_ADMIN_USER_ID && telegramId === env.SUPER_ADMIN_USER_ID) {
    return true;
  }
  return telegramId === FALLBACK_SUPER_ADMIN_ID;
}

/**
 * Assert user has admin permissions
 * @throws Error if not admin
 */
export function assertAdmin(env: Env, telegramId: string): void {
  if (!isAdmin(env, telegramId)) {
    throw new Error('Permission denied: Admin access required');
  }
}

/**
 * Assert user has super admin permissions
 * @throws Error if not super admin
 */
export function assertSuperAdmin(env: Env, telegramId: string): void {
  if (!isSuperAdmin(env, telegramId)) {
    throw new Error('Permission denied: Super Admin access required');
  }
}
