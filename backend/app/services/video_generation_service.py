import asyncio
import aiohttp
import logging
import base64
from typing import Optional, Dict, Any
from core.config import settings
import tempfile
import os
from pathlib import Path
from vertexai import init
from vertexai.preview.generative_models import GenerativeModel

logger = logging.getLogger(__name__)

class VideoGenerationService:
    """Professional video generation service using Vertex AI Veo 3 for brand promotional content."""
    
    def __init__(self):
        self.session = None
        self._vertex_initialized = False
        self._veo_model = None
        
        # Initialize Vertex AI for video generation
        if settings.VERTEX_AI_PROJECT_ID and settings.VERTEX_AI_REGION:
            try:
                init(project=settings.VERTEX_AI_PROJECT_ID, location=settings.VERTEX_AI_REGION)
                # Initialize Veo 3 model for video generation
                self._veo_model = GenerativeModel("video-generator")  # Veo 3 model
                self._vertex_initialized = True
                logger.info("Vertex AI Veo 3 video generator initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize Vertex AI Veo 3: {e}")
                self._vertex_initialized = False
    
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    def _create_promotional_prompt(self, concept: str = "Menttor learning platform") -> str:
        """Create a compelling promotional video prompt featuring the cat mascot and brand."""
        
        prompt = f"""Create a high-quality promotional video for {concept} with the following specifications:

SCENE DESCRIPTION:
- A tech-savvy cat character wearing futuristic AR/VR goggles (mirrored, colorful lenses reflecting digital data)
- The cat is dressed in a sleek black hoodie with subtle green tech accents
- Setting: Modern, atmospheric environment with soft lighting and tech ambiance

VISUAL STORY:
1. Opening: Cat sitting by a warm campfire at night, looking contemplative and intelligent
2. Transition: Digital particles and learning elements start flowing around the cat
3. The MenttorLabs logo appears elegantly, floating near the cat with a subtle glow
4. Cat interacts with holographic learning interfaces - touching floating knowledge nodes
5. Show the transformation from traditional learning to futuristic AI-powered education
6. Closing: Cat looks directly at camera with a knowing expression, logo prominently displayed

STYLE & MOOD:
- Professional yet approachable
- Cinematic quality with smooth camera movements
- Warm color palette mixed with cool tech blues and purples  
- Inspiring and innovative feeling
- 8-12 seconds duration
- High production value

BRANDING ELEMENTS:
- Menttor logo integration (purple and blue gradient)
- "Smart Learning" tagline subtly displayed
- Tech elements that represent personalized learning paths
- Clean, modern aesthetic suitable for a learning platform

TECHNICAL SPECS:
- 1080p HD resolution
- Smooth 30fps
- Professional lighting
- No harsh transitions
- Ready for web and social media use"""

        return prompt
    
    def _create_brand_focused_prompt(self) -> str:
        """Create a brand-focused promotional video prompt."""
        
        prompt = """Create a premium promotional video for Menttor learning platform:

HERO CHARACTER:
- A sophisticated cat mascot wearing high-tech AR goggles with iridescent blue-green lenses
- Black tech hoodie with subtle LED accents
- Confident, intelligent demeanor
- Acts as the guide/mentor figure

NARRATIVE FLOW:
1. OPENING (0-2s): Cat at a cozy campfire scene, contemplating while digital sparks mix with real fire
2. TRANSFORMATION (2-5s): Environment shifts to futuristic learning space with floating knowledge orbs
3. INTERACTION (5-8s): Cat gestures, activating holographic Menttor interface showing learning paths
4. BRAND MOMENT (8-10s): Logo materializes prominently with "Smart Learning" tagline
5. CLOSING (10-12s): Cat gives approving nod, background shows connected learning network

VISUAL STYLE:
- Cinematic 16:9 aspect ratio
- Professional color grading with warm-to-cool gradient
- Smooth camera movements (no jarring cuts)
- Premium lighting setup
- Particle effects for tech elements

BRANDING:
- Menttor logo (graduation cap icon with purple-to-blue gradient)
- "Smart Learning" tagline integration
- Consistent with educational technology aesthetic
- Modern, trustworthy, innovative feel

OUTPUT REQUIREMENTS:
- 12-second duration
- 1920x1080 resolution at 30fps
- Professional broadcast quality
- Web-optimized for landing pages and social media"""

        return prompt
    
    async def generate_promotional_video(
        self,
        concept: str = "Menttor Smart Learning Platform",
        duration_seconds: int = 12,
        quality: str = "high"
    ) -> Optional[Dict[str, Any]]:
        """Generate a professional promotional video using Vertex AI Veo 3."""
        
        if not self._vertex_initialized or not self._veo_model:
            logger.error("Vertex AI Veo 3 not initialized")
            return None
        
        try:
            # Create the promotional prompt
            video_prompt = self._create_brand_focused_prompt()
            
            logger.info(f"Generating promotional video with Veo 3...")
            logger.info(f"Prompt: {video_prompt}")
            
            # Generate video using Veo 3
            # Note: The exact API might vary based on Vertex AI's video generation interface
            response = await asyncio.to_thread(
                self._veo_model.generate_content,
                [video_prompt],
                generation_config={
                    "temperature": 0.7,
                    "max_output_tokens": 8192,
                    "response_mime_type": "video/mp4",
                    "video_duration_seconds": duration_seconds,
                    "video_quality": quality,
                    "aspect_ratio": "16:9",
                    "frame_rate": 30
                }
            )
            
            if response and hasattr(response, 'candidates') and response.candidates:
                video_candidate = response.candidates[0]
                
                # Extract video data
                video_data = None
                if hasattr(video_candidate.content, 'parts'):
                    for part in video_candidate.content.parts:
                        if hasattr(part, 'inline_data') and part.inline_data.mime_type.startswith('video/'):
                            video_data = part.inline_data.data
                            break
                
                if video_data:
                    # Convert to base64 for web delivery
                    video_base64 = base64.b64encode(video_data).decode('utf-8')
                    video_data_url = f"data:video/mp4;base64,{video_base64}"
                    
                    return {
                        "url": video_data_url,
                        "prompt": video_prompt,
                        "model": "vertex-ai-veo-3",
                        "concept": concept,
                        "duration": duration_seconds,
                        "quality": quality,
                        "type": "promotional_video",
                        "mime_type": "video/mp4"
                    }
                else:
                    logger.error("No video data found in response")
                    return None
            else:
                logger.error("No valid response from Veo 3")
                return None
                
        except Exception as e:
            logger.error(f"Video generation failed: {e}")
            return None
    
    async def generate_custom_video(
        self,
        prompt: str,
        duration_seconds: int = 8,
        quality: str = "high",
        style: str = "professional"
    ) -> Optional[Dict[str, Any]]:
        """Generate a custom video based on user prompt."""
        
        if not self._vertex_initialized or not self._veo_model:
            logger.error("Vertex AI Veo 3 not initialized")
            return None
        
        # Enhance the prompt with style and quality parameters
        enhanced_prompt = f"""Create a {style} video with the following description:

{prompt}

Technical requirements:
- Duration: {duration_seconds} seconds
- Quality: {quality}
- Smooth camera movements
- Professional lighting
- 1920x1080 HD resolution at 30fps
- Optimized for web playback"""
        
        try:
            response = await asyncio.to_thread(
                self._veo_model.generate_content,
                [enhanced_prompt],
                generation_config={
                    "temperature": 0.8,
                    "max_output_tokens": 8192,
                    "response_mime_type": "video/mp4",
                    "video_duration_seconds": duration_seconds,
                    "video_quality": quality,
                    "aspect_ratio": "16:9",
                    "frame_rate": 30
                }
            )
            
            if response and hasattr(response, 'candidates') and response.candidates:
                video_candidate = response.candidates[0]
                
                # Extract video data
                video_data = None
                if hasattr(video_candidate.content, 'parts'):
                    for part in video_candidate.content.parts:
                        if hasattr(part, 'inline_data') and part.inline_data.mime_type.startswith('video/'):
                            video_data = part.inline_data.data
                            break
                
                if video_data:
                    video_base64 = base64.b64encode(video_data).decode('utf-8')
                    video_data_url = f"data:video/mp4;base64,{video_base64}"
                    
                    return {
                        "url": video_data_url,
                        "prompt": enhanced_prompt,
                        "model": "vertex-ai-veo-3",
                        "duration": duration_seconds,
                        "quality": quality,
                        "style": style,
                        "type": "custom_video",
                        "mime_type": "video/mp4"
                    }
            
            return None
                
        except Exception as e:
            logger.error(f"Custom video generation failed: {e}")
            return None

# Singleton instance
video_generator = VideoGenerationService()

async def generate_promotional_video(
    concept: str = "Menttor Learning Platform",
    duration_seconds: int = 12,
    quality: str = "high"
) -> Optional[Dict[str, Any]]:
    """Public interface for generating promotional videos."""
    
    async with video_generator as generator:
        return await generator.generate_promotional_video(
            concept=concept,
            duration_seconds=duration_seconds,
            quality=quality
        )

async def generate_custom_video(
    prompt: str,
    duration_seconds: int = 8,
    quality: str = "high",
    style: str = "professional"
) -> Optional[Dict[str, Any]]:
    """Public interface for generating custom videos."""
    
    async with video_generator as generator:
        return await generator.generate_custom_video(
            prompt=prompt,
            duration_seconds=duration_seconds,
            quality=quality,
            style=style
        )