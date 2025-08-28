import uuid
import logging
from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from database.session import get_db
from core.auth import get_current_user
from sql_models import User
from schemas import (
    PracticeSessionCreate,
    PracticeSessionResponse,
    PracticeQuestionResponse,
    PracticeAnswerCreate,
    PracticeResultsResponse
)
from services.practice_service import (
    create_practice_session,
    generate_practice_questions,
    submit_practice_answer,
    get_practice_results,
    get_user_practice_history
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/practice", tags=["practice"])

@router.post("/sessions", response_model=PracticeSessionResponse)
async def create_practice_session_endpoint(
    session_data: PracticeSessionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new practice session with generated questions"""
    try:
        # Create practice session
        session = await create_practice_session(
            db=db,
            user_id=current_user.id,
            session_data=session_data
        )
        
        # Generate questions based on selected subtopics and question types
        questions = await generate_practice_questions(
            db=db,
            session_id=session.id,
            subtopic_ids=session_data.subtopic_ids,
            question_types=session_data.question_types,
            question_count=session_data.question_count,
            subject=session_data.subject,
            goal=session_data.goal
        )
        
        return PracticeSessionResponse(
            session_id=session.id,
            session_token=session.session_token,
            questions=questions,
            time_limit=session_data.time_limit,
            hints_enabled=session_data.hints_enabled
        )
        
    except Exception as e:
        logger.error(f"Error creating practice session: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create practice session: {str(e)}"
        )

@router.post("/sessions/{session_id}/answers")
async def submit_answer(
    session_id: int,
    answer_data: PracticeAnswerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Submit an answer for a practice question"""
    try:
        result = await submit_practice_answer(
            db=db,
            session_id=session_id,
            user_id=current_user.id,
            answer_data=answer_data
        )
        return {"success": True, "is_correct": result.is_correct}
        
    except Exception as e:
        logger.error(f"Error submitting answer: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to submit answer: {str(e)}"
        )

@router.post("/sessions/{session_id}/complete")
async def complete_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark practice session as complete and return results"""
    try:
        results = await get_practice_results(
            db=db,
            session_id=session_id,
            user_id=current_user.id
        )
        
        return results
        
    except Exception as e:
        logger.error(f"Error completing session: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to complete session: {str(e)}"
        )

@router.get("/sessions/{session_id}/results", response_model=PracticeResultsResponse)
async def get_session_results(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get detailed results for a completed practice session"""
    try:
        results = await get_practice_results(
            db=db,
            session_id=session_id,
            user_id=current_user.id
        )
        return results
        
    except Exception as e:
        logger.error(f"Error fetching results: {e}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session results not found"
        )

@router.get("/history")
async def get_practice_history(
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get user's practice session history"""
    try:
        history = await get_user_practice_history(
            db=db,
            user_id=current_user.id,
            limit=limit
        )
        return history
        
    except Exception as e:
        logger.error(f"Error fetching practice history: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch practice history"
        )

@router.get("/analytics/{roadmap_id}")
async def get_practice_analytics(
    roadmap_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get practice analytics for a specific roadmap"""
    try:
        # Calculate practice statistics for the roadmap
        analytics = await get_practice_analytics_for_roadmap(
            db=db,
            user_id=current_user.id,
            roadmap_id=roadmap_id
        )
        return analytics
        
    except Exception as e:
        logger.error(f"Error fetching analytics: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch practice analytics"
        )