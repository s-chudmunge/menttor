#!/usr/bin/env python3
"""
Direct migration script for practice tables
Runs the practice session migration directly without Alembic
"""

import os
import sys
sys.path.append('/app')

# Import database connection
try:
    from app.database.session import engine
    from sqlalchemy import text
    import logging
    
    logging.basicConfig(level=logging.INFO)
    logger = logging.getLogger(__name__)
    
    def run_practice_migration():
        """Run the practice session tables migration directly"""
        
        # Check if tables already exist
        with engine.connect() as conn:
            # Check if practicesession table exists
            result = conn.execute(text("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_name = 'practicesession'
                );
            """))
            tables_exist = result.fetchone()[0]
            
            if tables_exist:
                # Check if model_used column exists in practicequestion
                result = conn.execute(text("""
                    SELECT EXISTS (
                        SELECT FROM information_schema.columns 
                        WHERE table_name = 'practicequestion' 
                        AND column_name = 'model_used'
                    );
                """))
                model_used_exists = result.fetchone()[0]
                
                if model_used_exists:
                    print("✅ Practice tables already exist with all required columns")
                    return
                else:
                    print("⚠️ Adding missing model_used column to practicequestion table")
                    conn.execute(text("ALTER TABLE practicequestion ADD COLUMN IF NOT EXISTS model_used VARCHAR"))
                    conn.execute(text("ALTER TABLE practicequestion ADD COLUMN IF NOT EXISTS generation_prompt TEXT"))
                    conn.commit()
                    print("✅ Missing columns added")
                    return
            
            print("🔧 Creating practice session tables...")
            
            # Create the practice tables
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS practicesession (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL REFERENCES "user"(id),
                    roadmap_id INTEGER NOT NULL REFERENCES roadmap(id),
                    session_token VARCHAR NOT NULL UNIQUE,
                    subtopic_ids JSONB NOT NULL,
                    question_types JSONB NOT NULL,
                    question_count INTEGER NOT NULL,
                    time_limit INTEGER NOT NULL,
                    hints_enabled BOOLEAN NOT NULL DEFAULT true,
                    subject VARCHAR NOT NULL,
                    goal VARCHAR NOT NULL,
                    status VARCHAR NOT NULL DEFAULT 'active',
                    started_at TIMESTAMP,
                    completed_at TIMESTAMP,
                    total_time_spent INTEGER,
                    final_score FLOAT,
                    correct_answers INTEGER,
                    hints_used INTEGER,
                    created_at TIMESTAMP NOT NULL DEFAULT NOW()
                );
            """))
            
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS ix_practicesession_roadmap_id ON practicesession(roadmap_id);
                CREATE UNIQUE INDEX IF NOT EXISTS ix_practicesession_session_token ON practicesession(session_token);
                CREATE INDEX IF NOT EXISTS ix_practicesession_user_id ON practicesession(user_id);
            """))
            
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS practicequestion (
                    id SERIAL PRIMARY KEY,
                    session_id INTEGER NOT NULL REFERENCES practicesession(id),
                    subtopic_id VARCHAR NOT NULL,
                    question_type VARCHAR NOT NULL,
                    question_data JSONB NOT NULL,
                    difficulty VARCHAR NOT NULL DEFAULT 'medium',
                    order_index INTEGER NOT NULL,
                    model_used VARCHAR,
                    generation_prompt TEXT,
                    created_at TIMESTAMP NOT NULL DEFAULT NOW()
                );
            """))
            
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS ix_practicequestion_session_id ON practicequestion(session_id);
                CREATE INDEX IF NOT EXISTS ix_practicequestion_subtopic_id ON practicequestion(subtopic_id);
            """))
            
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS practiceanswer (
                    id SERIAL PRIMARY KEY,
                    session_id INTEGER NOT NULL REFERENCES practicesession(id),
                    question_id INTEGER NOT NULL REFERENCES practicequestion(id),
                    user_answer TEXT NOT NULL,
                    is_correct BOOLEAN NOT NULL,
                    time_spent INTEGER NOT NULL,
                    hint_used BOOLEAN NOT NULL DEFAULT false,
                    answered_at TIMESTAMP NOT NULL DEFAULT NOW(),
                    question_order INTEGER NOT NULL DEFAULT 0
                );
            """))
            
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS ix_practiceanswer_question_id ON practiceanswer(question_id);
                CREATE INDEX IF NOT EXISTS ix_practiceanswer_session_id ON practiceanswer(session_id);
            """))
            
            # Add columns to userprogress table if they don't exist
            conn.execute(text("""
                ALTER TABLE userprogress 
                ADD COLUMN IF NOT EXISTS practice_sessions_count INTEGER NOT NULL DEFAULT 0;
            """))
            
            conn.execute(text("""
                ALTER TABLE userprogress 
                ADD COLUMN IF NOT EXISTS last_practice_score FLOAT;
            """))
            
            conn.commit()
            print("✅ Practice session tables created successfully")
            
    if __name__ == "__main__":
        run_practice_migration()
        
except Exception as e:
    print(f"❌ Migration failed: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)