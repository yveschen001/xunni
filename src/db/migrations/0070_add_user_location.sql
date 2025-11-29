-- Migration: 0070_add_user_location.sql
ALTER TABLE users ADD COLUMN lat REAL;
ALTER TABLE users ADD COLUMN lng REAL;
ALTER TABLE users ADD COLUMN timezone TEXT;

