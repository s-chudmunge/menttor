"""
Database monitoring and health check endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session
from typing import Dict, Any
from datetime import datetime

from app.database.session import get_db, get_pool_status
from app.database.monitor import db_monitor
from app.database.cache import query_cache
from app.database.batch import batch_processor
from app.core.auth import get_current_user
from app.sql_models import User

router = APIRouter(prefix="/monitoring", tags=["monitoring"])

@router.get("/health")
async def health_check(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Basic health check endpoint"""
    try:
        # Test database connection
        db.exec("SELECT 1")
        
        return {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "database": "connected"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Database connection failed: {str(e)}"
        )

@router.get("/db-stats")
async def get_database_stats(
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """Get comprehensive database usage statistics (admin only)"""
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    try:
        # Get various statistics
        pool_stats = get_pool_status()
        usage_stats = db_monitor.get_usage_stats()
        cache_stats = query_cache.get_stats()
        
        return {
            "timestamp": datetime.utcnow().isoformat(),
            "connection_pool": pool_stats,
            "usage_monitoring": usage_stats,
            "query_cache": cache_stats,
            "batch_processor": {
                "pending_operations": len(batch_processor._pending_operations),
                "last_flush": batch_processor._last_flush.isoformat()
            }
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve statistics: {str(e)}"
        )

@router.get("/user-stats/{user_id}")
async def get_user_stats(
    user_id: str,
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """Get database usage statistics for a specific user"""
    # Users can only see their own stats, admins can see any user's stats
    if current_user.supabase_uid != user_id and not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    try:
        user_stats = db_monitor.get_user_stats(user_id)
        return {
            "user_id": user_id,
            "timestamp": datetime.utcnow().isoformat(),
            **user_stats
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve user statistics: {str(e)}"
        )

@router.post("/cache/clear")
async def clear_cache(
    current_user: User = Depends(get_current_user)
) -> Dict[str, str]:
    """Clear the query cache (admin only)"""
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    try:
        query_cache.clear()
        return {
            "status": "success",
            "message": "Query cache cleared successfully",
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to clear cache: {str(e)}"
        )

@router.post("/batch/flush")
async def flush_batch_operations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Force flush pending batch operations (admin only)"""
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    try:
        pending_count = len(batch_processor._pending_operations)
        batch_processor.flush(db)
        
        return {
            "status": "success",
            "message": f"Flushed {pending_count} pending operations",
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to flush batch operations: {str(e)}"
        )

@router.get("/quota-usage")
async def get_quota_usage(
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """Get estimated quota usage information"""
    try:
        stats = db_monitor.get_usage_stats()
        
        # Estimate quota usage (these are rough estimates)
        estimated_quota_usage = {
            "compute_time_used_seconds": stats["total_compute_time_seconds"],
            "compute_percentage": stats["compute_time_percentage"],
            "queries_per_hour": stats["queries_last_hour"],
            "active_connections": get_pool_status()["checked_out"],
            "recommendations": []
        }
        
        # Add recommendations based on usage
        if stats["compute_time_percentage"] > 80:
            estimated_quota_usage["recommendations"].append(
                "High compute usage detected. Consider optimizing queries or upgrading plan."
            )
        
        if stats["queries_last_hour"] > 800:
            estimated_quota_usage["recommendations"].append(
                "High query volume. Consider implementing more caching."
            )
        
        if len(stats["active_users"]) > 10:
            estimated_quota_usage["recommendations"].append(
                "Many active users. Monitor rate limits closely."
            )
        
        return {
            "timestamp": datetime.utcnow().isoformat(),
            "quota_estimates": estimated_quota_usage,
            "optimization_suggestions": [
                "Enable query caching for frequently accessed data",
                "Batch non-critical operations",
                "Use connection pooling efficiently",
                "Implement pagination for large result sets"
            ]
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to calculate quota usage: {str(e)}"
        )