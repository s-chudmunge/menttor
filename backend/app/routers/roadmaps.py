from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from app.database.session import get_db
from app.schemas import RoadmapCreateRequest, RoadmapResponse, RoadmapUpdate
from app.sql_models import Roadmap, User, UserCuratedRoadmap, UserProgress, LearningSession, MilestoneProgress, DependencyMap, PracticeSession, PracticeQuestion, PracticeAnswer
from app.core.ai_service import generate_roadmap_from_gemini
from typing import List, Optional
from .optional_auth import get_optional_current_user
from .auth import get_current_user

router = APIRouter(prefix="/roadmaps", tags=["roadmaps"])

@router.post("/generate", response_model=RoadmapResponse)
async def generate_roadmap_endpoint(request: RoadmapCreateRequest, db: Session = Depends(get_db), current_user: Optional[User] = Depends(get_optional_current_user)):
    try:
        ai_generated_roadmap = await generate_roadmap_from_gemini(request)

        # If user is authenticated, save to database
        if current_user:
            db_roadmap = Roadmap(
                user_id=current_user.id,
                subject=request.subject,
                goal=request.goal,
                time_value=request.time_value,
                time_unit=request.time_unit,
                model=request.model,
                title=ai_generated_roadmap.title,
                description=ai_generated_roadmap.description,
                roadmap_plan=ai_generated_roadmap.roadmap_plan.model_dump()["modules"],
            )
            db.add(db_roadmap)
            db.commit()
            db.refresh(db_roadmap)
            return db_roadmap
        else:
            # For unauthenticated users, return the AI response directly
            # Create a temporary roadmap response without saving to DB
            from app.schemas import RoadmapResponse
            return RoadmapResponse(
                id=0,  # Temporary ID for unauthenticated users
                user_id=0,  # No user ID
                subject=request.subject,
                goal=request.goal,
                time_value=request.time_value,
                time_unit=request.time_unit,
                model=request.model,
                title=ai_generated_roadmap.title,
                description=ai_generated_roadmap.description,
                roadmap_plan=ai_generated_roadmap.roadmap_plan.model_dump()["modules"],  # Return modules directly for frontend compatibility
                created_at="",  # Empty timestamp
                updated_at=""   # Empty timestamp
            )
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to generate or save roadmap: {e}")

@router.get("/", response_model=List[RoadmapResponse])
def get_all_roadmaps(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    roadmaps = db.exec(select(Roadmap).where(Roadmap.user_id == current_user.id).order_by(Roadmap.id.desc())).all()
    return roadmaps

@router.get("/{roadmap_id}", response_model=RoadmapResponse)
def get_roadmap_by_id(roadmap_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    roadmap = db.exec(select(Roadmap).where(Roadmap.id == roadmap_id, Roadmap.user_id == current_user.id)).first()
    if not roadmap:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Roadmap not found")
    return roadmap

@router.put("/{roadmap_id}", response_model=RoadmapResponse)
def update_roadmap(roadmap_id: int, roadmap_update: RoadmapUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    roadmap = db.exec(select(Roadmap).where(Roadmap.id == roadmap_id, Roadmap.user_id == current_user.id)).first()
    if not roadmap:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Roadmap not found")
    
    for key, value in roadmap_update.model_dump(exclude_unset=True).items():
        setattr(roadmap, key, value)
    
    db.add(roadmap)
    db.commit()
    db.refresh(roadmap)
    return roadmap

@router.delete("/{roadmap_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_roadmap(roadmap_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    roadmap = db.exec(select(Roadmap).where(Roadmap.id == roadmap_id, Roadmap.user_id == current_user.id)).first()
    if not roadmap:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Roadmap not found")
    
    try:
        # Handle all foreign key references before deleting the roadmap
        
        # 1. Handle UserCuratedRoadmap records that reference this roadmap
        curated_roadmap_refs = db.exec(
            select(UserCuratedRoadmap).where(UserCuratedRoadmap.personal_roadmap_id == roadmap_id)
        ).all()
        for ref in curated_roadmap_refs:
            ref.personal_roadmap_id = None
            db.add(ref)
        
        # 2. Delete UserProgress records for this roadmap
        user_progress_records = db.exec(
            select(UserProgress).where(UserProgress.roadmap_id == roadmap_id)
        ).all()
        for progress in user_progress_records:
            db.delete(progress)
        
        # 3. Delete LearningSession records for this roadmap
        learning_sessions = db.exec(
            select(LearningSession).where(LearningSession.roadmap_id == roadmap_id)
        ).all()
        for session in learning_sessions:
            db.delete(session)
        
        # 4. Delete MilestoneProgress records for this roadmap
        milestone_progress = db.exec(
            select(MilestoneProgress).where(MilestoneProgress.roadmap_id == roadmap_id)
        ).all()
        for milestone in milestone_progress:
            db.delete(milestone)
        
        # 5. Delete DependencyMap records for this roadmap
        dependency_maps = db.exec(
            select(DependencyMap).where(DependencyMap.roadmap_id == roadmap_id)
        ).all()
        for dependency in dependency_maps:
            db.delete(dependency)
        
        # 6. Delete Practice-related records for this roadmap
        practice_sessions = db.exec(
            select(PracticeSession).where(PracticeSession.roadmap_id == roadmap_id)
        ).all()
        
        # For each practice session, delete related questions and answers first
        for session in practice_sessions:
            # Delete practice answers for this session
            practice_answers = db.exec(
                select(PracticeAnswer).where(PracticeAnswer.session_id == session.id)
            ).all()
            for answer in practice_answers:
                db.delete(answer)
            
            # Delete practice questions for this session  
            practice_questions = db.exec(
                select(PracticeQuestion).where(PracticeQuestion.session_id == session.id)
            ).all()
            for question in practice_questions:
                db.delete(question)
            
            # Now delete the practice session
            db.delete(session)
        
        # Now we can safely delete the roadmap
        db.delete(roadmap)
        db.commit()
        return
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail=f"Failed to delete roadmap: {str(e)}"
        )