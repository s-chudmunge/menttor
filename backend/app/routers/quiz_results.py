import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from database.session import get_db
from schemas import QuestionResult
from sql_models import QuizAttempt, User
from .auth import get_current_user
from fastapi.responses import JSONResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/quizzes", tags=["quizzes"])

@router.get("/results")
def get_quiz_results_for_user_raw(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    page: int = 1,
    size: int = 10
):
    attempts = (
        db.exec(
            select(QuizAttempt)
            .where(QuizAttempt.user_id == current_user.id)
            .order_by(QuizAttempt.attempted_at.desc())
            .offset((page - 1) * size)
            .limit(size)
        ).all()
    )

    results = []
    for att in attempts:
        results.append({
            "id": att.id,
            "user_id": att.user_id,
            "quiz_id": att.quiz_id,
            "sub_topic_id": att.sub_topic_id,
            "score": att.score,
            "total_questions": att.total_questions,
            "question_results": [qr.dict() for qr in att.question_results] if att.question_results else [],
            "completed_at": att.attempted_at.isoformat() if att.attempted_at else None,
            "completed": att.completed
        })

    logger.info(f"Attempting to return quiz results: {results}")

    return JSONResponse(
        status_code=200,
        content={
            "items": results,
            "total": len(results),
            "page": page,
            "size": size
        }
    )

@router.get("/results/subtopic/{sub_topic_id}", response_model=Optional[dict])
def get_quiz_result_for_subtopic(
    sub_topic_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    attempt = db.exec(
        select(QuizAttempt)
        .where(QuizAttempt.user_id == current_user.id, QuizAttempt.sub_topic_id == sub_topic_id)
        .order_by(QuizAttempt.attempted_at.desc())
    ).first()

    if not attempt:
        return JSONResponse(content=None, status_code=200)

    return {
        "id": attempt.id,
        "user_id": attempt.user_id,
        "quiz_id": attempt.quiz_id,
        "sub_topic_id": attempt.sub_topic_id,
        "score": attempt.score,
        "total_questions": attempt.total_questions,
        "question_results": attempt.question_results or [],
        "completed_at": attempt.attempted_at.isoformat() if attempt.attempted_at else None,
        "completed": True
    }

@router.get("/results/attempt/{attempt_id}")
def get_quiz_result_by_attempt(
    attempt_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    attempt = db.get(QuizAttempt, attempt_id)
    if not attempt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz result not found")
    if attempt.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to view this result")
    
    return {
        "id": attempt.id,
        "user_id": attempt.user_id,
        "quiz_id": attempt.quiz_id,
        "sub_topic_id": attempt.sub_topic_id,
        "score": attempt.score,
        "total_questions": attempt.total_questions,
        "question_results": attempt.question_results or [],
        "completed_at": attempt.attempted_at.isoformat() if attempt.attempted_at else None,
        "completed": True
    }

