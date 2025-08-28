"""
Static data endpoints for serving cached JSON files
"""
import os
import json
from typing import Dict, Any, Optional
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse

router = APIRouter(prefix="/static-data", tags=["static-data"])

# Try multiple possible paths for the static data directory
POSSIBLE_STATIC_DIRS = [
    # Local development paths
    os.path.join(os.path.dirname(__file__), "..", "..", "curated_roadmaps_data"),
    # Backend root relative to app/routers
    os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "curated_roadmaps_data"),
    # Current working directory variations
    os.path.join(os.getcwd(), "curated_roadmaps_data"),
    os.path.join(os.getcwd(), "backend", "curated_roadmaps_data"),
    # Render.com deployment paths
    os.path.join("/app", "curated_roadmaps_data"),
    os.path.join("/opt/render/project/src", "curated_roadmaps_data"),
    os.path.join("/opt/render/project/src/backend", "curated_roadmaps_data"),
    # Docker deployment paths
    os.path.join("/usr/src/app", "curated_roadmaps_data"),
    # Absolute path fallback
    "/curated_roadmaps_data",
    # Additional fallbacks based on current file location
    os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "curated_roadmaps_data")),
]

def get_static_data_dir():
    """Find the correct static data directory"""
    print(f"DEBUG: Current working directory: {os.getcwd()}")
    print(f"DEBUG: Current file location: {__file__}")
    print(f"DEBUG: Current file directory: {os.path.dirname(__file__)}")
    
    for possible_dir in POSSIBLE_STATIC_DIRS:
        abs_path = os.path.abspath(possible_dir)
        print(f"DEBUG: Checking possible directory: {possible_dir} -> {abs_path}")
        if os.path.exists(abs_path):
            print(f"DEBUG: Found static data directory: {abs_path}")
            return abs_path
    
    # Final debugging: list contents of some key directories
    print("DEBUG: Listing contents of key directories:")
    for debug_dir in [os.getcwd(), "/app", "/opt/render/project/src"]:
        try:
            if os.path.exists(debug_dir):
                contents = os.listdir(debug_dir)
                print(f"DEBUG: Contents of {debug_dir}: {contents}")
        except Exception as e:
            print(f"DEBUG: Could not list {debug_dir}: {e}")
    
    print("DEBUG: No static data directory found")
    return None

def get_latest_roadmaps_file() -> Optional[str]:
    """Get the path to the latest curated roadmaps JSON file"""
    static_data_dir = get_static_data_dir()
    
    if not static_data_dir:
        return None
    
    try:
        all_files = os.listdir(static_data_dir)
        print(f"DEBUG: Files in directory: {all_files}")
        
        json_files = [f for f in all_files if f.endswith('.json') and f.startswith('curated_roadmaps_data_')]
        print(f"DEBUG: JSON files found: {json_files}")
        
        if not json_files:
            return None
        
        # Sort by filename (which includes date) to get the latest
        json_files.sort(reverse=True)
        file_path = os.path.join(static_data_dir, json_files[0])
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

@router.get("/debug")
async def debug_paths():
    """Debug endpoint to show current paths and directory structure"""
    debug_info = {
        "current_working_directory": os.getcwd(),
        "current_file_location": __file__,
        "current_file_directory": os.path.dirname(__file__),
        "possible_paths": [],
        "directory_listings": {}
    }
    
    # Check all possible paths
    for possible_dir in POSSIBLE_STATIC_DIRS:
        abs_path = os.path.abspath(possible_dir)
        debug_info["possible_paths"].append({
            "original_path": possible_dir,
            "absolute_path": abs_path,
            "exists": os.path.exists(abs_path)
        })
    
    # List contents of key directories
    for debug_dir in [os.getcwd(), "/app", "/opt/render/project/src", os.path.dirname(os.path.dirname(os.path.dirname(__file__)))]:
        try:
            if os.path.exists(debug_dir):
                contents = os.listdir(debug_dir)
                debug_info["directory_listings"][debug_dir] = contents
            else:
                debug_info["directory_listings"][debug_dir] = "Directory does not exist"
        except Exception as e:
            debug_info["directory_listings"][debug_dir] = f"Error: {str(e)}"
    
    return debug_info

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