from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any
from services.ai_service import get_available_models

router = APIRouter(prefix="/models", tags=["models"])

@router.get("/", response_model=List[Dict[str, Any]])
async def get_all_models_endpoint():
    """Returns a list of all AI models available from configured providers."""
    try:
        models = await get_available_models()
        return models
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to fetch models: {e}")
