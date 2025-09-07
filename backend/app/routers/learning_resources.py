"""
Learning Resources Router
Handles generation and management of external learning resources for curated roadmaps
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from sqlmodel import Session, select
from datetime import datetime
import secrets
import os

from database.session import get_db
from sql_models import RoadmapResource, CuratedRoadmap, User
from schemas import (
    GenerateResourcesRequest, GenerateResourcesResponse,
    RoadmapResourcesResponse, LearningResourceResponse, LearningResourceCreate,
    LearningResourceRequest
)
from services.ai_service import generate_learning_resources
import logging

logger = logging.getLogger(__name__)

router = APIRouter()
security = HTTPBasic()

# Admin credentials from Secret Manager
from utils.secret_manager import get_admin_credentials
ADMIN_USERNAME, ADMIN_PASSWORD = get_admin_credentials()

def verify_admin(credentials: HTTPBasicCredentials = Depends(security)):
    """Verify admin credentials"""
    is_correct_username = secrets.compare_digest(credentials.username, ADMIN_USERNAME)
    is_correct_password = secrets.compare_digest(credentials.password, ADMIN_PASSWORD)
    
    if not (is_correct_username and is_correct_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid admin credentials",
            headers={"WWW-Authenticate": "Basic"},
        )
    return credentials.username


@router.post("/generate-by-index/{roadmap_index}", response_model=GenerateResourcesResponse)
async def generate_resources_by_index(
    roadmap_index: int,
    db: Session = Depends(get_db)
):
    """Generate learning resources using roadmap index from trending list"""
    try:
        # Import here to avoid circular imports
        from routers.curated_roadmaps import TRENDING_ROADMAPS_CONFIG
        
        # Validate index
        if roadmap_index < 0 or roadmap_index >= len(TRENDING_ROADMAPS_CONFIG):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid roadmap index. Must be between 0 and {len(TRENDING_ROADMAPS_CONFIG) - 1}"
            )
        
        # Get config for this index
        config = TRENDING_ROADMAPS_CONFIG[roadmap_index]
        
        # Find the actual curated roadmap by title
        roadmap = db.exec(
            select(CuratedRoadmap).where(CuratedRoadmap.title == config["title"])
        ).first()
        
        if not roadmap:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Roadmap '{config['title']}' not found in database. Please generate the roadmap first."
            )
        
        # Create AI request
        ai_request = LearningResourceRequest(
            roadmap_id=roadmap.id,
            topic=roadmap.title,
            category=roadmap.category,
            max_resources=30
        )
        
        # Add roadmap context for better generation
        ai_request.roadmap_title = roadmap.title
        ai_request.roadmap_description = roadmap.description
        
        # Generate resources using AI
        response = await generate_learning_resources(ai_request)
        
        if not response.success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to generate resources: {response.error}"
            )
        
        logger.info(f"Generated {len(response.resources)} resources for roadmap {roadmap.id} (index {roadmap_index})")
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating resources for index {roadmap_index}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate learning resources"
        )

@router.post("/generate", response_model=GenerateResourcesResponse)
async def generate_resources_for_roadmap(
    request: GenerateResourcesRequest,
    db: Session = Depends(get_db)
):
    """Generate learning resources for a curated roadmap using AI"""
    try:
        # Get the curated roadmap
        roadmap = db.get(CuratedRoadmap, request.curated_roadmap_id)
        if not roadmap:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Curated roadmap not found"
            )
        
        # Create AI request
        ai_request = LearningResourceRequest(
            roadmap_id=roadmap.id,
            topic=roadmap.title,
            category=roadmap.category,
            max_resources=30
        )
        
        # Add roadmap context for better generation
        ai_request.roadmap_title = roadmap.title
        ai_request.roadmap_description = roadmap.description
        
        # Generate resources using AI
        response = await generate_learning_resources(ai_request)
        
        if not response.success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to generate resources: {response.error}"
            )
        
        logger.info(f"Generated {len(response.resources)} resources for roadmap {roadmap.id}")
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating resources: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate learning resources"
        )


@router.post("/save-by-index/{roadmap_index}", response_model=dict)
async def save_resources_by_index(
    roadmap_index: int,
    resources: List[LearningResourceCreate],
    db: Session = Depends(get_db)
):
    """Save learning resources using roadmap index from trending list"""
    try:
        # Import here to avoid circular imports
        from routers.curated_roadmaps import TRENDING_ROADMAPS_CONFIG
        
        # Validate index
        if roadmap_index < 0 or roadmap_index >= len(TRENDING_ROADMAPS_CONFIG):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid roadmap index. Must be between 0 and {len(TRENDING_ROADMAPS_CONFIG) - 1}"
            )
        
        # Get config for this index
        config = TRENDING_ROADMAPS_CONFIG[roadmap_index]
        
        # Find the actual curated roadmap by title
        roadmap = db.exec(
            select(CuratedRoadmap).where(CuratedRoadmap.title == config["title"])
        ).first()
        
        if not roadmap:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Roadmap '{config['title']}' not found in database"
            )
        
        saved_count = 0
        
        for resource_data in resources:
            # Update the resource to use the found roadmap ID
            resource_data.curated_roadmap_id = roadmap.id
            
            # Check if resource already exists (by URL)
            existing = db.exec(
                select(RoadmapResource).where(
                    RoadmapResource.curated_roadmap_id == roadmap.id,
                    RoadmapResource.url == resource_data.url
                )
            ).first()
            
            if not existing:
                # Create new resource
                resource = RoadmapResource(
                    curated_roadmap_id=roadmap.id,
                    title=resource_data.title,
                    url=resource_data.url,
                    type=resource_data.type,
                    description=resource_data.description,
                    is_active=True
                )
                db.add(resource)
                saved_count += 1
        
        db.commit()
        logger.info(f"Saved {saved_count} new learning resources for roadmap {roadmap.id} (index {roadmap_index})")
        
        return {"success": True, "saved_count": saved_count}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error saving resources for index {roadmap_index}: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save learning resources"
        )

@router.post("/save", response_model=dict)
async def save_generated_resources(
    resources: List[LearningResourceCreate],
    db: Session = Depends(get_db)
):
    """Save generated resources to the database (with admin auth) - force redeploy to fix 401 error"""
    try:
        saved_count = 0
        
        for resource_data in resources:
            # Check if resource already exists (by URL)
            existing = db.exec(
                select(RoadmapResource).where(
                    RoadmapResource.curated_roadmap_id == resource_data.curated_roadmap_id,
                    RoadmapResource.url == resource_data.url
                )
            ).first()
            
            if not existing:
                # Create new resource
                resource = RoadmapResource(
                    curated_roadmap_id=resource_data.curated_roadmap_id,
                    title=resource_data.title,
                    url=resource_data.url,
                    type=resource_data.type,
                    description=resource_data.description,
                    is_active=True
                )
                db.add(resource)
                saved_count += 1
        
        db.commit()
        logger.info(f"Saved {saved_count} new learning resources")
        
        return {"success": True, "saved_count": saved_count}
        
    except Exception as e:
        logger.error(f"Error saving resources: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save learning resources"
        )


@router.get("/{roadmap_id}", response_model=RoadmapResourcesResponse)
async def get_roadmap_resources(
    roadmap_id: int,
    db: Session = Depends(get_db)
):
    """Get all learning resources for a specific roadmap"""
    try:
        logger.info(f"Fetching learning resources for roadmap ID: {roadmap_id}")
        
        # Verify roadmap exists
        roadmap = db.get(CuratedRoadmap, roadmap_id)
        if not roadmap:
            logger.warning(f"Roadmap with ID {roadmap_id} not found in database")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Curated roadmap not found"
            )
        
        logger.info(f"Found roadmap: {roadmap.title} (ID: {roadmap.id})")
        
        # Get all active resources for this roadmap
        resources = db.exec(
            select(RoadmapResource).where(
                RoadmapResource.curated_roadmap_id == roadmap_id,
                RoadmapResource.is_active == True
            ).order_by(RoadmapResource.created_at)
        ).all()
        
        resource_responses = [
            LearningResourceResponse(
                id=resource.id,
                curated_roadmap_id=resource.curated_roadmap_id,
                title=resource.title,
                url=resource.url,
                type=resource.type,
                description=resource.description,
                is_active=resource.is_active,
                created_at=resource.created_at
            )
            for resource in resources
        ]
        
        return RoadmapResourcesResponse(
            resources=resource_responses,
            total_count=len(resource_responses)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching resources: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch learning resources"
        )


@router.delete("/{resource_id}")
async def delete_resource(
    resource_id: int,
    db: Session = Depends(get_db)
):
    """Delete a learning resource"""
    try:
        resource = db.get(RoadmapResource, resource_id)
        if not resource:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Learning resource not found"
            )
        
        db.delete(resource)
        db.commit()
        
        return {"success": True, "message": "Resource deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting resource: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete learning resource"
        )


@router.patch("/{resource_id}/toggle")
async def toggle_resource_status(
    resource_id: int,
    db: Session = Depends(get_db)
):
    """Toggle a learning resource's active status"""
    try:
        resource = db.get(RoadmapResource, resource_id)
        if not resource:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Learning resource not found"
            )
        
        resource.is_active = not resource.is_active
        db.add(resource)
        db.commit()
        
        return {
            "success": True, 
            "is_active": resource.is_active,
            "message": f"Resource {'activated' if resource.is_active else 'deactivated'}"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error toggling resource status: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update resource status"
        )