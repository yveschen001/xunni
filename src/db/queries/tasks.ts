/**
 * Task Database Queries
 */

import type { DatabaseClient } from '~/db/client';
import type { Task } from '~/domain/task';

/**
 * Get all enabled tasks
 */
export async function getAllTasks(db: DatabaseClient): Promise<Task[]> {
  const result = await db.d1
    .prepare(
      `SELECT id, category, name, description, reward_amount, reward_type, sort_order, is_enabled
       FROM tasks
       WHERE is_enabled = 1
       ORDER BY sort_order ASC`
    )
    .all<Task>();

  return result.results || [];
}

/**
 * Get task by ID
 */
export async function getTaskById(db: DatabaseClient, taskId: string): Promise<Task | null> {
  const result = await db.d1
    .prepare(
      `SELECT id, category, name, description, reward_amount, reward_type, sort_order, is_enabled
       FROM tasks
       WHERE id = ?`
    )
    .bind(taskId)
    .first<Task>();

  return result;
}

/**
 * Get tasks by category
 */
export async function getTasksByCategory(db: DatabaseClient, category: string): Promise<Task[]> {
  const result = await db.d1
    .prepare(
      `SELECT id, category, name, description, reward_amount, reward_type, sort_order, is_enabled
       FROM tasks
       WHERE category = ? AND is_enabled = 1
       ORDER BY sort_order ASC`
    )
    .bind(category)
    .all<Task>();

  return result.results || [];
}
