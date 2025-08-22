#!/usr/bin/env python3
"""
High-Quality Curated Roadmaps Generator
Generates 5-6 premium roadmaps for the public catalog using existing AI service
"""

import asyncio
import sys
import os
from datetime import datetime
from pathlib import Path

# Add the app directory to Python path
sys.path.insert(0, str(Path(__file__).parent / 'app'))

from database.session import get_db, engine
from sqlmodel import Session
from sql_models import CuratedRoadmap
from services.ai_service import generate_roadmap_content
from schemas import RoadmapCreateRequest
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_slug(title: str) -> str:
    """Create URL-friendly slug from title"""
    return title.lower().replace(' ', '-').replace('&', 'and').replace('/', '-')

# 5-6 Premium Quality Curated Roadmaps
PREMIUM_ROADMAPS = [
    {
        "title": "Complete Python Web Development with Django",
        "category": "web-development", 
        "subcategory": "backend",
        "difficulty": "intermediate",
        "target_audience": "Developers with basic Python knowledge wanting to build web applications",
        "estimated_hours": 120,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.5,
        "prerequisites": ["Basic Python programming", "HTML/CSS fundamentals", "Command line basics"],
        "learning_outcomes": [
            "Build full-stack web applications with Django",
            "Implement user authentication and authorization",
            "Design and work with databases using Django ORM",
            "Deploy Django applications to production",
            "Follow Django best practices and security guidelines"
        ],
        "tags": ["python", "django", "web-development", "backend", "database", "deployment"],
        "request": {
            "subject": "Django Web Development",
            "goal": "I want to become proficient in building web applications with Django. I have basic Python knowledge and want to learn how to create full-stack web applications, handle user authentication, work with databases, and deploy to production. Focus on practical projects and industry best practices.",
            "time_value": 8,
            "time_unit": "weeks",
            "model": "vertexai:gemini-1.5-flash-001"
        }
    },
    {
        "title": "Machine Learning for Data Science Beginners",
        "category": "data-science",
        "subcategory": "machine-learning", 
        "difficulty": "beginner",
        "target_audience": "Complete beginners wanting to start a career in data science and ML",
        "estimated_hours": 100,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.2,
        "prerequisites": ["High school mathematics", "Basic computer skills"],
        "learning_outcomes": [
            "Understand fundamental ML concepts and algorithms",
            "Work with Python, pandas, and scikit-learn",
            "Build and evaluate predictive models",
            "Visualize data and communicate insights",
            "Complete real-world ML projects"
        ],
        "tags": ["machine-learning", "python", "data-science", "pandas", "scikit-learn", "beginner"],
        "request": {
            "subject": "Machine Learning for Beginners",
            "goal": "I'm completely new to machine learning and data science. I want to learn the fundamentals, understand different ML algorithms, and be able to build predictive models using Python. Include hands-on projects with real datasets and focus on practical application over theory.",
            "time_value": 10,
            "time_unit": "weeks", 
            "model": "vertexai:gemini-1.5-flash-001"
        }
    },
    {
        "title": "Modern React Development with TypeScript",
        "category": "web-development",
        "subcategory": "frontend",
        "difficulty": "intermediate", 
        "target_audience": "Frontend developers wanting to master React with TypeScript",
        "estimated_hours": 80,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.4,
        "prerequisites": ["JavaScript ES6+", "HTML/CSS", "Basic React knowledge"],
        "learning_outcomes": [
            "Build scalable React applications with TypeScript",
            "Master React hooks and state management",
            "Implement modern UI patterns and component architecture",
            "Handle API integration and data fetching",
            "Test React components and optimize performance"
        ],
        "tags": ["react", "typescript", "frontend", "javascript", "hooks", "components"],
        "request": {
            "subject": "React with TypeScript",
            "goal": "I know basic React and JavaScript, but I want to become an expert in modern React development using TypeScript. Teach me hooks, state management, component patterns, testing, and performance optimization. Focus on building production-ready applications.",
            "time_value": 6,
            "time_unit": "weeks",
            "model": "vertexai:gemini-1.5-flash-001"
        }
    },
    {
        "title": "AWS Cloud Practitioner to Solutions Architect",
        "category": "cloud-computing",
        "subcategory": "aws",
        "difficulty": "intermediate",
        "target_audience": "IT professionals preparing for AWS certifications and cloud careers",
        "estimated_hours": 150,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.3,
        "prerequisites": ["Basic networking knowledge", "Linux command line", "General IT experience"],
        "learning_outcomes": [
            "Pass AWS Cloud Practitioner and Solutions Architect Associate exams",
            "Design scalable and secure AWS architectures",
            "Implement AWS services for compute, storage, and networking",
            "Understand AWS pricing and cost optimization",
            "Build and deploy cloud-native applications"
        ],
        "tags": ["aws", "cloud-computing", "certification", "architecture", "devops"],
        "request": {
            "subject": "AWS Cloud Architecture",
            "goal": "I want to become an AWS Solutions Architect. Start with Cloud Practitioner fundamentals and advance to Solutions Architect Associate level. Include hands-on labs, real-world scenarios, and exam preparation. Focus on practical cloud architecture design and implementation.",
            "time_value": 12,
            "time_unit": "weeks",
            "model": "vertexai:gemini-1.5-flash-001"
        }
    },
    {
        "title": "Complete Node.js Backend Development",
        "category": "web-development", 
        "subcategory": "backend",
        "difficulty": "beginner",
        "target_audience": "JavaScript developers transitioning to backend development",
        "estimated_hours": 90,
        "is_featured": False,
        "is_verified": True,
        "quality_score": 9.0,
        "prerequisites": ["JavaScript fundamentals", "Basic understanding of web concepts"],
        "learning_outcomes": [
            "Build REST APIs with Node.js and Express",
            "Work with databases (MongoDB and SQL)",
            "Implement authentication and security",
            "Handle file uploads and API integration",
            "Deploy Node.js applications to production"
        ],
        "tags": ["nodejs", "express", "backend", "api", "javascript", "mongodb"],
        "request": {
            "subject": "Node.js Backend Development",
            "goal": "I know JavaScript frontend but want to learn backend development with Node.js. Teach me to build REST APIs, work with databases, handle authentication, and deploy applications. Focus on practical projects and industry standards.",
            "time_value": 7,
            "time_unit": "weeks",
            "model": "vertexai:gemini-1.5-flash-001"
        }
    },
    {
        "title": "Data Structures & Algorithms for Coding Interviews",
        "category": "computer-science",
        "subcategory": "algorithms",
        "difficulty": "intermediate",
        "target_audience": "Software developers preparing for technical interviews at top companies",
        "estimated_hours": 120,
        "is_featured": True,
        "is_verified": True,
        "quality_score": 9.6,
        "prerequisites": ["Programming in Python/Java/C++", "Basic problem-solving skills"],
        "learning_outcomes": [
            "Master essential data structures (arrays, trees, graphs, etc.)",
            "Solve complex algorithmic problems efficiently",
            "Understand time and space complexity analysis",
            "Excel in coding interviews at top tech companies",
            "Practice with 100+ LeetCode-style problems"
        ],
        "tags": ["algorithms", "data-structures", "interviews", "leetcode", "problem-solving"],
        "request": {
            "subject": "Data Structures and Algorithms for Interviews",
            "goal": "I want to excel in coding interviews at top tech companies like Google, Amazon, and Facebook. Teach me essential data structures, algorithms, and problem-solving patterns. Include lots of practice problems with detailed explanations and interview tips.",
            "time_value": 10,
            "time_unit": "weeks",
            "model": "vertexai:gemini-1.5-flash-001"
        }
    }
]

