from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.database.session import get_db
from app.database.redis_client import get_redis_client
import time
import logging
from typing import Dict, Any
from app.sql_models import User # Import User for database health check

router = APIRouter(prefix="/health", tags=["health"])
logger = logging.getLogger(__name__)

@router.get("/")
async def health_check():
    """Basic health check to keep backend warm"""
    return {"status": "healthy", "timestamp": time.time()}

@router.get("/deep")
async def deep_health_check(db: Session = Depends(get_db)):
    """Deep health check that tests database and cache connectivity"""
    checks = {
        "database": False,
        "redis": False,
    }
    
    try:
        # Test database connectivity using a common model
        user_count = db.exec(select(User)).first()
        checks["database"] = True
        
        # Test Redis connectivity
        try:
            with get_redis_client() as redis_client:
                redis_client.ping()
                checks["redis"] = True
        except Exception as e:
            logger.warning(f"Redis check failed: {e}")
        
        return {
            "status": "healthy" if all(checks.values()) else "degraded",
            "checks": checks,
            "timestamp": time.time()
        }
        
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {
            "status": "unhealthy",
            "checks": checks,
            "error": str(e),
            "timestamp": time.time()
        }

@router.get("/warm")
async def warm_backend(db: Session = Depends(get_db)):
    """Warm up backend by ensuring Redis connectivity"""
    try:
        start_time = time.time()
        
        # Test Redis connectivity
        redis_healthy = False
        try:
            with get_redis_client() as redis_client:
                redis_client.ping()
                redis_healthy = True
        except Exception:
            pass
        
        warmup_time = time.time() - start_time
        
        return {
            "status": "warmed",
            "redis_healthy": redis_healthy,
            "warmup_time_ms": round(warmup_time * 1000, 2),
            "timestamp": time.time()
        }
        
    except Exception as e:
        logger.error(f"Backend warmup failed: {e}")
        raise HTTPException(status_code=500, detail=f"Warmup failed: {str(e)}")