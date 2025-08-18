#!/bin/bash

# Check for --fresh flag
FRESH_START=false
if [ "$1" == "--fresh" ]; then
  FRESH_START=true
fi

# This script performs a full setup and starts all services for local development.
# It combines environment setup, database startup, and service launching.

# Stop on any error
set -e

PROJECT_ROOT="$(pwd)"

echo "--- Running Environment Setup ---"

echo "Environment setup complete!"
echo "Please ensure your .env and frontend/.env.local files are correctly populated with all necessary environment variables, including Firebase credentials."

echo -e "\n--- Setting up Backend Database ---"
if [ "$FRESH_START" = true ]; then
    echo -e "\n--fresh flag detected. Resetting backend database..."
    docker compose down
    docker volume rm production_postgres_data
    docker compose up -d db
else
    # Ask the user if they want to reset the database
    read -p "Do you want to reset the backend database? All data will be lost. (y/N) " -n 1 -r
    echo  # Move to a new line
    if [[ $REPLY =~ ^[Yy]$ ]]
    then
        echo -e "\nResetting backend database..."
        docker compose down
        docker volume rm production_postgres_data
        docker compose up -d db
    else
        echo -e "\nSkipping backend database reset."
    fi
fi



echo -e "\n--- Starting Dockerized PostgreSQL Database ---"
docker compose up -d

# Wait for PostgreSQL to be ready
echo -e "\n--- Waiting for PostgreSQL to be ready ---"
sleep 10
echo "Checking PostgreSQL connection..."

# Try to connect and wait until ready
for i in {1..30}; do
    if docker exec production-db-1 pg_isready -U postgres >/dev/null 2>&1; then
        echo "PostgreSQL is ready!"
        break
    else
        echo "Waiting for PostgreSQL... (attempt $i/30)"
        sleep 2
    fi
    if [ $i -eq 30 ]; then
        echo "ERROR: PostgreSQL failed to start after 60 seconds"
        exit 1
    fi
done

# Initialize database tables (since we have a fresh database)
echo -e "\n--- Initializing Database Tables ---"
(cd ${PROJECT_ROOT}/backend && source venv/bin/activate && set -a && source ${PROJECT_ROOT}/.env && set +a && PYTHONPATH="${PROJECT_ROOT}/backend/app" python -c "
from database.session import create_db_and_tables
import sql_models
create_db_and_tables()
print('✅ Database tables created successfully')
")





echo -e "\n--- Launching Services in New Terminal Tabs ---"

# --- Start Backend ---
gnome-terminal --tab --title="Backend" -- bash -c "echo 'Starting FastAPI backend...'; cd ${PROJECT_ROOT}/backend && source venv/bin/activate && set -a; source ${PROJECT_ROOT}/.env; set +a; PYTHONPATH=${PROJECT_ROOT}/backend/app uvicorn app.main:app --reload --port 8000 --log-level debug; exec bash"



# --- Start Frontend ---
gnome-terminal --tab --title="Frontend" -- bash -c "echo 'Starting Next.js frontend...'; cd ${PROJECT_ROOT}/frontend && npm run dev; exec bash"

echo -e "\nAll services are starting in new terminal tabs. Check each tab for logs."