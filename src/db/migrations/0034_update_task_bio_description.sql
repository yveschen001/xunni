-- Migration: Update task_bio description to remove character requirement
-- Description: Remove "至少 20 字" requirement from bio task
-- Date: 2025-11-19

UPDATE tasks 
SET description = '寫下你的故事', 
    updated_at = datetime('now')
WHERE id = 'task_bio';

