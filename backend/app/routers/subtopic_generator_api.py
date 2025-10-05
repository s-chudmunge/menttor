from fastapi import APIRouter, BackgroundTasks, HTTPException, status, Query
from pydantic import BaseModel
from typing import Optional
import logging
import asyncio
import sys
from pathlib import Path

# Add parent directory to path to import the generator
sys.path.append(str(Path(__file__).parent.parent.parent))

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/subtopic-generator", tags=["subtopic-generator"])

# API endpoints for automated subtopic library content generation
# Provides background processing and status tracking for subtopic JSON file creation

class GeneratorStatus(BaseModel):
    running: bool
    message: str
    processed_count: int = 0
    failed_count: int = 0
    current_batch: int = 0
    total_subtopics: int = 0
    batch_size: int = 0

class BatchStatus(BaseModel):
    batch_completed: bool
    batch_number: int
    subtopics_processed: int
    subtopics_generated: int
    subtopics_failed: int
    next_batch_start: Optional[int] = None
    has_more_batches: bool

# Global status tracking
generator_status = {
    "running": False,
    "message": "Ready to start",
    "processed_count": 0,
    "failed_count": 0,
    "current_batch": 0,
    "total_subtopics": 0,
    "batch_size": 0,
    "last_run": None
}

async def run_subtopic_generation():
    """Background task to run subtopic generation"""
    global generator_status
    
    try:
        generator_status["running"] = True
        generator_status["message"] = "Starting subtopic generation..."
        
        # Import and run the generator
        import sys
        from pathlib import Path
        sys.path.append(str(Path(__file__).parent.parent))
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

async def run_batch_generation(batch_size: int = 20, start_from: Optional[int] = None):
    """Background task to run batch subtopic generation"""
    global generator_status
    
    try:
        generator_status["running"] = True
        generator_status["batch_size"] = batch_size
        generator_status["message"] = f"Starting batch generation (size: {batch_size})..."
        
        # Import and run the generator
        import sys
        from pathlib import Path
        sys.path.append(str(Path(__file__).parent.parent))
        from subtopic_generator import SubtopicGenerator
        
        generator = SubtopicGenerator()
        result = await generator.run_batch(batch_size=batch_size, start_from=start_from)
        
        # Update status with batch results
        generator_status["processed_count"] = result.get("processed_count", 0)
        generator_status["failed_count"] = result.get("failed_count", 0)
        generator_status["current_batch"] = result.get("batch_number", 0)
        generator_status["total_subtopics"] = result.get("total_subtopics", 0)
        
        if result.get("has_more_batches", False):
            generator_status["message"] = f"Batch {result['batch_number']} completed! Next batch can start from {result.get('next_batch_start', 0)}"
        else:
            generator_status["message"] = f"All batches completed! Total processed: {generator_status['processed_count']}"
        
        return result
        
    except Exception as e:
        logger.error(f"Batch generation failed: {e}")
        generator_status["message"] = f"Batch error: {str(e)}"
        return {"error": str(e)}
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

@router.post("/start-batch")
async def start_batch_generation(
    background_tasks: BackgroundTasks,
    batch_size: int = Query(20, description="Number of subtopics to process in this batch"),
    start_from: Optional[int] = Query(None, description="Subtopic index to start from (for resuming)")
):
    """Start batch subtopic generation with specified batch size"""
    global generator_status
    
    if generator_status["running"]:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Generation is already running"
        )
    
    # Start batch generation in background
    background_tasks.add_task(run_batch_generation, batch_size, start_from)
    
    generator_status["running"] = True
    generator_status["batch_size"] = batch_size
    generator_status["message"] = f"Batch generation started (size: {batch_size})"
    
    return {
        "success": True,
        "message": f"Batch generation started with size {batch_size}",
        "batch_size": batch_size,
        "start_from": start_from,
        "status": generator_status
    }

@router.post("/continue-batch")
async def continue_batch_generation(
    background_tasks: BackgroundTasks,
    batch_size: int = Query(20, description="Number of subtopics to process in this batch")
):
    """Continue batch generation from where the last batch left off"""
    global generator_status
    
    if generator_status["running"]:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Generation is already running"
        )
    
    # Get last processed position from database/status
    # This will be implemented in the generator logic
    background_tasks.add_task(run_batch_generation, batch_size, None)
    
    generator_status["running"] = True
    generator_status["batch_size"] = batch_size
    generator_status["message"] = f"Continuing batch generation (size: {batch_size})"
    
    return {
        "success": True,
        "message": f"Continuing batch generation with size {batch_size}",
        "batch_size": batch_size,
        "status": generator_status
    }

@router.get("/batch-status")
async def get_batch_status():
    """Get detailed batch status information"""
    return {
        "running": generator_status["running"],
        "message": generator_status["message"],
        "current_batch": generator_status.get("current_batch", 0),
        "batch_size": generator_status.get("batch_size", 0),
        "total_subtopics": generator_status.get("total_subtopics", 0),
        "processed_count": generator_status["processed_count"],
        "failed_count": generator_status["failed_count"],
        "last_run": generator_status.get("last_run")
    }