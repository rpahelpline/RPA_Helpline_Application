-- Migration: Make password_hash nullable to support OAuth users
-- OAuth users (Google, etc.) don't have passwords, so password_hash should be nullable

-- First, update any existing NULL values to a placeholder (if any exist)
-- This shouldn't be necessary, but just in case
UPDATE users 
SET password_hash = '' 
WHERE password_hash IS NULL AND id IN (
  SELECT id FROM users WHERE password_hash IS NULL
);

-- Make password_hash nullable
ALTER TABLE users 
ALTER COLUMN password_hash DROP NOT NULL;

-- Add a check constraint to ensure either password_hash is set OR email_verified is true
-- This ensures OAuth users (who have verified emails) can have NULL password_hash
-- But regular users must have a password_hash
-- Actually, let's keep it simple - just allow NULL for OAuth users
-- The application logic will handle validation




