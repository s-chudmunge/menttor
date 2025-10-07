#!/usr/bin/env python3
"""
Auto Batch Generator Service - Cloud Run Compatible
Continuously runs subtopic generation in batches until completion
Provides HTTP endpoints for control and monitoring
"""

import asyncio
import json
import logging
import os
from datetime import datetime, timedelta
from typing import Dict, Optional, Any
import httpx
from fastapi import FastAPI, BackgroundTasks, HTTPException
from pydantic import BaseModel
import uvicorn

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Configuration
API_URL = "https://menttor-backend-144050828172.asia-south1.run.app/subtopic-generator"
BATCH_SIZE = int(os.getenv("BATCH_SIZE", "20"))
MAX_BATCHES = int(os.getenv("MAX_BATCHES", "1000"))
SLEEP_BETWEEN_BATCHES = int(os.getenv("SLEEP_BETWEEN_BATCHES", "10"))
CHECK_INTERVAL = int(os.getenv("CHECK_INTERVAL", "15"))  # seconds
MAX_BATCH_WAIT_TIME = int(os.getenv("MAX_BATCH_WAIT_TIME", "1800"))  # 30 minutes
RESTART_DELAY = int(os.getenv("RESTART_DELAY", "60"))  # seconds

app = FastAPI(title="Auto Batch Generator Service", version="1.0.0")

# Global state
generator_state = {
    "running": False,
    "paused": False,
    "current_batch": 0,
    "total_processed": 0,
    "start_time": None,
    "last_activity": None,
    "error_count": 0,
    "last_error": None,
    "status": "idle",
    "restart_count": 0
}

class GeneratorStatus(BaseModel):
    running: bool
    paused: bool
    current_batch: int
    total_processed: int
    start_time: Optional[str]
    last_activity: Optional[str]
    error_count: int
    last_error: Optional[str]
    status: str
    restart_count: int

class StartRequest(BaseModel):
    batch_size: Optional[int] = BATCH_SIZE
    force_restart: bool = False

async def make_api_call(method: str, endpoint: str, **kwargs) -> Dict[str, Any]:
    """Make HTTP API call with error handling and retries"""
    url = f"{API_URL}/{endpoint}"
    max_retries = 3
    
    for attempt in range(max_retries):
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                if method.upper() == "GET":
                    response = await client.get(url, **kwargs)
                elif method.upper() == "POST":
                    response = await client.post(url, **kwargs)
                else:
                    raise ValueError(f"Unsupported method: {method}")
                
                response.raise_for_status()
                return response.json()
                
        except httpx.TimeoutException:
            logger.warning(f"Timeout on attempt {attempt + 1} for {url}")
            if attempt == max_retries - 1:
                raise
            await asyncio.sleep(2 ** attempt)  # Exponential backoff
            
        except httpx.HTTPError as e:
            logger.warning(f"HTTP error on attempt {attempt + 1} for {url}: {e}")
            if attempt == max_retries - 1:
                raise
            await asyncio.sleep(2 ** attempt)
            
        except Exception as e:
            logger.error(f"Unexpected error on attempt {attempt + 1} for {url}: {e}")
            if attempt == max_retries - 1:
                raise
            await asyncio.sleep(2 ** attempt)

async def get_batch_status() -> Dict[str, Any]:
    """Get current batch status from the API"""
    return await make_api_call("GET", "batch-status")

async def start_batch(batch_size: int, start_from: Optional[int] = None) -> Dict[str, Any]:
    """Start a new batch generation"""
    params = {"batch_size": batch_size}
    if start_from is not None:
        params["start_from"] = start_from
    return await make_api_call("POST", "start-batch", params=params)

