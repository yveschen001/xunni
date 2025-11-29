-- Migration: 0073_add_fortune_subscription.sql
-- Add subscription field to fortune_profiles for daily push notifications

ALTER TABLE fortune_profiles ADD COLUMN is_subscribed INTEGER DEFAULT 0;

