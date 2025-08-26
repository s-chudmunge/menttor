from typing import Generator
import logging
import os
from contextlib import asynccontextmanager
from sqlmodel import Session, SQLModel, create_engine
from core.config import settings

logger = logging.getLogger(__name__)

def create_database_engine():
    """Create database engine with Cloud SQL support"""
    # Check if we should use Cloud SQL Auth Proxy
    use_cloud_sql = os.getenv('USE_CLOUD_SQL_AUTH_PROXY', 'false').lower() == 'true'
    
    if use_cloud_sql:
        try:
            from database.cloud_sql import cloud_sql_connector
            logger.info("Using Google Cloud SQL Auth Proxy connection")
            return cloud_sql_connector.create_cloud_sql_engine()
        except ImportError as e:
            logger.error(f"Cloud SQL dependencies not available: {e}")
            logger.info("Falling back to direct connection")
        except Exception as e:
            logger.error(f"Failed to create Cloud SQL connection: {e}")
            logger.info("Falling back to direct connection")
    
    # Direct connection (fallback or default)
    logger.info("Using direct database connection")
    return create_engine(
        settings.get_database_url(),
        echo=settings.DATABASE_ECHO,
        # Conservative pool settings to prevent connection exhaustion
        pool_size=5,  # Reduced from 20 - Cloud SQL has connection limits
        max_overflow=10,  # Reduced from 30 - max total 15 connections
        pool_recycle=1800,  # 30 minutes - more aggressive recycling
        pool_pre_ping=True,  # Verify connections before use
        pool_timeout=20,  # Reduced timeout to fail faster
        # Use QueuePool which is most efficient for connection reuse
        poolclass=None,  # Default QueuePool
        # Additional optimization settings
        connect_args={
            "connect_timeout": 20,  # Reduced connect timeout
            "application_name": "menttorlabs_backend",
            # Compression and performance settings
            "options": "-c statement_timeout=30000 -c idle_in_transaction_session_timeout=300000"  # 30s query, 5min idle timeout
        }
    )

# Create the engine
engine = create_database_engine()

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