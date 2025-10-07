from fastapi import APIRouter, BackgroundTasks, HTTPException, status, Query
from pydantic import BaseModel
from typing import Optional
import logging
import asyncio
import sys
from pathlib import Path
from datetime import datetime
import json

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
    "last_run": None,
    "continuous_mode": False,
    "auto_restart": False,
    "error_count": 0,
    "last_error": None
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
        generator_status["last_run"] = datetime.now().isoformat()

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
        generator_status["last_run"] = datetime.now().isoformat()

async def run_continuous_generation(batch_size: int = 20, max_batches: int = 1000, sleep_between_batches: int = 10):
    """Background task to run continuous batch generation until completion"""
    global generator_status
    
    try:
        generator_status["running"] = True
        generator_status["continuous_mode"] = True
        generator_status["batch_size"] = batch_size
        generator_status["message"] = "Starting continuous generation..."
        logger.info("🚀 Starting continuous batch generation")
        
        # Import and initialize generator
        import sys
        from pathlib import Path
        sys.path.append(str(Path(__file__).parent.parent))
        from subtopic_generator import SubtopicGenerator
        
        batch_count = 0
        consecutive_errors = 0
        
        while generator_status["running"] and generator_status["continuous_mode"] and batch_count < max_batches:
            batch_count += 1
            generator_status["current_batch"] = batch_count
            
            try:
                logger.info(f"🔄 Starting Batch #{batch_count}")
                
                # Get current position from last batch result
                start_from = None
                if generator_status.get("message", "").startswith("Batch"):
                    # Extract next start position from message
                    message = generator_status["message"]
                    if "Next batch can start from" in message:
                        try:
                            start_from = int(message.split("from ")[-1])
                        except:
                            pass
                
                generator = SubtopicGenerator()
                result = await generator.run_batch(batch_size=batch_size, start_from=start_from)
                
                # Update status with batch results
                generator_status["processed_count"] = result.get("processed_count", 0)
                generator_status["failed_count"] = result.get("failed_count", 0)
                generator_status["current_batch"] = result.get("batch_number", batch_count)
                generator_status["total_subtopics"] = result.get("total_subtopics", 0)
                
                # Check if we're done
                if not result.get("has_more_batches", True):
                    generator_status["message"] = f"🎉 All subtopics completed! Total processed: {generator_status['processed_count']}"
                    logger.info("🎉 All subtopics completed!")
                    break
                else:
                    generator_status["message"] = f"Batch {result['batch_number']} completed! Next batch can start from {result.get('next_batch_start', 0)}"
                
                consecutive_errors = 0  # Reset on success
                logger.info(f"✅ Batch #{batch_count} completed successfully")
                
                # Sleep between batches if still running
                if generator_status["running"] and generator_status["continuous_mode"]:
                    await asyncio.sleep(sleep_between_batches)
                
            except Exception as e:
                consecutive_errors += 1
                generator_status["error_count"] = generator_status.get("error_count", 0) + 1
                generator_status["last_error"] = str(e)
                logger.error(f"❌ Error in batch #{batch_count}: {e}")
                
                # Exponential backoff for consecutive errors
                if consecutive_errors >= 3:
                    wait_time = min(300, 60 * (2 ** (consecutive_errors - 3)))
                    logger.error(f"🚨 {consecutive_errors} consecutive errors, waiting {wait_time}s before retry")
                    await asyncio.sleep(wait_time)
                else:
                    await asyncio.sleep(60)  # Wait 1 minute on error
                
                # Reset if too many consecutive errors
                if consecutive_errors >= 5:
                    logger.error("🚨 Too many consecutive errors, taking longer break...")
                    consecutive_errors = 0
                    await asyncio.sleep(300)  # Wait 5 minutes
        
        # Check why we exited
        if batch_count >= max_batches:
            generator_status["message"] = f"⚠️ Reached maximum batch limit ({max_batches})"
        elif not generator_status.get("continuous_mode", True):
            generator_status["message"] = "⏸️ Continuous generation paused"
        
    except Exception as e:
        logger.error(f"🚨 Fatal error in continuous generator: {e}")
        generator_status["error_count"] = generator_status.get("error_count", 0) + 1
        generator_status["last_error"] = str(e)
        generator_status["message"] = f"Fatal error: {str(e)}"
    
    finally:
        generator_status["running"] = False
        generator_status["continuous_mode"] = False
        generator_status["last_run"] = datetime.now().isoformat()
        logger.info("🏁 Continuous generation ended")

