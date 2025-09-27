#!/usr/bin/env python3
"""
Manual migration script to add missing columns to learningcontent table.
Run this to fix the database schema.
"""

import os
import sys
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def get_database_url():
    """Get database URL from environment variables"""
    # Try different environment variable patterns
    db_url = os.getenv('DATABASE_URL')
    if not db_url:
        db_host = os.getenv('DB_HOST', 'localhost')
        db_port = os.getenv('DB_PORT', '5432')
        db_name = os.getenv('DB_NAME', 'menttor')
        db_user = os.getenv('DB_USER', 'postgres')
        db_password = os.getenv('DB_PASSWORD', '')
        db_url = f"postgresql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"
    return db_url

def run_migration():
    """Run the migration to add missing columns"""
    try:
        db_url = get_database_url()
        print(f"Connecting to database: {db_url[:50]}...")
        
        engine = create_engine(db_url)
        
        with engine.connect() as conn:
            # Start transaction
            trans = conn.begin()
            
            try:
                # Check if columns already exist
                result = conn.execute(text("""
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name = 'learningcontent' 
                    AND column_name IN ('is_generated', 'roadmap_id')
                """))
                existing_columns = [row[0] for row in result.fetchall()]
                
                # Add is_generated column if it doesn't exist
                if 'is_generated' not in existing_columns:
                    print("Adding is_generated column...")
                    conn.execute(text("""
                        ALTER TABLE learningcontent 
                        ADD COLUMN is_generated BOOLEAN NOT NULL DEFAULT FALSE
                    """))
                    print("✅ Added is_generated column")
                else:
                    print("✅ is_generated column already exists")
                
                # Add roadmap_id column if it doesn't exist
                if 'roadmap_id' not in existing_columns:
                    print("Adding roadmap_id column...")
                    conn.execute(text("""
                        ALTER TABLE learningcontent 
                        ADD COLUMN roadmap_id INTEGER
                    """))
                    print("✅ Added roadmap_id column")
                    
                    # Add foreign key constraint (if roadmap table exists)
                    try:
                        conn.execute(text("""
                            ALTER TABLE learningcontent 
                            ADD CONSTRAINT fk_learningcontent_roadmap_id 
                            FOREIGN KEY (roadmap_id) REFERENCES roadmap(id)
                        """))
                        print("✅ Added foreign key constraint")
                    except Exception as e:
                        print(f"⚠️  Could not add foreign key constraint: {e}")
                    
                    # Add index
                    try:
                        conn.execute(text("""
                            CREATE INDEX ix_learningcontent_roadmap_id 
                            ON learningcontent(roadmap_id)
                        """))
                        print("✅ Added index on roadmap_id")
                    except Exception as e:
                        print(f"⚠️  Could not add index: {e}")
                else:
                    print("✅ roadmap_id column already exists")
                
                # Commit transaction
                trans.commit()
                print("🎉 Migration completed successfully!")
                
            except Exception as e:
                trans.rollback()
                raise e
                
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    run_migration()