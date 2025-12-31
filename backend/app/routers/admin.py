from fastapi import APIRouter, HTTPException, Query, Depends
from typing import Optional, List
from sqlmodel import Session, select, func
from app.database.session import get_db
from app.sql_models import User
from app.core.auth import get_current_user
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin", tags=["admin"])


def verify_admin(current_user: User = Depends(get_current_user)) -> User:
    """Verify that the current user is an admin"""
    if not current_user.is_admin:
        raise HTTPException(
            status_code=403,
            detail="Admin privileges required"
        )
    return current_user


@router.get("/users")
async def get_users(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=1000),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    admin_user: User = Depends(verify_admin)
):
    """
    Fetch users with pagination and search.
    Requires admin privileges.
    """
    try:
        logger.info(f"Fetching users - page: {page}, limit: {limit}, search: {search}")

        # Calculate offset for pagination
        offset = (page - 1) * limit

        # Build query
        statement = select(User)

        # Apply search filter if provided
        if search:
            search_filter = f"%{search}%"
            statement = statement.where(
                (User.email.ilike(search_filter)) |
                (User.display_name.ilike(search_filter))
            )

        # Get total count
        count_statement = select(func.count()).select_from(statement.subquery())
        total_users = db.exec(count_statement).one()

        # Apply pagination
        statement = statement.offset(offset).limit(limit)

        # Execute query
        users = db.exec(statement).all()

        logger.info(f"Retrieved {len(users)} users from database")

        # Format response
        users_data = []
        for user in users:
            user_dict = {
                "id": user.id,
                "email": user.email,
                "display_name": user.display_name,
                "is_active": user.is_active,
                "is_admin": user.is_admin,
                "profile_completed": user.profile_completed,
                "onboarding_completed": user.onboarding_completed,
                "supabase_uid": user.supabase_uid
            }
            users_data.append(user_dict)

        return {
            "users": users_data,
            "total": total_users,
            "page": page,
            "limit": limit,
            "total_pages": (total_users + limit - 1) // limit
        }

    except Exception as e:
        logger.error(f"Error fetching users: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching users: {str(e)}")