async def wait_for_batch_completion(batch_num: int, max_wait_time: int = MAX_BATCH_WAIT_TIME) -> bool:
    """Wait for current batch to complete with timeout"""
    start_time = datetime.now()
    
    while True:
        try:
            status = await get_batch_status()
            is_running = status.get("running", False)
            
            if not is_running:
                logger.info(f"✅ Batch #{batch_num} completed!")
                return True
                
            # Check for timeout
            elapsed = (datetime.now() - start_time).total_seconds()
            if elapsed > max_wait_time:
                logger.error(f"❌ Batch #{batch_num} timed out after {elapsed:.0f} seconds")
                return False
                
            logger.info(f"⏳ Batch #{batch_num} still running... ({elapsed:.0f}s elapsed)")
            await asyncio.sleep(CHECK_INTERVAL)
            
        except Exception as e:
            logger.error(f"Error checking batch status: {e}")
            await asyncio.sleep(CHECK_INTERVAL)
            
        # Check if we should stop (paused or not running)
        if generator_state["paused"] or not generator_state["running"]:
            logger.info(f"🛑 Generator paused/stopped while waiting for batch #{batch_num}")
            return False

def extract_next_start_position(message: str) -> int:
    """Extract next start position from status message"""
    try:
        if 'Next batch can start from' in message:
            return int(message.split('from ')[-1].strip())
        return 0
    except (ValueError, IndexError):
        return 0

def is_generation_complete(message: str) -> bool:
    """Check if generation is complete based on message"""
    completion_indicators = [
        "All batches completed",
        "All subtopics completed",
        "Generation finished"
    ]
    return any(indicator in message for indicator in completion_indicators)

async def continuous_generator():
    """Main continuous generation loop"""
    global generator_state
    
    logger.info("🚀 Starting continuous batch generation")
    generator_state.update({
        "running": True,
        "paused": False,
        "start_time": datetime.now().isoformat(),
        "status": "running"
    })
    
    batch_count = 0
    consecutive_errors = 0
    
    try:
        while generator_state["running"] and not generator_state["paused"] and batch_count < MAX_BATCHES:
            batch_count += 1
            generator_state["current_batch"] = batch_count
            generator_state["last_activity"] = datetime.now().isoformat()
            
            logger.info(f"🔄 Starting Batch #{batch_count} at {datetime.now()}")
            
            try:
                # Get current status
                status = await get_batch_status()
                logger.info(f"📊 Current Status: {status}")
                
                # Check if already running
                if status.get("running", False):
                    logger.info("⏳ Generator already running, waiting...")
                    await asyncio.sleep(30)
                    continue
                
                # Check if generation is complete
                message = status.get("message", "")
                if is_generation_complete(message):
                    logger.info("🎉 ALL SUBTOPICS COMPLETED! Generation finished!")
                    generator_state["status"] = "completed"
                    break
                
                # Get next start position
                next_start = extract_next_start_position(message)
                generator_state["total_processed"] = next_start
                logger.info(f"📍 Starting from position: {next_start}")
                
                # Start next batch
                start_response = await start_batch(BATCH_SIZE, next_start)
                logger.info(f"🎯 Batch Start Response: {start_response}")
                
                if not start_response.get("success", False):
                    raise Exception(f"Failed to start batch: {start_response}")
                
                logger.info(f"✅ Batch #{batch_count} started successfully")
                consecutive_errors = 0  # Reset error counter on success
                
                # Wait for batch completion
                completion_success = await wait_for_batch_completion(batch_count)
                
                if not completion_success:
                    logger.warning(f"⚠️ Batch #{batch_count} did not complete successfully")
                    consecutive_errors += 1
                else:
                    # Sleep between successful batches
                    if generator_state["running"] and not generator_state["paused"]:
                        logger.info(f"💤 Sleeping {SLEEP_BETWEEN_BATCHES} seconds before next batch...")
                        await asyncio.sleep(SLEEP_BETWEEN_BATCHES)
                
            except Exception as e:
                consecutive_errors += 1
                generator_state["error_count"] += 1
                generator_state["last_error"] = str(e)
                logger.error(f"❌ Error in batch #{batch_count}: {e}")
                
                # Exponential backoff for consecutive errors
                if consecutive_errors >= 3:
                    wait_time = min(300, RESTART_DELAY * (2 ** (consecutive_errors - 3)))
                    logger.error(f"🚨 {consecutive_errors} consecutive errors, waiting {wait_time}s before retry")
                    await asyncio.sleep(wait_time)
                else:
                    await asyncio.sleep(RESTART_DELAY)
                
                # Reset consecutive errors if we've had too many
                if consecutive_errors >= 5:
                    logger.error("🚨 Too many consecutive errors, resetting...")
                    consecutive_errors = 0
                    await asyncio.sleep(300)  # Wait 5 minutes
            
            # Check if we should pause/stop
            if generator_state["paused"]:
                logger.info("⏸️ Generator paused by user")
                break
                
            if not generator_state["running"]:
                logger.info("🛑 Generator stopped by user")
                break
        
        # Check why we exited
        if batch_count >= MAX_BATCHES:
            logger.warning(f"⚠️ Reached maximum batch limit ({MAX_BATCHES})")
            generator_state["status"] = "max_batches_reached"
        elif generator_state["paused"]:
            generator_state["status"] = "paused"
        elif not generator_state["running"]:
            generator_state["status"] = "stopped"
        
    except Exception as e:
        logger.error(f"🚨 Fatal error in continuous generator: {e}")
        generator_state["error_count"] += 1
        generator_state["last_error"] = str(e)
        generator_state["status"] = "error"
    
    finally:
        generator_state["running"] = False
        logger.info("🏁 Continuous batch generation ended")

