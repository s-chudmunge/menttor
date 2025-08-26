import asyncio
import logging
from typing import List, Dict, Any, Optional
from sqlmodel import Session, select
from database.session import get_db, engine
from sql_models import PromotionalImage, SQLModel
from services.video_generation_service import generate_promotional_video
from datetime import datetime, timedelta
import random

logger = logging.getLogger(__name__)

class PromotionalImagesService:
    """Service for managing promotional images with rotation and database storage."""
    
    def __init__(self):
        # Ensure the promotional images table exists
        self._ensure_table_exists()
        self.concepts = [
            "Tech cat mentor with AR goggles teaching coding concepts",
            "Futuristic cat guide showing data science visualizations",
            "AI cat assistant with holographic learning interfaces", 
            "Cyberpunk cat educator in neon-lit digital classroom",
            "Robot cat mentor surrounded by floating knowledge nodes",
            "Space-age cat teacher with quantum computing displays",
            "Digital cat guru with machine learning algorithms",
            "Steampunk cat professor with mechanical learning devices",
            "Virtual reality cat coach in immersive study environment",
            "Hologram cat tutor with interactive educational content",
            "Tech-savvy cat mentor with glowing circuit patterns",
            "Augmented reality cat guide with 3D learning models",
            "Cybernetic cat educator with neural network visuals",
            "Future cat instructor with advanced AI interfaces",
            "Digital native cat teacher with smart learning tools"
        ]
    
    def _ensure_table_exists(self):
        """Ensure the promotional images table exists in the database."""
        try:
            # Create the table if it doesn't exist
            SQLModel.metadata.create_all(engine, tables=[PromotionalImage.__table__])
            logger.info("Promotional images table ready")
        except Exception as e:
            logger.error(f"Error ensuring promotional images table exists: {e}")
    
    async def generate_bulk_images(self, count: int = 12) -> List[Dict[str, Any]]:
        """Generate multiple promotional images with varied concepts."""
        logger.info(f"Starting bulk generation of {count} promotional images")
        
        generated_images = []
        failed_count = 0
        
        # Select random concepts for variety
        selected_concepts = random.sample(self.concepts, min(count, len(self.concepts)))
        
        for i, concept in enumerate(selected_concepts):
            try:
                logger.info(f"Generating image {i+1}/{count}: {concept}")
                
                # Generate image using the existing service
                result = await generate_promotional_video(
                    concept=concept,
                    duration_seconds=12,  # Not used for images but required
                    quality="high"
                )
                
                if result and result.get("url"):
                    generated_images.append(result)
                    logger.info(f"Successfully generated image {i+1}")
                else:
                    logger.error(f"Failed to generate image {i+1}")
                    failed_count += 1
                
                # Small delay to avoid rate limiting
                await asyncio.sleep(2)
                
            except Exception as e:
                logger.error(f"Error generating image {i+1}: {e}")
                failed_count += 1
                continue
        
        logger.info(f"Bulk generation complete: {len(generated_images)} successful, {failed_count} failed")
        return generated_images
    
    async def save_images_to_database(self, images: List[Dict[str, Any]]) -> List[PromotionalImage]:
        """Save generated images to the database in batches of 5."""
        logger.info(f"Saving {len(images)} images to database in batches of 5")
        
        all_saved_images = []
        batch_size = 5
        
        # Process images in batches of 5
        for i in range(0, len(images), batch_size):
            batch = images[i:i + batch_size]
            batch_num = (i // batch_size) + 1
            
            logger.info(f"Processing batch {batch_num}: {len(batch)} images")
            
            # Get fresh database session for each batch
            db_gen = get_db()
            session = next(db_gen)
            
            try:
                batch_saved_images = []
                
                for image_data in batch:
                    try:
                        promotional_image = PromotionalImage(
                            image_url=image_data["url"],
                            prompt=image_data.get("prompt", ""),
                            model=image_data.get("model", "vertex-ai-imagen"),
                            concept=image_data.get("concept", "promotional content"),
                            quality=image_data.get("quality", "high"),
                            width=1920,
                            height=1080,
                            aspect_ratio="16:9",
                            is_active=True,
                            usage_count=0
                        )
                        
                        session.add(promotional_image)
                        batch_saved_images.append(promotional_image)
                        
                    except Exception as e:
                        logger.error(f"Error preparing image for database: {e}")
                        continue
                
                # Commit this batch
                session.commit()
                
                # Refresh to get IDs
                for img in batch_saved_images:
                    session.refresh(img)
                
                all_saved_images.extend(batch_saved_images)
                logger.info(f"Successfully saved batch {batch_num}: {len(batch_saved_images)} images")
                
            except Exception as e:
                session.rollback()
                logger.error(f"Error committing batch {batch_num}: {e}")
                # Continue with next batch instead of raising
            finally:
                session.close()
        
        logger.info(f"Completed batch saving: {len(all_saved_images)} total images saved")
        return all_saved_images
    
    def get_current_image(self) -> Optional[PromotionalImage]:
        """Get the current image for rotation based on time and usage."""
        db_gen = get_db()
        session = next(db_gen)
        
        try:
            # Get all active images
            statement = select(PromotionalImage).where(PromotionalImage.is_active == True)
            images = session.exec(statement).all()
            
            if not images:
                logger.warning("No active promotional images found")
                return None
            
            # Check if we need to rotate (every few hours)
            now = datetime.utcnow()
            
            # Find images that haven't been used recently or never used
            available_images = []
            for image in images:
                if image.last_used is None:
                    available_images.append(image)
                elif now - image.last_used > timedelta(hours=3):
                    available_images.append(image)
            
            # If no images meet the time criteria, reset and use least recently used
            if not available_images:
                available_images = sorted(images, key=lambda x: x.last_used or datetime.min)
            
            # Select image with lowest usage count among available
            selected_image = min(available_images, key=lambda x: x.usage_count)
            
            # Update usage tracking
            selected_image.last_used = now
            selected_image.usage_count += 1
            
            try:
                session.add(selected_image)
                session.commit()
                session.refresh(selected_image)
            except Exception as e:
                logger.error(f"Error updating image usage: {e}")
                session.rollback()
            
            return selected_image
    
    def get_all_images(self) -> List[PromotionalImage]:
        """Get all promotional images from database."""
        with Session(next(get_db())) as session:
            statement = select(PromotionalImage).where(PromotionalImage.is_active == True)
            return session.exec(statement).all()
    
    async def refresh_image_collection(self, count: int = 5) -> List[PromotionalImage]:
        """Generate and add new images to refresh the collection."""
        logger.info(f"Refreshing promotional image collection with {count} new images")
        
        # Generate new images
        new_images = await self.generate_bulk_images(count)
        
        # Save to database
        if new_images:
            saved_images = await self.save_images_to_database(new_images)
            return saved_images
        
        return []

# Singleton instance
promotional_images_service = PromotionalImagesService()

# Public functions for easy access
async def generate_promotional_images_bulk(count: int = 12) -> List[PromotionalImage]:
    """Generate and save multiple promotional images."""
    images = await promotional_images_service.generate_bulk_images(count)
    if images:
        return await promotional_images_service.save_images_to_database(images)
    return []

def get_current_promotional_image() -> Optional[PromotionalImage]:
    """Get current promotional image for main page."""
    return promotional_images_service.get_current_image()

def get_all_promotional_images() -> List[PromotionalImage]:
    """Get all active promotional images."""
    return promotional_images_service.get_all_images()