-- Migration: Update tasks to use i18n keys
-- Description: Convert hardcoded task names and descriptions to i18n keys
-- Date: 2025-11-28

-- Update task names to use i18n keys
UPDATE tasks SET name = 'tasks.name.interests', description = 'tasks.description.interests' WHERE id = 'task_interests';
UPDATE tasks SET name = 'tasks.name.bio', description = 'tasks.description.bio' WHERE id = 'task_bio';
UPDATE tasks SET name = 'tasks.name.city', description = 'tasks.description.city' WHERE id = 'task_city';
UPDATE tasks SET name = 'tasks.name.join_channel', description = 'tasks.description.join_channel' WHERE id = 'task_join_channel';
UPDATE tasks SET name = 'tasks.name.first_bottle', description = 'tasks.description.first_bottle' WHERE id = 'task_first_bottle';
UPDATE tasks SET name = 'tasks.name.first_catch', description = 'tasks.description.first_catch' WHERE id = 'task_first_catch';
UPDATE tasks SET name = 'tasks.name.first_conversation', description = 'tasks.description.first_conversation' WHERE id = 'task_first_conversation';
UPDATE tasks SET name = 'tasks.name.invite_progress', description = 'tasks.description.invite_progress' WHERE id = 'task_invite_progress';
UPDATE tasks SET name = 'tasks.name.confirm_country', description = 'tasks.description.confirm_country' WHERE id = 'task_confirm_country';

