#!/bin/bash

# Production CI/CD Safe Startup - Preserves All User Data

echo "Starting Menttor Backend - Production Mode..."
echo "Starting fresh: Dropping and recreating all tables based on current schema."

# Direct database connection - no proxy needed
export PYTHONPATH=${PYTHONPATH:-$(pwd)/app}

echo "Production startup - Using direct database connection"
echo "POSTGRES_USER: $POSTGRES_USER"
echo "POSTGRES_DB: $POSTGRES_DB"

# Drop and recreate all tables
echo "Dropping and recreating all tables..."
python -c "
import sys
sys.path.append('${PYTHONPATH}')
from database.session import engine
from sql_models import SQLModel
from sqlalchemy import text

print('Dropping and recreating public schema...')
with engine.connect() as connection:
    connection.execute(text('DROP SCHEMA public CASCADE;'))
    connection.execute(text('CREATE SCHEMA public;'))
    connection.commit()


print('Creating all tables...')
SQLModel.metadata.create_all(engine)
print('Tables created successfully.')
"

echo "Database ready for production"

# Start FastAPI in production mode
echo "Starting FastAPI application..."
# Use PORT environment variable from Cloud Run (defaults to 8080 for local testing)
export PORT=${PORT:-8080}
echo "Starting server on port $PORT"
exec python -m uvicorn main:app --host 0.0.0.0 --port $PORT