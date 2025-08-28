#!/usr/bin/env python3
"""
Simple migration using urllib to avoid dependency issues
"""
import urllib.parse
import urllib.request
import json

# Create a simple HTTP request to test the database connection through our API
def test_database_connection():
    """Test if we can reach the database through our API"""
    try:
        # Use the backend URL to test database connectivity
        backend_url = "https://menttor-backend.onrender.com"
        test_url = f"{backend_url}/test-db"
        
        print(f"🔄 Testing database connection via {test_url}")
        
        with urllib.request.urlopen(test_url) as response:
            data = json.loads(response.read().decode())
            print(f"✅ Database connection test: {data}")
            return True
            
    except Exception as e:
        print(f"❌ Database connection test failed: {e}")
        return False

def create_sql_script():
    """Create a SQL script that can be run manually"""
    sql_script = """
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
"""
    
    with open('practice_migration.sql', 'w') as f:
        f.write(sql_script)
    
    print("📝 Created practice_migration.sql file")
    print("   Run this SQL script manually on your Google Cloud SQL database")
    print("   You can use the Cloud SQL console or psql command:")
    print("   psql -h 34.93.60.80 -p 5432 -U admin-db -d menttor-db -f practice_migration.sql")
    
    return sql_script

if __name__ == "__main__":
    print("🔄 Simple database migration tool")
    
    # Test database connection via API
    if test_database_connection():
        print("✅ Database is reachable via API")
    
    # Create SQL script for manual execution
    sql_script = create_sql_script()
    print("\n" + "="*60)
    print("SQL MIGRATION SCRIPT:")
    print("="*60)
    print(sql_script)
    print("="*60)