# Menttor Production Deployment Guide

## Overview
Menttor uses a hybrid deployment architecture:
- **Frontend**: Next.js deployed on Vercel
- **Backend**: FastAPI deployed on Google Cloud Run
- **Database**: PostgreSQL on Google Cloud SQL
- **Authentication**: Firebase Auth
- **AI Services**: Google Vertex AI (Gemini 1.5 Flash)

## Google Cloud Infrastructure

### Project Details
- **Project ID**: `gen-lang-client-0319118634`
- **Region**: `asia-south1` (Mumbai)
- **Service Name**: `menttor-backend`

### Cloud Run Configuration
```bash
# Deployment settings
--region=asia-south1
--allow-unauthenticated
--min-instances=1
--max-instances=3
--memory=2Gi
--cpu=1
--timeout=300
```

### Environment Variables (Cloud Run)
```bash
GOOGLE_CLOUD_PROJECT_ID=your-project-id
CLOUD_SQL_INSTANCE_NAME=your-instance-name
CLOUD_SQL_REGION=your-region
USE_CLOUD_SQL_AUTH_PROXY=false
ENVIRONMENT=production
DATABASE_ECHO=false
POSTGRES_USER=your-db-user
POSTGRES_DB=your-database-name
POSTGRES_HOST=your-db-host
POSTGRES_PORT=5432
VERTEX_AI_PROJECT_ID=your-vertex-project-id
VERTEX_AI_REGION=us-central1
VERTEX_AI_MODEL_ID=gemini-1.5-flash
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_ID=your-google-client-id
```

### Google Secret Manager Secrets
```bash
# Database
postgres-password

# API Keys
openrouter-api-key
huggingface-hub-token

# Application Secrets
secret-key
refresh-secret-key
google-client-secret

# Firebase Credentials
firebase-service-account
```

## Docker Registry Setup

### Google Artifact Registry
- **Repository**: `menttor-repo`
- **Location**: `asia-south1`
- **Format**: Docker
- **Full URL**: `asia-south1-docker.pkg.dev/gen-lang-client-0319118634/menttor-repo`

### Docker Build & Push Commands
```bash
# Build image
docker build -t asia-south1-docker.pkg.dev/gen-lang-client-0319118634/menttor-repo/menttor-backend:latest .

# Push image
docker push asia-south1-docker.pkg.dev/gen-lang-client-0319118634/menttor-repo/menttor-backend:latest
```

## CI/CD Pipeline

### GitHub Actions Workflow
File: `.github/workflows/deploy-backend.yml`

**Triggers:**
- Push to `master` branch with changes in `backend/` directory
- Manual workflow dispatch

**Process:**
1. **Test Stage**: Basic syntax validation and model imports
2. **Deploy Stage**: 
   - Build Docker image
   - Push to Artifact Registry
   - Deploy to Cloud Run
   - Run health checks

### Required GitHub Secrets
- `GCP_SA_KEY`: Service account JSON key with permissions:
  - Cloud Run Developer
  - Artifact Registry Writer
  - Secret Manager Secret Accessor

## Database Setup

### PostgreSQL Configuration
- **Host**: `34.93.60.80`
- **Port**: `5432`
- **Database**: `menttor-db`
- **User**: `admin-db`
- **Connection**: Direct IP (not using Cloud SQL Proxy)

### Auto-Migration System
- Runs on application startup with 30-second timeout
- CI/CD-safe: preserves all user data
- Handles connection failures gracefully

## Authentication Flow

### Firebase Integration
1. Frontend authenticates users with Firebase Auth
2. Firebase ID tokens are sent to backend via Authorization header
3. Backend verifies tokens with Firebase Admin SDK
4. User records are synced between Firebase and PostgreSQL

### Fixed Issues
- **Race condition**: Added delay and token refresh in AuthContext
- **401 errors**: Proper token handling in API interceptors
- **WebSocket auth**: Secure token verification for real-time features

## Monitoring & Health Checks

### Available Endpoints
- `/health`: Comprehensive health check with database connectivity
- `/ready`: Simple readiness check
- `/pool-status`: Database connection pool monitoring
- `/test-db`: Database connectivity test

### Logging
- Structured logging with behavioral nudge filtering
- Request/response monitoring
- Database performance tracking

## Deployment Commands

### Manual Deployment
```bash
# Deploy to Cloud Run
gcloud run deploy menttor-backend \
  --image asia-south1-docker.pkg.dev/gen-lang-client-0319118634/menttor-repo/menttor-backend:latest \
  --region asia-south1 \
  --allow-unauthenticated \
  --min-instances=1 \
  --max-instances=3 \
  --memory=2Gi \
  --cpu=1 \
  --timeout=300
```

### Update Environment Variables
```bash
gcloud run services update menttor-backend \
  --region=asia-south1 \
  --set-env-vars="KEY=VALUE"
```

### Update Secrets
```bash
gcloud run services update menttor-backend \
  --region=asia-south1 \
  --set-secrets="SECRET_NAME=secret-version:latest"
```

## Frontend Configuration

### Vercel Environment Variables
```bash
NEXT_PUBLIC_BACKEND_URL=https://menttor-backend-[hash]-uc.a.run.app
```

## Troubleshooting

### Common Issues

1. **Database Connection Failures**
   - Check Cloud SQL instance is running
   - Verify IP address and credentials
   - Check Secret Manager permissions

2. **CI/CD Authentication Errors**
   - Verify GitHub secret `GCP_SA_KEY` is updated
   - Check service account has required IAM roles
   - Ensure Artifact Registry repository exists

3. **Frontend 401 Errors**
   - Check Firebase token refresh in AuthContext
   - Verify CORS origins in backend settings
   - Check API base URL in frontend

### Useful Commands
```bash
# Check Cloud Run service status
gcloud run services describe menttor-backend --region=asia-south1

# View logs
gcloud logs read "resource.type=cloud_run_revision AND resource.labels.service_name=menttor-backend" --limit=50

# Check Artifact Registry
gcloud artifacts repositories list --location=asia-south1

# Test database connection
curl https://your-service-url/test-db
```

## Security Notes
- All sensitive credentials stored in Google Secret Manager
- Firebase Admin SDK handles authentication
- CORS properly configured for frontend domain
- No secrets exposed in environment variables
- Service account follows principle of least privilege

## Performance Optimizations
- Database connection pooling with monitoring
- Query caching system
- Batch processing for bulk operations
- Rate limiting on authentication
- Graceful startup with timeout protection