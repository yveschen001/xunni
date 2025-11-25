/**
 * Task Reminder Database Queries
 */

import type { DatabaseClient } from '~/db/client';

/**
 * Get last task reminder for user
 */
export async function getLastTaskReminder(
  db: DatabaseClient,
  userId: string,
  scenario?: string
): Promise<string | null> {
  let query = `SELECT reminded_at
               FROM task_reminders
               WHERE user_id = ?`;

  const params: string[] = [userId];

  if (scenario) {
    query += ` AND scenario = ?`;
    params.push(scenario);
  }

  query += ` ORDER BY reminded_at DESC LIMIT 1`;

  const result = await db.d1
    .prepare(query)
    .bind(...params)
    .first<{ reminded_at: string }>();

  return result?.reminded_at || null;
}

/**
 * Record task reminder
 */
export async function recordTaskReminder(
  db: DatabaseClient,
  userId: string,
  scenario: string
): Promise<void> {
  const now = new Date().toISOString();

  await db.d1
    .prepare(
      `INSERT INTO task_reminders (user_id, reminded_at, scenario)
       VALUES (?, ?, ?)`
    )
    .bind(userId, now, scenario)
    .run();
}

/**
 * Check if user was reminded today
 */
export async function wasRemindedToday(
  db: DatabaseClient,
  userId: string,
  scenario: string
): Promise<boolean> {
  const today = new Date().toISOString().split('T')[0];

  const result = await db.d1
    .prepare(
      `SELECT COUNT(*) as count
       FROM task_reminders
       WHERE user_id = ? 
         AND scenario = ?
         AND date(reminded_at) = ?`
    )
    .bind(userId, scenario, today)
    .first<{ count: number }>();

  return (result?.count || 0) > 0;
}
