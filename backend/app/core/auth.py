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

logger = logging.getLogger(__name__)

async def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    from database.cache import query_cache, cache_user_query
    from database.monitor import monitor_query, db_monitor
    
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
    )

    # Google IAP provides user identity in headers
    iap_user_email = request.headers.get("X-Goog-Authenticated-User-Email")
    iap_user_id = request.headers.get("X-Goog-Authenticated-User-ID")
    
    if not iap_user_email:
        logger.warning("Auth: No IAP user email found in headers")
        raise credentials_exception

    # Clean the email (IAP prefixes with "accounts.google.com:")
    email = iap_user_email.replace("accounts.google.com:", "")
    uid = iap_user_id.replace("accounts.google.com:", "") if iap_user_id else email
    
    logger.debug(f"Auth: IAP authenticated user: {email}")

    # Check user cache first
    user_cache_key = f"user:email:{email}"
    cached_user_id = query_cache.get(user_cache_key)
    if cached_user_id:
        logger.debug(f"Auth: Using cached user ID for email: {email}")
        user = db.exec(select(User).where(User.id == cached_user_id)).first()
        if user:
            return user

    # Rate limit check using email as identifier
    allowed, reason = db_monitor.check_rate_limit(email)
    if not allowed:
        logger.warning(f"Auth rate limit exceeded for user {email}: {reason}")
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many requests. Please try again later."
        )

    # Fetch user from database by email
    @monitor_query("select", "user")
    def fetch_user_by_email(user_email: str) -> Optional[User]:
        return db.exec(select(User).where(User.email == user_email)).first()
    
    user = fetch_user_by_email(email)
    if user is None:
        # Create new user with IAP email
        logger.info(f"Auth: Creating new user for IAP email: {email}")
        try:
            new_user = User(
                firebase_uid=uid,  # Use IAP user ID as firebase_uid for compatibility
                email=email, 
                is_active=True, 
                hashed_password=None, 
                is_admin=False,
                display_name=email.split('@')[0],  # Use email prefix as display name
                profile_completed=True,
                onboarding_completed=False  # They still need to complete onboarding
            )
            db.add(new_user)
            db.commit()
            db.refresh(new_user)
            user = new_user
            logger.info(f"Auth: New IAP user created: {email}, ID: {user.id}")
        except Exception as e:
            logger.error(f"Auth: Failed to create new user: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create user in database",
            )

    # Cache the user ID for future requests (5 minutes TTL)
    query_cache.set(user_cache_key, user.id, ttl=300)
    
    logger.info(f"Auth: Successfully authenticated IAP user: {user.email}, ID: {user.id}")
    return user

async def get_current_user_from_websocket(token: str, db: Session) -> Optional[User]:
    # For IAP, WebSocket auth is handled differently
    # You'll need to implement WebSocket auth through IAP or disable WebSocket features
    logger.warning("WebSocket auth not implemented with IAP - returning None")
    return None