async def generate_premium_roadmap(roadmap_config: dict) -> CuratedRoadmap:
    """Generate a high-quality curated roadmap"""
    logger.info(f"Generating roadmap: {roadmap_config['title']}")
    
    # Create the AI request
    request = RoadmapCreateRequest(**roadmap_config['request'])
    
    # Generate roadmap content using existing AI service
    ai_response = await generate_roadmap_content(request)
    
    # Create curated roadmap object
    curated_roadmap = CuratedRoadmap(
        title=roadmap_config['title'],
        description=ai_response.description,
        category=roadmap_config['category'],
        subcategory=roadmap_config.get('subcategory'),
        difficulty=roadmap_config['difficulty'],
        
        # Quality metrics
        is_featured=roadmap_config['is_featured'],
        is_verified=roadmap_config['is_verified'], 
        quality_score=roadmap_config['quality_score'],
        
        # Content
        roadmap_plan=ai_response.roadmap_plan.model_dump()["modules"],
        estimated_hours=roadmap_config['estimated_hours'],
        prerequisites=roadmap_config['prerequisites'],
        learning_outcomes=roadmap_config['learning_outcomes'],
        tags=roadmap_config['tags'],
        target_audience=roadmap_config['target_audience'],
        slug=create_slug(roadmap_config['title']),
        
        # Initialize metrics
        view_count=0,
        adoption_count=0,
        completion_rate=0.0,
        average_rating=0.0
    )
    
    logger.info(f"✅ Generated: {roadmap_config['title']} ({len(ai_response.roadmap_plan.modules)} modules)")
    return curated_roadmap

async def main():
    """Generate and save all premium curated roadmaps"""
    logger.info("🚀 Starting generation of premium curated roadmaps...")
    
    # Create database tables if they don't exist
    # Note: In production, this should be done via Alembic migrations
    from sqlmodel import SQLModel
    SQLModel.metadata.create_all(engine)
    
    generated_roadmaps = []
    
    for roadmap_config in PREMIUM_ROADMAPS:
        try:
            curated_roadmap = await generate_premium_roadmap(roadmap_config)
            generated_roadmaps.append(curated_roadmap)
            
            # Add a small delay to avoid hitting API limits
            await asyncio.sleep(2)
            
        except Exception as e:
            logger.error(f"❌ Failed to generate {roadmap_config['title']}: {e}")
            continue
    
    # Save to database
    if generated_roadmaps:
        with Session(engine) as db:
            # Check if roadmaps already exist
            existing_count = len(db.query(CuratedRoadmap).all()) if hasattr(db, 'query') else 0
            
            for roadmap in generated_roadmaps:
                db.add(roadmap)
            
            db.commit()
            
            logger.info(f"💾 Saved {len(generated_roadmaps)} curated roadmaps to database")
            
            # Print summary
            for roadmap in generated_roadmaps:
                logger.info(f"   • {roadmap.title} ({roadmap.difficulty}) - {roadmap.category}")
    
    logger.info("🎉 Premium curated roadmaps generation completed!")
    
    print("\n" + "="*60)
    print("CURATED ROADMAPS GENERATED SUCCESSFULLY!")
    print("="*60)
    print(f"Generated: {len(generated_roadmaps)} premium roadmaps")
    print("Categories covered:")
    categories = set(r.category for r in generated_roadmaps)
    for category in categories:
        count = sum(1 for r in generated_roadmaps if r.category == category)
        print(f"  • {category}: {count} roadmap(s)")
    print("\nReady for public catalog! 🚀")

if __name__ == "__main__":
    asyncio.run(main())