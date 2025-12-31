from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from typing import Optional
from services.enhanced_image_service import generate_learning_visual
from .auth import get_current_user
from app.sql_models import User
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

class ImageGenerationRequest(BaseModel):
    concept: str
    subject: str
    content: str
    subtopic_title: Optional[str] = None  # Add subtopic title for better context
    roadmap_category: Optional[str] = None  # Add roadmap category for better context
    width: Optional[int] = 512
    height: Optional[int] = 512

class ImageGenerationResponse(BaseModel):
    url: str
    prompt: str
    model: str
    concept: str
    type: str  # Content type instead of subject

@router.post("/generate-diagram", response_model=ImageGenerationResponse)
async def generate_educational_diagram(
    request: ImageGenerationRequest,
    current_user: User = Depends(get_current_user)
):
    """Generate a universal educational visual based on learning content."""
    try:
        logger.info(f"Generating learning visual for concept: {request.concept}")
        
        result = await generate_learning_visual(
            concept=request.concept,
            content=request.content,
            subject=request.subject,
            subtopic_title=request.subtopic_title,
            roadmap_category=request.roadmap_category,
            width=request.width,
            height=request.height
        )
        
        if not result:
            # Fallback if generation completely fails
            return ImageGenerationResponse(
                url="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTEyIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ3aGl0ZSIvPgogIDx0ZXh0IHg9IjUwJSIgeT0iNDAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTYiIGZpbGw9IiM2NjYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj7wn5OCIEF1ZGlhbCBMZWFybmluZzwvdGV4dD4KICA8dGV4dCB4PSI1MCUiIHk9IjYwJSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+Q29uY2VwdDogT0lTT0lTPC90ZXh0Pgo8L3N2Zz4K".replace("O0lTT0lT", request.concept),
                prompt=f"Emergency fallback for {request.concept}",
                model="emergency-fallback",
                concept=request.concept,
                type="fallback"
            )
        
        return ImageGenerationResponse(
            url=result["url"],
            prompt=result["prompt"],
            model=result["model"],
            concept=result["concept"],
            type=result["type"]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating learning visual: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate learning visual"
        )