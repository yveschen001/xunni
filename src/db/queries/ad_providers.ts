/**
 * Ad Providers Database Queries
 *
 * Purpose:
 *   Database operations for ad_providers and ad_provider_logs tables
 *   Provider management and performance tracking
 */

import type { D1Database } from '@cloudflare/workers-types';
import type { AdProvider } from '~/domain/ad_provider';

// ============================================================================
// Read Operations - Providers
// ============================================================================

/**
 * Get all ad providers
 *
 * @param db - D1 database instance
 * @param enabledOnly - Only return enabled providers
 * @returns Array of ad providers
 */
export async function getAllAdProviders(
  db: D1Database,
  enabledOnly: boolean = false
): Promise<AdProvider[]> {
  const query = enabledOnly
    ? `SELECT * FROM ad_providers WHERE is_enabled = 1 ORDER BY priority DESC`
    : `SELECT * FROM ad_providers ORDER BY priority DESC`;

  const result = await db.prepare(query).all<AdProvider>();

  return result.results || [];
}

/**
 * Get ad provider by name
 *
 * @param db - D1 database instance
 * @param providerName - Provider name
 * @returns Ad provider or null
 */
export async function getAdProviderByName(
  db: D1Database,
  providerName: string
): Promise<AdProvider | null> {
  const result = await db
    .prepare(`SELECT * FROM ad_providers WHERE provider_name = ?`)
    .bind(providerName)
    .first<AdProvider>();

  return result || null;
}

/**
 * Get ad provider by ID
 *
 * @param db - D1 database instance
 * @param providerId - Provider ID
 * @returns Ad provider or null
 */
export async function getAdProviderById(
  db: D1Database,
  providerId: number
): Promise<AdProvider | null> {
  const result = await db
    .prepare(`SELECT * FROM ad_providers WHERE id = ?`)
    .bind(providerId)
    .first<AdProvider>();

  return result || null;
}

// ============================================================================
// Write Operations - Providers
// ============================================================================

/**
 * Create ad provider
 *
 * @param db - D1 database instance
 * @param provider - Provider data
 * @returns Created provider ID
 */
