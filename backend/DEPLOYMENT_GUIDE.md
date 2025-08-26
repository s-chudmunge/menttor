# Google Cloud SQL + Render Deployment Guide

## 🚀 Complete Setup Guide

### 1. Updated Files
The following files have been created/updated:

- ✅ `requirements.txt` - Added Cloud SQL dependencies
- ✅ `app/database/cloud_sql.py` - New Cloud SQL Auth Proxy connector
- ✅ `app/database/session.py` - Updated to support Cloud SQL
- ✅ `app/core/config.py` - Added Cloud SQL configuration options
- ✅ `start.sh` - Render startup script with migrations
- ✅ `render.yaml` - Render deployment configuration
- ✅ `test_cloud_sql_connection.py` - Connection test script
- ✅ `RENDER_ENV_VARS.md` - Environment variables documentation

### 2. Render Configuration Steps

#### Step 1: Update Build & Start Commands
In your Render service settings:

**Build Command:**
```bash
pip install -r requirements.txt
```

**Start Command:**
```bash
./start.sh
```

#### Step 2: Set Environment Variables
In Render dashboard, add these environment variables:

**🔐 Required Secrets (set these manually):**
```
GOOGLE_APPLICATION_CREDENTIALS_JSON={"type":"service_account",...}
POSTGRES_PASSWORD=tyson2012
SECRET_KEY=BWyLoXkIIYi3tC5VXpopBr5NilxafLLLZGZP9AxCbs0=
OPENROUTER_API_KEY=sk-or-v1-...
GOOGLE_CLIENT_SECRET=GOCSPX-...
```

**⚙️ Configuration Variables:**
```
USE_CLOUD_SQL_AUTH_PROXY=true
GOOGLE_CLOUD_PROJECT_ID=your-project-id
CLOUD_SQL_INSTANCE_NAME=menttor-db-instance
CLOUD_SQL_REGION=asia-south1
POSTGRES_USER=admin-db
POSTGRES_DB=menttor-db
ENVIRONMENT=production
DATABASE_ECHO=false
CORS_ALLOWED_ORIGINS=http://localhost:3000,https://menttor.live,https://www.menttor.live
```

### 3. Google Cloud SQL Instance Details

Your Cloud SQL instance connection name format:
```
your-project-id:asia-south1:menttor-db-instance
```

### 4. How the Connection Works

#### 🔄 Connection Flow
1. **Cloud SQL Auth Proxy (Primary)**
   - Uses service account JSON from `GOOGLE_APPLICATION_CREDENTIALS_JSON`
   - Creates secure tunnel to Cloud SQL instance
   - No need for IP whitelisting
   - Automatic SSL/TLS encryption

2. **Direct Connection (Fallback)**
   - If Cloud SQL Auth Proxy fails, falls back to direct connection
   - Uses `DATABASE_URL` or individual connection parameters
   - Requires IP whitelisting in Cloud SQL

#### 🔍 Connection Logic
```python
# The app checks USE_CLOUD_SQL_AUTH_PROXY=true
if Cloud SQL Auth Proxy is enabled:
    try:
        # Use google-cloud-sql-connector with service account JSON
        # Connect via: your-project-id:region:instance-name
    except:
        # Fall back to direct connection
        # Use DATABASE_URL or individual parameters
```

### 5. Service Account Requirements

Your service account needs these IAM roles:
- `Cloud SQL Client` (minimum required)
- `Cloud SQL Editor` (if creating databases/users)

### 6. Testing the Connection

After deployment, check Render logs for:
```
✅ Using Google Cloud SQL Auth Proxy connection
✅ Cloud SQL engine created successfully
✅ Running database migrations...
✅ Starting FastAPI application...
```

If Cloud SQL fails, you'll see:
```
⚠️  Cloud SQL dependencies not available, falling back to direct connection
⚠️  Using direct database connection
```

### 7. Troubleshooting

#### Common Issues:

1. **"Cloud SQL dependencies not available"**
   - Solution: Redeploy to ensure new dependencies are installed

2. **"Invalid JSON in GOOGLE_APPLICATION_CREDENTIALS_JSON"**
   - Solution: Ensure the entire JSON is properly formatted as a string

3. **"Failed to initialize Cloud SQL Connector"**
   - Check service account permissions
   - Verify project ID and instance name are correct

4. **Connection timeouts**
   - Check if your Cloud SQL instance is running
   - Verify region and instance name settings

### 8. Verification Steps

1. Deploy to Render with new configuration
2. Check logs for successful Cloud SQL connection
3. Verify database tables are created via migrations
4. Test API endpoints to confirm database connectivity

### 9. Environment Variables Format

**Important:** For the service account JSON, copy the ENTIRE JSON content as a single line string:

```bash
GOOGLE_APPLICATION_CREDENTIALS_JSON={"type":"service_account","project_id":"your-project",...}
```

**NOT as separate lines or with line breaks.**

### 10. Benefits of This Setup

✅ **Secure**: Uses Google Cloud IAM for authentication
✅ **Reliable**: Automatic fallback to direct connection
✅ **Scalable**: Connection pooling and auto-reconnection
✅ **Flexible**: Easy to switch between Cloud SQL and direct connection
✅ **Production-Ready**: Proper error handling and logging

## 🎯 Next Steps

1. Update your Render service with the new configuration
2. Set all required environment variables
3. Deploy and monitor the logs
4. Test your application endpoints
5. Update your frontend to use the new domain (menttor.live)

Your backend is now configured to use Google Cloud SQL with secure authentication! 🎉