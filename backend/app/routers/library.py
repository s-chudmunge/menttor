from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from typing import Any, Dict, List, Optional
import json
import os
import logging
from pathlib import Path
from datetime import datetime
from sqlmodel import Session, select

from schemas import LearningContentRequest
from services.ai_service import ai_executor
from services.ai_service import LearningContentResponse
from sql_models import LibraryContent
from database.session import get_db

router = APIRouter(prefix="/library", tags=["library"])
logger = logging.getLogger(__name__)

class RegeneratePageRequest(BaseModel):
    model: str

def load_content_from_db(slug: str, db: Session) -> Dict[str, Any]:
    """Load content from database"""
    try:
        statement = select(LibraryContent).where(
            LibraryContent.slug == slug,
            LibraryContent.is_active == True
        )
        content_record = db.exec(statement).first()
        
        if not content_record:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Content for slug '{slug}' not found"
            )
        
        # Convert database record to response format
        content_data = {
            "title": content_record.title,
            "subject": content_record.subject,
            "goal": content_record.goal,
            "lastUpdated": content_record.last_updated.isoformat() + "Z",
            "content": json.loads(content_record.content_json),
        }
        
        # Add resources if they exist
        if content_record.resources_json:
            content_data["resources"] = json.loads(content_record.resources_json)
        
        return content_data
        
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Invalid JSON stored for slug '{slug}'"
        )

def save_content_to_db(slug: str, content: Dict[str, Any], db: Session) -> None:
    """Save content to database"""
    try:
        # Check if content already exists
        statement = select(LibraryContent).where(LibraryContent.slug == slug)
        existing_content = db.exec(statement).first()
        
        # Prepare JSON strings
        content_json = json.dumps(content.get("content", []))
        resources_json = None
        if content.get("resources"):
            resources_json = json.dumps(content["resources"])
        
        if existing_content:
            # Update existing content
            existing_content.title = content.get("title", slug.replace("-", " ").title())
            existing_content.subject = content.get("subject", "")
            existing_content.goal = content.get("goal", "")
            existing_content.content_json = content_json
            existing_content.resources_json = resources_json
            existing_content.last_updated = datetime.utcnow()
            
            db.add(existing_content)
        else:
            # Create new content
            new_content = LibraryContent(
                slug=slug,
                title=content.get("title", slug.replace("-", " ").title()),
                subject=content.get("subject", ""),
                goal=content.get("goal", ""),
                content_json=content_json,
                resources_json=resources_json
            )
            db.add(new_content)
        
        db.commit()
        logger.info(f"Successfully saved content for slug '{slug}' to database")
        
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to save content for slug '{slug}': {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save content: {str(e)}"
        )


@router.post("/{page_slug}/regenerate-page")
async def regenerate_page(page_slug: str, request: RegeneratePageRequest, db: Session = Depends(get_db)):
    """Regenerate any library page"""
    try:
        # Load current content to preserve metadata
        content_data = load_content_from_db(page_slug, db)
        
        # Create a request for generating the entire page
        ai_request = LearningContentRequest(
            subtopic=content_data["title"],
            subject=content_data["subject"], 
            goal=content_data["goal"],
            model=request.model
        )
        
        # Generate new content
        result = await ai_executor.execute(
            task_type="learn_chunk_with_resources",
            request_data=ai_request,
            response_schema=LearningContentResponse,
            is_json=True
        )
        
        # Update the content while preserving metadata structure
        # Convert Pydantic models to dictionaries for JSON serialization
        new_content = result["response"].content
        
        # Better serialization handling for content blocks
        serialized_content = []
        for component in new_content:
            if hasattr(component, 'model_dump'):
                serialized_content.append(component.model_dump())
            elif hasattr(component, 'dict'):
                serialized_content.append(component.dict())
            elif isinstance(component, dict):
                serialized_content.append(component)
            else:
                # Fallback: try to convert using __dict__ or JSON serializable format
                try:
                    import json
                    serialized_content.append(json.loads(json.dumps(component, default=str)))
                except (TypeError, AttributeError):
                    logger.error(f"Failed to serialize content component: {type(component)} - {component}")
                    continue
        
        content_data["content"] = serialized_content
        
        # Save resources if they exist
        if result["response"].resources:
            new_resources = result["response"].resources
            
            # Better serialization handling for resources
            serialized_resources = []
            for resource in new_resources:
                if hasattr(resource, 'model_dump'):
                    serialized_resources.append(resource.model_dump())
                elif hasattr(resource, 'dict'):
                    serialized_resources.append(resource.dict())
                elif isinstance(resource, dict):
                    serialized_resources.append(resource)
                else:
                    try:
                        import json
                        serialized_resources.append(json.loads(json.dumps(resource, default=str)))
                    except (TypeError, AttributeError):
                        logger.error(f"Failed to serialize resource: {type(resource)} - {resource}")
                        continue
            
            content_data["resources"] = serialized_resources
        
        content_data["lastUpdated"] = datetime.now().isoformat() + "Z"
        
        # Save the updated content
        save_content_to_db(page_slug, content_data, db)
        
        logger.info(f"Successfully regenerated page '{page_slug}' using model {request.model}")
        
        return {
            "success": True,
            "message": f"Page '{page_slug}' regenerated successfully",
            "content_blocks": len(content_data["content"]),
            "model": request.model
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to regenerate page: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to regenerate page: {str(e)}"
        )

@router.get("/available")
async def get_available_content(db: Session = Depends(get_db)):
    """Get list of all available library content"""
    try:
        # Query all active content from database
        statement = select(LibraryContent).where(LibraryContent.is_active == True)
        content_records = db.exec(statement).all()
        
        available_items = []
        for record in content_records:
            available_items.append({
                "slug": record.slug,
                "title": record.title,
                "subject": record.subject,
                "goal": record.goal,
                "lastUpdated": record.last_updated.isoformat() + "Z"
            })
        
        # Sort by title
        available_items.sort(key=lambda x: x["title"])
        
        return available_items
        
    except Exception as e:
        logger.error(f"Failed to get available content: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get available content: {str(e)}"
        )

@router.get("/{page_slug}/content")
async def get_content(page_slug: str, db: Session = Depends(get_db)):
    """Get the current content of any library page"""
    try:
        content_data = load_content_from_db(page_slug, db)
        return content_data
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get content for page '{page_slug}': {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get content for page '{page_slug}': {str(e)}"
        )