export async function createAdProvider(
  db: D1Database,
  provider: {
    provider_name: string;
    provider_display_name: string;
    is_enabled?: boolean;
    priority?: number;
    weight?: number;
    config?: string;
    script_url: string;
    fallback_script_urls?: string;
  }
): Promise<number> {
  const result = await db
    .prepare(
      `INSERT INTO ad_providers (
        provider_name, provider_display_name, is_enabled, priority, weight,
        config, script_url, fallback_script_urls
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      provider.provider_name,
      provider.provider_display_name,
      provider.is_enabled ?? 1,
      provider.priority ?? 0,
      provider.weight ?? 100,
      provider.config || '{}',
      provider.script_url,
      provider.fallback_script_urls || null
    )
    .run();

  return result.meta?.last_row_id || 0;
}

/**
 * Update ad provider
 *
 * @param db - D1 database instance
 * @param providerId - Provider ID
 * @param updates - Fields to update
 * @returns Success boolean
 */
export async function updateAdProvider(
  db: D1Database,
  providerId: number,
  updates: Partial<AdProvider>
): Promise<boolean> {
  const fields: string[] = [];
  const values: any[] = [];

  if (updates.provider_display_name !== undefined) {
    fields.push('provider_display_name = ?');
    values.push(updates.provider_display_name);
  }
  if (updates.is_enabled !== undefined) {
    fields.push('is_enabled = ?');
    values.push(updates.is_enabled ? 1 : 0);
  }
  if (updates.priority !== undefined) {
    fields.push('priority = ?');
    values.push(updates.priority);
  }
  if (updates.weight !== undefined) {
    fields.push('weight = ?');
    values.push(updates.weight);
  }
  if (updates.config !== undefined) {
    fields.push('config = ?');
    values.push(updates.config);
  }
  if (updates.script_url !== undefined) {
    fields.push('script_url = ?');
    values.push(updates.script_url);
  }
  if (updates.fallback_script_urls !== undefined) {
    fields.push('fallback_script_urls = ?');
    values.push(updates.fallback_script_urls);
  }

  if (fields.length === 0) {
    return false;
  }

  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(providerId);

  const result = await db
    .prepare(
      `UPDATE ad_providers 
       SET ${fields.join(', ')} 
       WHERE id = ?`
    )
    .bind(...values)
    .run();

  return (result.meta?.changes || 0) > 0;
}

/**
 * Update provider statistics
 *
 * @param db - D1 database instance
 * @param providerName - Provider name
 * @param stats - Statistics to update
 * @returns Success boolean
 */
export async function updateProviderStats(
  db: D1Database,
  providerName: string,
  stats: {
    total_requests?: number;
    total_views?: number;
    total_completions?: number;
    total_errors?: number;
    last_success_at?: string;
    last_error?: string;
    last_error_at?: string;
  }
): Promise<boolean> {
  const fields: string[] = [];
  const values: any[] = [];

  if (stats.total_requests !== undefined) {
    fields.push('total_requests = total_requests + ?');
    values.push(stats.total_requests);
  }
  if (stats.total_views !== undefined) {
    fields.push('total_views = total_views + ?');
    values.push(stats.total_views);
  }
  if (stats.total_completions !== undefined) {
    fields.push('total_completions = total_completions + ?');
    values.push(stats.total_completions);
  }
  if (stats.total_errors !== undefined) {
    fields.push('total_errors = total_errors + ?');
    values.push(stats.total_errors);
  }
  if (stats.last_success_at !== undefined) {
    fields.push('last_success_at = ?');
    values.push(stats.last_success_at);
  }
  if (stats.last_error !== undefined) {
    fields.push('last_error = ?');
    values.push(stats.last_error);
  }
  if (stats.last_error_at !== undefined) {
    fields.push('last_error_at = ?');
    values.push(stats.last_error_at);
  }

  if (fields.length === 0) {
    return false;
  }

  // Calculate completion rate
  fields.push(`completion_rate = CASE 
    WHEN total_views > 0 THEN CAST(total_completions AS REAL) / total_views 
    ELSE 0 
  END`);

  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(providerName);

  const result = await db
    .prepare(
      `UPDATE ad_providers 
       SET ${fields.join(', ')} 
       WHERE provider_name = ?`
    )
    .bind(...values)
    .run();

  return (result.meta?.changes || 0) > 0;
}

/**
 * Record successful ad request
 *
 * @param db - D1 database instance
 * @param providerName - Provider name
 * @returns Success boolean
 */
export async function recordAdSuccess(db: D1Database, providerName: string): Promise<boolean> {
  return updateProviderStats(db, providerName, {
    total_requests: 1,
    total_views: 1,
    last_success_at: new Date().toISOString(),
  });
}

/**
 * Record successful ad completion
 *
 * @param db - D1 database instance
 * @param providerName - Provider name
 * @returns Success boolean
 */
export async function recordAdCompletion(db: D1Database, providerName: string): Promise<boolean> {
  return updateProviderStats(db, providerName, {
    total_completions: 1,
  });
}

/**
 * Record ad error
 *
 * @param db - D1 database instance
 * @param providerName - Provider name
 * @param errorMessage - Error message
 * @returns Success boolean
 */
export async function recordAdError(
  db: D1Database,
  providerName: string,
  errorMessage: string
): Promise<boolean> {
  return updateProviderStats(db, providerName, {
    total_requests: 1,
    total_errors: 1,
    last_error: errorMessage,
    last_error_at: new Date().toISOString(),
  });
}

// ============================================================================
// Provider Logs
// ============================================================================

/**
 * Create ad provider log
 *
 * @param db - D1 database instance
 * @param log - Log data
 * @returns Created log ID
 */
export async function createAdProviderLog(
  db: D1Database,
  log: {
    telegram_id: string;
    provider_name: string;
    request_type: 'view' | 'completion';
    status: 'success' | 'error' | 'timeout';
    error_message?: string;
    response_time_ms?: number;
  }
): Promise<number> {
  const result = await db
    .prepare(
      `INSERT INTO ad_provider_logs (
        telegram_id, provider_name, request_date, request_type,
        status, error_message, response_time_ms
      )
      VALUES (?, ?, CURRENT_TIMESTAMP, ?, ?, ?, ?)`
    )
    .bind(
      log.telegram_id,
      log.provider_name,
      log.request_type,
      log.status,
      log.error_message || null,
      log.response_time_ms || null
    )
    .run();

  return result.meta?.last_row_id || 0;
}

/**
 * Get provider logs for user
 *
 * @param db - D1 database instance
 * @param telegramId - User's Telegram ID
 * @param limit - Number of logs to return
 * @returns Array of logs
 */
export async function getProviderLogsByUser(
  db: D1Database,
  telegramId: string,
  limit: number = 10
): Promise<any[]> {
  const result = await db
    .prepare(
      `SELECT * FROM ad_provider_logs 
       WHERE telegram_id = ? 
       ORDER BY created_at DESC 
       LIMIT ?`
    )
    .bind(telegramId, limit)
    .all();

  return result.results || [];
}

/**
 * Get provider logs by provider
 *
 * @param db - D1 database instance
 * @param providerName - Provider name
 * @param limit - Number of logs to return
 * @returns Array of logs
 */
export async function getProviderLogsByProvider(
  db: D1Database,
  providerName: string,
  limit: number = 100
): Promise<any[]> {
  const result = await db
    .prepare(
      `SELECT * FROM ad_provider_logs 
       WHERE provider_name = ? 
       ORDER BY created_at DESC 
       LIMIT ?`
    )
    .bind(providerName, limit)
    .all();

  return result.results || [];
}

/**
 * Get provider error rate (last 24 hours)
 *
 * @param db - D1 database instance
 * @param providerName - Provider name
 * @returns Error rate (0-1)
 */
export async function getProviderErrorRate(db: D1Database, providerName: string): Promise<number> {
  const result = await db
    .prepare(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as errors
       FROM ad_provider_logs 
       WHERE provider_name = ? 
         AND request_date >= datetime('now', '-1 day')`
    )
    .bind(providerName)
    .first<{ total: number; errors: number }>();

  if (!result || result.total === 0) {
    return 0;
  }

  return result.errors / result.total;
}

