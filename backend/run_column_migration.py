#!/usr/bin/env python3
"""
Add missing columns to practicequestion table on Google Cloud SQL
Usage: python3 run_column_migration.py
"""
import os
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

# Google Cloud SQL connection parameters
CLOUD_SQL_CONFIG = {
    'host': os.getenv('DB_HOST', '34.93.60.80'),
    'port': os.getenv('DB_PORT', '5432'),
    'database': os.getenv('DB_NAME', 'menttor-db'),
    'user': os.getenv('DB_USER', 'admin-db'),
    'password': os.getenv('DB_PASSWORD', ''),
}

def run_column_migration():
    """Add missing columns to practicequestion table"""
    
    if not CLOUD_SQL_CONFIG['password']:
        print("❌ DB_PASSWORD environment variable not set!")
        print("Set it with: export DB_PASSWORD='your_password'")
        return False
    
    try:
        print("🔄 Connecting to Google Cloud SQL...")
        
        conn = psycopg2.connect(**CLOUD_SQL_CONFIG)
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()
        
        print("✅ Connected to database")
        
        # Check if table exists
        cursor.execute("""
            SELECT EXISTS (
                SELECT 1 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'practicequestion'
            );
        """)
        
        table_exists = cursor.fetchone()[0]
        if not table_exists:
            print("❌ practicequestion table doesn't exist!")
            return False
        
        print("📋 Table exists, checking columns...")
        
        # Check existing columns
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'practicequestion'
            ORDER BY column_name;
        """)
        
        existing_columns = [row[0] for row in cursor.fetchall()]
        print(f"📋 Existing columns: {existing_columns}")
        
        # Add missing columns
        migrations = [
            ("model_used", "ALTER TABLE practicequestion ADD COLUMN IF NOT EXISTS model_used VARCHAR;"),
            ("generation_prompt", "ALTER TABLE practicequestion ADD COLUMN IF NOT EXISTS generation_prompt TEXT;"),
            ("created_at", "ALTER TABLE practicequestion ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;"),
            ("updated_at", "ALTER TABLE practicequestion ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;")
        ]
        
        for column_name, sql in migrations:
            print(f"🔄 Adding column: {column_name}")
            cursor.execute(sql)
            print(f"✅ Added column: {column_name}")
        
        # Update existing records with timestamps
        print("🔄 Updating existing records with timestamps...")
        cursor.execute("""
            UPDATE practicequestion 
            SET created_at = COALESCE(created_at, CURRENT_TIMESTAMP),
                updated_at = COALESCE(updated_at, CURRENT_TIMESTAMP)
            WHERE id IS NOT NULL;
        """)
        
        rows_updated = cursor.rowcount
        print(f"✅ Updated {rows_updated} existing records")
        
        # Verify final column structure
        cursor.execute("""
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'practicequestion'
            ORDER BY ordinal_position;
        """)
        
        columns = cursor.fetchall()
        print("📋 Final table structure:")
        for col_name, data_type, is_nullable, col_default in columns:
            default_str = f" DEFAULT {col_default}" if col_default else ""
            nullable_str = "NULL" if is_nullable == "YES" else "NOT NULL"
            print(f"  - {col_name}: {data_type} {nullable_str}{default_str}")
        
        cursor.close()
        conn.close()
        
        print("🎉 Column migration completed successfully!")
        return True
        
    except psycopg2.Error as e:
        print(f"❌ Database error: {e}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Starting column migration for practicequestion table...")
    success = run_column_migration()
    
    if success:
        print("🎉 Column migration completed successfully!")
        print("\n✅ The practicequestion table now has all required columns.")
        print("✅ Practice session creation should work now.")
    else:
        print("💔 Migration failed. Check the error messages above.")