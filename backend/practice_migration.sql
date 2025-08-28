
-- Migration: Add missing columns to practicequestion table
-- Run this SQL script on your Google Cloud SQL database

-- Check current table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'practicequestion'
ORDER BY ordinal_position;

-- Add missing columns
ALTER TABLE practicequestion ADD COLUMN IF NOT EXISTS model_used VARCHAR;
ALTER TABLE practicequestion ADD COLUMN IF NOT EXISTS generation_prompt TEXT;
ALTER TABLE practicequestion ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE practicequestion ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Update existing records with timestamps
UPDATE practicequestion 
SET 
    created_at = COALESCE(created_at, CURRENT_TIMESTAMP),
    updated_at = COALESCE(updated_at, CURRENT_TIMESTAMP)
WHERE id IS NOT NULL;

-- Verify final structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'practicequestion'
ORDER BY ordinal_position;

-- Test that the columns exist by selecting from the table
SELECT COUNT(*), 
       COUNT(model_used) as model_used_count,
       COUNT(generation_prompt) as generation_prompt_count,
       COUNT(created_at) as created_at_count,
       COUNT(updated_at) as updated_at_count
FROM practicequestion;
