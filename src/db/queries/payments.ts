import type { D1Database } from '@cloudflare/workers-types';

/**
 * Get daily payment statistics
 *
 * @param db - D1 database instance
 * @param date - Date in YYYY-MM-DD format
 * @returns Daily payment statistics
 */
export async function getDailyPaymentStats(
  db: D1Database,
  date: string
): Promise<{
  revenue: number;
  transactions: number;
}> {
  const result = await db
    .prepare(
      `SELECT 
        SUM(amount_stars) as revenue,
        COUNT(*) as transactions
       FROM payments 
       WHERE status = 'completed' AND DATE(created_at) = ?`
    )
    .bind(date)
    .first<{
      revenue: number;
      transactions: number;
    }>();

  return {
    revenue: result?.revenue || 0,
    transactions: result?.transactions || 0,
  };
}
