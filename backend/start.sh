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

# Run database migrations
echo "🔧 Running database migrations..."
python -m alembic upgrade head

if [ $? -ne 0 ]; then
    echo "❌ Database migration failed. Exiting..."
    exit 1
fi

echo "✅ Database migrations completed successfully"

# Start the FastAPI application
echo "🌟 Starting FastAPI application..."
exec python -m uvicorn main:app --host 0.0.0.0 --port $PORT --workers 4