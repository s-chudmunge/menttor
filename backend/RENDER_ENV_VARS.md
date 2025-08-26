# Render Environment Variables Configuration

## Required Environment Variables for Google Cloud SQL

### Google Cloud SQL Authentication
```bash
# Enable Cloud SQL Auth Proxy (set to true for production)
USE_CLOUD_SQL_AUTH_PROXY=true

# Your Google Cloud Project ID
GOOGLE_CLOUD_PROJECT_ID=your-project-id

# Cloud SQL instance details
CLOUD_SQL_INSTANCE_NAME=menttor-db-instance
CLOUD_SQL_REGION=asia-south1

# Service Account Credentials (entire JSON as a string)
GOOGLE_APPLICATION_CREDENTIALS_JSON={"type":"service_account","project_id":"your-project-id",...}
```

### Database Configuration
```bash
# Database connection details
POSTGRES_USER=admin-db
POSTGRES_PASSWORD=tyson2012
POSTGRES_DB=menttor-db

# Alternative: Direct DATABASE_URL (fallback if Cloud SQL Auth Proxy fails)
DATABASE_URL=postgresql://admin-db:tyson2012@34.93.60.80:5432/menttor-db
```

### Other Required Variables
```bash
# Application secrets
SECRET_KEY=BWyLoXkIIYi3tC5VXpopBr5NilxafLLLZGZP9AxCbs0=
REFRESH_SECRET_KEY=42efd2324ccea375b2c49a468d9e30229e3f73acb2d76f40385efa15530e9328

# API Keys
OPENROUTER_API_KEY=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
HUGGINGFACE_HUB_TOKEN=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

# Vertex AI Configuration
VERTEX_AI_PROJECT_ID=gen-lang-client-0319118634
VERTEX_AI_REGION=us-central1
VERTEX_AI_MODEL_ID=gemini-1.5-flash

# Google OAuth
GOOGLE_CLIENT_ID=144050828172-7c4f3ms8ou0a2sjp8egsta35rtq6atq8.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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

# Firebase
FIREBASE_PROJECT_ID=menttorlabs-779fe
FIREBASE_PRIVATE_KEY_ID=68c2f39fde97461ad262dee26fbbb95545bfc2d6
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n[YOUR_PRIVATE_KEY]\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@menttorlabs-779fe.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=113389293844332048038
FIREBASE_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40menttorlabs-779fe.iam.gserviceaccount.com

# CORS Configuration
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000,http://127.0.0.1:3001,https://menttor.live,https://www.menttor.live

# Application Settings
ENVIRONMENT=production
DATABASE_ECHO=false
ENABLE_AUTH_BYPASS=false
```

## Render Deployment Configuration

### Build Command
```bash
pip install -r requirements.txt
```

### Start Command
```bash
./start.sh
```

## Cloud SQL Connection Methods

The application supports two connection methods:

### 1. Cloud SQL Auth Proxy (Recommended)
- Set `USE_CLOUD_SQL_AUTH_PROXY=true`
- Provide `GOOGLE_APPLICATION_CREDENTIALS_JSON` with your service account key
- The app will automatically handle secure connections through the Auth Proxy

### 2. Direct Connection (Fallback)
- Set `USE_CLOUD_SQL_AUTH_PROXY=false`
- Use the direct `DATABASE_URL` with your Cloud SQL instance's public IP
- Less secure but simpler setup

## Service Account Permissions

Your service account should have the following IAM roles:
- `Cloud SQL Client`
- `Cloud SQL Editor` (if you need to create databases/users)

## Troubleshooting

### Connection Issues
1. Verify your service account has the correct permissions
2. Check that the Cloud SQL instance allows connections from Render's IP ranges
3. Ensure the database name, username, and password are correct
4. Check the logs for specific error messages

### Fallback Behavior
If Cloud SQL Auth Proxy fails to initialize, the application will automatically fall back to direct connection using the DATABASE_URL.