
import type { Env } from '~/types';

/**
 * Check if user has admin permissions (Angel or God)
 * @param env Environment variables
 * @param telegramId User Telegram ID
 * @returns True if user is admin
 */
export function isAdmin(env: Env, telegramId: string): boolean {
  const superAdminId = env.SUPER_ADMIN_USER_ID;
  const adminIds = (env.ADMIN_USER_IDS || '').split(',').filter(Boolean);
  
  return telegramId === superAdminId || adminIds.includes(telegramId);
}

/**
 * Check if user has super admin permissions (God)
 * @param env Environment variables
 * @param telegramId User Telegram ID
 * @returns True if user is super admin
 */
export function isSuperAdmin(env: Env, telegramId: string): boolean {
  return telegramId === env.SUPER_ADMIN_USER_ID;
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

