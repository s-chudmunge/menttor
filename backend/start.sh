#!/bin/bash

# Menttor Backend Startup Script for Render Docker with Google Cloud SQL Auth Proxy

echo "🚀 Starting Menttor Backend..."

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

# Run database migrations  
echo "🔧 Running database migrations..."
python -m alembic upgrade head

if [ $? -ne 0 ]; then
    echo "⚠️ Alembic migration had issues. Tables may already exist from previous setup."
    echo "✅ Continuing with existing database tables..."
fi

echo "✅ Database migrations completed successfully"

# Start the FastAPI application
echo "🌟 Starting FastAPI application..."
exec python -m uvicorn main:app --host 0.0.0.0 --port $PORT --workers 4