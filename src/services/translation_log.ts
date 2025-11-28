import { DatabaseClient } from '~/db/client';

export interface DailyTranslationStats {
  date: string;
  provider: string;
  total_tokens: number;
  total_characters: number;
  request_count: number;
  error_count: number;
}

export class TranslationLogService {
  constructor(private db: DatabaseClient) {}

  /**
   * Log translation usage stats (aggregated daily)
   */
  async logUsage(
    provider: string,
    usage: { tokens?: number; characters?: number; success: boolean }
  ): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    const tokens = usage.tokens || 0;
    const chars = usage.characters || 0;
    const errors = usage.success ? 0 : 1;

    try {
      await this.db.d1.prepare(`
        INSERT INTO daily_translation_stats 
          (date, provider, total_tokens, total_characters, request_count, error_count)
        VALUES (?, ?, ?, ?, 1, ?)
        ON CONFLICT(date, provider) DO UPDATE SET
          total_tokens = total_tokens + excluded.total_tokens,
          total_characters = total_characters + excluded.total_characters,
          request_count = request_count + 1,
          error_count = error_count + excluded.error_count,
          updated_at = CURRENT_TIMESTAMP
      `).bind(today, provider, tokens, chars, errors).run();
    } catch (error) {
      console.error('[TranslationLogService] Failed to log usage:', error);
    }
  }

  /**
   * Log fallback event
   */
  async logFallback(
    userId: string,
    fromProvider: string,
    toProvider: string,
    error: string
  ): Promise<void> {
    try {
      await this.db.d1.prepare(`
        INSERT INTO translation_fallbacks (user_id, from_provider, to_provider, error_message)
        VALUES (?, ?, ?, ?)
      `).bind(userId, fromProvider, toProvider, error).run();
    } catch (error) {
      console.error('[TranslationLogService] Failed to log fallback:', error);
    }
  }

  /**
   * Get stats for a specific date
   */
  async getDailyStats(date: string): Promise<DailyTranslationStats[]> {
    const result = await this.db.d1.prepare(`
      SELECT * FROM daily_translation_stats WHERE date = ?
    `).bind(date).all<DailyTranslationStats>();
    return result.results || [];
  }

  /**
   * Get fallback count for a specific date
   */
  async getFallbackCount(date: string): Promise<number> {
    const result = await this.db.d1.prepare(`
      SELECT COUNT(*) as count FROM translation_fallbacks 
      WHERE date(created_at) = ?
    `).bind(date).first<{ count: number }>();
    return result?.count || 0;
  }
}

