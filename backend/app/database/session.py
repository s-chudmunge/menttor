from typing import Generator
import logging
from contextlib import asynccontextmanager
from sqlmodel import Session, SQLModel, create_engine
from core.config import settings

logger = logging.getLogger(__name__)

# Optimized connection pool settings for quota management
engine = create_engine(
    settings.get_database_url(),
    echo=settings.DATABASE_ECHO,
    # Reduced pool size to minimize concurrent connections
    pool_size=3,  # Reduced from 10
    max_overflow=5,  # Reduced from 20
    pool_recycle=1800,  # 30 minutes instead of 1 hour
    pool_pre_ping=True,  # Verify connections before use
    pool_timeout=10,  # Fail fast if no connections available
    # Use QueuePool which is most efficient for connection reuse
    poolclass=None,  # Default QueuePool
    # Additional optimization settings
    connect_args={
        "connect_timeout": 10,
        "application_name": "menttorlabs_backend",
        # Compression and performance settings
        "options": "-c statement_timeout=30000"  # 30 second query timeout
    }
)

def create_db_and_tables():
    """Create database tables with connection monitoring"""
    try:
        SQLModel.metadata.create_all(engine)
        logger.info("Database tables created successfully")
    except Exception as e:
        logger.error(f"Failed to create database tables: {e}")
        raise

def get_db() -> Generator[Session, None, None]:
    """Optimized database session with automatic cleanup"""
    session = Session(engine)
    try:
        yield session
    except Exception as e:
        logger.error(f"Database session error: {e}")
        session.rollback()
        raise
    finally:
        session.close()

# Connection pool monitoring
def get_pool_status():
    """Get current connection pool status for monitoring"""
    pool = engine.pool
    return {
        "pool_size": pool.size(),
        "checked_in": pool.checkedin(),
        "checked_out": pool.checkedout(),
        "overflow": pool.overflow(),
    }