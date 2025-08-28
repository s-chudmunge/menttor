-- Practice Session Tables Migration for Google Cloud SQL
-- Run this in Google Cloud Console > SQL > Your Database > Query Editor

-- Create practicesession table
CREATE TABLE IF NOT EXISTS practicesession (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    roadmap_id INTEGER NOT NULL,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    subtopic_ids JSONB NOT NULL,
    question_types JSONB NOT NULL,
    question_count INTEGER NOT NULL,
    time_limit INTEGER NOT NULL,
    hints_enabled BOOLEAN NOT NULL DEFAULT true,
    subject VARCHAR(255) NOT NULL,
    goal TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    total_time_spent INTEGER,
    final_score FLOAT,
    correct_answers INTEGER,
    hints_used INTEGER,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Add foreign key constraints (adjust table names if needed)
ALTER TABLE practicesession 
ADD CONSTRAINT fk_practicesession_user 
FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE;

ALTER TABLE practicesession 
ADD CONSTRAINT fk_practicesession_roadmap 
FOREIGN KEY (roadmap_id) REFERENCES roadmap(id) ON DELETE CASCADE;

-- Create indexes
CREATE INDEX IF NOT EXISTS ix_practicesession_user_id ON practicesession(user_id);
CREATE INDEX IF NOT EXISTS ix_practicesession_roadmap_id ON practicesession(roadmap_id);
CREATE INDEX IF NOT EXISTS ix_practicesession_session_token ON practicesession(session_token);
CREATE INDEX IF NOT EXISTS ix_practicesession_status ON practicesession(status);
CREATE INDEX IF NOT EXISTS ix_practicesession_created_at ON practicesession(created_at);

-- Create practicequestion table
CREATE TABLE IF NOT EXISTS practicequestion (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL,
    subtopic_id VARCHAR(255) NOT NULL,
    question_type VARCHAR(50) NOT NULL,
    question_data JSONB NOT NULL,
    difficulty VARCHAR(20) NOT NULL DEFAULT 'medium',
    order_index INTEGER NOT NULL,
    model_used VARCHAR(100),
    generation_prompt TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Add foreign key constraint
ALTER TABLE practicequestion 
ADD CONSTRAINT fk_practicequestion_session 
FOREIGN KEY (session_id) REFERENCES practicesession(id) ON DELETE CASCADE;

-- Create indexes
CREATE INDEX IF NOT EXISTS ix_practicequestion_session_id ON practicequestion(session_id);
CREATE INDEX IF NOT EXISTS ix_practicequestion_subtopic_id ON practicequestion(subtopic_id);
CREATE INDEX IF NOT EXISTS ix_practicequestion_type ON practicequestion(question_type);

-- Create practiceanswer table
CREATE TABLE IF NOT EXISTS practiceanswer (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL,
    question_id INTEGER NOT NULL,
    user_answer TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL,
    time_spent INTEGER NOT NULL,
    hint_used BOOLEAN NOT NULL DEFAULT false,
    answered_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    question_order INTEGER NOT NULL DEFAULT 0
);

-- Add foreign key constraints
ALTER TABLE practiceanswer 
ADD CONSTRAINT fk_practiceanswer_session 
FOREIGN KEY (session_id) REFERENCES practicesession(id) ON DELETE CASCADE;

ALTER TABLE practiceanswer 
ADD CONSTRAINT fk_practiceanswer_question 
FOREIGN KEY (question_id) REFERENCES practicequestion(id) ON DELETE CASCADE;

-- Create indexes
CREATE INDEX IF NOT EXISTS ix_practiceanswer_session_id ON practiceanswer(session_id);
CREATE INDEX IF NOT EXISTS ix_practiceanswer_question_id ON practiceanswer(question_id);

-- Add practice-related columns to existing userprogress table
-- (Check if userprogress table exists and adjust table name if needed)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'userprogress') THEN
        ALTER TABLE userprogress ADD COLUMN IF NOT EXISTS practice_sessions_count INTEGER DEFAULT 0;
        ALTER TABLE userprogress ADD COLUMN IF NOT EXISTS last_practice_score FLOAT;
    END IF;
END $$;

-- Verify tables were created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('practicesession', 'practicequestion', 'practiceanswer')
ORDER BY table_name;