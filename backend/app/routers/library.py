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

# Path to the content directory - prioritize repo backend/content for persistence
CONTENT_DIR = None
for possible_path in [
    Path(__file__).parent.parent.parent / "content",  # Backend repo content (preferred for persistence)
    Path(__file__).parent.parent / "content",  # Alternative backend location
    Path(__file__).parent.parent.parent.parent / "frontend" / "src" / "content",  # Frontend development
    Path("/app/content"),  # Docker runtime (ephemeral)
]:
    if possible_path.exists():
        CONTENT_DIR = possible_path
        break

if CONTENT_DIR is None:
    # Create in backend repo directory for persistence
    CONTENT_DIR = Path(__file__).parent.parent.parent / "content"
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
    """Save content to JSON file and commit to git"""
    filepath = CONTENT_DIR / f"{filename}.json"
    try:
        # Ensure directory exists
        filepath.parent.mkdir(parents=True, exist_ok=True)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(content, f, indent=2, ensure_ascii=False)
        
        # Auto-commit to git if this is in a repo
        try:
            import subprocess
            repo_root = Path(__file__).parent.parent.parent  # Go to backend root
            
            # Check if we're in a git repo
            result = subprocess.run(['git', 'status'], cwd=repo_root, capture_output=True, text=True)
            if result.returncode == 0:
                # Add the file
                subprocess.run(['git', 'add', f'content/{filename}.json'], cwd=repo_root, check=True)
                
                # Commit with a descriptive message
                commit_msg = f"Add generated library content: {content.get('title', filename)}\n\nAuto-generated content for {filename}\n\nCo-Authored-By: AI Content Generator"
                subprocess.run(['git', 'commit', '-m', commit_msg], cwd=repo_root, check=True)
                
                logger.info(f"Successfully committed {filename}.json to git")
            else:
                logger.info(f"Not in a git repo, skipping commit for {filename}.json")
                
        except subprocess.CalledProcessError as git_error:
            logger.warning(f"Git commit failed for {filename}.json: {git_error}")
        except Exception as git_error:
            logger.warning(f"Git operations failed for {filename}.json: {git_error}")
            
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

@router.get("/available")
async def get_available_content():
    """Get list of all available library content"""
    try:
        available_items = []
        
        # Scan the content directory for JSON files
        if CONTENT_DIR and CONTENT_DIR.exists():
            for json_file in CONTENT_DIR.glob("*.json"):
                slug = json_file.stem
                
                # Skip processed_subtopics.txt file
                if slug == "processed_subtopics":
                    continue
                    
                try:
                    # Load just the metadata we need
                    with open(json_file, 'r', encoding='utf-8') as f:
                        content_data = json.load(f)
                        
                    available_items.append({
                        "slug": slug,
                        "title": content_data.get("title", slug.replace("-", " ").title()),
                        "subject": content_data.get("subject", ""),
                        "goal": content_data.get("goal", ""),
                        "lastUpdated": content_data.get("lastUpdated", "")
                    })
                except Exception as e:
                    logger.warning(f"Failed to read metadata from {json_file}: {e}")
                    # Still include it with basic info
                    available_items.append({
                        "slug": slug,
                        "title": slug.replace("-", " ").title(),
                        "subject": "",
                        "goal": f"Learn about {slug.replace('-', ' ').lower()}",
                        "lastUpdated": ""
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

