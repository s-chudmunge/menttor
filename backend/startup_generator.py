#!/usr/bin/env python3
"""
Startup script to automatically trigger subtopic generation
Can be called from Cloud Run startup or scheduled tasks
"""

import asyncio
import logging
import httpx
import os
import time

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def trigger_generation():
    """Trigger subtopic generation via API"""
    backend_url = os.getenv('BACKEND_URL', 'http://localhost:8000')
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            # Check status first
            status_response = await client.get(f"{backend_url}/subtopic-generator/status")
            status_data = status_response.json()
            
            logger.info(f"Current status: {status_data}")
            
            if status_data.get('running'):
                logger.info("Generation already running, skipping trigger")
                return
            
            # Trigger generation
            logger.info("Triggering subtopic generation...")
            trigger_response = await client.get(f"{backend_url}/subtopic-generator/trigger-single")
            result = trigger_response.json()
            
            if result.get('success'):
                logger.info(f"✅ Successfully triggered: {result['message']}")
                
                # Wait a bit and check final status
                await asyncio.sleep(30)  # Wait 30 seconds
                
                final_status = await client.get(f"{backend_url}/subtopic-generator/status")
                final_data = final_status.json()
                logger.info(f"Final status: {final_data}")
                
            else:
                logger.error(f"❌ Failed to trigger: {result.get('message')}")
                
    except Exception as e:
        logger.error(f"Error triggering generation: {e}")

if __name__ == "__main__":
    asyncio.run(trigger_generation())