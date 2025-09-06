"""
Admin management router for setting up admin users with Firebase claims.
This is a one-time setup router that can be disabled after initial configuration.
"""
from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from pydantic import BaseModel
from utils.firebase_admin_utils import set_admin_claims, ensure_user_has_admin_claims
from utils.secret_manager import get_admin_credentials
import secrets
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin-setup", tags=["admin-setup"])
security = HTTPBasic()

# Get admin credentials for initial setup authentication
SETUP_USERNAME, SETUP_PASSWORD = get_admin_credentials()

class AdminSetupRequest(BaseModel):
    firebase_uid: str
    email: str

def verify_setup_credentials(credentials: HTTPBasicCredentials = Depends(security)):
    """Verify setup credentials using Secret Manager"""
    is_correct_username = secrets.compare_digest(credentials.username, SETUP_USERNAME)
    is_correct_password = secrets.compare_digest(credentials.password, SETUP_PASSWORD)
    
    if not (is_correct_username and is_correct_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid setup credentials",
            headers={"WWW-Authenticate": "Basic"},
        )
    return credentials.username

@router.post("/create-admin")
async def create_admin_user(
    request: AdminSetupRequest,
    _: str = Depends(verify_setup_credentials)
):
    """
    Set admin claims for a Firebase user.
    This endpoint should only be used during initial setup.
    
    Usage:
    1. User creates account normally through Firebase Auth
    2. Admin uses this endpoint with the user's Firebase UID to grant admin privileges
    3. User can then access admin panels using their Firebase token
    """
    try:
        success = await set_admin_claims(request.firebase_uid, True)
        
        if success:
            logger.info(f"Successfully granted admin privileges to {request.email} ({request.firebase_uid})")
            return {
                "success": True,
                "message": f"Admin privileges granted to {request.email}",
                "firebase_uid": request.firebase_uid
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to set admin claims"
            )
            
    except Exception as e:
        logger.error(f"Error creating admin user: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create admin user: {str(e)}"
        )

@router.post("/revoke-admin")
async def revoke_admin_user(
    request: AdminSetupRequest,
    _: str = Depends(verify_setup_credentials)
):
    """Revoke admin claims from a Firebase user."""
    try:
        success = await set_admin_claims(request.firebase_uid, False)
        
        if success:
            logger.info(f"Successfully revoked admin privileges from {request.email} ({request.firebase_uid})")
            return {
                "success": True,
                "message": f"Admin privileges revoked from {request.email}",
                "firebase_uid": request.firebase_uid
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to revoke admin claims"
            )
            
    except Exception as e:
        logger.error(f"Error revoking admin user: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to revoke admin user: {str(e)}"
        )

@router.get("/instructions")
async def get_setup_instructions():
    """Get instructions for setting up admin users."""
    return {
        "instructions": [
            "1. Create a regular user account through Firebase Auth (sign up normally)",
            "2. Get the user's Firebase UID from the Firebase console or user profile",
            "3. Use POST /admin-setup/create-admin with HTTP Basic Auth and the user's UID",
            "4. The user can now access admin panels using their Firebase token",
            "5. For security, disable or remove this setup router after configuration"
        ],
        "example_request": {
            "method": "POST",
            "url": "/admin-setup/create-admin",
            "auth": "HTTP Basic Auth (use Secret Manager credentials)",
            "body": {
                "firebase_uid": "user-firebase-uid-here",
                "email": "admin@example.com"
            }
        }
    }