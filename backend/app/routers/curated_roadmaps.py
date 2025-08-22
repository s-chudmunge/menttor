from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlmodel import Session, select, desc, func, and_, or_
from database.session import get_db
from schemas import (
    CuratedRoadmapResponse, CuratedRoadmapListResponse, 
    CuratedRoadmapSearchRequest, CuratedRoadmapAdoptRequest, 
    CuratedRoadmapAdoptResponse, CuratedRoadmapCategoriesResponse,
    RoadmapResponse
)
from sql_models import CuratedRoadmap, UserCuratedRoadmap, Roadmap, User
from .optional_auth import get_optional_current_user
from .auth import get_current_user
from typing import List, Optional, Dict
import uuid
from datetime import datetime

router = APIRouter(prefix="/curated-roadmaps", tags=["curated-roadmaps"])

@router.get("/", response_model=List[CuratedRoadmapListResponse])
def browse_curated_roadmaps(
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(12, ge=1, le=50, description="Items per page"),
    category: Optional[str] = Query(None, description="Filter by category"),
    subcategory: Optional[str] = Query(None, description="Filter by subcategory"), 
    difficulty: Optional[str] = Query(None, description="Filter by difficulty"),
    featured_only: bool = Query(False, description="Show only featured roadmaps"),
    verified_only: bool = Query(False, description="Show only verified roadmaps"),
    sort_by: str = Query("popularity", description="Sort by: popularity, rating, recent, alphabetical"),
    search: Optional[str] = Query(None, description="Search query"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """
    Browse curated roadmaps with filtering and pagination.
    Public endpoint - no authentication required.
    """
    query = select(CuratedRoadmap)
    
    # Apply filters
    filters = []
    if category:
        filters.append(CuratedRoadmap.category == category)
    if subcategory:
        filters.append(CuratedRoadmap.subcategory == subcategory)
    if difficulty:
        filters.append(CuratedRoadmap.difficulty == difficulty)
    if featured_only:
        filters.append(CuratedRoadmap.is_featured == True)
    if verified_only:
        filters.append(CuratedRoadmap.is_verified == True)
    if search:
        search_filter = or_(
            CuratedRoadmap.title.icontains(search),
            CuratedRoadmap.description.icontains(search),
            func.array_to_string(CuratedRoadmap.tags, ' ').icontains(search)
        )
        filters.append(search_filter)
    
    if filters:
        query = query.where(and_(*filters))
    
    # Apply sorting
    if sort_by == "popularity":
        query = query.order_by(desc(CuratedRoadmap.adoption_count), desc(CuratedRoadmap.view_count))
    elif sort_by == "rating":
        query = query.order_by(desc(CuratedRoadmap.average_rating), desc(CuratedRoadmap.adoption_count))
    elif sort_by == "recent":
        query = query.order_by(desc(CuratedRoadmap.created_at))
    elif sort_by == "alphabetical":
        query = query.order_by(CuratedRoadmap.title)
    
    # Apply pagination
    offset = (page - 1) * per_page
    query = query.offset(offset).limit(per_page)
    
    roadmaps = db.exec(query).all()
    
    # Convert to response format (excluding full roadmap_plan for list view)
    return [
        CuratedRoadmapListResponse(
            id=roadmap.id,
            title=roadmap.title,
            description=roadmap.description,
            category=roadmap.category,
            subcategory=roadmap.subcategory,
            difficulty=roadmap.difficulty,
            is_featured=roadmap.is_featured,
            is_verified=roadmap.is_verified,
            view_count=roadmap.view_count,
            adoption_count=roadmap.adoption_count,
            average_rating=roadmap.average_rating,
            estimated_hours=roadmap.estimated_hours,
            tags=roadmap.tags,
            target_audience=roadmap.target_audience,
            slug=roadmap.slug
        ) for roadmap in roadmaps
    ]

@router.get("/{roadmap_id}", response_model=CuratedRoadmapResponse)
def get_curated_roadmap(
    roadmap_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """
    Get detailed curated roadmap by ID.
    Public endpoint - increments view count.
    """
    roadmap = db.exec(select(CuratedRoadmap).where(CuratedRoadmap.id == roadmap_id)).first()
    
    if not roadmap:
        raise HTTPException(status_code=404, detail="Curated roadmap not found")
    
    # Increment view count (anonymous views are still valuable)
    roadmap.view_count += 1
    db.add(roadmap)
    db.commit()
    db.refresh(roadmap)
    
    return CuratedRoadmapResponse(
        id=roadmap.id,
        title=roadmap.title,
        description=roadmap.description,
        category=roadmap.category,
        subcategory=roadmap.subcategory,
        difficulty=roadmap.difficulty,
        is_featured=roadmap.is_featured,
        is_verified=roadmap.is_verified,
        view_count=roadmap.view_count,
        adoption_count=roadmap.adoption_count,
        average_rating=roadmap.average_rating,
        roadmap_plan=roadmap.roadmap_plan,
        estimated_hours=roadmap.estimated_hours,
        prerequisites=roadmap.prerequisites,
        learning_outcomes=roadmap.learning_outcomes,
        tags=roadmap.tags,
        target_audience=roadmap.target_audience,
        slug=roadmap.slug,
        created_at=roadmap.created_at,
        updated_at=roadmap.updated_at
    )

@router.get("/slug/{slug}", response_model=CuratedRoadmapResponse)
def get_curated_roadmap_by_slug(
    slug: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """
    Get curated roadmap by SEO-friendly slug.
    Public endpoint for better URLs.
    """
    roadmap = db.exec(select(CuratedRoadmap).where(CuratedRoadmap.slug == slug)).first()
    
    if not roadmap:
        raise HTTPException(status_code=404, detail="Curated roadmap not found")
    
    # Increment view count
    roadmap.view_count += 1
    db.add(roadmap)
    db.commit()
    db.refresh(roadmap)
    
    return CuratedRoadmapResponse(
        id=roadmap.id,
        title=roadmap.title,
        description=roadmap.description,
        category=roadmap.category,
        subcategory=roadmap.subcategory,
        difficulty=roadmap.difficulty,
        is_featured=roadmap.is_featured,
        is_verified=roadmap.is_verified,
        view_count=roadmap.view_count,
        adoption_count=roadmap.adoption_count,
        average_rating=roadmap.average_rating,
        roadmap_plan=roadmap.roadmap_plan,
        estimated_hours=roadmap.estimated_hours,
        prerequisites=roadmap.prerequisites,
        learning_outcomes=roadmap.learning_outcomes,
        tags=roadmap.tags,
        target_audience=roadmap.target_audience,
        slug=roadmap.slug,
        created_at=roadmap.created_at,
        updated_at=roadmap.updated_at
    )

@router.get("/categories/all", response_model=CuratedRoadmapCategoriesResponse)
def get_curated_roadmap_categories(db: Session = Depends(get_db)):
    """
    Get all available categories and subcategories.
    Public endpoint for filtering UI.
    """
    # Query distinct categories and subcategories
    categories_query = db.exec(
        select(CuratedRoadmap.category, CuratedRoadmap.subcategory)
        .distinct()
    ).all()
    
    # Organize into nested structure
    categories = {}
    for category, subcategory in categories_query:
        if category not in categories:
            categories[category] = []
        if subcategory and subcategory not in categories[category]:
            categories[category].append(subcategory)
    
    # Sort for consistent ordering
    for category in categories:
        categories[category].sort()
    
    return CuratedRoadmapCategoriesResponse(categories=categories)

@router.post("/{roadmap_id}/adopt", response_model=CuratedRoadmapAdoptResponse)
def adopt_curated_roadmap(
    roadmap_id: int,
    adopt_request: CuratedRoadmapAdoptRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Adopt a curated roadmap to user's personal collection.
    Requires authentication.
    """
    # Verify curated roadmap exists
    curated_roadmap = db.exec(
        select(CuratedRoadmap).where(CuratedRoadmap.id == roadmap_id)
    ).first()
    
    if not curated_roadmap:
        raise HTTPException(status_code=404, detail="Curated roadmap not found")
    
    # Check if user already adopted this roadmap
    existing_adoption = db.exec(
        select(UserCuratedRoadmap).where(
            and_(
                UserCuratedRoadmap.user_id == current_user.id,
                UserCuratedRoadmap.curated_roadmap_id == roadmap_id
            )
        )
    ).first()
    
    if existing_adoption:
        raise HTTPException(
            status_code=409, 
            detail="You have already adopted this roadmap"
        )
    
    # Create personal copy of the roadmap
    personal_title = adopt_request.customize_title or curated_roadmap.title
    personal_roadmap = Roadmap(
        user_id=current_user.id,
        title=personal_title,
        description=curated_roadmap.description,
        roadmap_plan=curated_roadmap.roadmap_plan,
        subject=curated_roadmap.category,  # Map category to subject
        goal=f"Learning {curated_roadmap.title}",
        time_value=curated_roadmap.estimated_hours // 10 if curated_roadmap.estimated_hours else 4,  # Rough conversion
        time_unit="weeks",
        model="curated"  # Mark as adopted from curated
    )
    
    db.add(personal_roadmap)
    db.commit()
    db.refresh(personal_roadmap)
    
    # Record the adoption
    user_adoption = UserCuratedRoadmap(
        user_id=current_user.id,
        curated_roadmap_id=roadmap_id,
        personal_roadmap_id=personal_roadmap.id
    )
    
    db.add(user_adoption)
    
    # Update curated roadmap adoption count
    curated_roadmap.adoption_count += 1
    db.add(curated_roadmap)
    
    db.commit()
    db.refresh(user_adoption)
    
    return CuratedRoadmapAdoptResponse(
        success=True,
        message="Successfully adopted roadmap to your personal collection!",
        personal_roadmap_id=personal_roadmap.id,
        adoption_id=user_adoption.id
    )

@router.get("/featured/latest", response_model=List[CuratedRoadmapListResponse])
def get_featured_roadmaps(
    limit: int = Query(6, ge=1, le=20, description="Number of featured roadmaps to return"),
    db: Session = Depends(get_db)
):
    """
    Get latest featured roadmaps for homepage display.
    Public endpoint.
    """
    query = select(CuratedRoadmap).where(
        CuratedRoadmap.is_featured == True
    ).order_by(
        desc(CuratedRoadmap.quality_score),
        desc(CuratedRoadmap.adoption_count)
    ).limit(limit)
    
    roadmaps = db.exec(query).all()
    
    return [
        CuratedRoadmapListResponse(
            id=roadmap.id,
            title=roadmap.title,
            description=roadmap.description,
            category=roadmap.category,
            subcategory=roadmap.subcategory,
            difficulty=roadmap.difficulty,
            is_featured=roadmap.is_featured,
            is_verified=roadmap.is_verified,
            view_count=roadmap.view_count,
            adoption_count=roadmap.adoption_count,
            average_rating=roadmap.average_rating,
            estimated_hours=roadmap.estimated_hours,
            tags=roadmap.tags,
            target_audience=roadmap.target_audience,
            slug=roadmap.slug
        ) for roadmap in roadmaps
    ]

@router.get("/user/adopted", response_model=List[RoadmapResponse])
def get_user_adopted_roadmaps(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get user's adopted curated roadmaps (their personal copies).
    Requires authentication.
    """
    # Get user's adopted roadmaps through the tracking table
    adopted_query = db.exec(
        select(UserCuratedRoadmap, Roadmap)
        .join(Roadmap, UserCuratedRoadmap.personal_roadmap_id == Roadmap.id)
        .where(UserCuratedRoadmap.user_id == current_user.id)
        .order_by(desc(UserCuratedRoadmap.adopted_at))
    ).all()
    
    return [
        RoadmapResponse(
            id=roadmap.id,
            user_id=roadmap.user_id,
            title=roadmap.title,
            description=roadmap.description,
            roadmap_plan=roadmap.roadmap_plan,
            subject=roadmap.subject,
            goal=roadmap.goal,
            time_value=roadmap.time_value,
            time_unit=roadmap.time_unit,
            model=roadmap.model
        ) for _, roadmap in adopted_query
    ]

@router.post("/{roadmap_id}/rate")
def rate_curated_roadmap(
    roadmap_id: int,
    rating: int = Query(..., ge=1, le=5, description="Rating from 1 to 5 stars"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Rate a curated roadmap (1-5 stars).
    Requires authentication and prior adoption.
    """
    # Verify user has adopted this roadmap
    adoption = db.exec(
        select(UserCuratedRoadmap).where(
            and_(
                UserCuratedRoadmap.user_id == current_user.id,
                UserCuratedRoadmap.curated_roadmap_id == roadmap_id
            )
        )
    ).first()
    
    if not adoption:
        raise HTTPException(
            status_code=403, 
            detail="You must adopt this roadmap before rating it"
        )
    
    # Update user's rating
    old_rating = adoption.user_rating
    adoption.user_rating = rating
    db.add(adoption)
    
    # Update curated roadmap's average rating
    curated_roadmap = db.exec(
        select(CuratedRoadmap).where(CuratedRoadmap.id == roadmap_id)
    ).first()
    
    if curated_roadmap:
        # Recalculate average rating
        all_ratings = db.exec(
            select(UserCuratedRoadmap.user_rating)
            .where(
                and_(
                    UserCuratedRoadmap.curated_roadmap_id == roadmap_id,
                    UserCuratedRoadmap.user_rating.is_not(None)
                )
            )
        ).all()
        
        if all_ratings:
            curated_roadmap.average_rating = sum(all_ratings) / len(all_ratings)
        else:
            curated_roadmap.average_rating = 0.0
            
        db.add(curated_roadmap)
    
    db.commit()
    
    return {"success": True, "message": "Rating updated successfully", "new_rating": rating}