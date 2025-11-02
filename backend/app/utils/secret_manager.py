import subprocess
import logging
from typing import Optional
from functools import lru_cache

# Firebase admin authentication with Google Cloud Secret Manager integration
logger = logging.getLogger(__name__)

@lru_cache(maxsize=128)
def get_secret(secret_name: str, project_id: Optional[str] = None) -> Optional[str]:
    """
    Fetch a secret from Google Cloud Secret Manager using gcloud CLI.
    Results are cached to avoid repeated API calls.
    
    Args:
        secret_name: Name of the secret in Secret Manager
        project_id: Optional Google Cloud project ID
        
    Returns:
        Secret value as string, or None if not found/error
    """
    try:
        cmd = ["gcloud", "secrets", "versions", "access", "latest", "--secret", secret_name]
        if project_id:
            cmd.extend(["--project", project_id])
            
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=10
        )
        
        if result.returncode == 0:
            secret_value = result.stdout.strip()
            logger.info(f"Successfully retrieved secret: {secret_name}")
            return secret_value
        else:
            logger.error(f"Failed to retrieve secret {secret_name}: {result.stderr}")
            return None
            
    except subprocess.TimeoutExpired:
        logger.error(f"Timeout retrieving secret: {secret_name}")
        return None
    except Exception as e:
        logger.error(f"Error retrieving secret {secret_name}: {e}")
        return None

def get_admin_credentials() -> tuple[str, str]:
    """
    Get admin credentials from Secret Manager.
    Falls back to environment variables if secrets not available.
    
    Returns:
        Tuple of (username, password)
    """
    import os
    
    # Try to get from Secret Manager first
    username = get_secret("admin-username")
    password = get_secret("admin-password")
    
    # Fallback to environment variables
    if not username:
        username = os.getenv("ADMIN_USERNAME", "admin")
        logger.warning("Admin username not found in Secret Manager, using environment variable")
    
    if not password:
        password = os.getenv("ADMIN_PASSWORD")
        if not password:
            logger.error("Admin password not found in Secret Manager or environment variables")
            return None, None
        logger.warning("Admin password not found in Secret Manager, using environment variable")
    
    return username, password