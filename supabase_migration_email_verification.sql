-- Email Verification & Password Authentication Migration
-- Run this in your Supabase SQL Editor

-- Step 1: Add new columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS password_hash TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS verification_token TEXT,
ADD COLUMN IF NOT EXISTS verification_token_expires TIMESTAMP WITH TIME ZONE;

-- Step 2: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_verification_token ON users(verification_token);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email_verified);

-- Step 3: Add unique constraint on email (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'users_email_unique'
    ) THEN
        ALTER TABLE users ADD CONSTRAINT users_email_unique UNIQUE (email);
    END IF;
END $$;

-- Step 4: Update existing users (optional - for testing)
-- This sets a default password hash for existing users
-- WARNING: In production, you may want to force password reset for existing users
-- UPDATE users SET password_hash = '$2a$10$defaulthash' WHERE password_hash = '';

-- Step 5: Create function to clean up expired tokens (optional)
CREATE OR REPLACE FUNCTION cleanup_expired_verification_tokens()
RETURNS void AS $$
BEGIN
    UPDATE users
    SET verification_token = NULL,
        verification_token_expires = NULL
    WHERE verification_token IS NOT NULL
      AND verification_token_expires < NOW();
END;
$$ LANGUAGE plpgsql;

-- Step 6: Create a scheduled job to run cleanup (optional)
-- You can use pg_cron extension if available
-- SELECT cron.schedule('cleanup-tokens', '0 * * * *', 'SELECT cleanup_expired_verification_tokens()');

-- Step 7: Verify the migration
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'users'
  AND column_name IN ('password_hash', 'email_verified', 'verification_token', 'verification_token_expires')
ORDER BY column_name;

-- Expected output:
-- column_name                  | data_type              | is_nullable | column_default
-- -----------------------------|------------------------|-------------|---------------
-- email_verified               | boolean                | YES         | false
-- password_hash                | text                   | NO          | ''
-- verification_token           | text                   | YES         | NULL
-- verification_token_expires   | timestamp with time zone | YES       | NULL
