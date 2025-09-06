"""
Firebase Admin utilities for managing admin claims and authentication.
"""
import logging
from typing import Optional
from firebase_admin import auth
from fastapi import HTTPException, status, Depends, Request
from sqlmodel import Session
from database.session import get_db
from core.auth import get_current_user
from sql_models import User

logger = logging.getLogger(__name__)

async def set_admin_claims(uid: str, is_admin: bool = True) -> bool:
    """
    Set admin custom claims for a Firebase user.
    
    Args:
        uid: Firebase user UID
        is_admin: Whether to grant admin privileges
        
    Returns:
        True if successful, False otherwise
    """
    try:
        custom_claims = {"admin": is_admin}
        auth.set_custom_user_claims(uid, custom_claims)
        logger.info(f"Set admin claims for user {uid}: {custom_claims}")
        return True
    except Exception as e:
        logger.error(f"Failed to set admin claims for user {uid}: {e}")
        return False

async def verify_admin_token(id_token: str) -> Optional[dict]:
    """
    Verify Firebase ID token and check for admin claims.
    
    Args:
        id_token: Firebase ID token
        
    Returns:
        Decoded token if admin, None otherwise
    """
    try:
        decoded_token = auth.verify_id_token(id_token)
        
        # Check if user has admin claims
        if decoded_token.get("admin") is True:
            return decoded_token
        else:
            logger.warning(f"User {decoded_token.get('uid')} attempted admin access without claims")
            return None
            
    except Exception as e:
        logger.error(f"Failed to verify admin token: {e}")
        return None

async def get_admin_user(request: Request, db: Session = Depends(get_db)) -> User:
    """
    Dependency to get current user and verify admin privileges.
    This replaces the HTTP Basic Auth for admin endpoints.
    
    Args:
        request: FastAPI request object
        db: Database session
        
    Returns:
        User object if admin, raises HTTPException otherwise
    """
    try:
        # Get current user from Firebase token
        user = await get_current_user(request, db)
        
        # Get Firebase ID token from Authorization header
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Bearer token required for admin access"
            )
        
        id_token = auth_header.split(" ")[1]
        
        # Verify admin claims in token
        decoded_token = await verify_admin_token(id_token)
        if not decoded_token:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin privileges required"
            )
        
        logger.info(f"Admin access granted to user: {user.email}")
        return user
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Admin authentication error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Admin authentication failed"
        )

async def ensure_user_has_admin_claims(firebase_uid: str) -> bool:
    """
    Ensure a Firebase user has admin claims set.
    This is a utility function for initial setup.
    
    Args:
        firebase_uid: Firebase user UID
        
    Returns:
        True if successful
    """
    try:
        # Check current claims
        user_record = auth.get_user(firebase_uid)
        current_claims = user_record.custom_claims or {}
        
        if not current_claims.get("admin"):
            # Set admin claims
            await set_admin_claims(firebase_uid, True)
            logger.info(f"Added admin claims to user: {firebase_uid}")
        else:
            logger.info(f"User {firebase_uid} already has admin claims")
            
        return True
        
    except Exception as e:
        logger.error(f"Failed to ensure admin claims for user {firebase_uid}: {e}")
        return False