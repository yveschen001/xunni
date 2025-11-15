/**
 * Database Client
 * Based on @doc/MODULE_DESIGN.md
 *
 * Provides a thin wrapper around Cloudflare D1 with error handling and logging.
 */

import type { Env } from '~/types';

// ============================================================================
// Database Client
// ============================================================================

export class DatabaseClient {
  constructor(private db: D1Database) {}

  /**
   * Get the underlying D1Database instance
   * Use this when you need direct D1 API access
   */
  get d1(): D1Database {
    return this.db;
  }

  /**
   * Execute a query and return all results
   */
  async query<T = unknown>(sql: string, params: unknown[] = []): Promise<T[]> {
    try {
      const result = await this.db.prepare(sql).bind(...params).all<T>();

      if (!result.success) {
        throw new Error(`Database query failed: ${result.error}`);
      }

      return result.results || [];
    } catch (error) {
      console.error('[DB] Query error:', { sql, params, error });
      throw error;
    }
  }

  /**
   * Execute a query and return first result
   */
  async queryOne<T = unknown>(sql: string, params: unknown[] = []): Promise<T | null> {
    try {
      const result = await this.db.prepare(sql).bind(...params).first<T>();
      return result || null;
    } catch (error) {
      console.error('[DB] QueryOne error:', { sql, params, error });
      throw error;
    }
  }

  /**
   * Execute a write operation (INSERT, UPDATE, DELETE)
   */
  async execute(sql: string, params: unknown[] = []): Promise<D1Result> {
    try {
      const result = await this.db.prepare(sql).bind(...params).run();

      if (!result.success) {
        throw new Error(`Database execute failed: ${result.error}`);
      }

      return result;
    } catch (error) {
      console.error('[DB] Execute error:', { sql, params, error });
      throw error;
    }
  }

  /**
   * Execute multiple statements in a batch
   */
  async batch(statements: { sql: string; params: unknown[] }[]): Promise<D1Result[]> {
    try {
      const prepared = statements.map((stmt) => this.db.prepare(stmt.sql).bind(...stmt.params));

      const results = await this.db.batch(prepared);

      return results;
    } catch (error) {
      console.error('[DB] Batch error:', { statements, error });
      throw error;
    }
  }
}

// ============================================================================
// Database Factory
// ============================================================================

/**
 * Create a database client from environment
 */
export function createDatabaseClient(env: Env): DatabaseClient {
  return new DatabaseClient(env.DB);
}

