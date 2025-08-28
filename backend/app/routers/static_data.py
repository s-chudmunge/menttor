"""
Static data endpoints for serving cached JSON files
"""
import os
import json
from typing import Dict, Any, Optional
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse

router = APIRouter(prefix="/static-data", tags=["static-data"])

STATIC_DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "curated_roadmaps_data")

def get_latest_roadmaps_file() -> Optional[str]:
    """Get the path to the latest curated roadmaps JSON file"""
    print(f"DEBUG: Looking for static data in: {STATIC_DATA_DIR}")
    print(f"DEBUG: Directory exists: {os.path.exists(STATIC_DATA_DIR)}")
    
    if not os.path.exists(STATIC_DATA_DIR):
        print(f"DEBUG: Static data directory does not exist: {STATIC_DATA_DIR}")
        return None
    
    try:
        all_files = os.listdir(STATIC_DATA_DIR)
        print(f"DEBUG: Files in directory: {all_files}")
        
        json_files = [f for f in all_files if f.endswith('.json') and f.startswith('curated_roadmaps_data_')]
        print(f"DEBUG: JSON files found: {json_files}")
        
        if not json_files:
            return None
        
        # Sort by filename (which includes date) to get the latest
        json_files.sort(reverse=True)
        file_path = os.path.join(STATIC_DATA_DIR, json_files[0])
        print(f"DEBUG: Selected file: {file_path}")
        return file_path
    except Exception as e:
        print(f"DEBUG: Error listing files: {str(e)}")
        return None

@router.get("/curated-roadmaps")
async def get_static_curated_roadmaps():
    """
    Get curated roadmaps from static JSON file
    Falls back to indicating no static data available
    """
    try:
        print("DEBUG: Static roadmaps endpoint called")
        file_path = get_latest_roadmaps_file()
        print(f"DEBUG: get_latest_roadmaps_file returned: {file_path}")
        
        if not file_path or not os.path.exists(file_path):
            print(f"DEBUG: File not found or doesn't exist: {file_path}")
            raise HTTPException(
                status_code=404, 
                detail="No static roadmaps data available. Please generate and download from admin panel."
            )
        
        print(f"DEBUG: Attempting to read file: {file_path}")
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        print(f"DEBUG: Successfully loaded data with {len(data.get('roadmaps', []))} roadmaps")
        # Return the same structure as the database API
        return JSONResponse(content=data)
    
    except json.JSONDecodeError as e:
        print(f"DEBUG: JSON decode error: {str(e)}")
        raise HTTPException(status_code=500, detail="Invalid JSON file format")
    except Exception as e:
        print(f"DEBUG: General error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error reading static data: {str(e)}")

@router.get("/curated-roadmaps/info")
async def get_static_file_info():
    """Get information about the available static data file"""
    try:
        file_path = get_latest_roadmaps_file()
        
        if not file_path or not os.path.exists(file_path):
            return {
                "available": False,
                "message": "No static data file found"
            }
        
        # Get file stats
        stat = os.stat(file_path)
        file_size = stat.st_size
        
        # Try to read just the metadata
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            return {
                "available": True,
                "file_name": os.path.basename(file_path),
                "file_size_bytes": file_size,
                "file_size_mb": round(file_size / (1024 * 1024), 2),
                "generated_at": data.get("generated_at", "Unknown"),
                "total_roadmaps": data.get("total_roadmaps", 0),
                "categories_count": len(data.get("categories", {}))
            }
        except json.JSONDecodeError:
            return {
                "available": False,
                "message": "Static data file exists but has invalid JSON format"
            }
    
    except Exception as e:
        return {
            "available": False,
            "message": f"Error checking static data: {str(e)}"
        }