from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select, and_
from database.session import get_db
from sql_models import CuratedRoadmap, UserCuratedRoadmap, User, Roadmap
from schemas import CuratedRoadmapAdoptRequest, CuratedRoadmapAdoptResponse
from routers.auth import get_current_user
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/{roadmap_id}/adopt", response_model=CuratedRoadmapAdoptResponse)
async def adopt_curated_roadmap(
    roadmap_id: int,
    request: CuratedRoadmapAdoptRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Adopt a curated roadmap - creates a personal copy for the user"""
    
    # current_user is now properly bound to the session
    user_id = current_user.id
    
    # Find the curated roadmap
    curated_roadmap = db.exec(
        select(CuratedRoadmap).where(CuratedRoadmap.id == roadmap_id)
    ).first()
    
    if not curated_roadmap:
        raise HTTPException(status_code=404, detail="Curated roadmap not found")
    
    # Check if user already adopted this roadmap
    existing_adoption = db.exec(
        select(UserCuratedRoadmap).where(
            and_(
                UserCuratedRoadmap.user_id == user_id,
                UserCuratedRoadmap.curated_roadmap_id == roadmap_id
            )
        )
    ).first()
    
    if existing_adoption:
        raise HTTPException(
            status_code=409, 
            detail="You have already adopted this roadmap"
        )
    
    try:
        # Use custom title if provided, otherwise use original
        roadmap_title = request.customize_title or curated_roadmap.title
        
        # Create personal roadmap
        personal_roadmap = Roadmap(
            user_id=user_id,
            subject=curated_roadmap.title,
            goal=curated_roadmap.description,
            time_value=curated_roadmap.estimated_hours or 40,
            time_unit="hours",
            title=roadmap_title,
            description=curated_roadmap.description,
            status="active",
            is_from_curated=True
        )
        
        db.add(personal_roadmap)
        db.flush()  # Get the ID
        
        # Copy the roadmap structure directly as JSON (no separate table records needed)
        if curated_roadmap.roadmap_plan:
            personal_roadmap.roadmap_plan = curated_roadmap.roadmap_plan
        else:
            # Fallback empty structure
            personal_roadmap.roadmap_plan = []
        
        # Create adoption record
        adoption = UserCuratedRoadmap(
            user_id=user_id,
            curated_roadmap_id=roadmap_id,
            personal_roadmap_id=personal_roadmap.id
        )
        db.add(adoption)
        
        # Update adoption count
        curated_roadmap.adoption_count += 1
        db.add(curated_roadmap)
        
        db.commit()
        db.refresh(adoption)
        
        logger.info(f"✅ User {user_id} adopted curated roadmap '{curated_roadmap.title}' (ID: {roadmap_id})")
        
        return CuratedRoadmapAdoptResponse(
            success=True,
            message=f"Successfully adopted '{curated_roadmap.title}'",
            personal_roadmap_id=personal_roadmap.id,
            adoption_id=adoption.id
        )
        
    except Exception as e:
        db.rollback()
        logger.error(f"❌ Failed to adopt roadmap {roadmap_id} for user {user_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to adopt roadmap: {str(e)}"
        )