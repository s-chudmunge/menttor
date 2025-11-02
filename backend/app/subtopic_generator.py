#!/usr/bin/env python3
"""
Subtopic Library Content Generator

This script fetches all subtopics from ALL curated roadmaps and generates
library content for each subtopic using AI generation functionality. 
It automatically skips already processed subtopics and processes remaining
ones with a 30-second interval between generations.
"""

import asyncio
import json
import logging
import os
import sys
import time
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any

# Add the app directory to the Python path
sys.path.append(str(Path(__file__).parent / "app"))

import httpx

from schemas import LearningContentRequest
from services.ai_service import ai_executor, LearningContentResponse
from routers.library import save_content_to_db
from database.session import get_db

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Configuration
BACKEND_URL = os.getenv("BACKEND_URL", "https://menttor-backend.onrender.com")
DEFAULT_MODEL = "vertexai:gemini-2.5-flash-lite"
GENERATION_INTERVAL = 30  # 30 seconds
MAX_RETRIES = 3

class SubtopicGenerator:
    def __init__(self):
        self.processed_subtopics = set()
        self.failed_subtopics = set()
        self.load_processed_list()
    
    def load_processed_list(self):
        """Load list of already processed subtopics from database and temp storage"""
        # First load from temp file for backwards compatibility
        processed_file = Path("/tmp/processed_subtopics.txt")
        if processed_file.exists():
            with open(processed_file, 'r') as f:
                temp_processed = set(line.strip() for line in f if line.strip())
                self.processed_subtopics.update(temp_processed)
                logger.info(f"Loaded {len(temp_processed)} processed subtopics from temp file")
        
        # Also load from database - check for existing library content
        try:
            db_session = next(get_db())
            try:
                from database.models import LibraryContent
                existing_content = db_session.query(LibraryContent).all()
                
                # Extract subtopic IDs from metadata if available
                db_processed = set()
                for content in existing_content:
                    if hasattr(content, 'metadata') and content.metadata:
                        metadata = content.metadata if isinstance(content.metadata, dict) else {}
                        subtopic_id = metadata.get('subtopic_id')
                        if subtopic_id:
                            db_processed.add(str(subtopic_id))
                
                self.processed_subtopics.update(db_processed)
                logger.info(f"Loaded {len(db_processed)} processed subtopics from database")
                logger.info(f"Total processed subtopics: {len(self.processed_subtopics)}")
                
            finally:
                db_session.close()
        except Exception as e:
            logger.warning(f"Could not load processed subtopics from database: {e}")
            # Continue with just temp file data
    
    def save_processed_list(self):
        """Save list of processed subtopics to temp storage"""
        processed_file = Path("/tmp/processed_subtopics.txt")
        processed_file.parent.mkdir(exist_ok=True)
        with open(processed_file, 'w') as f:
            for subtopic_id in sorted(self.processed_subtopics):
                f.write(f"{subtopic_id}\n")
    
    async def fetch_all_curated_roadmaps(self) -> List[Dict[str, Any]]:
        """Fetch all curated roadmaps from the API"""
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(f"{BACKEND_URL}/curated-roadmaps/", timeout=30.0)
                response.raise_for_status()
                roadmaps = response.json()
                logger.info(f"Fetched {len(roadmaps)} curated roadmaps")
                return roadmaps
            except Exception as e:
                logger.error(f"Failed to fetch curated roadmaps: {e}")
                return []
    
    async def fetch_roadmap_details(self, slug: str) -> Dict[str, Any]:
        """Fetch detailed roadmap with all subtopics"""
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(f"{BACKEND_URL}/curated-roadmaps/slug/{slug}", timeout=30.0)
                response.raise_for_status()
                return response.json()
            except Exception as e:
                logger.error(f"Failed to fetch roadmap details for {slug}: {e}")
                return {}
    
    def extract_all_subtopics(self, roadmaps_with_details: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Extract all subtopics from all roadmaps with context"""
        all_subtopics = []
        
        for roadmap in roadmaps_with_details:
            if not roadmap.get('roadmap_plan'):
                continue
                
            roadmap_title = roadmap.get('title', 'Unknown Roadmap')
            roadmap_category = roadmap.get('category', 'general')
            
            for module in roadmap['roadmap_plan']:
                module_title = module.get('title', 'Unknown Module')
                
                for topic in module.get('topics', []):
                    topic_title = topic.get('title', 'Unknown Topic')
                    
                    for subtopic in topic.get('subtopics', []):
                        subtopic_data = {
                            'id': subtopic.get('id'),
                            'title': subtopic.get('title'),
                            'roadmap_title': roadmap_title,
                            'roadmap_category': roadmap_category,
                            'module_title': module_title,
                            'topic_title': topic_title,
                            'learn': subtopic.get('learn'),
                            'quiz': subtopic.get('quiz'),
                            'code': subtopic.get('code')
                        }
                        
                        if subtopic_data['id'] and subtopic_data['title']:
                            all_subtopics.append(subtopic_data)
        
        logger.info(f"Extracted {len(all_subtopics)} total subtopics from all roadmaps")
        return all_subtopics
    
    def create_slug_from_title(self, title: str) -> str:
        """Convert subtopic title to URL-friendly slug"""
        import re
        slug = title.lower()
        slug = re.sub(r'[^\w\s-]', '', slug)  # Remove special chars
        slug = re.sub(r'[\s_-]+', '-', slug)  # Replace spaces with hyphens
        slug = slug.strip('-')  # Remove leading/trailing hyphens
        return slug
    
    async def generate_subtopic_content(self, subtopic: Dict[str, Any]) -> tuple[bool, bool]:
        """Generate content for a single subtopic using AI
        
        Returns:
            tuple[bool, bool]: (success, was_generated)
            - success: Whether the operation was successful
            - was_generated: Whether new content was actually generated (vs. skipped existing)
        """
        slug = self.create_slug_from_title(subtopic['title'])
        
        # Skip if already processed
        if subtopic['id'] in self.processed_subtopics:
            logger.info(f"Skipping already processed subtopic: {subtopic['title']}")
            return True, False
        
        # Check if content already exists in database
        try:
            db_session = next(get_db())
            from routers.library import load_content_from_db
            try:
                existing_content = load_content_from_db(slug, db_session)
                logger.info(f"Content already exists in database for: {subtopic['title']}")
                self.processed_subtopics.add(subtopic['id'])
                return True, False
            except:
                # Content doesn't exist, continue with generation
                pass
            finally:
                db_session.close()
        except Exception as e:
            logger.warning(f"Failed to check existing content: {e}")
            # Continue with generation
        
        try:
            logger.info(f"Generating content for subtopic: {subtopic['title']}")
            
            # Create AI request
            subject = f"{subtopic['roadmap_category'].replace('-', ' ').title()} - {subtopic['module_title']}"
            goal = f"Learn about {subtopic['title']} as part of {subtopic['roadmap_title']}"
            
            ai_request = LearningContentRequest(
                subtopic=subtopic['title'],
                subject=subject,
                goal=goal,
                model=DEFAULT_MODEL
            )
            
            # Generate content using existing AI service
            result = await ai_executor.execute(
                task_type="learn_chunk_with_resources",
                request_data=ai_request,
                response_schema=LearningContentResponse,
                is_json=True
            )
            
            # Serialize content blocks
            serialized_content = []
            for component in result["response"].content:
                if hasattr(component, 'model_dump'):
                    serialized_content.append(component.model_dump())
                elif hasattr(component, 'dict'):
                    serialized_content.append(component.dict())
                elif isinstance(component, dict):
                    serialized_content.append(component)
                else:
                    try:
                        serialized_content.append(json.loads(json.dumps(component, default=str)))
                    except (TypeError, AttributeError):
                        logger.error(f"Failed to serialize content component: {type(component)}")
                        continue
            
            # Serialize resources if they exist
            serialized_resources = []
            if result["response"].resources:
                for resource in result["response"].resources:
                    if hasattr(resource, 'model_dump'):
                        serialized_resources.append(resource.model_dump())
                    elif hasattr(resource, 'dict'):
                        serialized_resources.append(resource.dict())
                    elif isinstance(resource, dict):
                        serialized_resources.append(resource)
                    else:
                        try:
                            serialized_resources.append(json.loads(json.dumps(resource, default=str)))
                        except (TypeError, AttributeError):
                            logger.error(f"Failed to serialize resource: {type(resource)}")
                            continue
            
            # Create content data structure
            content_data = {
                "title": subtopic['title'],
                "subject": subject,
                "goal": goal,
                "lastUpdated": datetime.now().isoformat() + "Z",
                "content": serialized_content,
                "resources": serialized_resources,
                "metadata": {
                    "subtopic_id": subtopic['id'],
                    "roadmap_title": subtopic['roadmap_title'],
                    "roadmap_category": subtopic['roadmap_category'],
                    "module_title": subtopic['module_title'],
                    "topic_title": subtopic['topic_title'],
                    "activities": {
                        "learn": subtopic['learn'],
                        "quiz": subtopic['quiz'],
                        "code": subtopic['code']
                    }
                }
            }
            
            # Save the content to database
            db_session = next(get_db())
            try:
                save_content_to_db(slug, content_data, db_session)
            finally:
                db_session.close()
            
            # Mark as processed
            self.processed_subtopics.add(subtopic['id'])
            self.save_processed_list()
            
            logger.info(f"Successfully generated content for: {subtopic['title']} -> {slug}.json")
            return True, True
            
        except Exception as e:
            logger.error(f"Failed to generate content for {subtopic['title']}: {e}")
            self.failed_subtopics.add(subtopic['id'])
            return False, False
    
    async def run_generation_cycle(self):
        """Run one cycle of subtopic generation - ALL REMAINING SUBTOPICS FROM ALL ROADMAPS"""
        logger.info("Starting ALL remaining subtopics generation cycle from ALL roadmaps...")
        
        # Fetch all curated roadmaps
        roadmaps = await self.fetch_all_curated_roadmaps()
        if not roadmaps:
            logger.error("No roadmaps found, skipping cycle")
            return True
        
        logger.info(f"Found {len(roadmaps)} curated roadmaps to process")
        
        # Get details for all roadmaps
        all_roadmap_details = []
        for i, roadmap in enumerate(roadmaps):
            slug = roadmap.get('slug') or str(roadmap.get('id'))
            title = roadmap.get('title', 'Unknown Roadmap')
            logger.info(f"Fetching details for roadmap {i+1}/{len(roadmaps)}: {title} (slug: {slug})")
            
            details = await self.fetch_roadmap_details(slug)
            if details:
                all_roadmap_details.append(details)
                logger.info(f"✅ Successfully fetched details for: {title}")
            else:
                logger.warning(f"❌ Failed to fetch details for: {title}")
        
        if not all_roadmap_details:
            logger.error("Failed to fetch details for any roadmap")
            return True
            
        logger.info(f"Successfully fetched details for {len(all_roadmap_details)} roadmaps")
            
        # Extract subtopics from all roadmaps
        all_subtopics = self.extract_all_subtopics(all_roadmap_details)
        
        if not all_subtopics:
            logger.error("No subtopics extracted from any roadmap")
            return True
        
        logger.info(f"Found {len(all_subtopics)} total subtopics across all roadmaps")
        
        # Filter unprocessed subtopics (this automatically skips already generated content)
        unprocessed = [s for s in all_subtopics if s['id'] not in self.processed_subtopics]
        logger.info(f"Found {len(unprocessed)} unprocessed subtopics (skipping {len(all_subtopics) - len(unprocessed)} already processed)")
        
        if not unprocessed:
            logger.info("All subtopics from all roadmaps have been processed! 🎉")
            return True  # Signal completion
        
        # Process ALL remaining subtopics
        processed_count = 0
        failed_count = 0
        generated_count = 0
        
        for i, subtopic in enumerate(unprocessed):
            logger.info(f"Processing subtopic {i+1}/{len(unprocessed)}: {subtopic['title']}")
            logger.info(f"From: {subtopic['roadmap_title']} -> {subtopic['module_title']} -> {subtopic['topic_title']}")
            
            success, was_generated = await self.generate_subtopic_content(subtopic)
            if success:
                processed_count += 1
                if was_generated:
                    generated_count += 1
                    logger.info(f"✅ Successfully generated ({i+1}/{len(unprocessed)}): {subtopic['title']}")
                else:
                    logger.info(f"⏭️ Skipped existing content ({i+1}/{len(unprocessed)}): {subtopic['title']}")
            else:
                failed_count += 1
                logger.error(f"❌ Failed to generate ({i+1}/{len(unprocessed)}): {subtopic['title']}")
            
            # Only add delay if we actually generated new content and there are more subtopics to process
            if was_generated and i < len(unprocessed) - 1:
                logger.info("Waiting 30 seconds before next generation...")
                await asyncio.sleep(GENERATION_INTERVAL)  # 30 seconds
        
        logger.info(f"Batch completed! Processed: {processed_count}, Generated: {generated_count}, Failed: {failed_count}")
        return True  # Signal completion
    
    async def run(self):
        """Main execution loop - ALL ROADMAPS VERSION"""
        logger.info("🚀 Starting Library Content Generator for ALL Curated Roadmaps")
        logger.info("Content storage: Database")
        logger.info(f"Using model: {DEFAULT_MODEL}")
        logger.info("NOTE: This version processes ALL remaining subtopics from ALL curated roadmaps")
        
        try:
            completed = await self.run_generation_cycle()
            if completed:
                logger.info("🎊 All subtopics from all roadmaps processing completed!")
            
        except Exception as e:
            logger.error(f"Error in generation cycle: {e}")
            import traceback
            traceback.print_exc()
        
        # Final summary
        logger.info(f"\n📊 Final Summary:")
        logger.info(f"Total processed: {len(self.processed_subtopics)}")
        logger.info(f"Total failed: {len(self.failed_subtopics)}")
        logger.info("Content files saved to database")
    
    async def run_batch(self, batch_size: int = 20, start_from: int = None):
        """Run a batch of subtopic generation with specified size"""
        logger.info(f"🚀 Starting Batch Content Generator (size: {batch_size})")
        logger.info("Content storage: Database")
        logger.info(f"Using model: {DEFAULT_MODEL}")
        
        try:
            # Fetch all curated roadmaps
            roadmaps = await self.fetch_all_curated_roadmaps()
            if not roadmaps:
                logger.error("No roadmaps found, skipping batch")
                return {
                    "batch_completed": True,
                    "batch_number": 0,
                    "subtopics_processed": 0,
                    "subtopics_generated": 0,
                    "subtopics_failed": 0,
                    "has_more_batches": False,
                    "error": "No roadmaps found"
                }

            logger.info(f"Found {len(roadmaps)} curated roadmaps to process")
            
            # Get details for all roadmaps
            all_roadmap_details = []
            for i, roadmap in enumerate(roadmaps):
                slug = roadmap.get('slug') or str(roadmap.get('id'))
                title = roadmap.get('title', 'Unknown Roadmap')
                logger.info(f"Fetching details for roadmap {i+1}/{len(roadmaps)}: {title} (slug: {slug})")
                
                details = await self.fetch_roadmap_details(slug)
                if details:
                    all_roadmap_details.append(details)
                    logger.info(f"✅ Successfully fetched details for: {title}")
                else:
                    logger.warning(f"❌ Failed to fetch details for: {title}")

            if not all_roadmap_details:
                logger.error("Failed to fetch details for any roadmap")
                return {
                    "batch_completed": True,
                    "batch_number": 0,
                    "subtopics_processed": 0,
                    "subtopics_generated": 0,
                    "subtopics_failed": 0,
                    "has_more_batches": False,
                    "error": "Failed to fetch roadmap details"
                }
                
            logger.info(f"Successfully fetched details for {len(all_roadmap_details)} roadmaps")
                
            # Extract subtopics from all roadmaps
            all_subtopics = self.extract_all_subtopics(all_roadmap_details)
            
            if not all_subtopics:
                logger.error("No subtopics extracted from any roadmap")
                return {
                    "batch_completed": True,
                    "batch_number": 0,
                    "subtopics_processed": 0,
                    "subtopics_generated": 0,
                    "subtopics_failed": 0,
                    "total_subtopics": 0,
                    "has_more_batches": False,
                    "error": "No subtopics found"
                }

            logger.info(f"Found {len(all_subtopics)} total subtopics across all roadmaps")
            
            # Filter unprocessed subtopics
            unprocessed = [s for s in all_subtopics if s['id'] not in self.processed_subtopics]
            logger.info(f"Found {len(unprocessed)} unprocessed subtopics (skipping {len(all_subtopics) - len(unprocessed)} already processed)")
            
            if not unprocessed:
                logger.info("All subtopics from all roadmaps have been processed! 🎉")
                return {
                    "batch_completed": True,
                    "batch_number": 0,
                    "subtopics_processed": len(all_subtopics),
                    "subtopics_generated": 0,
                    "subtopics_failed": 0,
                    "total_subtopics": len(all_subtopics),
                    "has_more_batches": False,
                    "message": "All subtopics completed"
                }

            # Determine batch range
            if start_from is None:
                start_from = 0
            
            end_index = min(start_from + batch_size, len(unprocessed))
            batch_subtopics = unprocessed[start_from:end_index]
            
            logger.info(f"Processing batch: {start_from} to {end_index-1} ({len(batch_subtopics)} subtopics)")
            
            # Process batch
            processed_count = 0
            failed_count = 0
            generated_count = 0
            
            for i, subtopic in enumerate(batch_subtopics):
                global_index = start_from + i
                logger.info(f"Processing subtopic {global_index+1}/{len(unprocessed)}: {subtopic['title']}")
                logger.info(f"From: {subtopic['roadmap_title']} -> {subtopic['module_title']} -> {subtopic['topic_title']}")
                
                success, was_generated = await self.generate_subtopic_content(subtopic)
                if success:
                    processed_count += 1
                    if was_generated:
                        generated_count += 1
                        logger.info(f"✅ Successfully generated ({global_index+1}/{len(unprocessed)}): {subtopic['title']}")
                    else:
                        logger.info(f"⏭️ Skipped existing content ({global_index+1}/{len(unprocessed)}): {subtopic['title']}")
                else:
                    failed_count += 1
                    logger.error(f"❌ Failed to generate ({global_index+1}/{len(unprocessed)}): {subtopic['title']}")
                
                # Add delay only if we generated new content and there are more items in this batch
                if was_generated and i < len(batch_subtopics) - 1:
                    logger.info("Waiting 30 seconds before next generation...")
                    await asyncio.sleep(GENERATION_INTERVAL)  # 30 seconds

            # Calculate next batch info
            next_batch_start = end_index
            has_more_batches = next_batch_start < len(unprocessed)
            batch_number = (start_from // batch_size) + 1
            
            logger.info(f"Batch {batch_number} completed! Processed: {processed_count}, Generated: {generated_count}, Failed: {failed_count}")
            
            return {
                "batch_completed": True,
                "batch_number": batch_number,
                "subtopics_processed": processed_count,
                "subtopics_generated": generated_count,
                "subtopics_failed": failed_count,
                "processed_count": len(self.processed_subtopics),
                "failed_count": len(self.failed_subtopics),
                "total_subtopics": len(all_subtopics),
                "next_batch_start": next_batch_start if has_more_batches else None,
                "has_more_batches": has_more_batches,
                "remaining_subtopics": len(unprocessed) - end_index
            }
            
        except Exception as e:
            logger.error(f"Error in batch generation: {e}")
            import traceback
            traceback.print_exc()
            return {
                "batch_completed": False,
                "batch_number": 0,
                "subtopics_processed": 0,
                "subtopics_generated": 0,
                "subtopics_failed": 0,
                "has_more_batches": False,
                "error": str(e)
            }

async def main():
    """Entry point"""
    generator = SubtopicGenerator()
    await generator.run()

if __name__ == "__main__":
    asyncio.run(main())