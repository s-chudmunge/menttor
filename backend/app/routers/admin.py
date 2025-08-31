from fastapi import APIRouter, HTTPException, Query
from typing import Optional
import firebase_admin
from firebase_admin import credentials, auth
import os
import json
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin", tags=["admin"])

def get_firebase_admin():
    """Initialize Firebase Admin SDK if not already done"""
    try:
        # Check if already initialized
        if firebase_admin._apps:
            return firebase_admin.get_app()
            
        # Get Firebase credentials from FIREBASE_CREDENTIALS environment variable
        firebase_credentials_json = os.getenv("FIREBASE_CREDENTIALS")
        
        if not firebase_credentials_json:
            raise HTTPException(
                status_code=503, 
                detail="Missing FIREBASE_CREDENTIALS environment variable"
            )
        
        try:
            # Parse the JSON credentials
            firebase_config = json.loads(firebase_credentials_json)
            logger.info(f"Loaded Firebase config for project: {firebase_config.get('project_id', 'unknown')}")
        except json.JSONDecodeError as e:
            raise HTTPException(
                status_code=503, 
                detail=f"Invalid FIREBASE_CREDENTIALS JSON format: {str(e)}"
            )
        
        # Validate critical fields
        if not firebase_config.get("project_id") or not firebase_config.get("client_email"):
            raise HTTPException(
                status_code=503, 
                detail="Invalid Firebase configuration: missing project_id or client_email"
            )
        
        cred = credentials.Certificate(firebase_config)
        firebase_admin.initialize_app(cred)
        logger.info("Firebase Admin SDK initialized successfully")
        return firebase_admin.get_app()
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Firebase initialization error: {str(e)}")
        raise HTTPException(status_code=503, detail=f"Firebase initialization error: {str(e)}")

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
        logger.info(f"Fetching Firebase users - page: {page}, limit: {limit}, search: {search}")
        
        # Initialize Firebase Admin
        get_firebase_admin()
        logger.info("Firebase Admin initialized successfully")
        
        # Calculate max_results for Firebase (they use different pagination)
        max_results = limit * page
        
        # List users from Firebase
        logger.info(f"Requesting {max_results} users from Firebase")
        list_users_result = auth.list_users(max_results=max_results)
        logger.info(f"Retrieved {len(list_users_result.users)} users from Firebase")
        
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
            logger.info(f"Filtered to {len(users)} users matching search '{search}'")
        
        # Apply pagination
        start_index = (page - 1) * limit
        end_index = start_index + limit
        paginated_users = users[start_index:end_index]
        
        # Calculate pagination info
        total_users = len(users)
        total_pages = (total_users + limit - 1) // limit
        
        logger.info(f"Returning {len(paginated_users)} users for page {page}")
        
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
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching Firebase users: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch Firebase users: {str(e)}")