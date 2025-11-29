import type { D1Database } from '@cloudflare/workers-types';
import type { BroadcastFilters } from '~/domain/broadcast_filters';

/**
 * Filter Engine
 * Converts high-level BroadcastFilters into optimized SQL queries.
 */
export class FilterEngine {
  private db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  /**
   * Build the SQL query and parameters based on filters
   * Enforces security policies (active users only, etc.)
   */
  buildQuery(filters: BroadcastFilters): { sql: string; params: any[] } {
    let sql = `
      SELECT telegram_id 
      FROM users 
      WHERE onboarding_step = 'completed'
        AND deleted_at IS NULL
        AND bot_status = 'active'
    `;
    const params: any[] = [];

    // 1. Basic Demographics
    if (filters.gender) {
      sql += ` AND gender = ?`;
      params.push(filters.gender);
    }

    if (filters.country) {
      sql += ` AND country_code = ?`;
      params.push(filters.country);
    }

    if (filters.zodiac) {
      sql += ` AND zodiac_sign = ?`;
      params.push(filters.zodiac);
    }

    if (filters.mbti) {
      sql += ` AND mbti_result = ?`;
      params.push(filters.mbti);
    }

    // 2. VIP Status
    if (filters.vip !== undefined) {
      sql += ` AND is_vip = ?`;
      params.push(filters.vip ? 1 : 0);
    }

    // 3. Age Range
    if (filters.age) {
      if (filters.age.min !== undefined) {
        sql += ` AND age >= ?`;
        params.push(filters.age.min);
      }
      if (filters.age.max !== undefined) {
        sql += ` AND age <= ?`;
        params.push(filters.age.max);
      }
    }

    // 4. System Triggers (Automation)

    // Birthday Trigger: Match month and day
    // SQLite strftime('%m-%d', birthday) returns 'MM-DD'
    if (filters.is_birthday) {
      sql += ` AND strftime('%m-%d', birthday) = strftime('%m-%d', 'now')`;
    }

    // Active within X days (Default 30 days if not specified, but flexible)
    // If last_active_days is explicit, use it.
    // Otherwise, enforce a default safe limit (e.g. 90 days) to avoid zombie accounts?
    // Let's stick to the Spec: "Default 30 days active" if not specified in automation,
    // but for manual broadcast, maybe we want to reach dormant users too?
    // Spec says: "智能過濾：只推送給 30 天內活躍用戶" as a general rule.
    const days = filters.last_active_days || 30;
    sql += ` AND last_active_at >= datetime('now', '-${days} days')`;

    return { sql, params };
  }

  /**
   * Execute the query and return count of matching users
   * Useful for "Dry Run" or preview
   */
  async countMatches(filters: BroadcastFilters): Promise<number> {
    const { sql, params } = this.buildQuery(filters);
    // Replace SELECT telegram_id with SELECT COUNT(*)
    const countSql = sql.replace('SELECT telegram_id', 'SELECT COUNT(*) as count');

    const result = await this.db
      .prepare(countSql)
      .bind(...params)
      .first<{ count: number }>();
    return result?.count || 0;
  }

  /**
   * Execute the query and return user IDs
   * Uses Cursor Pagination internally if we were to support massive result sets,
   * but for now returns all IDs (assuming < 10k for Worker memory safety, or will need batching in Service)
   */
  async getMatchingUserIds(filters: BroadcastFilters): Promise<string[]> {
    const { sql, params } = this.buildQuery(filters);
    const results = await this.db
      .prepare(sql)
      .bind(...params)
      .all<{ telegram_id: string }>();

    return results.results.map((r) => r.telegram_id);
  }
}
