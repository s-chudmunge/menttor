from typing import Generator
import logging
import os
from contextlib import asynccontextmanager
from sqlmodel import Session, SQLModel, create_engine
from core.config import settings

logger = logging.getLogger(__name__)

def create_database_engine():
    """Create database engine with direct connection"""
    logger.info("Creating direct database connection")
    db_url = settings.get_database_url()
    logger.info(f"Database URL: {db_url[:50]}...")
    
    return create_engine(
        db_url,
        echo=settings.DATABASE_ECHO,
        # Optimized pool settings for production
        pool_size=10,  # Reasonable pool size
        max_overflow=15,  # Max total 25 connections
        pool_recycle=1800,  # 30 minutes - recycle connections
        pool_pre_ping=True,  # Verify connections before use
        pool_timeout=20,  # Connection timeout
        connect_args={
            "connect_timeout": 20,  # Connection timeout
            "application_name": "menttorlabs_backend",
            # PostgreSQL performance settings
            "options": "-c statement_timeout=30000 -c idle_in_transaction_session_timeout=300000"
        }
    )

# Create the engine - recreate on each import to pick up new environment variables
engine = create_database_engine()

def get_fresh_engine():
    """Get a fresh engine with current environment variables"""
    global engine
    engine = create_database_engine()
    return engine

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
    operation = "initialization"
    try:
        operation = "query execution"
        yield session
        operation = "transaction commit"
        # Commit any pending transactions if no exception occurred
        session.commit()
    except HTTPException:
        # Re-raise HTTPException without logging it as a database error,
        # as it's used for flow control (e.g., 404 Not Found).
        session.rollback() # Rollback any potential changes before raising
        raise
    except Exception as e:
        logger.error(f"Database session error during {operation}: {type(e).__name__}: {e}")
        try:
            session.rollback()
        except Exception as rollback_error:
            logger.error(f"Error during rollback: {rollback_error}")
        raise
    finally:
        # Ensure session is always closed to return connection to pool
        try:
            session.close()
        except Exception as e:
            logger.error(f"Error closing database session: {e}")

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