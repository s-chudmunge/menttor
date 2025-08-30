from typing import List, Optional
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from database.session import get_db
from sql_models import SpacedRepetition, User
from schemas import SpacedRepetitionUpdate
from .auth import get_current_user

router = APIRouter(prefix="/spaced_repetition", tags=["spaced_repetition"])

@router.get("/", response_model=List[SpacedRepetition])
def get_all_spaced_repetition_entries(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    user_id = current_user.id
    entries = db.exec(select(SpacedRepetition).where(SpacedRepetition.user_id == user_id)).all()
    return entries

@router.get("/{entry_id}", response_model=SpacedRepetition)
def get_spaced_repetition_entry_by_id(entry_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    user_id = current_user.id
    entry = db.exec(select(SpacedRepetition).where(SpacedRepetition.id == entry_id, SpacedRepetition.user_id == user_id)).first()
    if not entry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Spaced Repetition entry not found")
    return entry

@router.put("/{entry_id}", response_model=SpacedRepetition)
def update_spaced_repetition_entry(entry_id: int, entry_update: SpacedRepetitionUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    user_id = current_user.id
    entry = db.exec(select(SpacedRepetition).where(SpacedRepetition.id == entry_id, SpacedRepetition.user_id == user_id)).first()
    if not entry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Spaced Repetition entry not found")
    
    for key, value in entry_update.model_dump(exclude_unset=True).items():
        setattr(entry, key, value)
    
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry

@router.delete("/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_spaced_repetition_entry(entry_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    user_id = current_user.id
    entry = db.exec(select(SpacedRepetition).where(SpacedRepetition.id == entry_id, SpacedRepetition.user_id == user_id)).first()
    if not entry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Spaced Repetition entry not found")
    
    db.delete(entry)
    db.commit()
    return