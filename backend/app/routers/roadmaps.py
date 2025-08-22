from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from database.session import get_db
from schemas import RoadmapCreateRequest, RoadmapResponse, RoadmapUpdate
from sql_models import Roadmap, User
from services.ai_service import generate_roadmap_content
from typing import List, Optional
from .optional_auth import get_optional_current_user
from .auth import get_current_user

router = APIRouter(prefix="/roadmaps", tags=["roadmaps"])

@router.post("/generate", response_model=RoadmapResponse)
async def generate_roadmap_endpoint(request: RoadmapCreateRequest, db: Session = Depends(get_db), current_user: Optional[User] = Depends(get_optional_current_user)):
    try:
        ai_generated_roadmap = await generate_roadmap_content(request)

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
            from schemas import RoadmapResponse
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
    
    db.delete(roadmap)
    db.commit()
    return