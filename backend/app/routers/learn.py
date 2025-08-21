from typing import List
from fastapi import APIRouter, HTTPException, status, Body, Depends, Query
from sqlmodel import Session, select
from core.config import settings
from services.ai_service import generate_learning_content, generate_3d_visualization
from services.behavioral_service import BehavioralService
from schemas import LearningContentRequest, LearningContentResponse, ThreeDVisualizationRequest, ThreeDVisualizationResponse, ContentBlock, RoadmapModule, BehavioralData
from sql_models import User, LearningContent, Roadmap
from .auth import get_current_user
from database.session import get_db
import json
import uuid
import gzip
import base64
from datetime import datetime

router = APIRouter()

def compress_content(content_data: List[dict]) -> str:
    """Compress learning content for efficient storage"""
    json_str = json.dumps(content_data)
    compressed = gzip.compress(json_str.encode('utf-8'))
    return base64.b64encode(compressed).decode('utf-8')

def decompress_content(compressed_data: str) -> List[dict]:
    """Decompress learning content for retrieval"""
    try:
        compressed_bytes = base64.b64decode(compressed_data.encode('utf-8'))
        decompressed = gzip.decompress(compressed_bytes)
        return json.loads(decompressed.decode('utf-8'))
    except Exception:
        # Fallback for uncompressed data
        if isinstance(compressed_data, str):
            return json.loads(compressed_data)
        return compressed_data

