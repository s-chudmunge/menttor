from typing import Optional
from fastapi import Depends, HTTPException, status, Request
from sqlmodel import Session, select
from core.config import settings
from database.session import get_db
from sql_models import User
from firebase_admin import auth
import logging

logger = logging.getLogger(__name__)

async def get_optional_current_user(request: Request, db: Session = Depends(get_db)) -> Optional[User]:
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None

    token = auth_header.split(" ")[1]

    try:
        decoded_token = auth.verify_id_token(token)
        uid = decoded_token['uid']
        email = decoded_token.get('email')
        logger.info(f"Optional Auth: Decoded Firebase ID token for UID: {uid}, Email: {email}")

        user = db.exec(select(User).where(User.firebase_uid == uid)).first()
        if user is None:
            logger.warning(f"Optional Auth: User with Firebase UID {uid} not found in database. Creating new user.")
            try:
                new_user = User(firebase_uid=uid, email=email, is_active=True, hashed_password="", is_admin=False)
                db.add(new_user)
                db.commit()
                db.refresh(new_user)
                user = new_user
                logger.info(f"Optional Auth: New user created in DB with UID: {uid}, Email: {email}")
            except Exception as e:
                logger.error(f"Optional Auth: Failed to create new user in DB: {e}")
                return None # Return None if user creation fails
        return user
    except Exception as e:
        logger.warning(f"Optional Auth: Firebase ID token verification failed or user not found: {e}")
        return None