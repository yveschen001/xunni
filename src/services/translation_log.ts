import type { D1Database } from '@cloudflare/workers-types';

export interface TranslationLogParams {
  provider: 'openai' | 'gemini' | 'google';
  tokens?: number;
  characters?: number;
  isError?: boolean;
}

export class TranslationLogService {
  constructor(private db: D1Database) {}

  /**
   * Log daily translation stats (aggregated)
   * This is designed to be called via ctx.waitUntil
   */
  async logStats(params: TranslationLogParams): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    const tokens = params.tokens || 0;
    const chars = params.characters || 0;
    const errorCount = params.isError ? 1 : 0;
    const requestCount = 1;

    // Simple cost estimation (can be refined)
    // OpenAI gpt-4o-mini: $0.15 / 1M input tokens, $0.60 / 1M output tokens
    // Gemini Flash: Free tier or low cost
    // Google Translate: $20 / 1M chars
    let estimatedCost = 0;
    if (params.provider === 'openai') {
      // Rough avg of input/output mix: $0.40 / 1M tokens
      estimatedCost = (tokens / 1000000) * 0.4;
    } else if (params.provider === 'google') {
      estimatedCost = (chars / 1000000) * 20;
    }

    try {
      await this.db
        .prepare(
          `
        INSERT INTO daily_translation_stats 
          (stat_date, provider, total_tokens, total_characters, request_count, error_count, cost_usd)
        VALUES 
          (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(stat_date, provider) DO UPDATE SET
          total_tokens = total_tokens + excluded.total_tokens,
          total_characters = total_characters + excluded.total_characters,
          request_count = request_count + excluded.request_count,
          error_count = error_count + excluded.error_count,
          cost_usd = cost_usd + excluded.cost_usd,
          updated_at = CURRENT_TIMESTAMP
      `
        )
        .bind(today, params.provider, tokens, chars, requestCount, errorCount, estimatedCost)
        .run();
    } catch (error) {
      console.error('[TranslationLogService] Failed to log stats:', error);
    }
  }

  /**
   * Log fallback event
   */
  async logFallback(
    userId: string | null,
    fromProvider: string,
    toProvider: string,
    error: string
  ): Promise<void> {
    try {
      await this.db
        .prepare(
          `
        INSERT INTO translation_fallbacks (user_id, from_provider, to_provider, error_message)
        VALUES (?, ?, ?, ?)
      `
        )
        .bind(userId, fromProvider, toProvider, error)
        .run();
    } catch (err) {
      console.error('[TranslationLogService] Failed to log fallback:', err);
    }
  }
}
