from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from app.database.session import get_db
from app.schemas import RecommendedReview
from app.sql_models import SpacedRepetition, User, Quiz
from .auth import get_current_user
from datetime import date

router = APIRouter(prefix="/reviews", tags=["reviews"])

@router.get("/recommended-for-review", response_model=List[RecommendedReview])
def get_recommended_reviews(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_id = current_user.id

    today = date.today()
    due_for_review = db.exec(
        select(SpacedRepetition).where(
            SpacedRepetition.user_id == user_id,
            SpacedRepetition.next_review_date <= today
        )
    ).all()
    
    print(f"Due for review: {due_for_review}")

    recommended_list = []
    for entry in due_for_review:
        quiz = db.get(Quiz, entry.quiz_id)
        if quiz:
            recommended_list.append(RecommendedReview(
                sub_topic_id=entry.sub_topic_id,
                sub_topic_title=quiz.title.replace("Quiz on ", ""),
                module_title=quiz.module_title,
                topic_title=quiz.topic_title,
                subject=quiz.subject,
                next_review_date=entry.next_review_date.isoformat() # Convert date to ISO string
            ))
    return recommended_list
