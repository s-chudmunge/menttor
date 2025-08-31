from fastapi import APIRouter, HTTPException, Query
from typing import Optional
import firebase_admin
from firebase_admin import credentials, auth
import os
import json

router = APIRouter(prefix="/admin", tags=["admin"])

def get_firebase_admin():
    """Initialize Firebase Admin SDK if not already done"""
    if not firebase_admin._apps:
        try:
            # Get Firebase credentials from environment variables
            firebase_config = {
                "type": "service_account",
                "project_id": os.getenv("FIREBASE_PROJECT_ID"),
                "private_key_id": os.getenv("FIREBASE_PRIVATE_KEY_ID"),
                "private_key": os.getenv("FIREBASE_PRIVATE_KEY", "").replace('\\n', '\n'),
                "client_email": os.getenv("FIREBASE_CLIENT_EMAIL"),
                "client_id": os.getenv("FIREBASE_CLIENT_ID"),
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
                "client_x509_cert_url": os.getenv("FIREBASE_CLIENT_X509_CERT_URL")
            }
            
            cred = credentials.Certificate(firebase_config)
            firebase_admin.initialize_app(cred)
        except Exception as e:
            raise HTTPException(status_code=503, detail=f"Firebase configuration error: {str(e)}")
    
    return firebase_admin.get_app()

@router.get("/users")
async def get_firebase_users(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=1000),
    search: Optional[str] = Query(None)
):
    """
    Fetch Firebase users with pagination and search
    """
    try:
        # Initialize Firebase Admin
        get_firebase_admin()
        
        # Calculate max_results for Firebase (they use different pagination)
        max_results = limit * page
        
        # List users from Firebase
        list_users_result = auth.list_users(max_results=max_results)
        
        # Convert to our format
        users = []
        for user in list_users_result.users:
            users.append({
                "uid": user.uid,
                "email": user.email or "",
                "displayName": user.display_name or "",
                "emailVerified": user.email_verified,
                "disabled": user.disabled,
                "creationTime": user.user_metadata.creation_timestamp.isoformat() if user.user_metadata.creation_timestamp else None,
                "lastSignInTime": user.user_metadata.last_sign_in_timestamp.isoformat() if user.user_metadata.last_sign_in_timestamp else None,
            })
        
        # Filter by search term if provided
        if search:
            search_lower = search.lower()
            users = [
                user for user in users 
                if search_lower in user["email"].lower() or search_lower in user["displayName"].lower()
            ]
        
        # Apply pagination
        start_index = (page - 1) * limit
        end_index = start_index + limit
        paginated_users = users[start_index:end_index]
        
        # Calculate pagination info
        total_users = len(users)
        total_pages = (total_users + limit - 1) // limit
        
        return {
            "users": paginated_users,
            "pagination": {
                "currentPage": page,
                "totalPages": total_pages,
                "totalUsers": total_users,
                "hasNextPage": page < total_pages,
                "hasPrevPage": page > 1
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch Firebase users: {str(e)}")