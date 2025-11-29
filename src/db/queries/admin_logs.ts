import type { D1Database } from '@cloudflare/workers-types';

export interface AdminLog {
  id: number;
  admin_telegram_id: string;
  action: string;
  target_telegram_id?: string;
  details: string; // JSON string
  created_at: string;
}

/**
 * Log an admin action
 * @param db D1Database
 * @param adminId Telegram ID of the admin performing the action
 * @param action Action name (e.g. 'ad_create', 'ad_delete')
 * @param details Details object (will be stringified)
 * @param targetId Optional target ID (e.g. affected user or ad ID)
 */
export async function logAdminAction(
  db: D1Database,
  adminId: string,
  action: string,
  details: Record<string, any>,
  targetId?: string
): Promise<void> {
  try {
    await db
      .prepare(
        `INSERT INTO admin_logs (admin_telegram_id, action, details, target_telegram_id)
         VALUES (?, ?, ?, ?)`
      )
      .bind(adminId, action, JSON.stringify(details), targetId || null)
      .run();
  } catch (error) {
    console.error('[logAdminAction] Failed to log admin action:', error);
    // Don't throw, logging failure shouldn't block the action
  }
}
