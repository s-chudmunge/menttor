from typing import Optional
from fastapi import Depends, HTTPException, status, Request
from sqlmodel import Session, select
from core.config import settings
from database.session import get_db
from sql_models import User
from core.supabase_client import supabase
import logging

logger = logging.getLogger(__name__)

async def get_optional_current_user(request: Request, db: Session = Depends(get_db)) -> Optional[User]:
    """Get current user from token, return None if not authenticated (optional auth)."""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None

    token = auth_header.split(" ")[1]

    try:
        # Verify Supabase JWT token
        response = supabase.auth.get_user(token)
        if not response or not response.user:
            return None

        supabase_user = response.user
        uid = supabase_user.id
        email = supabase_user.email
        logger.info(f"Optional Auth: Decoded Supabase token for UID: {uid}, Email: {email}")

        user = db.exec(select(User).where(User.supabase_uid == uid)).first()
        if user is None:
            logger.warning(f"Optional Auth: User with Supabase UID {uid} not found in database. Creating new user.")
            try:
                user_metadata = supabase_user.user_metadata or {}
                display_name = user_metadata.get('full_name') or user_metadata.get('name')

                new_user = User(
                    supabase_uid=uid,
                    email=email or f"{uid}@temp.user",
                    is_active=True,
                    hashed_password="",
                    is_admin=False,
                    display_name=display_name,
                    profile_completed=bool(email),
                    onboarding_completed=bool(email)
                )
                db.add(new_user)
                db.commit()
                db.refresh(new_user)
                user = new_user
                logger.info(f"Optional Auth: New user created in DB with UID: {uid}, Email: {email}")
            except Exception as e:
                logger.error(f"Optional Auth: Failed to create new user in DB: {e}")
                return None
        return user
    except Exception as e:
        logger.warning(f"Optional Auth: Supabase token verification failed or user not found: {e}")
        return None