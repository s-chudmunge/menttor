#!/usr/bin/env python3
"""
Run practice session migration on Google Cloud SQL
Usage: python3 run_cloud_migration.py
"""
import os
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

# Google Cloud SQL connection parameters
# Update these with your actual connection details
CLOUD_SQL_CONFIG = {
    'host': os.getenv('DB_HOST', '34.93.60.80'),  # Your Cloud SQL public IP
    'port': os.getenv('DB_PORT', '5432'),
    'database': os.getenv('DB_NAME', 'menttor-db'),
    'user': os.getenv('DB_USER', 'admin-db'),
    'password': os.getenv('DB_PASSWORD', ''),  # Set this in environment
}

def run_migration():
    """Run the practice session migration"""
    
    # Check if password is set
    if not CLOUD_SQL_CONFIG['password']:
        print("❌ DB_PASSWORD environment variable not set!")
        print("Set it with: export DB_PASSWORD='your_password'")
        return False
    
    try:
        print("🔄 Connecting to Google Cloud SQL...")
        
        # Connect to database
        conn = psycopg2.connect(**CLOUD_SQL_CONFIG)
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()
        
        print("✅ Connected to database")
        
        # Read migration SQL
        with open('migrations/practice_session_tables.sql', 'r') as f:
            migration_sql = f.read()
        
        print("🔄 Running migration...")
        
        # Execute migration
        cursor.execute(migration_sql)
        
        print("✅ Migration completed successfully!")
        
        # Verify tables exist
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('practicesession', 'practicequestion', 'practiceanswer')
            ORDER BY table_name
        """)
        
        tables = cursor.fetchall()
        print(f"📋 Created tables: {[table[0] for table in tables]}")
        
        cursor.close()
        conn.close()
        
        return True
        
    except psycopg2.Error as e:
        print(f"❌ Database error: {e}")
        return False
    except FileNotFoundError:
        print("❌ Migration file not found. Make sure practice_session_tables.sql exists in migrations/")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Starting Google Cloud SQL migration for practice sessions...")
    success = run_migration()
    
    if success:
        print("🎉 Migration completed successfully!")
        print("\nNext steps:")
        print("1. Test the API endpoints")
        print("2. Update frontend to use real API")
        print("3. Test complete practice flow")
    else:
        print("💔 Migration failed. Check the error messages above.")