import os
import requests
import logging
from typing import Optional
import asyncio
from concurrent.futures import ThreadPoolExecutor

logger = logging.getLogger(__name__)

class EmailService:
    def __init__(self):
        self.api_url = os.getenv("FRONTEND_URL", "http://localhost:3000") + "/api/send-email"
        self.executor = ThreadPoolExecutor(max_workers=2)
    
    def _send_email_sync(self, payload: dict) -> bool:
        """Synchronous email sending function for thread execution"""
        try:
            response = requests.post(
                self.api_url,
                json=payload,
                timeout=10,
                headers={'Content-Type': 'application/json'}
            )
            
            if response.status_code == 200:
                logger.info(f"Email sent successfully to {payload['to']}")
                return True
            else:
                logger.error(f"Failed to send email to {payload['to']}. Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            logger.error(f"Error sending email to {payload['to']}: {e}")
            return False
    
    async def send_welcome_email_async(self, user_email: str, user_name: Optional[str] = None) -> bool:
        """Send welcome email to newly registered user (async)"""
        if not user_email or user_email.endswith("@phone.auth"):
            logger.info(f"Skipping welcome email for phone auth user: {user_email}")
            return True
            
        payload = {
            "to": user_email,
            "subject": "Welcome to Menttor! 🚀",
            "template": "welcome",
            "userName": user_name or "there"
        }
        
        # Run in thread pool to avoid blocking
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(self.executor, self._send_email_sync, payload)
        return result
    
    def send_welcome_email_sync(self, user_email: str, user_name: Optional[str] = None) -> bool:
        """Send welcome email to newly registered user (sync)"""
        if not user_email or user_email.endswith("@phone.auth"):
            logger.info(f"Skipping welcome email for phone auth user: {user_email}")
            return True
            
        payload = {
            "to": user_email,
            "subject": "Welcome to Menttor! 🚀", 
            "template": "welcome",
            "userName": user_name or "there"
        }
        
        return self._send_email_sync(payload)

# Global email service instance
email_service = EmailService()