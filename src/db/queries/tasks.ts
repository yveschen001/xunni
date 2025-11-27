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
      `SELECT *
       FROM tasks
       WHERE is_enabled = 1 AND deleted_at IS NULL
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
      `SELECT *
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
      `SELECT *
       FROM tasks
       WHERE category = ? AND is_enabled = 1 AND deleted_at IS NULL
       ORDER BY sort_order ASC`
    )
    .bind(category)
    .all<Task>();

  return result.results || [];
}

/**
 * Get all tasks (including disabled, excluding deleted) for admin
 */
export async function getAllTasksForAdmin(db: DatabaseClient): Promise<Task[]> {
  const result = await db.d1
    .prepare(
      `SELECT *
       FROM tasks
       WHERE deleted_at IS NULL
       ORDER BY category, sort_order ASC`
    )
    .all<Task>();

  return result.results || [];
}

/**
 * Create task (Admin)
 */
export async function createTask(db: DatabaseClient, task: Task): Promise<void> {
  await db.d1
    .prepare(
      `INSERT INTO tasks (
        id, category, name, description, reward_amount, reward_type, sort_order, is_enabled,
        action_url, verification_type, target_id, name_i18n, description_i18n, icon
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      task.id,
      task.category,
      task.name,
      task.description,
      task.reward_amount,
      task.reward_type,
      task.sort_order,
      task.is_enabled ? 1 : 0,
      task.action_url || null,
      task.verification_type || null,
      task.target_id || null,
      task.name_i18n || null,
      task.description_i18n || null,
      task.icon || null
    )
    .run();
}

/**
 * Update task (Admin)
 */
export async function updateTask(db: DatabaseClient, taskId: string, updates: Partial<Task>): Promise<boolean> {
  const fields: string[] = [];
  const values: any[] = [];

  if (updates.category !== undefined) { fields.push('category = ?'); values.push(updates.category); }
  if (updates.name !== undefined) { fields.push('name = ?'); values.push(updates.name); }
  if (updates.description !== undefined) { fields.push('description = ?'); values.push(updates.description); }
  if (updates.reward_amount !== undefined) { fields.push('reward_amount = ?'); values.push(updates.reward_amount); }
  if (updates.sort_order !== undefined) { fields.push('sort_order = ?'); values.push(updates.sort_order); }
  if (updates.is_enabled !== undefined) { fields.push('is_enabled = ?'); values.push(updates.is_enabled ? 1 : 0); }
  if (updates.action_url !== undefined) { fields.push('action_url = ?'); values.push(updates.action_url); }
  if (updates.verification_type !== undefined) { fields.push('verification_type = ?'); values.push(updates.verification_type); }
  if (updates.target_id !== undefined) { fields.push('target_id = ?'); values.push(updates.target_id); }
  if (updates.name_i18n !== undefined) { fields.push('name_i18n = ?'); values.push(updates.name_i18n); }
  if (updates.description_i18n !== undefined) { fields.push('description_i18n = ?'); values.push(updates.description_i18n); }
  if (updates.icon !== undefined) { fields.push('icon = ?'); values.push(updates.icon); }
  if (updates.deleted_at !== undefined) { fields.push('deleted_at = ?'); values.push(updates.deleted_at); }

  if (fields.length === 0) return false;

  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(taskId);

  const result = await db.d1
    .prepare(`UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`)
    .bind(...values)
    .run();

  return (result.meta?.changes || 0) > 0;
}
