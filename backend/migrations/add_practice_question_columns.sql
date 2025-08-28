-- Migration: Add missing columns to practicequestion table
-- Date: 2025-08-28
-- Description: Add model_used and generation_prompt columns that are missing from production schema

-- Add model_used column (optional string)
ALTER TABLE practicequestion ADD COLUMN IF NOT EXISTS model_used VARCHAR;

-- Add generation_prompt column (optional text)
ALTER TABLE practicequestion ADD COLUMN IF NOT EXISTS generation_prompt TEXT;

-- Add created_at and updated_at columns if they don't exist
ALTER TABLE practicequestion ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE practicequestion ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Update existing records to have default timestamps
UPDATE practicequestion 
SET created_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
WHERE created_at IS NULL OR updated_at IS NULL;