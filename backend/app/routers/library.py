from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from typing import Any, Dict, List, Optional
import json
import os
import logging
from pathlib import Path

from schemas import LearningContentRequest
from services.ai_service import ai_executor
from services.ai_service import LearningContentResponse

router = APIRouter(prefix="/library", tags=["library"])
logger = logging.getLogger(__name__)

# Path to the content directory - check multiple possible locations
CONTENT_DIR = None
for possible_path in [
    Path(__file__).parent.parent.parent.parent / "frontend" / "src" / "content",  # Development
    Path(__file__).parent.parent.parent / "content",  # Backend deployment
    Path(__file__).parent.parent / "content",  # Alternative deployment
    Path("/app/content"),  # Docker deployment
]:
    if possible_path.exists():
        CONTENT_DIR = possible_path
        break

if CONTENT_DIR is None:
    # Fallback to a default location and create it
    CONTENT_DIR = Path(__file__).parent.parent / "content"
    CONTENT_DIR.mkdir(parents=True, exist_ok=True)

class RegeneratePageRequest(BaseModel):
    model: str

def load_content_file(filename: str) -> Dict[str, Any]:
    """Load content from JSON file"""
    filepath = CONTENT_DIR / f"{filename}.json"
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Content file {filename}.json not found"
        )
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Invalid JSON in content file {filename}.json"
        )

def save_content_file(filename: str, content: Dict[str, Any]) -> None:
    """Save content to JSON file"""
    filepath = CONTENT_DIR / f"{filename}.json"
    try:
        # Ensure directory exists
        filepath.parent.mkdir(parents=True, exist_ok=True)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(content, f, indent=2, ensure_ascii=False)
    except Exception as e:
        logger.error(f"Failed to save content file {filename}.json: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save content file: {str(e)}"
        )


@router.post("/{page_slug}/regenerate-page")
async def regenerate_page(page_slug: str, request: RegeneratePageRequest):
    """Regenerate any library page"""
    try:
        # Load current content to preserve metadata
        content_data = load_content_file(page_slug)
        
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
        content_data["content"] = [component.model_dump() if hasattr(component, 'model_dump') else component for component in new_content]
        
        # Save resources if they exist
        if result["response"].resources:
            new_resources = result["response"].resources
            content_data["resources"] = [resource.model_dump() if hasattr(resource, 'model_dump') else resource for resource in new_resources]
        
        content_data["lastUpdated"] = "2025-01-09T" + __import__('datetime').datetime.now().strftime("%H:%M:%S") + "Z"
        
        # Save the updated content
        save_content_file(page_slug, content_data)
        
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

@router.get("/{page_slug}/content")
async def get_content(page_slug: str):
    """Get the current content of any library page"""
    try:
        content_data = load_content_file(page_slug)
        return content_data
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get content for page '{page_slug}': {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get content for page '{page_slug}': {str(e)}"
        )

