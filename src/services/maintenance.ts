/**
 * Maintenance Mode Service
 * Handles automatic maintenance mode expiration
 */

import type { Env } from '~/types';
import { createDatabaseClient } from '~/db/client';
import { createBroadcast } from './broadcast';
import { getMaintenanceMode } from '~/telegram/handlers/maintenance';

/**
 * Check and automatically disable expired maintenance mode
 * Called by cron job every 5 minutes
 */
export async function checkAndDisableExpiredMaintenance(env: Env): Promise<void> {
  const db = createDatabaseClient(env.DB);

  try {
    // Get current maintenance mode
    const maintenance = await getMaintenanceMode(db);

    if (!maintenance) {
      console.log('[Maintenance] No maintenance mode record found');
      return;
    }

    // Check if maintenance is active
    if (!maintenance.isActive) {
      console.log('[Maintenance] Maintenance mode is not active');
      return;
    }

    // Check if end time is set
    if (!maintenance.endTime) {
      console.log('[Maintenance] No end time set, cannot auto-disable');
      return;
    }

    // Check if maintenance has expired
    const now = new Date();
    const endTime = new Date(maintenance.endTime);

    if (now < endTime) {
      const remainingMinutes = Math.floor((endTime.getTime() - now.getTime()) / 1000 / 60);
      console.log(`[Maintenance] Still in maintenance mode, ${remainingMinutes} minutes remaining`);
      return;
    }

    // Maintenance has expired, auto-disable
    console.log('[Maintenance] Maintenance period expired, auto-disabling...');

    await db.d1
      .prepare(
        `UPDATE maintenance_mode 
         SET is_active = 0,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = 1`
      )
      .run();

    // Broadcast recovery notification to all users
    // System messages use Chinese by default, but we'll use i18n for consistency
    const { createI18n } = await import('~/i18n');
    const i18n = createI18n('zh-TW'); // Default to Chinese for system messages
    const recoveryMessage =
      i18n.t('maintenance.completed') + '\n\n' +
      i18n.t('maintenance.serviceRestored') + '\n\n' +
      i18n.t('maintenance.allFeaturesAvailable');

    // Use system as the sender
    await createBroadcast(env, recoveryMessage, 'all', 'system');

    console.log('[Maintenance] Maintenance mode auto-disabled and recovery notification sent');
  } catch (error) {
    console.error('[Maintenance] Error checking/disabling maintenance:', error);
  }
}