def is_generation_complete(message: str) -> bool:
    """Check if generation is complete based on message"""
    completion_indicators = [
        "All batches completed",
        "All subtopics completed", 
        "Generation finished",
        "🎉 All subtopics completed"
    ]
    return any(indicator in message for indicator in completion_indicators)

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
        "last_run": generator_status.get("last_run"),
        "continuous_mode": generator_status.get("continuous_mode", False),
        "auto_restart": generator_status.get("auto_restart", False),
        "error_count": generator_status.get("error_count", 0),
        "last_error": generator_status.get("last_error")
    }

@router.post("/start-continuous")
async def start_continuous_generation(
    background_tasks: BackgroundTasks,
    batch_size: int = Query(20, description="Number of subtopics per batch"),
    max_batches: int = Query(1000, description="Maximum number of batches (safety limit)"),
    sleep_between_batches: int = Query(10, description="Seconds to wait between batches"),
    auto_restart: bool = Query(True, description="Auto-restart if generation stops")
):
    """Start continuous subtopic generation that runs until completion"""
    global generator_status
    
    if generator_status["running"]:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Generator is already running"
        )
    
    # Check if generation is already complete
    if is_generation_complete(generator_status.get("message", "")):
        return {
            "success": True,
            "message": "Generation already completed",
            "status": generator_status
        }
    
    # Set auto-restart flag
    generator_status["auto_restart"] = auto_restart
    
    # Start continuous generation in background
    background_tasks.add_task(run_continuous_generation, batch_size, max_batches, sleep_between_batches)
    
    generator_status["running"] = True
    generator_status["continuous_mode"] = True
    generator_status["batch_size"] = batch_size
    generator_status["message"] = "Continuous generation starting..."
    
    return {
        "success": True,
        "message": f"Continuous generation started (batch_size={batch_size}, auto_restart={auto_restart})",
        "batch_size": batch_size,
        "max_batches": max_batches,
        "sleep_between_batches": sleep_between_batches,
        "auto_restart": auto_restart,
        "status": generator_status
    }

@router.post("/pause-continuous")
async def pause_continuous_generation():
    """Pause continuous generation (can be resumed)"""
    global generator_status
    
    if not generator_status["running"] or not generator_status.get("continuous_mode", False):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Continuous generation is not running"
        )
    
    generator_status["continuous_mode"] = False
    generator_status["message"] = "Pausing continuous generation..."
    
    return {
        "success": True,
        "message": "Continuous generation pause requested",
        "status": generator_status
    }

@router.post("/resume-continuous") 
async def resume_continuous_generation(background_tasks: BackgroundTasks):
    """Resume paused continuous generation"""
    global generator_status
    
    if generator_status["running"] and generator_status.get("continuous_mode", False):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Continuous generation is already running"
        )
    
    # Get previous settings
    batch_size = generator_status.get("batch_size", 20)
    
    # Check if generation is complete
    if is_generation_complete(generator_status.get("message", "")):
        return {
            "success": True,
            "message": "Generation already completed",
            "status": generator_status
        }
    
    # Resume with previous settings
    background_tasks.add_task(run_continuous_generation, batch_size, 1000, 10)
    
    generator_status["running"] = True
    generator_status["continuous_mode"] = True
    generator_status["message"] = "Resuming continuous generation..."
    
    return {
        "success": True,
        "message": "Continuous generation resumed",
        "batch_size": batch_size,
        "status": generator_status
    }

@router.post("/stop-continuous")
async def stop_continuous_generation():
    """Stop continuous generation completely"""
    global generator_status
    
    generator_status["running"] = False
    generator_status["continuous_mode"] = False
    generator_status["auto_restart"] = False
    generator_status["message"] = "Continuous generation stopped by user"
    
    return {
        "success": True,
        "message": "Continuous generation stopped",
        "status": generator_status
    }