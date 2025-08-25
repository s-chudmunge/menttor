from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select, and_
from database.session import get_db
from sql_models import CuratedRoadmap, UserCuratedRoadmap, User, Roadmap
from schemas import RoadmapModule, RoadmapTopic, Subtopic
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
                UserCuratedRoadmap.user_id == current_user.id,
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
            user_id=current_user.id,
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
        
        # Copy the roadmap structure from curated roadmap
        roadmap_plan = curated_roadmap.roadmap_plan
        
        if roadmap_plan and isinstance(roadmap_plan, list):
            for module_idx, module_data in enumerate(roadmap_plan):
                if not isinstance(module_data, dict):
                    continue
                    
                # Create module
                module = RoadmapModule(
                    roadmap_id=personal_roadmap.id,
                    title=module_data.get("title", f"Module {module_idx + 1}"),
                    description=module_data.get("description", ""),
                    order_index=module_idx,
                    status="available" if module_idx == 0 else "locked"
                )
                db.add(module)
                db.flush()
                
                # Create topics
                topics = module_data.get("topics", [])
                for topic_idx, topic_data in enumerate(topics):
                    if not isinstance(topic_data, dict):
                        continue
                        
                    topic = RoadmapTopic(
                        module_id=module.id,
                        title=topic_data.get("title", f"Topic {topic_idx + 1}"),
                        description=topic_data.get("description", ""),
                        order_index=topic_idx,
                        status="available" if module_idx == 0 and topic_idx == 0 else "locked"
                    )
                    db.add(topic)
                    db.flush()
                    
                    # Create subtopics
                    subtopics = topic_data.get("subtopics", [])
                    for subtopic_idx, subtopic_data in enumerate(subtopics):
                        if not isinstance(subtopic_data, dict):
                            continue
                            
                        subtopic = Subtopic(
                            topic_id=topic.id,
                            title=subtopic_data.get("title", f"Subtopic {subtopic_idx + 1}"),
                            description=subtopic_data.get("description", ""),
                            content=subtopic_data.get("content", ""),
                            order_index=subtopic_idx,
                            status="available" if module_idx == 0 and topic_idx == 0 and subtopic_idx == 0 else "locked",
                            estimated_time=subtopic_data.get("estimated_time", 60)  # Default 1 hour
                        )
                        db.add(subtopic)
        
        # Create adoption record
        adoption = UserCuratedRoadmap(
            user_id=current_user.id,
            curated_roadmap_id=roadmap_id,
            personal_roadmap_id=personal_roadmap.id
        )
        db.add(adoption)
        
        # Update adoption count
        curated_roadmap.adoption_count += 1
        db.add(curated_roadmap)
        
        db.commit()
        db.refresh(adoption)
        
        logger.info(f"✅ User {current_user.id} adopted curated roadmap '{curated_roadmap.title}' (ID: {roadmap_id})")
        
        return CuratedRoadmapAdoptResponse(
            success=True,
            message=f"Successfully adopted '{curated_roadmap.title}'",
            personal_roadmap_id=personal_roadmap.id,
            adoption_id=adoption.id
        )
        
    except Exception as e:
        db.rollback()
        logger.error(f"❌ Failed to adopt roadmap {roadmap_id} for user {current_user.id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to adopt roadmap: {str(e)}"
        )