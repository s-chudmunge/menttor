from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import Optional, List
import logging
from services.promotional_images_service import (
    generate_promotional_images_bulk,
    get_current_promotional_image,
    get_all_promotional_images,
    promotional_images_service
)
from sql_models import PromotionalImage

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/promotional-images", tags=["promotional-images"])

class BulkGenerationRequest(BaseModel):
    count: int = Field(default=12, ge=1, le=20, description="Number of images to generate")

class PromotionalImageResponse(BaseModel):
    id: int
    image_url: str
    concept: str
    model: str
    quality: str
    usage_count: int
    last_used: Optional[str] = None
    created_at: str
    is_active: bool

class BulkGenerationResponse(BaseModel):
    success: bool
    generated_count: int
    images: List[PromotionalImageResponse] = []
    error: Optional[str] = None

class CurrentImageResponse(BaseModel):
    success: bool
    image: Optional[PromotionalImageResponse] = None
    error: Optional[str] = None

@router.post("/generate-bulk", response_model=BulkGenerationResponse, summary="Generate Multiple Promotional Images")
async def generate_bulk_promotional_images(request: BulkGenerationRequest):
    """
    Generate multiple AI promotional images featuring the tech cat mascot.
    
    This endpoint creates a collection of varied promotional images that can be
    used for the main page background rotation system.
    """
    try:
        logger.info(f"Starting bulk generation of {request.count} promotional images")
        
        # Generate images
        saved_images = await generate_promotional_images_bulk(request.count)
        
        # Convert to response format
        image_responses = []
        for img in saved_images:
            image_responses.append(PromotionalImageResponse(
                id=img.id,
                image_url=img.image_url,
                concept=img.concept,
                model=img.model,
                quality=img.quality,
                usage_count=img.usage_count,
                last_used=img.last_used.isoformat() if img.last_used else None,
                created_at=img.created_at.isoformat(),
                is_active=img.is_active
            ))
        
        return BulkGenerationResponse(
            success=True,
            generated_count=len(saved_images),
            images=image_responses
        )
        
    except Exception as e:
        logger.error(f"Bulk generation failed: {e}")
        return BulkGenerationResponse(
            success=False,
            generated_count=0,
            error=f"Bulk generation failed: {str(e)}"
        )

@router.get("/current", response_model=CurrentImageResponse, summary="Get Current Promotional Image")
async def get_current_image():
    """
    Get the current promotional image for main page display.
    
    This endpoint implements a rotation system that:
    - Rotates images every few hours
    - Tracks usage to ensure variety
    - Returns the best image for current display
    """
    try:
        current_image = get_current_promotional_image()
        
        if current_image:
            image_response = PromotionalImageResponse(
                id=current_image.id,
                image_url=current_image.image_url,
                concept=current_image.concept,
                model=current_image.model,
                quality=current_image.quality,
                usage_count=current_image.usage_count,
                last_used=current_image.last_used.isoformat() if current_image.last_used else None,
                created_at=current_image.created_at.isoformat(),
                is_active=current_image.is_active
            )
            
            return CurrentImageResponse(
                success=True,
                image=image_response
            )
        else:
            return CurrentImageResponse(
                success=False,
                error="No promotional images available"
            )
            
    except Exception as e:
        logger.error(f"Error getting current image: {e}")
        return CurrentImageResponse(
            success=False,
            error=f"Failed to get current image: {str(e)}"
        )

@router.get("/all", response_model=List[PromotionalImageResponse], summary="Get All Promotional Images")
async def get_all_images():
    """Get all active promotional images from the database."""
    try:
        all_images = get_all_promotional_images()
        
        image_responses = []
        for img in all_images:
            image_responses.append(PromotionalImageResponse(
                id=img.id,
                image_url=img.image_url,
                concept=img.concept,
                model=img.model,
                quality=img.quality,
                usage_count=img.usage_count,
                last_used=img.last_used.isoformat() if img.last_used else None,
                created_at=img.created_at.isoformat(),
                is_active=img.is_active
            ))
        
        return image_responses
        
    except Exception as e:
        logger.error(f"Error getting all images: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get images: {str(e)}")

@router.post("/refresh", response_model=BulkGenerationResponse, summary="Refresh Image Collection")
async def refresh_images():
    """
    Generate new images to refresh the collection.
    
    Adds 5 new promotional images with fresh concepts to keep the
    main page content dynamic and engaging.
    """
    try:
        logger.info("Refreshing promotional image collection")
        
        new_images = await promotional_images_service.refresh_image_collection(5)
        
        # Convert to response format
        image_responses = []
        for img in new_images:
            image_responses.append(PromotionalImageResponse(
                id=img.id,
                image_url=img.image_url,
                concept=img.concept,
                model=img.model,
                quality=img.quality,
                usage_count=img.usage_count,
                last_used=img.last_used.isoformat() if img.last_used else None,
                created_at=img.created_at.isoformat(),
                is_active=img.is_active
            ))
        
        return BulkGenerationResponse(
            success=True,
            generated_count=len(new_images),
            images=image_responses
        )
        
    except Exception as e:
        logger.error(f"Image refresh failed: {e}")
        return BulkGenerationResponse(
            success=False,
            generated_count=0,
            error=f"Refresh failed: {str(e)}"
        )

@router.get("/health", summary="Promotional Images Service Health Check")
async def service_health():
    """Check the health of promotional images service."""
    try:
        # Check if we can get images from database
        images = get_all_promotional_images()
        
        return {
            "status": "healthy",
            "service": "promotional-images",
            "total_images": len(images),
            "active_images": len([img for img in images if img.is_active]),
            "capabilities": ["bulk_generation", "image_rotation", "database_storage"]
        }
        
    except Exception as e:
        logger.error(f"Promotional images service health check failed: {e}")
        return {
            "status": "error",
            "service": "promotional-images",
            "error": str(e)
        }