/**
 * Delete old provider logs (for data retention)
 *
 * @param db - D1 database instance
 * @param daysToKeep - Number of days to keep
 * @returns Number of records deleted
 */
export async function deleteOldProviderLogs(
  db: D1Database,
  daysToKeep: number = 30
): Promise<number> {
  const result = await db
    .prepare(
      `DELETE FROM ad_provider_logs 
       WHERE request_date < datetime('now', '-' || ? || ' days')`
    )
    .bind(daysToKeep)
    .run();

  return result.meta?.changes || 0;
}

// ============================================================================
// Statistics Queries
// ============================================================================

/**
 * Get provider performance comparison
 *
 * @param db - D1 database instance
 * @returns Array of provider stats
 */
export async function getProviderPerformanceComparison(db: D1Database): Promise<
  Array<{
    provider_name: string;
    provider_display_name: string;
    total_requests: number;
    total_completions: number;
    completion_rate: number;
    error_rate: number;
  }>
> {
  const result = await db
    .prepare(
      `SELECT 
        provider_name,
        provider_display_name,
        total_requests,
        total_completions,
        completion_rate,
        CASE 
          WHEN total_requests > 0 
          THEN CAST(total_errors AS REAL) / total_requests 
          ELSE 0 
        END as error_rate
       FROM ad_providers 
       WHERE is_enabled = 1
       ORDER BY completion_rate DESC`
    )
    .all();

  return result.results || [];
}

/**
 * Update ad provider status (enable/disable)
 */
export async function updateAdProviderStatus(
  db: ReturnType<typeof createDatabaseClient>,
  providerName: string,
  isEnabled: boolean
): Promise<void> {
  await db.d1
    .prepare(`UPDATE ad_providers SET is_enabled = ? WHERE provider_name = ?`)
    .bind(isEnabled ? 1 : 0, providerName)
    .run();
}

/**
 * Update ad provider priority
 */
export async function updateAdProviderPriority(
  db: ReturnType<typeof createDatabaseClient>,
  providerName: string,
  priority: number
): Promise<void> {
  await db.d1
    .prepare(`UPDATE ad_providers SET priority = ? WHERE provider_name = ?`)
    .bind(priority, providerName)
    .run();
}
