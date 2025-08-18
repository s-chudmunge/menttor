from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from typing import Optional
from services.image_generation_service import generate_diagram_for_content
from .auth import get_current_user
from sql_models import User
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

class ImageGenerationRequest(BaseModel):
    concept: str
    subject: str
    content: str
    width: Optional[int] = 512
    height: Optional[int] = 512

class ImageGenerationResponse(BaseModel):
    url: str
    prompt: str
    model: str
    concept: str
    subject: str

@router.post("/generate-diagram", response_model=ImageGenerationResponse)
async def generate_educational_diagram(
    request: ImageGenerationRequest,
    current_user: User = Depends(get_current_user)
):
    """Generate a specific educational diagram based on learning content."""
    try:
        logger.info(f"Generating diagram for concept: {request.concept}, subject: {request.subject}")
        
        result = await generate_diagram_for_content(
            concept=request.concept,
            subject=request.subject,
            specific_content=request.content,
            width=request.width,
            height=request.height
        )
        
        if not result:
            # This should not happen with the updated service, but provide a final fallback
            return ImageGenerationResponse(
                url="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNiIgZmlsbD0iIzY2NiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkZhbGxiYWNrIERpYWdyYW08L3RleHQ+Cjwvc3ZnPgo=",
                prompt=f"Fallback diagram for {request.concept}",
                model="fallback",
                concept=request.concept,
                subject=request.subject
            )
        
        return ImageGenerationResponse(
            url=result["url"],
            prompt=result["prompt"],
            model=result["model"],
            concept=result["concept"],
            subject=result["subject"]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating educational diagram: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate educational diagram"
        )