"""
Supabase client initialization and configuration.
"""
import logging
from typing import Optional
from supabase import create_client, Client
from .config import settings

logger = logging.getLogger(__name__)

# Global Supabase client instance
_supabase_client: Optional[Client] = None


def get_supabase_client() -> Client:
    """
    Get or create the Supabase client instance.

    Returns:
        Supabase Client instance

    Raises:
        RuntimeError: If Supabase credentials are not configured
    """
    global _supabase_client

    if _supabase_client is None:
        if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
            logger.error("SUPABASE_URL and SUPABASE_KEY environment variables are required")
            raise RuntimeError("Supabase credentials are not configured")

        try:
            _supabase_client = create_client(
                settings.SUPABASE_URL,
                settings.SUPABASE_KEY
            )
            logger.info("Supabase client initialized successfully")
        except TypeError as e:
            if "got an unexpected keyword argument 'proxy'" in str(e):
                logger.warning(f"Supabase client not initialized due to proxy argument error: {e}")
                _supabase_client = None
            else:
                logger.error(f"Failed to initialize Supabase client: {e}")
                raise RuntimeError(f"Supabase initialization failed: {e}")
        except Exception as e:
            logger.error(f"Failed to initialize Supabase client: {e}")
            raise RuntimeError(f"Supabase initialization failed: {e}")

    return _supabase_client


# Initialize client on module import
try:
    supabase = get_supabase_client()
except Exception as e:
    logger.warning(f"Supabase client not initialized: {e}")
    supabase = None
