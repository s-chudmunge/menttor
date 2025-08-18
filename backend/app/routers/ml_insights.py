from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select, func
from typing import List, Dict, Any, Optional
from datetime import date, datetime
from core.config import settings

from database.session import get_db
from sql_models import UserPerformance, SpacedRepetition, User, QuizAttempt, UserBehavior
from schemas import UserPerformanceDetailsResponse, GenerateFeedbackRequest, GenerateFeedbackResponse, QuizResultResponse, QuestionResult
from core.auth import get_current_user
from services.ai_service import generate_performance_feedback

router = APIRouter(prefix="/ml-insights", tags=["ml-insights"])

@router.get("/user-performance-details", response_model=UserPerformanceDetailsResponse)
async def get_user_performance_details(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    user_id = current_user.id
    
    # Get or create UserPerformance record
    user_performance = db.exec(select(UserPerformance).where(UserPerformance.user_id == user_id)).first()
    
    # Get historical quiz results
    historical_results = db.exec(select(QuizAttempt).where(QuizAttempt.user_id == user_id)).all()
    
    if not user_performance:
        # Create a default UserPerformance record based on quiz attempts
        total_quizzes = len(historical_results)
        total_score = sum(result.score for result in historical_results) if historical_results else 0
        total_questions = sum(result.total_questions for result in historical_results) if historical_results else 0
        
        # Calculate correct answers from question results
        total_correct = 0
        for result in historical_results:
            if result.question_results:
                total_correct += sum(1 for q in result.question_results if q.get('is_correct', False))
            else:
                # Fallback: estimate from score and total questions
                total_correct += int(result.score * result.total_questions / 100)
        
        user_performance = UserPerformance(
            user_id=user_id,
            quizzes_completed=total_quizzes,
            total_score=total_score,
            total_questions_answered=total_questions,
            total_correct_answers=total_correct,
            average_score=total_score / max(total_quizzes, 1),
            overall_accuracy=total_correct / max(total_questions, 1) * 100 if total_questions > 0 else 0
        )
        
        db.add(user_performance)
        db.commit()
        db.refresh(user_performance)

    score_trajectory = [result.score for result in historical_results] # Placeholder

    return UserPerformanceDetailsResponse(
        user_id=user_id,
        quizzes_completed=user_performance.quizzes_completed,
        average_score=user_performance.average_score,
        total_score=user_performance.total_score,
        total_questions_answered=user_performance.total_questions_answered,
        overall_accuracy=(user_performance.total_correct_answers / user_performance.total_questions_answered) * 100 if user_performance.total_questions_answered > 0 else 0,
        historical_quiz_results=[QuizResultResponse(
        id=attempt.id,
        user_id=attempt.user_id,
        quiz_id=attempt.quiz_id,
        sub_topic_id=attempt.sub_topic_id,
        score=attempt.score,
        total_questions=attempt.total_questions,
        question_results=[QuestionResult(**qr) for qr in (attempt.question_results or [])],
        completed_at=attempt.attempted_at,
        completed=True
    ) for attempt in historical_results],
        score_trajectory=score_trajectory,
    )

@router.post("/generate-feedback", response_model=GenerateFeedbackResponse)
async def generate_feedback(
    request: GenerateFeedbackRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if request.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    user_performance = db.exec(select(UserPerformance).where(UserPerformance.user_id == request.user_id)).first()
    historical_results = db.exec(select(QuizAttempt).where(QuizAttempt.user_id == request.user_id)).all()

    if not user_performance:
        # If no performance data, provide default values
        performance_details = {
            "quizzes_completed": 0,
            "average_score": 0.0,
            "overall_accuracy": 0.0,
            "score_trajectory": [],
        }
    else:
        score_trajectory = [result.score for result in historical_results]
        performance_details = {
            "quizzes_completed": user_performance.quizzes_completed,
            "average_score": user_performance.average_score,
            "overall_accuracy": (user_performance.total_correct_answers / user_performance.total_questions_answered) * 100 if user_performance.total_questions_answered > 0 else 0.0,
            "score_trajectory": score_trajectory,
        }

    # Update the request object with performance details
    request.performance_details = performance_details

    feedback_text = (await generate_performance_feedback(request)).feedback_text

    return GenerateFeedbackResponse(feedback_text=feedback_text)

