#!/bin/bash

# Menttor Backend Startup Script - Fresh Database Setup

echo "🚀 Starting Menttor Backend with fresh database setup..."

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

# Create fresh database tables (skip migrations)
echo "🔧 Creating fresh database tables..."
python -c "
import sys
sys.path.append('/app')

try:
    from database.session import create_db_and_tables
    create_db_and_tables()
    print('✅ Database tables created successfully')
except Exception as e:
    print(f'❌ Failed to create database tables: {e}')
    sys.exit(1)
"

if [ $? -ne 0 ]; then
    echo "❌ Database table creation failed. Exiting..."
    exit 1
fi

echo "✅ Database setup completed successfully"

# Start the FastAPI application
echo "🌟 Starting FastAPI application..."
exec python -m uvicorn main:app --host 0.0.0.0 --port $PORT --workers 4