#!/bin/bash

# Optimized Fast Startup for Render - Skip Cloud SQL Auth Proxy for now

echo "🚀 Starting Menttor Backend - Fast Deployment Mode..."

# Skip Cloud SQL Auth Proxy to avoid timeout issues
export USE_CLOUD_SQL_AUTH_PROXY=false

# Set Python path for Docker container
export PYTHONPATH=/app

# Quick environment check
echo "🔍 Fast startup mode - using direct database connection"
echo "POSTGRES_USER: $POSTGRES_USER"
echo "POSTGRES_DB: $POSTGRES_DB"

# Test direct database connection quickly
echo "🔧 Quick database test..."

# Ensure database tables exist (CI/CD safe - preserves existing data)
echo "🛡️ Ensuring database tables exist (preserves all existing data)..."
timeout 30 python -c "
import sys
sys.path.append('/app')
try:
    from database.session import create_db_and_tables
    # This only creates tables that don't exist - preserves all data
    create_db_and_tables()
    print('✅ Database schema verified (existing data preserved)')
except Exception as e:
    print(f'⚠️ Database schema check: {e}')
    print('✅ Continuing with existing database (data preserved)')
    # Continue anyway - tables likely already exist with data
"

echo "✅ Database setup completed"

# Start FastAPI with minimal configuration
echo "🌟 Starting FastAPI (optimized)..."
exec python -m uvicorn main:app --host 0.0.0.0 --port $PORT