from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from schemas import UserUpdate
from pydantic import BaseModel
from database.session import get_db
from sql_models import User

from core.auth import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])

class UserOnboardingRequest(BaseModel):
    display_name: str
    email: Optional[str] = None
    
class OnboardingStatusResponse(BaseModel):
    needs_onboarding: bool
    profile_completed: bool
    user_id: int

@router.get("/users", response_model=List[User])
def get_all_users(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    users = db.exec(select(User)).all()
    return users

@router.get("/users/{user_id}", response_model=User)
def get_user_by_id(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    user = db.exec(select(User).where(User.id == user_id)).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user

@router.get("/users/by-firebase-uid/{firebase_uid}", response_model=User)
def get_user_by_firebase_uid(firebase_uid: str, db: Session = Depends(get_db)):
    user = db.exec(select(User).where(User.firebase_uid == firebase_uid)).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user

@router.put("/users/{user_id}", response_model=User)
def update_user(user_id: int, user_update: UserUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    user = db.exec(select(User).where(User.id == user_id)).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    for key, value in user_update.model_dump(exclude_unset=True).items():
        setattr(user, key, value)
    
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    user = db.exec(select(User).where(User.id == user_id)).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    db.delete(user)
    db.commit()
    return

@router.get("/me", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.get("/onboarding-status", response_model=OnboardingStatusResponse)
async def get_onboarding_status(current_user: User = Depends(get_current_user)):
    """Check if user needs to complete onboarding"""
    return OnboardingStatusResponse(
        needs_onboarding=not current_user.onboarding_completed,
        profile_completed=current_user.profile_completed,
        user_id=current_user.id
    )

@router.post("/complete-onboarding", response_model=User)
async def complete_onboarding(
    onboarding_data: UserOnboardingRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Complete user onboarding with required profile information"""
    
    # Update user profile
    current_user.display_name = onboarding_data.display_name
    
    # Update email if provided and it's not a placeholder
    if onboarding_data.email and not onboarding_data.email.endswith("@phone.auth"):
        current_user.email = onboarding_data.email
    
    # Mark profile and onboarding as completed
    current_user.profile_completed = True
    current_user.onboarding_completed = True
    
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    
    return current_user
