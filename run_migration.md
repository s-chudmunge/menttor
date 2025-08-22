# Migration Instructions

## Commands to run on your backend server:

```bash
# Navigate to backend directory
cd /path/to/backend

# Create and run migration
alembic revision --autogenerate -m "add user onboarding fields"
alembic upgrade head
```

## Or if using the manual SQL file:
```bash
# Connect to your Neon database and run:
psql "your-neon-connection-string" -f migrations/add_user_onboarding_fields.sql
```

## Verify migration worked:
```sql
-- Check that columns were added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'user' 
AND column_name IN ('display_name', 'profile_completed', 'onboarding_completed');
```