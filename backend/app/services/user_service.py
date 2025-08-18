from datetime import timedelta
from typing import Optional

from fastapi import HTTPException, status
from sqlmodel import Session, select

from schemas import Token, TokenData
from core.config import settings
from sql_models import User, UserCreate
from core.auth import verify_password, get_password_hash, create_access_token


def register_new_user(user: UserCreate, db: Session) -> User:
    db_user = db.exec(select(User).where(User.email == user.email)).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed_password = get_password_hash(user.password)
    db_user = User(email=user.email, hashed_password=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def authenticate_user(email: str, password: str, db: Session) -> Optional[User]:
    user = db.exec(select(User).where(User.email == email)).first()
    if not user or not verify_password(password, user.hashed_password):
        return None
    return user

def create_user_access_token(user: User) -> Token:
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return Token(access_token=access_token, token_type="bearer", user_id=user.id, user_email=user.email)