# API Endpoints

@app.get("/")
async def root():
    """Health check and service info"""
    return {
        "service": "Auto Batch Generator",
        "version": "1.0.0",
        "status": "healthy",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/status", response_model=GeneratorStatus)
async def get_status():
    """Get current generator status"""
    return GeneratorStatus(**generator_state)

@app.post("/start")
async def start_generator(request: StartRequest, background_tasks: BackgroundTasks):
    """Start the continuous batch generator"""
    if generator_state["running"] and not request.force_restart:
        raise HTTPException(status_code=409, detail="Generator is already running")
    
    if request.force_restart and generator_state["running"]:
        generator_state["running"] = False
        generator_state["paused"] = False
        await asyncio.sleep(2)  # Wait for current loop to stop
        generator_state["restart_count"] += 1
    
    # Update batch size if provided
    global BATCH_SIZE
    if request.batch_size:
        BATCH_SIZE = request.batch_size
    
    # Reset state
    generator_state.update({
        "running": False,
        "paused": False,
        "current_batch": 0,
        "status": "starting"
    })
    
    # Start in background
    background_tasks.add_task(continuous_generator)
    
    return {
        "success": True,
        "message": f"Continuous generator started with batch size {BATCH_SIZE}",
        "batch_size": BATCH_SIZE
    }

@app.post("/pause")
async def pause_generator():
    """Pause the generator (can be resumed)"""
    if not generator_state["running"]:
        raise HTTPException(status_code=409, detail="Generator is not running")
    
    generator_state["paused"] = True
    generator_state["status"] = "pausing"
    
    return {
        "success": True,
        "message": "Generator pause requested"
    }

@app.post("/resume")
async def resume_generator(background_tasks: BackgroundTasks):
    """Resume a paused generator"""
    if generator_state["running"] and not generator_state["paused"]:
        raise HTTPException(status_code=409, detail="Generator is already running")
    
    generator_state["paused"] = False
    
    if not generator_state["running"]:
        # Start fresh if not running
        generator_state["status"] = "resuming"
        background_tasks.add_task(continuous_generator)
    else:
        generator_state["status"] = "running"
    
    return {
        "success": True,
        "message": "Generator resumed"
    }

@app.post("/stop")
async def stop_generator():
    """Stop the generator completely"""
    generator_state["running"] = False
    generator_state["paused"] = False
    generator_state["status"] = "stopping"
    
    return {
        "success": True,
        "message": "Generator stop requested"
    }

@app.get("/health")
async def health_check():
    """Health check for Cloud Run"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "generator_running": generator_state["running"]
    }

if __name__ == "__main__":
    port = int(os.getenv("PORT", "8080"))
    uvicorn.run(app, host="0.0.0.0", port=port)