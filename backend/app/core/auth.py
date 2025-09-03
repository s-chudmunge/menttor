from datetime import timedelta, datetime
from typing import Optional

from fastapi import Depends, HTTPException, status, Cookie, Request
from fastapi.security import OAuth2PasswordBearer
from sqlmodel import Session, select
from sql_models import User
from schemas import TokenData
from .config import settings
from database.session import get_db

import logging
import json
import firebase_admin
from firebase_admin import credentials, auth

logger = logging.getLogger(__name__)

# Initialize Firebase Admin SDK
# Check if Firebase app is already initialized to avoid re-initialization errors
if not firebase_admin._apps:
    try:
        firebase_creds = settings.FIREBASE_CREDENTIALS
        
        # Check if it's a file path or JSON content
        if firebase_creds.startswith('{') and firebase_creds.endswith('}'):
            # It's JSON content - parse it and create credentials
            cred_dict = json.loads(firebase_creds)
            cred = credentials.Certificate(cred_dict)
        else:
            # It's a file path - use it directly
            cred = credentials.Certificate(firebase_creds)
            
        firebase_admin.initialize_app(cred)
        logger.info("Firebase Admin SDK initialized successfully.")
    except Exception as e:
        logger.error(f"Failed to initialize Firebase Admin SDK: {e}")
        # Depending on your application's needs, you might want to exit or raise an error here

async def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    from database.cache import query_cache, cache_user_query
    from database.monitor import monitor_query, db_monitor
    
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    # Get token from Authorization header
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        logger.warning("Auth: No Bearer token found in Authorization header.")
        raise credentials_exception

    token = auth_header.split(" ")[1]
    

    try:
        # Verify Firebase ID token (this is cached by Firebase SDK)
        decoded_token = auth.verify_id_token(token)
        uid = decoded_token['uid']
        email = decoded_token.get('email')
        logger.debug(f"Auth: Decoded Firebase ID token for UID: {uid}")
    except Exception as e:
        logger.error(f"Auth: Firebase ID token verification failed: {e}")
        raise credentials_exception

    # Check user cache first (cache user ID only, not the object)
    user_cache_key = f"user:uid:{uid}"
    cached_user_id = query_cache.get(user_cache_key)
    if cached_user_id:
        logger.debug(f"Auth: Using cached user ID for UID: {uid}")
        # Re-fetch user from current session to ensure it's bound
        user = db.exec(select(User).where(User.id == cached_user_id)).first()
        if user:
            return user

    # Rate limit check
    allowed, reason = db_monitor.check_rate_limit(uid)
    if not allowed:
        logger.warning(f"Auth rate limit exceeded for user {uid}: {reason}")
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many requests. Please try again later."
        )

    # Fetch user from database
    @monitor_query("select", "user")
    def fetch_user_by_uid(firebase_uid: str) -> Optional[User]:
        return db.exec(select(User).where(User.firebase_uid == firebase_uid)).first()
    
    user = fetch_user_by_uid(uid)
    if user is None:
        # If user doesn't exist in your DB, create them (optional, depending on your flow)
        # Or raise an error if all users must pre-exist in your DB
        logger.warning(f"Auth: User with Firebase UID {uid} not found in database. Attempting to create.")
        try:
            # Handle phone authentication where email might be None
            user_email = email if email else f"{uid}@phone.auth"  # Generate placeholder email for phone auth
            # For phone auth users, mark profile as incomplete so they complete onboarding
            profile_completed = bool(email)  # Only complete if we have a real email
            new_user = User(
                firebase_uid=uid, 
                email=user_email, 
                is_active=True, 
                hashed_password=None, 
                is_admin=False,
                display_name=decoded_token.get('name'),
                profile_completed=profile_completed,
                onboarding_completed=profile_completed
            )
            db.add(new_user)
            db.commit()
            db.refresh(new_user)
            user = new_user
            logger.info(f"Auth: New user created in DB with UID: {uid}, Email: {user_email}")
        except Exception as e:
            logger.error(f"Auth: Failed to create new user in DB: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create user in database",
            )

    if user.id is None:
        logger.error(f"Auth: Critical error: User object returned with None ID after authentication/creation for Firebase UID: {uid}. This indicates a database or ORM issue.")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error: User ID could not be determined.",
        )

    # Cache the user ID for future requests (5 minutes TTL)
    query_cache.set(user_cache_key, user.id, ttl=300)
    
    logger.info(f"Auth: Successfully authenticated user: {user.email}, ID: {user.id}")
    return user

async def get_current_user_from_websocket(token: str, db: Session) -> Optional[User]:
    if not token:
        return None
    try:
        decoded_token = auth.verify_id_token(token)
        uid = decoded_token['uid']
        email = decoded_token.get('email')
    except Exception:
        return None
    
    user = db.exec(select(User).where(User.firebase_uid == uid)).first()
    return user
