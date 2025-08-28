-- Create Practice Session Tables
-- Copy and paste this directly into Google Cloud SQL Query Editor

-- 1. Create practicesession table
CREATE TABLE practicesession (
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
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign keys (adjust table names if different)
    CONSTRAINT fk_practicesession_user FOREIGN KEY (user_id) REFERENCES "user"(id),
    CONSTRAINT fk_practicesession_roadmap FOREIGN KEY (roadmap_id) REFERENCES roadmap(id)
);

-- 2. Create practicequestion table
CREATE TABLE practicequestion (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL,
    subtopic_id VARCHAR(255) NOT NULL,
    question_type VARCHAR(50) NOT NULL,
    question_data JSONB NOT NULL,
    difficulty VARCHAR(20) NOT NULL DEFAULT 'medium',
    order_index INTEGER NOT NULL,
    model_used VARCHAR(100),
    generation_prompt TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_practicequestion_session FOREIGN KEY (session_id) REFERENCES practicesession(id)
);

-- 3. Create practiceanswer table
CREATE TABLE practiceanswer (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL,
    question_id INTEGER NOT NULL,
    user_answer TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL,
    time_spent INTEGER NOT NULL,
    hint_used BOOLEAN NOT NULL DEFAULT false,
    answered_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    question_order INTEGER NOT NULL DEFAULT 0,
    
    CONSTRAINT fk_practiceanswer_session FOREIGN KEY (session_id) REFERENCES practicesession(id),
    CONSTRAINT fk_practiceanswer_question FOREIGN KEY (question_id) REFERENCES practicequestion(id)
);

-- 4. Create indexes for performance
CREATE INDEX ix_practicesession_user_id ON practicesession(user_id);
CREATE INDEX ix_practicesession_roadmap_id ON practicesession(roadmap_id);
CREATE INDEX ix_practicesession_status ON practicesession(status);

CREATE INDEX ix_practicequestion_session_id ON practicequestion(session_id);
CREATE INDEX ix_practicequestion_subtopic_id ON practicequestion(subtopic_id);

CREATE INDEX ix_practiceanswer_session_id ON practiceanswer(session_id);
CREATE INDEX ix_practiceanswer_question_id ON practiceanswer(question_id);

-- 5. Add practice columns to existing userprogress table (optional)
ALTER TABLE userprogress ADD COLUMN IF NOT EXISTS practice_sessions_count INTEGER DEFAULT 0;
ALTER TABLE userprogress ADD COLUMN IF NOT EXISTS last_practice_score FLOAT;

-- 6. Verify tables were created
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'practice%'
ORDER BY table_name;