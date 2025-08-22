from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from sqlmodel import Session, select, desc, func, and_, or_
from database.session import get_db
from schemas import (
    CuratedRoadmapResponse, CuratedRoadmapListResponse, 
    CuratedRoadmapSearchRequest, CuratedRoadmapAdoptRequest, 
    CuratedRoadmapAdoptResponse, CuratedRoadmapCategoriesResponse,
    RoadmapResponse, RoadmapCreateRequest
)
from sql_models import CuratedRoadmap, UserCuratedRoadmap, Roadmap, User
from .optional_auth import get_optional_current_user
from .auth import get_current_user
from services.ai_service import generate_roadmap_content
from typing import List, Optional, Dict
import uuid
import logging
import asyncio
import re
from datetime import datetime

router = APIRouter(prefix="/curated-roadmaps", tags=["curated-roadmaps"])

logger = logging.getLogger(__name__)

def create_slug(title: str) -> str:
    """Create URL-friendly slug from title"""
    slug = title.lower()
    slug = re.sub(r'[^\w\s-]', '', slug)  # Remove special chars
    slug = re.sub(r'[\s_-]+', '-', slug)  # Replace spaces with hyphens
    slug = slug.strip('-')  # Remove leading/trailing hyphens
    return slug

# Premium curated roadmaps configuration
PREMIUM_ROADMAPS_CONFIG = [
    {
        "title": "Complete React Development with TypeScript",
        "category": "web-development", 
        "subcategory": "frontend",
        "difficulty": "intermediate",
        "target_audience": "Frontend developers wanting to master modern React with TypeScript",
        "estimated_hours": 100,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.5,
        "prerequisites": ["JavaScript ES6+", "HTML/CSS fundamentals", "Basic React knowledge"],
        "learning_outcomes": [
            "Build scalable React applications with TypeScript",
            "Master React hooks and advanced patterns", 
            "Implement state management with Context API and Redux Toolkit",
            "Create reusable UI component libraries",
            "Test React applications with Jest and React Testing Library"
        ],
        "tags": ["react", "typescript", "frontend", "javascript", "hooks", "testing"],
        "request": {
            "subject": "Modern React Development with TypeScript",
            "goal": "I want to become an expert in building modern, scalable React applications using TypeScript. Teach me advanced React patterns, hooks, state management, component architecture, testing strategies, and performance optimization. Focus on industry best practices and real-world project development.",
            "time_value": 8,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "Python Data Science and Machine Learning",
        "category": "data-science",
        "subcategory": "machine-learning",
        "difficulty": "beginner",
        "target_audience": "Beginners wanting to start a career in data science and AI",
        "estimated_hours": 140,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.6,
        "prerequisites": ["Basic Python programming", "High school mathematics"],
        "learning_outcomes": [
            "Master NumPy, Pandas, and data manipulation",
            "Build machine learning models with scikit-learn",
            "Create data visualizations with Matplotlib and Seaborn",
            "Understand statistics and feature engineering",
            "Deploy ML models to production"
        ],
        "tags": ["python", "data-science", "machine-learning", "pandas", "scikit-learn", "visualization"],
        "request": {
            "subject": "Python Data Science and Machine Learning",
            "goal": "I want to become proficient in data science and machine learning using Python. Start from data manipulation basics and progress to building, evaluating, and deploying ML models. Include hands-on projects with real datasets, statistical concepts, and industry best practices.",
            "time_value": 12,
            "time_unit": "weeks", 
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "AWS Cloud Solutions Architect",
        "category": "cloud-computing",
        "subcategory": "aws",
        "difficulty": "intermediate",
        "target_audience": "IT professionals preparing for AWS certification and cloud careers",
        "estimated_hours": 160,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.3,
        "prerequisites": ["Basic networking", "Linux fundamentals", "General IT experience"],
        "learning_outcomes": [
            "Design scalable and secure AWS architectures",
            "Master core AWS services (EC2, S3, RDS, Lambda)",
            "Implement CI/CD pipelines and DevOps practices",
            "Pass AWS Solutions Architect Associate exam",
            "Optimize costs and monitor cloud infrastructure"
        ],
        "tags": ["aws", "cloud-computing", "architecture", "certification", "devops", "security"],
        "request": {
            "subject": "AWS Cloud Solutions Architect",
            "goal": "I want to become an AWS Solutions Architect and pass the certification exam. Teach me to design resilient, scalable, and cost-effective cloud architectures. Cover core services, security best practices, monitoring, and real-world implementation scenarios.",
            "time_value": 12,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "Node.js Backend Development with Express",
        "category": "web-development",
        "subcategory": "backend", 
        "difficulty": "beginner",
        "target_audience": "JavaScript developers transitioning to backend development",
        "estimated_hours": 90,
        "is_featured": False,
        "is_verified": True,
        "quality_score": 9.1,
        "prerequisites": ["JavaScript fundamentals", "Basic understanding of web concepts"],
        "learning_outcomes": [
            "Build REST APIs and GraphQL endpoints",
            "Implement authentication and authorization",
            "Work with databases (MongoDB and PostgreSQL)",
            "Handle file uploads and third-party integrations", 
            "Deploy and monitor Node.js applications"
        ],
        "tags": ["nodejs", "express", "backend", "api", "javascript", "databases"],
        "request": {
            "subject": "Node.js Backend Development",
            "goal": "I want to master backend development with Node.js and Express. Teach me to build secure, scalable APIs, work with databases, implement authentication, handle real-time communication, and deploy production applications. Focus on modern best practices.",
            "time_value": 8,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    },
    {
        "title": "Algorithms and Data Structures for Coding Interviews",
        "category": "computer-science",
        "subcategory": "algorithms", 
        "difficulty": "intermediate",
        "target_audience": "Software engineers preparing for technical interviews at top tech companies",
        "estimated_hours": 130,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.7,
        "prerequisites": ["Programming experience in Python/Java/C++", "Basic problem-solving skills"],
        "learning_outcomes": [
            "Master fundamental data structures and algorithms",
            "Solve complex coding problems efficiently",
            "Understand time and space complexity analysis",
            "Excel in technical interviews at FAANG companies",
            "Practice 150+ LeetCode-style problems with solutions"
        ],
        "tags": ["algorithms", "data-structures", "interviews", "leetcode", "problem-solving", "faang"],
        "request": {
            "subject": "Algorithms and Data Structures for Technical Interviews",
            "goal": "I want to excel in coding interviews at top tech companies like Google, Meta, Amazon, and Apple. Teach me essential algorithms, data structures, problem-solving patterns, and interview strategies. Include extensive practice with explanations and optimization techniques.",
            "time_value": 10,
            "time_unit": "weeks",
            "model": "vertexai:gemini-2.5-flash"
        }
    }
]

async def generate_curated_roadmap(roadmap_config: dict) -> CuratedRoadmap:
    """Generate a single curated roadmap using AI"""
    logger.info(f"🎯 Generating: {roadmap_config['title']}")
    
    # Create AI request
    request = RoadmapCreateRequest(**roadmap_config['request'])
    
    # Generate content using AI service
    ai_response = await generate_roadmap_content(request)
    
    # Create curated roadmap
    curated_roadmap = CuratedRoadmap(
        title=roadmap_config['title'],
        description=ai_response.description,
        category=roadmap_config['category'],
        subcategory=roadmap_config.get('subcategory'),
        difficulty=roadmap_config['difficulty'],
        is_featured=roadmap_config['is_featured'],
        is_verified=roadmap_config['is_verified'], 
        quality_score=roadmap_config['quality_score'],
        view_count=0,
        adoption_count=0,
        completion_rate=0.0,
        average_rating=0.0,
        roadmap_plan=ai_response.roadmap_plan.model_dump()["modules"],
        estimated_hours=roadmap_config['estimated_hours'],
        prerequisites=roadmap_config['prerequisites'],
        learning_outcomes=roadmap_config['learning_outcomes'],
        tags=roadmap_config['tags'],
        target_audience=roadmap_config['target_audience'],
        slug=create_slug(roadmap_config['title']),
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    return curated_roadmap

async def generate_all_curated_roadmaps_background(db: Session):
    """Background task to generate all curated roadmaps"""
    try:
        logger.info("🚀 Starting background generation of curated roadmaps...")
        generated_roadmaps = []
        
        for config in PREMIUM_ROADMAPS_CONFIG:
            try:
                roadmap = await generate_curated_roadmap(config)
                generated_roadmaps.append(roadmap)
                logger.info(f"✅ Generated: {config['title']}")
                # Small delay to avoid API limits
                await asyncio.sleep(2)
            except Exception as e:
                logger.error(f"❌ Failed to generate {config['title']}: {e}")
                continue
        
        # Save all generated roadmaps
        if generated_roadmaps:
            for roadmap in generated_roadmaps:
                db.add(roadmap)
            db.commit()
            logger.info(f"💾 Saved {len(generated_roadmaps)} curated roadmaps to database!")
        
    except Exception as e:
        logger.error(f"💥 Background roadmap generation failed: {e}")
        db.rollback()

@router.get("/", response_model=List[CuratedRoadmapListResponse])
async def browse_curated_roadmaps(
    background_tasks: BackgroundTasks,
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
    Auto-generates roadmaps if database is empty (first-time visit).
    """
    
    # Check if curated roadmaps exist - if not, generate them in background
    existing_count = db.exec(select(func.count(CuratedRoadmap.id))).first()
    if existing_count == 0:
        logger.info("🎯 No curated roadmaps found. Starting background generation...")
        # Start generation in background - don't wait for completion
        background_tasks.add_task(generate_all_curated_roadmaps_background, db)
        # Return empty array for now - roadmaps will be available after generation completes
        return []
    
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
            CuratedRoadmap.description.icontains(search)
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