from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import Optional
import logging
from services.video_generation_service import generate_promotional_video, generate_custom_video

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/video", tags=["video-generation"])

class PromoVideoRequest(BaseModel):
    concept: Optional[str] = Field(default="Menttor Smart Learning Platform", description="The concept/brand to showcase")
    duration_seconds: Optional[int] = Field(default=12, ge=5, le=30, description="Video duration in seconds")
    quality: Optional[str] = Field(default="high", pattern="^(high|medium|low)$", description="Video quality level")
    theme: Optional[str] = Field(default="dark", pattern="^(light|dark)$", description="Theme style (light or dark)")

class CustomVideoRequest(BaseModel):
    prompt: str = Field(..., description="Custom video generation prompt", min_length=10, max_length=1000)
    duration_seconds: Optional[int] = Field(default=8, ge=3, le=20, description="Video duration in seconds")
    quality: Optional[str] = Field(default="high", pattern="^(high|medium|low)$", description="Video quality level")
    style: Optional[str] = Field(default="professional", description="Video style (professional, creative, cinematic)")

class VideoResponse(BaseModel):
    success: bool
    url: Optional[str] = None
    prompt: Optional[str] = None
    model: Optional[str] = None
    concept: Optional[str] = None
    duration: Optional[int] = None
    quality: Optional[str] = None
    type: Optional[str] = None
    mime_type: Optional[str] = None
    error: Optional[str] = None

@router.post("/generate-promo", response_model=VideoResponse, summary="Generate Promotional Video")
async def create_promotional_video(request: PromoVideoRequest):
    """
    Generate a high-quality promotional video featuring the Menttor brand mascot (tech cat) 
    and logo using Vertex AI Veo 3.
    
    This endpoint creates professional promotional content perfect for:
    - Landing page hero sections
    - Social media campaigns  
    - Marketing materials
    - Brand showcase videos
    """
    try:
        logger.info(f"Generating promotional video - concept: {request.concept}, duration: {request.duration_seconds}s")
        
        # Generate the promotional video
        result = await generate_promotional_video(
            concept=request.concept,
            duration_seconds=request.duration_seconds,
            quality=request.quality,
            theme=request.theme
        )
        
        if result:
            return VideoResponse(
                success=True,
                url=result.get("url"),
                prompt=result.get("prompt"),
                model=result.get("model"),
                concept=result.get("concept"),
                duration=result.get("duration"),
                quality=result.get("quality"),
                type=result.get("type"),
                mime_type=result.get("mime_type")
            )
        else:
            logger.error("Video generation returned no result")
            raise HTTPException(
                status_code=500, 
                detail="Video generation failed - no result returned"
            )
            
    except Exception as e:
        logger.error(f"Promotional video generation error: {e}")
        return VideoResponse(
            success=False,
            error=f"Video generation failed: {str(e)}"
        )

@router.post("/generate-custom", response_model=VideoResponse, summary="Generate Custom Video")
async def create_custom_video(request: CustomVideoRequest):
    """
    Generate a custom video based on user-provided prompt using Vertex AI Veo 3.
    
    Allows for creative, branded video content with custom specifications while 
    maintaining professional quality standards.
    """
    try:
        logger.info(f"Generating custom video - duration: {request.duration_seconds}s, style: {request.style}")
        
        # Generate the custom video
        result = await generate_custom_video(
            prompt=request.prompt,
            duration_seconds=request.duration_seconds,
            quality=request.quality,
            style=request.style
        )
        
        if result:
            return VideoResponse(
                success=True,
                url=result.get("url"),
                prompt=result.get("prompt"),
                model=result.get("model"),
                duration=result.get("duration"),
                quality=result.get("quality"),
                type=result.get("type"),
                mime_type=result.get("mime_type")
            )
        else:
            logger.error("Custom video generation returned no result")
            raise HTTPException(
                status_code=500,
                detail="Custom video generation failed - no result returned"
            )
            
    except Exception as e:
        logger.error(f"Custom video generation error: {e}")
        return VideoResponse(
            success=False,
            error=f"Custom video generation failed: {str(e)}"
        )

@router.get("/health", summary="Video Service Health Check")
async def video_service_health():
    """Check if video generation service is available and healthy."""
    try:
        from services.video_generation_service import video_generator
        
        if video_generator._vertex_initialized:
            return {
                "status": "healthy",
                "service": "vertex-ai-veo-3",
                "capabilities": ["promotional_videos", "custom_videos"],
                "max_duration": "30 seconds",
                "supported_qualities": ["high", "medium", "low"]
            }
        else:
            return {
                "status": "unavailable",
                "service": "vertex-ai-veo-3",
                "error": "Vertex AI not initialized"
            }
            
    except Exception as e:
        logger.error(f"Video service health check failed: {e}")
        return {
            "status": "error",
            "error": str(e)
        }