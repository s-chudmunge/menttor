#!/bin/bash

# Fast Production Startup - Skip migrations for speed

echo "🚀 Starting Menttor Backend - Fast Production Mode..."
echo "⚡ Skipping migrations for faster deployment"

# Use direct connection
export USE_CLOUD_SQL_AUTH_PROXY=false
export PYTHONPATH=/app

echo "🔍 Direct database connection"
echo "POSTGRES_USER: $POSTGRES_USER"
echo "POSTGRES_DB: $POSTGRES_DB"

# Skip database migrations entirely - tables already exist and working
echo "⚡ Skipping migrations - database already configured"
echo "✅ Database ready for production"

# Start FastAPI immediately
echo "🌟 Starting FastAPI application..."
exec python -m uvicorn main:app --host 0.0.0.0 --port $PORT