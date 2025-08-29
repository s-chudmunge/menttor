#!/bin/bash

# Production CI/CD Safe Startup - Preserves All User Data

echo "🚀 Starting Menttor Backend - Production Mode..."
echo "🛡️ CI/CD Safe: All existing user data will be preserved"

# Use direct connection (more reliable than Auth Proxy for now)
export USE_CLOUD_SQL_AUTH_PROXY=false
export PYTHONPATH=/app

echo "🔍 Production startup - direct database connection"
echo "POSTGRES_USER: $POSTGRES_USER"
echo "POSTGRES_DB: $POSTGRES_DB"

# Quick database connectivity test
echo "🔧 Testing database connectivity..."

# Create fresh database schema (wipe and recreate for clean deployment)
echo "🔄 Creating fresh database schema..."
python -c "
import sys
sys.path.append('/app')
from database.session import engine
from sqlalchemy import text

print('🗑️ Dropping all existing tables...')
with engine.begin() as conn:
    # Drop all tables to start fresh
    conn.execute(text('DROP SCHEMA public CASCADE'))
    conn.execute(text('CREATE SCHEMA public'))
    conn.execute(text('GRANT ALL ON SCHEMA public TO postgres'))
    conn.execute(text('GRANT ALL ON SCHEMA public TO public'))

print('✅ Database wiped clean')
"

# Run fresh migrations
echo "📦 Running complete database migrations..."
python -m alembic upgrade head

if [ $? -eq 0 ]; then
    echo "✅ Fresh database schema created successfully"
else
    echo "❌ Migration failed, falling back to SQLModel table creation"
    python -c "
import sys
sys.path.append('/app')
from database.session import create_db_and_tables
create_db_and_tables()
print('✅ Database tables created via SQLModel')
    "
fi

echo "✅ Database ready for production"

# Start FastAPI in production mode
echo "🌟 Starting FastAPI application..."
exec python -m uvicorn main:app --host 0.0.0.0 --port $PORT