-- Migration: Add language tracking columns to conversation_messages
-- Created: 2025-11-16
-- Description: Add original_language and translated_language columns to track message languages

ALTER TABLE conversation_messages ADD COLUMN original_language TEXT;
ALTER TABLE conversation_messages ADD COLUMN translated_language TEXT;

