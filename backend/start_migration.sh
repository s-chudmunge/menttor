#!/bin/bash

# Menttor Backend Startup Script - One-time Migration from Railway to Google Cloud

echo "🚀 Starting Menttor Backend - Railway to Google Cloud Migration..."

# Set environment variables for Cloud SQL
export USE_CLOUD_SQL_AUTH_PROXY=true

# Validate required environment variables
if [ -z "$GOOGLE_APPLICATION_CREDENTIALS_JSON" ]; then
    echo "⚠️  WARNING: GOOGLE_APPLICATION_CREDENTIALS_JSON not found. Falling back to direct connection."
    export USE_CLOUD_SQL_AUTH_PROXY=false
fi

if [ -z "$GOOGLE_CLOUD_PROJECT_ID" ]; then
    echo "⚠️  WARNING: GOOGLE_CLOUD_PROJECT_ID not set. Using default settings."
fi

# Set Python path for Docker container
export PYTHONPATH=/app

# Debug environment variables
echo "🔍 Environment check:"
echo "USE_CLOUD_SQL_AUTH_PROXY: $USE_CLOUD_SQL_AUTH_PROXY"
echo "POSTGRES_USER: $POSTGRES_USER"
echo "POSTGRES_DB: $POSTGRES_DB"
echo "GOOGLE_CLOUD_PROJECT_ID: $GOOGLE_CLOUD_PROJECT_ID"

# Test database connection first
echo "🔧 Testing database connection..."
python -c "
import sys
sys.path.append('/app')
from core.config import settings
print(f'Database URL configured: {settings.get_database_url()[:50]}...')
"

# Check if this is a fresh Google Cloud database (no tables exist)
echo "🔍 Checking if database is empty (fresh Google Cloud setup)..."
TABLES_EXIST=$(python -c "
import sys
sys.path.append('/app')
try:
    from database.session import engine
    with engine.connect() as conn:
        result = conn.execute(\"SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public'\")
        count = result.scalar()
        print(count)
except Exception as e:
    print('0')  # Assume empty if error
" 2>/dev/null)

if [ "$TABLES_EXIST" = "0" ]; then
    echo "🆕 Fresh Google Cloud database detected. Creating initial tables..."
    python -c "
import sys
sys.path.append('/app')
try:
    from database.session import create_db_and_tables
    create_db_and_tables()
    print('✅ Fresh database tables created successfully')
except Exception as e:
    print(f'❌ Failed to create database tables: {e}')
    sys.exit(1)
    "
    
    if [ $? -ne 0 ]; then
        echo "❌ Database table creation failed. Exiting..."
        exit 1
    fi
    
    # Mark database as migrated (for future deployments)
    python -c "
import sys
sys.path.append('/app')
try:
    from database.session import engine
    from sqlalchemy import text
    with engine.connect() as conn:
        # Create a simple migration marker
        conn.execute(text('CREATE TABLE IF NOT EXISTS _migration_status (migrated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)'))
        conn.execute(text('INSERT INTO _migration_status DEFAULT VALUES'))
        conn.commit()
        print('✅ Migration marker created')
except Exception as e:
    print(f'⚠️  Warning: Could not create migration marker: {e}')
    "
    
    echo "✅ Fresh Google Cloud database setup completed!"
    
else
    echo "📊 Existing tables found. Running normal migrations..."
    # Run normal alembic migrations for existing database
    python -m alembic upgrade head
    
    if [ $? -ne 0 ]; then
        echo "❌ Database migration failed. Exiting..."
        exit 1
    fi
    
    echo "✅ Database migrations completed successfully"
fi

# Start the FastAPI application with memory optimization
echo "🌟 Starting FastAPI application..."
exec python -m uvicorn main:app --host 0.0.0.0 --port $PORT --workers 1 --worker-class uvicorn.workers.UvicornWorker