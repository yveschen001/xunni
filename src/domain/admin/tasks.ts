
import type { D1Database } from '@cloudflare/workers-types';
import type { Env } from '~/types';
import type { Task } from '~/domain/task';
import { createDatabaseClient } from '~/db/client';
import { getAllTasksForAdmin, getTaskById, createTask, updateTask } from '~/db/queries/tasks';
import { logAdminAction } from '~/db/queries/admin_logs';
import { assertAdmin } from '~/domain/admin/auth';
import { TranslationService } from '~/services/translation';

export class AdminTasksService {
  private db: ReturnType<typeof createDatabaseClient>;
  private d1: D1Database;
  private env: Env;
  private adminId: string;
  private translationService: TranslationService;

  constructor(db: D1Database, env: Env, adminId: string) {
    this.d1 = db;
    this.db = createDatabaseClient(db);
    this.env = env;
    this.adminId = adminId;
    this.translationService = new TranslationService(env);
  }

  /**
   * Create a new social task
   */
  async createSocialTask(params: {
    id: string;
    name: string;
    description: string;
    action_url: string;
    verification_type: 'none' | 'telegram_chat';
    target_id?: string;
    reward_amount: number;
    icon?: string;
  }): Promise<void> {
    // 1. Auth check
    assertAdmin(this.env, this.adminId);

    // 2. Auto-translate
    const [nameI18n, descI18n] = await Promise.all([
      this.translationService.batchTranslate(params.name),
      this.translationService.batchTranslate(params.description),
    ]);

    // 3. Calculate sort order (append to end)
    const tasks = await getAllTasksForAdmin(this.db);
    const maxOrder = Math.max(0, ...tasks.map(t => t.sort_order));

    // 4. Create task
    const task: Task = {
      id: params.id,
      category: 'social',
      name: params.name,
      description: params.description,
      reward_amount: params.reward_amount,
      reward_type: 'daily',
      sort_order: maxOrder + 1,
      is_enabled: true,
      action_url: params.action_url,
      verification_type: params.verification_type,
      target_id: params.target_id,
      name_i18n: JSON.stringify(nameI18n),
      description_i18n: JSON.stringify(descI18n),
      icon: params.icon || '📢'
    };

    await createTask(this.db, task);

    // 5. Log action
    await logAdminAction(
      this.d1,
      this.adminId,
      'task_create',
      { ...params, type: 'social' },
      params.id
    );
  }

  /**
   * Update any task (System or Social)
   */
  async editTask(taskId: string, updates: Partial<Task>): Promise<void> {
    // 1. Auth check
    assertAdmin(this.env, this.adminId);

    // 2. Get existing
    const existing = await getTaskById(this.db, taskId);
    if (!existing) throw new Error('Task not found');

    const updateData = { ...updates };

    // 3. Handle translations if text changed
    if (updates.name && updates.name !== existing.name) {
      const nameI18n = await this.translationService.batchTranslate(updates.name);
      updateData.name_i18n = JSON.stringify(nameI18n);
    }

    if (updates.description && updates.description !== existing.description) {
      const descI18n = await this.translationService.batchTranslate(updates.description);
      updateData.description_i18n = JSON.stringify(descI18n);
    }

    // 4. Update
    await updateTask(this.db, taskId, updateData);

    // 5. Log action
    await logAdminAction(
      this.d1,
      this.adminId,
      'task_edit',
      { task_id: taskId, updates },
      taskId
    );
  }

  /**
   * Soft delete social task (System tasks cannot be deleted)
   */
  async deleteTask(taskId: string): Promise<void> {
    // 1. Auth check
    assertAdmin(this.env, this.adminId);

    // 2. Check type
    const existing = await getTaskById(this.db, taskId);
    if (!existing) throw new Error('Task not found');
    
    if (existing.category !== 'social') {
      throw new Error('Only social tasks can be deleted');
    }

    // 3. Soft delete
    await updateTask(this.db, taskId, {
      deleted_at: new Date().toISOString(),
      is_enabled: false
    });

    // 4. Log
    await logAdminAction(
      this.d1,
      this.adminId,
      'task_delete',
      { task_id: taskId },
      taskId
    );
  }

  /**
   * Get all tasks for admin view
   */
  async getTasks(): Promise<Task[]> {
    assertAdmin(this.env, this.adminId);
    return getAllTasksForAdmin(this.db);
  }
}

