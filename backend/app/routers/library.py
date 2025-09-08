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

# Path to the frontend content directory
CONTENT_DIR = Path(__file__).parent.parent.parent.parent / "frontend" / "src" / "content"

class RegenerateComponentRequest(BaseModel):
    component_index: int
    model: str

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

@router.post("/neural-network-architectures/regenerate-component")
async def regenerate_component(request: RegenerateComponentRequest):
    """Regenerate a specific component in the Neural Network Architectures page"""
    try:
        # Load current content
        content_data = load_content_file("neural-network-architectures")
        
        if request.component_index < 0 or request.component_index >= len(content_data["content"]):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid component index"
            )
        
        # Get the current block to understand its type and context
        current_block = content_data["content"][request.component_index]
        block_type = current_block["type"]
        
        # Create a request for generating just this component
        ai_request = LearningContentRequest(
            subtopic=content_data["title"],
            subject=content_data["subject"],
            goal=content_data["goal"],
            model=request.model
        )
        
        # Generate new content for the entire page and extract the specific component
        result = await ai_executor.execute(
            task_type="learn_chunk",
            request_data=ai_request,
            response_schema=LearningContentResponse,
            is_json=True
        )
        
        # Find a matching component type from the generated content
        generated_content = result["response"].content
        new_component = None
        
        # Try to find a component of the same type
        for component in generated_content:
            if component["type"] == block_type:
                new_component = component
                break
        
        # If no matching type found, regenerate the entire content and use the component at the same index
        if new_component is None and request.component_index < len(generated_content):
            new_component = generated_content[request.component_index]
        
        # If still no component, create a default based on the original type
        if new_component is None:
            if block_type == "paragraph":
                new_component = {
                    "type": "paragraph",
                    "data": {
                        "text": f"This section about {content_data['title']} has been regenerated. The content explores key concepts and provides detailed explanations to enhance understanding."
                    }
                }
            else:
                # Keep the original component if we can't generate a replacement
                new_component = current_block
        
        # Update the specific component
        content_data["content"][request.component_index] = new_component
        content_data["lastUpdated"] = "2025-01-09T" + __import__('datetime').datetime.now().strftime("%H:%M:%S") + "Z"
        
        # Save the updated content
        save_content_file("neural-network-architectures", content_data)
        
        logger.info(f"Successfully regenerated component {request.component_index} using model {request.model}")
        
        return {
            "success": True,
            "message": f"Component {request.component_index + 1} regenerated successfully",
            "component": new_component,
            "model": request.model
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to regenerate component: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to regenerate component: {str(e)}"
        )

@router.post("/neural-network-architectures/regenerate-page")
async def regenerate_page(request: RegeneratePageRequest):
    """Regenerate the entire Neural Network Architectures page"""
    try:
        # Load current content to preserve metadata
        content_data = load_content_file("neural-network-architectures")
        
        # Create a request for generating the entire page
        ai_request = LearningContentRequest(
            subtopic=content_data["title"],
            subject=content_data["subject"], 
            goal=content_data["goal"],
            model=request.model
        )
        
        # Generate new content
        result = await ai_executor.execute(
            task_type="learn_chunk",
            request_data=ai_request,
            response_schema=LearningContentResponse,
            is_json=True
        )
        
        # Update the content while preserving metadata structure
        content_data["content"] = result["response"].content
        content_data["lastUpdated"] = "2025-01-09T" + __import__('datetime').datetime.now().strftime("%H:%M:%S") + "Z"
        
        # Save the updated content
        save_content_file("neural-network-architectures", content_data)
        
        logger.info(f"Successfully regenerated entire page using model {request.model}")
        
        return {
            "success": True,
            "message": "Page regenerated successfully",
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

@router.get("/neural-network-architectures/content")
async def get_content():
    """Get the current content of the Neural Network Architectures page"""
    try:
        content_data = load_content_file("neural-network-architectures")
        return content_data
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get content: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get content: {str(e)}"
        )