from fastapi import APIRouter, HTTPException
from sqlmodel import Session, create_engine, text
import os
import logging

router = APIRouter(prefix="/db-test", tags=["database-test"])
logger = logging.getLogger(__name__)

@router.get("/")
async def test_database_connection():
    """Simple database connection test endpoint"""
    try:
        # Get database URL from environment
        database_url = os.getenv('DATABASE_URL')
        if not database_url:
            return {"error": "DATABASE_URL not found", "status": "fail"}
        
        # Create a simple engine for testing
        engine = create_engine(database_url, pool_size=1, max_overflow=0)
        
        # Test connection
        with engine.connect() as connection:
            result = connection.execute(text("SELECT 1 as test_value"))
            row = result.fetchone()
            
            # Test if we can query the actual table
            roadmap_result = connection.execute(text("SELECT COUNT(*) as count FROM curatedroadmap LIMIT 1"))
            roadmap_count = roadmap_result.fetchone()
        
        return {
            "status": "success", 
            "test_query": row[0] if row else None,
            "roadmaps_count": roadmap_count[0] if roadmap_count else 0,
            "database_url_preview": database_url[:30] + "..."
        }
        
    except Exception as e:
        logger.error(f"Database test failed: {e}")
        return {
            "status": "error",
            "error": str(e),
            "database_url_preview": database_url[:30] + "..." if 'database_url' in locals() else "Not set"
        }