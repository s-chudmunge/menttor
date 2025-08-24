from fastapi import APIRouter, Depends, HTTPException, status, Query, Form
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from sqlmodel import Session, select, desc, func, and_, or_
from database.session import get_db
from schemas import (
    CuratedRoadmapResponse, CuratedRoadmapListResponse, 
    CuratedRoadmapAdoptRequest, CuratedRoadmapAdoptResponse, 
    CuratedRoadmapCategoriesResponse, RoadmapResponse, RoadmapCreateRequest
)
from sql_models import CuratedRoadmap, UserCuratedRoadmap, Roadmap, User
from .optional_auth import get_optional_current_user
from .auth import get_current_user
from services.ai_service import generate_roadmap_content
from typing import List, Optional, Dict
import secrets
import logging
import re
from datetime import datetime

router = APIRouter(prefix="/curated-roadmaps", tags=["curated-roadmaps"])
security = HTTPBasic()
logger = logging.getLogger(__name__)

# Admin credentials
ADMIN_USERNAME = "mountain_snatcher"
ADMIN_PASSWORD = "tyson2012"

def create_slug(title: str) -> str:
    """Create URL-friendly slug from title"""
    slug = title.lower()
    slug = re.sub(r'[^\w\s-]', '', slug)  # Remove special chars
    slug = re.sub(r'[\s_-]+', '-', slug)  # Replace spaces with hyphens
    slug = slug.strip('-')  # Remove leading/trailing hyphens
    return slug

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

# ==============================================================================
# TRENDING ROADMAPS CONFIGURATION
# ==============================================================================

TRENDING_ROADMAPS_CONFIG = [
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
        "title": "Generative AI and Large Language Models",
        "category": "artificial-intelligence",
        "subcategory": "generative-ai",
        "difficulty": "intermediate",
        "target_audience": "Developers wanting to build AI-powered applications with LLMs",
        "estimated_hours": 120,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.6,
        "prerequisites": ["Python programming", "Basic machine learning", "API development"],
        "learning_outcomes": [
            "Build applications with OpenAI GPT and Claude APIs",
            "Master prompt engineering and fine-tuning techniques",
            "Implement RAG (Retrieval Augmented Generation) systems",
            "Deploy LLM applications at scale",
            "Handle AI safety and ethical considerations"
        ],
        "tags": ["llm", "gpt", "claude", "prompt-engineering", "rag", "ai-safety"],
        "request": {
            "subject": "Generative AI and Large Language Model Development",
            "goal": "I want to master building applications with LLMs like GPT and Claude. Teach me prompt engineering, fine-tuning, RAG systems, vector databases, AI safety, and deploying LLM applications. Include practical projects and ethical considerations.",
            "time_value": 10,
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
    }
]

# ==============================================================================
# ADMIN ENDPOINTS
# ==============================================================================

@router.get("/admin/trending-list")
def get_trending_roadmaps_list(admin: str = Depends(verify_admin)):
    """Get list of available trending roadmaps for admin selection"""
    return {
        "total_available": len(TRENDING_ROADMAPS_CONFIG),
        "roadmaps": [
            {
                "title": config["title"],
                "category": config["category"],
                "subcategory": config["subcategory"],
                "difficulty": config["difficulty"],
                "estimated_hours": config["estimated_hours"],
                "target_audience": config["target_audience"]
            }
            for config in TRENDING_ROADMAPS_CONFIG
        ]
    }

