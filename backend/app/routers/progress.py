import logging
from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlmodel import Session, select, func
from database.session import get_db
from sql_models import User, UserProgress, Roadmap
from schemas import UserProgressRead
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta # Import datetime and timedelta
from .auth import get_current_user
from pydantic import BaseModel # Import BaseModel for TimeSummaryResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/progress", tags=["progress"])

class TimeSummaryResponse(BaseModel):
    total_time_spent: int
    period: str

class NextSubtopicResponse(BaseModel):
    module_title: str
    topic_title: str
    subtopic_title: str
    subtopic_id: str
    status: str
    # Add other relevant fields as needed

def _calculate_progress_status(progress: UserProgress) -> str:
    """Derives the status based on learn_completed and quiz_completed."""
    # If quiz is completed with a good score, consider it completed regardless of learn status
    if progress.quiz_completed and (progress.quiz_best_score is None or progress.quiz_best_score >= 3):
        return "completed"
    elif progress.learn_completed and progress.quiz_completed:
        return "completed"
    elif progress.learn_completed or progress.quiz_completed:
        return "in_progress"
    else:
        return "not_started"

@router.post("/{sub_topic_id}", response_model=UserProgressRead)
async def mark_subtopic_as_completed(
    sub_topic_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # This endpoint will now primarily ensure a progress record exists and update its status
    # based on the new logic. It's a generic "update progress" endpoint.
    roadmap = db.exec(select(Roadmap).where(Roadmap.user_id == current_user.id)).first()
    if not roadmap:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Roadmap not found")

    progress = db.exec(
        select(UserProgress)
        .where(UserProgress.user_id == current_user.id, UserProgress.sub_topic_id == sub_topic_id)
    ).first()

    if not progress:
        progress = UserProgress(
            user_id=current_user.id,
            sub_topic_id=sub_topic_id,
            roadmap_id=roadmap.id,
            # Default values for learn_completed, quiz_completed, time_spent_learning will apply
        )
        db.add(progress)
        db.flush() # Flush to get an ID if it's a new object

    # This endpoint doesn't explicitly set status to "completed" anymore,
    # but it can be used to trigger a status recalculation if other fields are updated.
    # For now, it just ensures the record exists.
    # The status will be updated by specific learn/quiz completion endpoints.
    
    db.commit()
    db.refresh(progress)
    return progress

@router.patch("/{sub_topic_id}/learn-completed", response_model=UserProgressRead)
async def mark_learn_completed(
    sub_topic_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    progress = db.exec(
        select(UserProgress)
        .where(UserProgress.user_id == current_user.id, UserProgress.sub_topic_id == sub_topic_id)
    ).first()

    if not progress:
        # If no progress record exists, create one
        roadmap = db.exec(select(Roadmap).where(Roadmap.user_id == current_user.id)).first()
        if not roadmap:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Roadmap not found for user")
        
        progress = UserProgress(
            user_id=current_user.id,
            sub_topic_id=sub_topic_id,
            roadmap_id=roadmap.id,
        )
        db.add(progress)
        db.flush() # Flush to get an ID if it's a new object

    progress.learn_completed = True
    progress.status = _calculate_progress_status(progress)
    progress.completed_at = datetime.utcnow() if progress.status == "completed" else None
    
    db.add(progress)
    db.commit()
    db.refresh(progress)
    return progress

@router.patch("/{sub_topic_id}/track-time", response_model=UserProgressRead)
async def track_learning_time(
    sub_topic_id: str,
    time_spent: int = Body(..., embed=True),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    progress = db.exec(
        select(UserProgress)
        .where(UserProgress.user_id == current_user.id, UserProgress.sub_topic_id == sub_topic_id)
    ).first()

    if not progress:
        # If no progress record exists, create one
        roadmap = db.exec(select(Roadmap).where(Roadmap.user_id == current_user.id)).first()
        if not roadmap:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Roadmap not found for user")
        
        progress = UserProgress(
            user_id=current_user.id,
            sub_topic_id=sub_topic_id,
            roadmap_id=roadmap.id,
            time_spent_learning=time_spent
        )
    else:
        progress.time_spent_learning += time_spent
    
    progress.status = _calculate_progress_status(progress) # Recalculate status
    progress.completed_at = datetime.utcnow() if progress.status == "completed" else None

    db.add(progress)
    db.commit()
    db.refresh(progress)
    return progress

@router.get("/time-summary", response_model=TimeSummaryResponse)
async def get_time_summary(
    period: Optional[str] = None, # "today", "this_week", "total"
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(func.sum(UserProgress.time_spent_learning)).where(UserProgress.user_id == current_user.id)
    
    if period == "today":
        start_of_day = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        query = query.where(UserProgress.last_accessed_at >= start_of_day)
    elif period == "this_week":
        today = datetime.utcnow().date()
        start_of_week = today - timedelta(days=today.weekday()) # Monday as start of week
        query = query.where(UserProgress.last_accessed_at >= start_of_week)
    # If period is None or "total", no additional filter is needed

    total_time_spent = db.exec(query).scalar_one_or_none() or 0
    
    return TimeSummaryResponse(total_time_spent=total_time_spent, period=period or "total")

@router.get("/{roadmap_id}/next-subtopic", response_model=Optional[NextSubtopicResponse])
async def get_next_recommended_subtopic(
    roadmap_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    roadmap = db.exec(select(Roadmap).where(Roadmap.id == roadmap_id, Roadmap.user_id == current_user.id)).first()
    if not roadmap:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Roadmap not found for user")

    user_progress_records = db.exec(
        select(UserProgress)
        .where(UserProgress.user_id == current_user.id, UserProgress.roadmap_id == roadmap_id)
    ).all()

    completed_subtopics = {p.sub_topic_id for p in user_progress_records if p.status == "completed"}

    # Iterate through the roadmap plan to find the next uncompleted subtopic
    if roadmap.roadmap_plan and "modules" in roadmap.roadmap_plan:
        for module in roadmap.roadmap_plan["modules"]:
            if "topics" in module:
                for topic in module["topics"]:
                    if "subtopics" in topic:
                        for subtopic in topic["subtopics"]:
                            if subtopic["id"] not in completed_subtopics:
                                # Found the next uncompleted subtopic
                                return NextSubtopicResponse(
                                    module_title=module.get("title", "N/A"),
                                    topic_title=topic.get("title", "N/A"),
                                    subtopic_title=subtopic.get("title", "N/A"),
                                    subtopic_id=subtopic["id"],
                                    status="in_progress" # Assuming it's in progress if not completed
                                )
    return None # No uncompleted subtopic found

@router.get("/{roadmap_id}", response_model=List[UserProgressRead])
async def get_progress_for_roadmap(
    roadmap_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    progress_list = db.exec(
        select(UserProgress)
        .where(UserProgress.user_id == current_user.id, UserProgress.roadmap_id == roadmap_id)
    ).all()
    
    logger.info(f"DEBUG: Progress fetch for roadmap {roadmap_id}, user {current_user.id}")
    logger.info(f"DEBUG: Found {len(progress_list)} progress records")
    for progress in progress_list:
        logger.info(f"DEBUG: Progress - sub_topic_id: {progress.sub_topic_id}, status: {progress.status}, quiz_completed: {progress.quiz_completed}, score: {progress.quiz_best_score}")
    
    return progress_list