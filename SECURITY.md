# Security Notice

This repository has been sanitized for public access. All sensitive credentials have been removed or secured.

## 🔒 What Was Secured

### ✅ Removed Sensitive Files
- `.env` files containing database passwords, API keys, and secrets
- Firebase service account JSON files
- Configuration files with hardcoded credentials

### ✅ Secured Hardcoded Credentials  
- Admin usernames and passwords moved to environment variables
- Default fallback values use placeholder text

### ✅ Enhanced .gitignore
- Prevents accidentally committing sensitive files
- Covers all common credential file patterns

## 🛠️ Setup Instructions

### 1. Environment Variables
Copy the example environment file and fill in your values:
```bash
cp .env.example .env
# Edit .env with your actual credentials
```

### 2. Required Credentials
You'll need to set up:
- Database credentials (PostgreSQL)
- Firebase project and service account
- Google Vertex AI project
- OpenRouter API key (optional)
- HuggingFace token (optional)
- Admin credentials

### 3. Firebase Setup
- Create a Firebase project
- Generate a service account key
- Save as `firebase-service-account.json` (already in .gitignore)
- Set the path in your environment variables

## 🚨 Security Best Practices

- **Never commit credentials** to version control
- **Use environment variables** for all sensitive data  
- **Rotate credentials** regularly
- **Use strong passwords** for admin accounts
- **Enable 2FA** where possible

## 📧 Security Contact

If you find any security issues, please report them responsibly by creating an issue or contacting the maintainers.