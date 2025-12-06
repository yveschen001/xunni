-- Migration: Add onboarding_reminder_enabled to user_push_preferences
ALTER TABLE user_push_preferences ADD COLUMN onboarding_reminder_enabled INTEGER DEFAULT 1;

