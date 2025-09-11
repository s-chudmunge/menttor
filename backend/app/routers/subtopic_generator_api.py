from fastapi import APIRouter, BackgroundTasks, HTTPException, status
from pydantic import BaseModel
import logging
import asyncio
import sys
from pathlib import Path

# Add parent directory to path to import the generator
sys.path.append(str(Path(__file__).parent.parent.parent))

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/subtopic-generator", tags=["subtopic-generator"])

class GeneratorStatus(BaseModel):
    running: bool
    message: str
    processed_count: int = 0
    failed_count: int = 0

# Global status tracking
generator_status = {
    "running": False,
    "message": "Ready to start",
    "processed_count": 0,
    "failed_count": 0,
    "last_run": None
}

async def run_subtopic_generation():
    """Background task to run subtopic generation"""
    global generator_status
    
    try:
        generator_status["running"] = True
        generator_status["message"] = "Starting subtopic generation..."
        
        # Import and run the generator
        from subtopic_generator import SubtopicGenerator
        
        generator = SubtopicGenerator()
        await generator.run()
        
        # Update status with results
        generator_status["processed_count"] = len(generator.processed_subtopics)
        generator_status["failed_count"] = len(generator.failed_subtopics)
        generator_status["message"] = f"Completed! Processed: {generator_status['processed_count']}, Failed: {generator_status['failed_count']}"
        
    except Exception as e:
        logger.error(f"Subtopic generation failed: {e}")
        generator_status["message"] = f"Error: {str(e)}"
    finally:
        generator_status["running"] = False
        generator_status["last_run"] = __import__('datetime').datetime.now().isoformat()

@router.post("/start")
async def start_generation(background_tasks: BackgroundTasks):
    """Start subtopic generation in the background"""
    global generator_status
    
    if generator_status["running"]:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Subtopic generation is already running"
        )
    
    # Start generation in background
    background_tasks.add_task(run_subtopic_generation)
    
    generator_status["running"] = True
    generator_status["message"] = "Generation started in background"
    
    return {
        "success": True,
        "message": "Subtopic generation started",
        "status": generator_status
    }

@router.get("/status")
async def get_status():
    """Get current status of subtopic generation"""
    return GeneratorStatus(**generator_status)

@router.post("/reset-status")
async def reset_status():
    """Reset the status (useful for testing)"""
    global generator_status
    
    if generator_status["running"]:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot reset status while generation is running"
        )
    
    generator_status.update({
        "running": False,
        "message": "Ready to start",
        "processed_count": 0,
        "failed_count": 0,
        "last_run": None
    })
    
    return {"success": True, "message": "Status reset"}

@router.get("/trigger-single")
async def trigger_single_generation(background_tasks: BackgroundTasks):
    """Convenience endpoint to trigger single subtopic generation"""
    if generator_status["running"]:
        return {
            "success": False,
            "message": "Generation already running",
            "status": generator_status
        }
    
    # Start generation in background
    background_tasks.add_task(run_subtopic_generation)
    
    generator_status["running"] = True
    generator_status["message"] = "Single subtopic generation started"
    
    return {
        "success": True,
        "message": "Single subtopic generation triggered",
        "status": generator_status
    }