@router.post("/admin/generate/{roadmap_index}")
async def generate_curated_roadmap(
    roadmap_index: int,
    db: Session = Depends(get_db),
    admin: str = Depends(verify_admin)
):
    """Generate and save a curated roadmap by index"""
    
    if roadmap_index < 0 or roadmap_index >= len(TRENDING_ROADMAPS_CONFIG):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid roadmap index. Must be between 0 and {len(TRENDING_ROADMAPS_CONFIG) - 1}"
        )
    
    config = TRENDING_ROADMAPS_CONFIG[roadmap_index]
    
    # Check if already exists
    existing = db.exec(
        select(CuratedRoadmap).where(CuratedRoadmap.title == config["title"])
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=409,
            detail=f"Roadmap '{config['title']}' already exists in database"
        )
    
    try:
        logger.info(f"🎯 Admin {admin} generating: {config['title']}")
        
        # Create AI request
        request = RoadmapCreateRequest(**config['request'])
        
        # Generate content using AI service
        ai_response = await generate_roadmap_content(request)
        
        # Create curated roadmap
        curated_roadmap = CuratedRoadmap(
            title=config['title'],
            description=ai_response.description,
            category=config['category'],
            subcategory=config.get('subcategory'),
            difficulty=config['difficulty'],
            is_featured=config['is_featured'],
            is_verified=config['is_verified'], 
            quality_score=config['quality_score'],
            view_count=0,
            adoption_count=0,
            completion_rate=0.0,
            average_rating=0.0,
            roadmap_plan=ai_response.roadmap_plan.model_dump()["modules"],
            estimated_hours=config['estimated_hours'],
            prerequisites=config['prerequisites'],
            learning_outcomes=config['learning_outcomes'],
            tags=config['tags'],
            target_audience=config['target_audience'],
            slug=create_slug(config['title']),
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        # Save to database
        db.add(curated_roadmap)
        db.commit()
        db.refresh(curated_roadmap)
        
        logger.info(f"✅ Successfully generated and saved: {config['title']} (ID: {curated_roadmap.id})")
        
        return {
            "success": True,
            "message": f"Successfully generated '{config['title']}'",
            "roadmap_id": curated_roadmap.id,
            "slug": curated_roadmap.slug
        }
        
    except Exception as e:
        logger.error(f"❌ Failed to generate {config['title']}: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate roadmap: {str(e)}"
        )

@router.get("/admin/status")
def get_admin_status(db: Session = Depends(get_db), admin: str = Depends(verify_admin)):
    """Get status of generated vs available roadmaps"""
    
    # Get existing roadmap titles
    existing_titles = set(db.exec(select(CuratedRoadmap.title)).all())
    total_existing = len(existing_titles)
    total_available = len(TRENDING_ROADMAPS_CONFIG)
    
    # Check which ones exist
    generated_status = []
    for i, config in enumerate(TRENDING_ROADMAPS_CONFIG):
        generated_status.append({
            "index": i,
            "title": config["title"],
            "category": config["category"],
            "generated": config["title"] in existing_titles
        })
    
    return {
        "total_available": total_available,
        "total_generated": total_existing,
        "remaining": total_available - total_existing,
        "roadmaps": generated_status
    }

@router.delete("/admin/clear-all")
def clear_all_curated_roadmaps(db: Session = Depends(get_db), admin: str = Depends(verify_admin)):
    """Delete ALL curated roadmaps from database - DANGER ZONE"""
    
    try:
        # Get count before deletion
        count_before = db.exec(select(func.count(CuratedRoadmap.id))).first()
        
        # Delete all UserCuratedRoadmap associations first (foreign key constraint)
        user_adoptions = db.exec(select(UserCuratedRoadmap)).all()
        for adoption in user_adoptions:
            db.delete(adoption)
        
        # Delete all curated roadmaps
        roadmaps = db.exec(select(CuratedRoadmap)).all()
        for roadmap in roadmaps:
            db.delete(roadmap)
        
        db.commit()
        
        logger.info(f"🗑️ Admin {admin} cleared ALL curated roadmaps: {count_before} deleted")
        
        return {
            "success": True,
            "message": f"Successfully deleted {count_before} curated roadmaps",
            "deleted_count": count_before
        }
        
    except Exception as e:
        logger.error(f"❌ Failed to clear roadmaps: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to clear roadmaps: {str(e)}"
        )

@router.delete("/admin/delete/{roadmap_id}")
def delete_single_curated_roadmap(
    roadmap_id: int, 
    db: Session = Depends(get_db), 
    admin: str = Depends(verify_admin)
):
    """Delete a single curated roadmap by ID"""
    
    # Find the roadmap
    roadmap = db.exec(select(CuratedRoadmap).where(CuratedRoadmap.id == roadmap_id)).first()
    
    if not roadmap:
        raise HTTPException(status_code=404, detail="Roadmap not found")
    
    try:
        # Delete associated user adoptions first
        adoptions = db.exec(
            select(UserCuratedRoadmap).where(UserCuratedRoadmap.curated_roadmap_id == roadmap_id)
        ).all()
        
        for adoption in adoptions:
            db.delete(adoption)
        
        # Delete the roadmap
        roadmap_title = roadmap.title
        db.delete(roadmap)
        db.commit()
        
        logger.info(f"🗑️ Admin {admin} deleted roadmap: {roadmap_title} (ID: {roadmap_id})")
        
        return {
            "success": True,
            "message": f"Successfully deleted '{roadmap_title}'",
            "deleted_id": roadmap_id
        }
        
    except Exception as e:
        logger.error(f"❌ Failed to delete roadmap {roadmap_id}: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete roadmap: {str(e)}"
        )

# ==============================================================================
# PUBLIC ENDPOINTS FOR USERS
# ==============================================================================

@router.get("/", response_model=List[CuratedRoadmapListResponse])
def browse_curated_roadmaps(
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(12, ge=1, le=50, description="Items per page"),
    category: Optional[str] = Query(None, description="Filter by category"),
    subcategory: Optional[str] = Query(None, description="Filter by subcategory"), 
    difficulty: Optional[str] = Query(None, description="Filter by difficulty"),
    featured_only: bool = Query(False, description="Show only featured roadmaps"),
    search: Optional[str] = Query(None, description="Search query"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """Browse curated roadmaps - public endpoint"""
    
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
    if search:
        search_filter = or_(
            CuratedRoadmap.title.icontains(search),
            CuratedRoadmap.description.icontains(search)
        )
        filters.append(search_filter)
    
    if filters:
        query = query.where(and_(*filters))
    
    # Apply sorting by quality score and popularity
    query = query.order_by(desc(CuratedRoadmap.quality_score), desc(CuratedRoadmap.adoption_count))
    
    # Apply pagination
    offset = (page - 1) * per_page
    query = query.offset(offset).limit(per_page)
    
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

@router.get("/{roadmap_id}", response_model=CuratedRoadmapResponse)
def get_curated_roadmap(
    roadmap_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """Get detailed curated roadmap by ID - public endpoint"""
    
    roadmap = db.exec(select(CuratedRoadmap).where(CuratedRoadmap.id == roadmap_id)).first()
    
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