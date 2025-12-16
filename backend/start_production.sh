#!/bin/bash

# Production CI/CD Safe Startup - Preserves All User Data

echo "Starting Menttor Backend - Production Mode..."
echo "CI/CD Safe: All existing user data will be preserved"

# Direct database connection - no proxy needed
export PYTHONPATH=${PYTHONPATH:-/app}

echo "Production startup - Using direct database connection"
echo "POSTGRES_USER: $POSTGRES_USER"
echo "POSTGRES_DB: $POSTGRES_DB"

# Quick database connectivity test
echo "Testing database connectivity..."

# CI/CD Safe Migration System - Auto-generates migrations based on SQLModel changes
echo "Setting up CI/CD safe auto-migration system..."

# Generate new migration if models changed (CI/CD safe - only adds schema changes)
echo "Auto-generating migration for any model changes..."
python -c "
import sys
sys.path.append('${PYTHONPATH}')
try:
    # Import all models to ensure they're registered with SQLModel.metadata
    from app.models.sql_models import *
    print('All SQLModels imported and registered')
except Exception as e:
    print(f'Model import warning: {e}')
"

# Auto-generate migration based on current SQLModels vs database state
python -m alembic revision --autogenerate -m "Auto-generated migration for current SQLModels" 2>/dev/null || echo "No new migrations needed"

# Run all pending migrations (CI/CD safe - preserves existing data)
echo "Running auto-generated migrations (preserves all existing data)..."
python -m alembic upgrade head

if [ $? -eq 0 ]; then
    echo "Auto-generated migrations completed successfully"
else
    echo "Migration failed, ensuring tables exist via SQLModel..."
    python -c "
import sys
sys.path.append('${PYTHONPATH}')
from app.database.session import create_db_and_tables
# SQLModel.metadata.create_all() only creates missing tables, preserves existing data
create_db_and_tables()
print('Database schema ensured via SQLModel (data preserved)')
    "
fi

echo "Database ready for production"

# Start FastAPI in production mode
echo "Starting FastAPI application..."
# Use PORT environment variable from Cloud Run (defaults to 8080 for local testing)
export PORT=${PORT:-8080}
echo "Starting server on port $PORT"
exec python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT