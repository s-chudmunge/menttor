from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from typing import Any, Dict, List, Optional
import json
import os
import logging
from pathlib import Path
from datetime import datetime
from sqlmodel import Session, select
import json

from schemas import LearningContentRequest
from services.ai_service import ai_executor
from services.ai_service import LearningContentResponse
from sql_models import LibraryContent
from database.session import get_db
from database.redis_client import get_redis_client

router = APIRouter(prefix="/library", tags=["library"])
logger = logging.getLogger(__name__)

CACHE_TTL = 3600  # 1 hour cache

# RegeneratePageRequest removed - library pages are now static

def load_content_from_db(slug: str, db: Session) -> Dict[str, Any]:
    """Load content from database with Redis caching"""
    cache_key = f"library_content:{slug}"

    # Try to get from cache first
    try:
        with get_redis_client() as redis_client:
            if redis_client:  # Check if Redis is available
                cached_data = redis_client.get(cache_key)
                if cached_data:
                    logger.info(f"Cache hit for library content: {slug}")
                    return json.loads(cached_data)
            else:
                logger.debug(f"Redis unavailable, skipping cache read for {slug}")
    except Exception as e:
        logger.warning(f"Redis cache read failed for {slug}: {e}")
    
    # Cache miss - fetch from database
    try:
        # Try both exact match and case-insensitive match
        statement = select(LibraryContent).where(
            LibraryContent.slug == slug,
            LibraryContent.is_active == True
        )
        content_record = db.exec(statement).first()

        # If not found with exact match, try case-insensitive
        if not content_record:
            statement = select(LibraryContent).where(
                LibraryContent.slug.ilike(slug),
                LibraryContent.is_active == True
            )
            content_record = db.exec(statement).first()

        if not content_record:
            logger.warning(f"Content not found in database for slug '{slug}'")
            # Log all available slugs for debugging
            all_slugs = db.exec(select(LibraryContent.slug).where(LibraryContent.is_active == True)).all()
            logger.debug(f"Available active slugs: {all_slugs[:10]}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Content for slug '{slug}' not found"
            )
        
        # Convert database record to response format
        content_data = {
            "title": content_record.title,
            "subject": content_record.subject,
            "goal": content_record.goal,
            "lastUpdated": content_record.last_updated.isoformat() + "Z",
            "content": json.loads(content_record.content_json),
        }
        
        # Add resources if they exist
        if content_record.resources_json:
            content_data["resources"] = json.loads(content_record.resources_json)
        
        # Cache the result
        try:
            with get_redis_client() as redis_client:
                if redis_client:  # Check if Redis is available
                    redis_client.setex(cache_key, CACHE_TTL, json.dumps(content_data, default=str))
                    logger.info(f"Cached library content: {slug}")
                else:
                    logger.debug(f"Redis unavailable, skipping cache write for {slug}")
        except Exception as e:
            logger.warning(f"Redis cache write failed for {slug}: {e}")
        
        return content_data
        
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Invalid JSON stored for slug '{slug}'"
        )

def save_content_to_db(slug: str, content: Dict[str, Any], db: Session) -> None:
    """Save content to database and invalidate cache"""
    try:
        # Check if content already exists
        statement = select(LibraryContent).where(LibraryContent.slug == slug)
        existing_content = db.exec(statement).first()
        
        # Prepare JSON strings
        content_json = json.dumps(content.get("content", []))
        resources_json = None
        if content.get("resources"):
            resources_json = json.dumps(content["resources"])
        
        if existing_content:
            # Update existing content
            existing_content.title = content.get("title", slug.replace("-", " ").title())
            existing_content.subject = content.get("subject", "")
            existing_content.goal = content.get("goal", "")
            existing_content.content_json = content_json
            existing_content.resources_json = resources_json
            existing_content.last_updated = datetime.utcnow()
            
            db.add(existing_content)
        else:
            # Create new content
            new_content = LibraryContent(
                slug=slug,
                title=content.get("title", slug.replace("-", " ").title()),
                subject=content.get("subject", ""),
                goal=content.get("goal", ""),
                content_json=content_json,
                resources_json=resources_json
            )
            db.add(new_content)
        
        db.commit()
        
        # Invalidate caches
        try:
            with get_redis_client() as redis_client:
                if redis_client:  # Check if Redis is available
                    # Clear specific content cache
                    redis_client.delete(f"library_content:{slug}")
                    # Clear available content list cache
                    redis_client.delete("library_available")
                    logger.info(f"Invalidated cache for library content: {slug}")
                else:
                    logger.debug(f"Redis unavailable, skipping cache invalidation for {slug}")
        except Exception as e:
            logger.warning(f"Cache invalidation failed for {slug}: {e}")
        
        logger.info(f"Successfully saved content for slug '{slug}' to database")
        
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to save content for slug '{slug}': {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save content: {str(e)}"
        )


# Regeneration endpoint removed - library pages are now static

@router.get("/available")
async def get_available_content(db: Session = Depends(get_db)):
    """Get list of all available library content with caching"""
    cache_key = "library_available"
    
    # Try to get from cache first
    try:
        with get_redis_client() as redis_client:
            cached_data = redis_client.get(cache_key)
            if cached_data:
                logger.info("Cache hit for library available content")
                return json.loads(cached_data)
    except Exception as e:
        logger.warning(f"Redis cache read failed for available content: {e}")
    
    # Cache miss - fetch from database
    try:
        # Query all active content from database
        statement = select(LibraryContent).where(LibraryContent.is_active == True)
        content_records = db.exec(statement).all()
        
        available_items = []
        for record in content_records:
            available_items.append({
                "slug": record.slug,
                "title": record.title,
                "subject": record.subject,
                "goal": record.goal,
                "lastUpdated": record.last_updated.isoformat() + "Z"
            })
        
        # Sort by title
        available_items.sort(key=lambda x: x["title"])
        
        # Cache the result
        try:
            with get_redis_client() as redis_client:
                redis_client.setex(cache_key, CACHE_TTL, json.dumps(available_items, default=str))
                logger.info("Cached library available content")
        except Exception as e:
            logger.warning(f"Redis cache write failed for available content: {e}")
        
        return available_items
        
    except Exception as e:
        logger.error(f"Failed to get available content: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get available content: {str(e)}"
        )

@router.get("/{page_slug}/content")
async def get_content(page_slug: str, db: Session = Depends(get_db)):
    """Get the current content of any library page"""
    try:
        content_data = load_content_from_db(page_slug, db)
        return content_data
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get content for page '{page_slug}': {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get content for page '{page_slug}': {str(e)}"
        )

