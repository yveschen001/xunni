/**
 * User Task Database Queries
 */

import type { DatabaseClient } from '~/db/client';
import type { UserTask } from '~/domain/task';

/**
 * Get user task by task ID
 */
export async function getUserTask(
  db: DatabaseClient,
  userId: string,
  taskId: string
): Promise<UserTask | null> {
  const result = await db.d1
    .prepare(
      `SELECT id, user_id, task_id, status, completed_at, reward_claimed
       FROM user_tasks
       WHERE user_id = ? AND task_id = ?`
    )
    .bind(userId, taskId)
    .first<UserTask>();

  return result;
}

/**
 * Get all user tasks
 */
export async function getAllUserTasks(db: DatabaseClient, userId: string): Promise<UserTask[]> {
  const result = await db.d1
    .prepare(
      `SELECT id, user_id, task_id, status, completed_at, reward_claimed
       FROM user_tasks
       WHERE user_id = ?
       ORDER BY id ASC`
    )
    .bind(userId)
    .all<UserTask>();

  return result.results || [];
}

/**
 * Create or update user task
 */
export async function upsertUserTask(
  db: DatabaseClient,
  userId: string,
  taskId: string,
  status: string,
  rewardClaimed: boolean = false
): Promise<void> {
  const now = new Date().toISOString();
  const completedAt = status === 'completed' ? now : null;

  await db.d1
    .prepare(
      `INSERT INTO user_tasks (user_id, task_id, status, completed_at, reward_claimed, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(user_id, task_id) DO UPDATE SET
         status = excluded.status,
         completed_at = excluded.completed_at,
         reward_claimed = excluded.reward_claimed,
         updated_at = excluded.updated_at`
    )
    .bind(userId, taskId, status, completedAt, rewardClaimed ? 1 : 0, now)
    .run();
}

/**
 * Mark task as pending claim
 */
export async function markTaskAsPendingClaim(
  db: DatabaseClient,
  userId: string,
  taskId: string
): Promise<void> {
  await upsertUserTask(db, userId, taskId, 'pending_claim', false);
}

/**
 * Complete task and claim reward
 */
export async function completeTask(
  db: DatabaseClient,
  userId: string,
  taskId: string
): Promise<void> {
  await upsertUserTask(db, userId, taskId, 'completed', true);
}

/**
 * Get incomplete tasks for user
 */
export async function getIncompleteTasks(db: DatabaseClient, userId: string): Promise<string[]> {
  const result = await db.d1
    .prepare(
      `SELECT task_id
       FROM user_tasks
       WHERE user_id = ? AND status != 'completed'`
    )
    .bind(userId)
    .all<{ task_id: string }>();

  return (result.results || []).map((r) => r.task_id);
}

/**
 * Get tasks completed today
 */
export async function getTasksCompletedToday(
  db: DatabaseClient,
  userId: string
): Promise<UserTask[]> {
  const today = new Date().toISOString().split('T')[0];

  const result = await db.d1
    .prepare(
      `SELECT id, user_id, task_id, status, completed_at, reward_claimed
       FROM user_tasks
       WHERE user_id = ? 
         AND status = 'completed'
         AND reward_claimed = 1
         AND date(completed_at) = ?`
    )
    .bind(userId, today)
    .all<UserTask>();

  return result.results || [];
}

/**
 * Get users with incomplete task (for Cron jobs)
 */
export async function getUsersWithIncompleteTask(
  db: DatabaseClient,
  taskId: string
): Promise<Array<{ telegram_id: string }>> {
  const result = await db.d1
    .prepare(
      `SELECT DISTINCT u.telegram_id
       FROM users u
       LEFT JOIN user_tasks ut ON u.telegram_id = ut.user_id AND ut.task_id = ?
       WHERE u.onboarding_step = 'completed'
         AND (ut.status IS NULL OR ut.status != 'completed')`
    )
    .bind(taskId)
    .all<{ telegram_id: string }>();

  return result.results || [];
}
