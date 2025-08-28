#!/bin/bash
# Google Cloud SQL Migration Script
# Usage: ./migrate_gcloud.sh

# Configuration - Update these values
PROJECT_ID="your-project-id"
INSTANCE_NAME="your-sql-instance-name"
DATABASE_NAME="menttor-db"

echo "🔄 Running practice session migration on Google Cloud SQL..."

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ gcloud CLI not found. Please install Google Cloud SDK."
    echo "Visit: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if migration file exists
if [ ! -f "migrations/practice_session_tables.sql" ]; then
    echo "❌ Migration file not found: migrations/practice_session_tables.sql"
    exit 1
fi

echo "📋 Using configuration:"
echo "  Project: $PROJECT_ID"
echo "  Instance: $INSTANCE_NAME"
echo "  Database: $DATABASE_NAME"
echo ""

# Run migration
echo "🚀 Executing migration..."
gcloud sql connect $INSTANCE_NAME \
    --user=postgres \
    --database=$DATABASE_NAME \
    --project=$PROJECT_ID < migrations/practice_session_tables.sql

if [ $? -eq 0 ]; then
    echo "✅ Migration completed successfully!"
    echo ""
    echo "🎉 Practice session tables created in Google Cloud SQL!"
    echo ""
    echo "Next steps:"
    echo "1. Test the API endpoints"
    echo "2. Update environment variables if needed"
    echo "3. Deploy and test the complete flow"
else
    echo "❌ Migration failed. Check the error messages above."
    exit 1
fi