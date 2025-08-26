# 🚨 RENDER PRE-PUSH CHECKLIST

## ⚠️ DO THESE STEPS BEFORE PUSHING TO GITHUB

### 1. Update Render Service Settings
Go to: **Render Dashboard → [Your Service] → Settings**

**Start Command:** Change to:
```bash
./start.sh
```

### 2. Add New Environment Variables
Go to: **Render Dashboard → [Your Service] → Environment**

**Add these new variables:**
```bash
USE_CLOUD_SQL_AUTH_PROXY=true
GOOGLE_CLOUD_PROJECT_ID=[Your Google Cloud Project ID]
GOOGLE_APPLICATION_CREDENTIALS_JSON=[Your entire service account JSON as one line]
```

**Example of GOOGLE_APPLICATION_CREDENTIALS_JSON format:**
```bash
{"type":"service_account","project_id":"your-project-123","private_key_id":"abc123","private_key":"-----BEGIN PRIVATE KEY-----\nMIIEvQ...","client_email":"service-account@your-project.iam.gserviceaccount.com","client_id":"123456789","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/service-account%40your-project.iam.gserviceaccount.com"}
```

### 3. Verify Existing Environment Variables
Make sure these are still set correctly:
```bash
POSTGRES_USER=admin-db
POSTGRES_PASSWORD=tyson2012
POSTGRES_DB=menttor-db
SECRET_KEY=[your secret key]
OPENROUTER_API_KEY=[your API key]
```

### 4. Optional: Test Cloud SQL Connection
Add this temporarily to test:
```bash
DATABASE_URL=postgresql://admin-db:tyson2012@34.93.60.80:5432/menttor-db
```
(Keep as fallback in case Cloud SQL Auth Proxy fails)

## ✅ AFTER CONFIGURING ABOVE, YOU CAN SAFELY PUSH TO GITHUB

## 🔍 What to Monitor After Push

1. **Render Build Logs** - Check for dependency installation
2. **Render Deploy Logs** - Look for:
   ```
   ✅ Using Google Cloud SQL Auth Proxy connection
   ✅ Running database migrations...
   ✅ Starting FastAPI application...
   ```

## 🚨 If Deployment Fails

**Quick Recovery Steps:**
1. Set `USE_CLOUD_SQL_AUTH_PROXY=false` in Render
2. Ensure `DATABASE_URL` is set as fallback
3. Redeploy manually from Render dashboard

## 📞 Need Help?
Check the deployment logs in Render for specific error messages!