@router.post("/generate", response_model=LearningContentResponse)
async def generate_learn_content_endpoint(
    request: LearningContentRequest = Body(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        ai_generated_content = await generate_learning_content(request)

        # Return the generated content without saving to database
        content_dict = [block.model_dump() for block in ai_generated_content.content]
        
        return LearningContentResponse(
            id=None,  # No ID since not saved to DB
            content=content_dict,
            model=ai_generated_content.model,
            subject=getattr(request, 'subject', None),
            goal=getattr(request, 'goal', None),
            subtopic=request.subtopic,
            is_saved=False,
            is_public=False,
            share_token=None,
            created_at=None,
            updated_at=None
        )
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to generate learning content: {e}")

@router.post("/generate-3d", response_model=ThreeDVisualizationResponse)
async def generate_3d_visualization_endpoint(
    request: ThreeDVisualizationRequest = Body(...),
    current_user: User = Depends(get_current_user)
):
    try:
        return await generate_3d_visualization(request)
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to generate 3D visualization: {e}")

@router.get("/ml/learn", response_model=LearningContentResponse)
async def get_learn_content_endpoint(
    subtopic: str = Query(...),
    subtopic_id: str = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        # Always generate new content and save it
        # Try to find subject and goal from the user's roadmap
        roadmap_subject = subtopic
        roadmap_goal = subtopic

        user_roadmaps = db.exec(
            select(Roadmap).where(Roadmap.user_id == current_user.id)
        ).all()

        for roadmap in user_roadmaps:
            if roadmap.roadmap_plan:
                for module_data in roadmap.roadmap_plan:
                    module = RoadmapModule.model_validate(module_data)
                    for topic in module.topics:
                        if any(sub.title == subtopic or sub.id == subtopic for sub in topic.subtopics):
                            roadmap_subject = roadmap.subject or subtopic
                            roadmap_goal = roadmap.goal or subtopic
                            break
                    if roadmap_subject != subtopic or roadmap_goal != subtopic:
                        break
                if roadmap_subject != subtopic or roadmap_goal != subtopic:
                    break

        model = "gemini-2.5-flash-lite"  # Stable and cost-effective model
        request = LearningContentRequest(subtopic=subtopic, subject=roadmap_subject, goal=roadmap_goal, model=model)
        ai_generated_content = await generate_learning_content(request)

        # Track learning activity with behavioral service
        behavioral_service = BehavioralService(db)
        
        # Find the roadmap ID for milestone tracking
        roadmap_id = None
        for roadmap in user_roadmaps:
            roadmap_id = roadmap.id
            break
        
        if roadmap_id:
            # Ensure user has milestones set up
            _ensure_user_milestones(current_user.id, roadmap_id, behavioral_service)
        
        # Award XP for accessing learning content
        xp_result = behavioral_service.award_xp(current_user.id, "subtopic_completion", {
            "subtopic": subtopic,
            "subtopic_id": subtopic_id
        })
        
        # Update streak
        streak_result = behavioral_service.update_streak(current_user.id)
        
        # Update milestones
        milestone_result = behavioral_service.update_milestone_progress(current_user.id, "Foundation Builder", 1)

        # Return the generated content without saving to database
        content_dict = [block.model_dump() for block in ai_generated_content.content]

        # Create behavioral data
        behavioral_data = BehavioralData(
            xp_earned=xp_result.get("xp_earned", 0),
            total_xp=xp_result.get("total_xp", 0),
            current_level=xp_result.get("current_level", 1),
            level_up=xp_result.get("level_up_occurred", False),
            current_streak=streak_result.get("current_streak", 1),
            milestone_completed=milestone_result.get("just_completed", False) if milestone_result else False
        )

        response = LearningContentResponse(
            id=None,  # No ID since not saved to DB
            content=content_dict,
            model=ai_generated_content.model,
            subject=roadmap_subject,
            goal=roadmap_goal,
            subtopic=subtopic,
            subtopic_id=subtopic_id,
            is_saved=False,
            is_public=False,
            share_token=None,
            created_at=None,
            updated_at=None,
            behavioral_data=behavioral_data
        )

        return response
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to retrieve or generate learning content: {e}")

def _ensure_user_milestones(user_id: int, roadmap_id: int, behavioral_service: BehavioralService):
    """Ensure user has basic milestones set up"""
    try:
        from sql_models import MilestoneProgress
        
        # Check if user already has milestones
        existing_milestones = behavioral_service.db.exec(
            select(MilestoneProgress).where(
                MilestoneProgress.user_id == user_id,
                MilestoneProgress.roadmap_id == roadmap_id
            )
        ).all()
        
        if not existing_milestones:
            # Create basic milestones
            milestones = [
                {"name": "Foundation Builder", "description": "Complete 5 learning subtopics", "target": 5, "type": "subtopic_completion"},
                {"name": "Dedicated Learner", "description": "Complete 15 learning subtopics", "target": 15, "type": "subtopic_completion"},
                {"name": "Knowledge Master", "description": "Complete 50 learning subtopics", "target": 50, "type": "subtopic_completion"},
                {"name": "Streak Starter", "description": "Maintain a 3-day learning streak", "target": 3, "type": "streak"},
                {"name": "Consistency King", "description": "Maintain a 7-day learning streak", "target": 7, "type": "streak"},
                {"name": "Focus Champion", "description": "Spend 60 minutes learning", "target": 60, "type": "focus_time"}
            ]
            
            for milestone in milestones:
                behavioral_service.create_milestone(
                    user_id=user_id,
                    roadmap_id=roadmap_id,
                    milestone_type=milestone["type"],
                    name=milestone["name"],
                    description=milestone["description"],
                    target_value=milestone["target"]
                )
    except Exception as e:
        print(f"Failed to create milestones: {e}")  # Log but don't fail the request

@router.get("/saved", response_model=List[LearningContentResponse])
def get_saved_learn_content(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100)
):
    try:
        saved_content = db.exec(
            select(LearningContent).where(
                LearningContent.user_id == current_user.id
            ).offset(skip).limit(limit)
        ).all()
        
        response_list = []
        for content_item in saved_content:
            # Decompress the content
            content_to_return = decompress_content(content_item.content)
            
            response_list.append(LearningContentResponse(
                id=content_item.id,
                content=content_to_return,
                model=content_item.model,
                subject=content_item.subject,
                goal=content_item.goal,
                subtopic=content_item.subtopic,
                subtopic_id=content_item.subtopic_id,
                is_saved=content_item.is_saved,
                is_public=content_item.is_public,
                share_token=content_item.share_token,
                created_at=content_item.created_at,
                updated_at=content_item.updated_at
            ))
        return response_list
    except Exception as e:
        print(f"Error retrieving saved learning content: {e}") # Added for debugging
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to retrieve saved learning content: {e}")

@router.post("/save")
async def save_learning_content(
    content_data: dict = Body(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Save learning content to database when user clicks save"""
    try:
        # Extract content data
        content_blocks = content_data.get('content', [])
        subtopic = content_data.get('subtopic', '')
        subject = content_data.get('subject', '')
        goal = content_data.get('goal', '')
        model = content_data.get('model', '')
        subtopic_id = content_data.get('subtopic_id', '')
        
        # Compress and save the content
        compressed_content = compress_content(content_blocks)
        
        db_learning_content = LearningContent(
            subtopic=subtopic,
            content=compressed_content,
            user_id=current_user.id,
            model=model,
            subject=subject,
            goal=goal,
            subtopic_id=subtopic_id,
            is_saved=True,  # User explicitly saved this
            is_public=False,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        db.add(db_learning_content)
        db.commit()
        db.refresh(db_learning_content)
        
        return {
            "message": "Content saved successfully", 
            "is_saved": True,
            "id": db_learning_content.id,
            "created_at": db_learning_content.created_at.isoformat(),
            "updated_at": db_learning_content.updated_at.isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save content: {e}")

# Keep the old endpoint for backward compatibility with existing saved content
@router.post("/{content_id}/save")
async def toggle_existing_content_save(
    content_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Toggle save status for existing saved content"""
    try:
        # Find the content
        content = db.exec(
            select(LearningContent).where(
                LearningContent.id == content_id,
                LearningContent.user_id == current_user.id
            )
        ).first()
        
        if not content:
            raise HTTPException(status_code=404, detail="Learning content not found")
        
        # Mark as saved
        content.is_saved = True
        content.updated_at = datetime.utcnow()
        db.add(content)
        db.commit()
        
        return {"message": "Content saved successfully", "is_saved": True}
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save content: {e}")

@router.delete("/{content_id}/save")
async def unsave_learning_content(
    content_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Remove a learning content from saved items"""
    try:
        # Find the content
        content = db.exec(
            select(LearningContent).where(
                LearningContent.id == content_id,
                LearningContent.user_id == current_user.id
            )
        ).first()
        
        if not content:
            raise HTTPException(status_code=404, detail="Learning content not found")
        
        # Mark as not saved
        content.is_saved = False
        content.updated_at = datetime.utcnow()
        db.add(content)
        db.commit()
        
        return {"message": "Content removed from saved items", "is_saved": False}
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to unsave content: {e}")

@router.post("/{content_id}/share")
async def create_share_link(
    content_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a shareable link for learning content"""
    try:
        # Find the content
        content = db.exec(
            select(LearningContent).where(
                LearningContent.id == content_id,
                LearningContent.user_id == current_user.id
            )
        ).first()
        
        if not content:
            raise HTTPException(status_code=404, detail="Learning content not found")
        
        # Generate share token if not exists
        if not content.share_token:
            content.share_token = str(uuid.uuid4())
        
        # Mark as public
        content.is_public = True
        content.updated_at = datetime.utcnow()
        db.add(content)
        db.commit()
        
        share_url = f"/shared/learn/{content.share_token}"
        
        return {
            "message": "Share link created successfully",
            "share_token": content.share_token,
            "share_url": share_url,
            "is_public": True
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create share link: {e}")

@router.delete("/{content_id}/share")
async def remove_share_link(
    content_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Remove sharing for learning content"""
    try:
        # Find the content
        content = db.exec(
            select(LearningContent).where(
                LearningContent.id == content_id,
                LearningContent.user_id == current_user.id
            )
        ).first()
        
        if not content:
            raise HTTPException(status_code=404, detail="Learning content not found")
        
        # Remove public access
        content.is_public = False
        content.updated_at = datetime.utcnow()
        # Keep the share_token but make it inactive
        db.add(content)
        db.commit()
        
        return {"message": "Share link removed", "is_public": False}
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to remove share link: {e}")

@router.get("/shared/learn/{share_token}", response_model=LearningContentResponse)
async def get_shared_learning_content(
    share_token: str,
    db: Session = Depends(get_db)
):
    """Get publicly shared learning content by token"""
    try:
        # Find the shared content
        content = db.exec(
            select(LearningContent).where(
                LearningContent.share_token == share_token,
                LearningContent.is_public == True
            )
        ).first()
        
        if not content:
            raise HTTPException(status_code=404, detail="Shared content not found or no longer available")
        
        # Decompress the content
        content_to_return = decompress_content(content.content)
        
        return LearningContentResponse(
            id=content.id,
            content=content_to_return,
            model=content.model,
            subject=content.subject,
            goal=content.goal,
            subtopic=content.subtopic,
            subtopic_id=content.subtopic_id,
            is_saved=False,  # Don't show save status for shared content
            is_public=content.is_public,
            share_token=content.share_token,
            created_at=content.created_at,
            updated_at=content.updated_at
        )
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get shared content: {e}")

@router.get("/saved", response_model=List[LearningContentResponse])
def get_saved_learn_content_only(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100)
):
    """Get only the content that user has explicitly saved"""
    try:
        saved_content = db.exec(
            select(LearningContent).where(
                LearningContent.user_id == current_user.id,
                LearningContent.is_saved == True
            ).offset(skip).limit(limit).order_by(LearningContent.updated_at.desc())
        ).all()
        
        response_list = []
        for content_item in saved_content:
            # Decompress the content
            content_to_return = decompress_content(content_item.content)

            response_list.append(LearningContentResponse(
                id=content_item.id,
                content=content_to_return,
                model=content_item.model,
                subject=content_item.subject,
                goal=content_item.goal,
                subtopic=content_item.subtopic,
                subtopic_id=content_item.subtopic_id,
                is_saved=content_item.is_saved,
                is_public=content_item.is_public,
                share_token=content_item.share_token,
                created_at=content_item.created_at,
                updated_at=content_item.updated_at
            ))
        return response_list
    except Exception as e:
        print(f"Error retrieving saved learning content: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve saved learning content: {e}")

@router.post("/track-time")
async def track_learning_time(
    time_data: dict = Body(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Track time spent learning and award XP"""
    try:
        subtopic_id = time_data.get('subtopic_id')
        time_spent_minutes = time_data.get('time_spent_minutes', 0)
        
        if not subtopic_id or time_spent_minutes <= 0:
            raise HTTPException(status_code=400, detail="Invalid time tracking data")
        
        # Update progress tracking
        from .progress import track_learning_time_helper
        progress_result = track_learning_time_helper(subtopic_id, time_spent_minutes * 60, db, current_user)  # Convert to seconds
        
        # Award XP for focus time
        behavioral_service = BehavioralService(db)
        xp_result = behavioral_service.award_xp(current_user.id, "focus_time", {
            "minutes": time_spent_minutes,
            "subtopic_id": subtopic_id
        })
        
        return {
            "message": "Time tracked successfully",
            "time_spent_minutes": time_spent_minutes,
            "xp_earned": xp_result.get("xp_earned", 0),
            "total_xp": xp_result.get("total_xp", 0),
            "level_up": xp_result.get("level_up_occurred", False)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to track time: {e}")

@router.post("/complete-learning")
async def mark_learning_complete(
    completion_data: dict = Body(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark a subtopic as completed and award achievements"""
    try:
        subtopic_id = completion_data.get('subtopic_id')
        time_spent = completion_data.get('time_spent_minutes', 0)
        
        if not subtopic_id:
            raise HTTPException(status_code=400, detail="subtopic_id is required")
        
        # Mark learning as completed in progress tracker
        from .progress import mark_learn_completed_helper
        progress_result = mark_learn_completed_helper(subtopic_id, db, current_user)
        
        # Award completion XP and update streaks
        behavioral_service = BehavioralService(db)
        
        # Award completion XP
        xp_result = behavioral_service.award_xp(current_user.id, "subtopic_completion", {
            "subtopic_id": subtopic_id,
            "time_spent": time_spent
        })
        
        # Update streak
        streak_result = behavioral_service.update_streak(current_user.id)
        
        # Update milestones
        milestone_result = behavioral_service.update_milestone_progress(current_user.id, "Foundation Builder", 1)
        
        # Check for rewards
        reward = behavioral_service.create_reward_event(
            current_user.id, 
            "subtopic_completion", 
            {"subtopic_id": subtopic_id},
            session_id=None
        )
        
        return {
            "message": "Learning completed successfully",
            "progress": progress_result,
            "behavioral_data": {
                "xp_earned": xp_result.get("xp_earned", 0),
                "total_xp": xp_result.get("total_xp", 0),
                "current_level": xp_result.get("current_level", 1),
                "level_up": xp_result.get("level_up_occurred", False),
                "current_streak": streak_result.get("current_streak", 1),
                "milestone_completed": milestone_result.get("just_completed", False) if milestone_result else False,
                "reward_triggered": reward is not None,
                "reward": reward.model_dump() if reward else None
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to complete learning: {e}")

