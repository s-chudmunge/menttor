import logging
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from fastapi import FastAPI, Depends, WebSocket, status
from core.config import settings
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

class COOPMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["Cross-Origin-Opener-Policy"] = "same-origin-allow-popups"
        return response

from core.websocket_manager import manager
from sqlmodel import Session

from database.session import create_db_and_tables, get_db
from sql_models import User, Roadmap, SpacedRepetition, QuizAttempt
from routers import auth, ml_insights, quiz, quiz_results, quiz_review, roadmaps, learn, spaced_repetition, models, quiz_submission, visualize, progress, behavioral, image_generation, activity, curated_roadmaps

# Configure logging with behavioral nudge filter
class BehavioralNudgeFilter(logging.Filter):
    """Filter to reduce noise from behavioral nudge requests"""
    def filter(self, record):
        message = record.getMessage()
        # Filter out behavioral nudge should-show requests from uvicorn access logs
        if "GET /behavioral/nudge/should-show/" in message and record.name == "uvicorn.access":
            return False
        return True

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Apply filter to uvicorn access logger to reduce behavioral nudge noise
uvicorn_access_logger = logging.getLogger("uvicorn.access")
uvicorn_access_logger.addFilter(BehavioralNudgeFilter())

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
logger.info(f"CORS allowed origins: {settings.cors_origins_list}")

app.add_middleware(COOPMiddleware)

@app.on_event("startup")
async def on_startup():
    """Startup event with resilient database initialization"""
    try:
        logger.info("Starting FastAPI application...")
        
        # Try to create database tables with timeout protection
        import asyncio
        from functools import partial
        
        # Run database creation in thread with timeout
        loop = asyncio.get_event_loop()
        
        try:
            # 30-second timeout for database operations
            await asyncio.wait_for(
                loop.run_in_executor(None, create_db_and_tables),
                timeout=30.0
            )
            logger.info("✅ Database tables created/checked successfully")
        except asyncio.TimeoutError:
            logger.warning("⚠️ Database table creation timed out - app will continue")
        except Exception as e:
            logger.warning(f"⚠️ Database initialization failed: {e} - app will continue")
            
        logger.info("🚀 FastAPI application startup completed")
        
    except Exception as e:
        logger.error(f"❌ Startup failed: {e}")
        # Don't crash the app, let it start anyway
        pass

app.include_router(auth.router)
app.include_router(ml_insights.router)
app.include_router(quiz.router)
app.include_router(quiz_results.router)
app.include_router(quiz_review.router)

app.include_router(roadmaps.router)
app.include_router(learn.router)
app.include_router(spaced_repetition.router)
app.include_router(models.router)
app.include_router(quiz_submission.router)
app.include_router(visualize.router)
app.include_router(progress.router)
app.include_router(behavioral.router)
app.include_router(activity.router)
app.include_router(image_generation.router, prefix="/images")
app.include_router(curated_roadmaps.router)

from core.auth import get_current_user_from_websocket
from database.session import get_db

@app.websocket("/ws/{token}")
async def websocket_endpoint(websocket: WebSocket, token: str, db: Session = Depends(get_db)):
    user = await get_current_user_from_websocket(token, db)
    if not user:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await manager.connect(websocket, user.id)
    try:
        while True:
            data = await websocket.receive_text()
            # For now, we'll just echo messages back to the same user
            await manager.broadcast_to_user(user.id, f"Message text was: {data}")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
    finally:
        manager.disconnect(websocket, user.id)

@app.get("/")
async def root():
    """Root endpoint for basic connectivity check"""
    return {"message": "Menttor API is running", "status": "ok"}

@app.get("/test-simple")
async def test_simple_endpoint():
    return {"message": "Simple test endpoint is working!"}

@app.get("/ready")
async def readiness_check():
    """Readiness check for deployment platforms"""
    return {"ready": True, "message": "Service is ready to accept traffic"}

@app.get("/health")
async def health_check():
    """Enhanced health check endpoint for deployment monitoring"""
    from datetime import datetime
    
    try:
        # Basic app health
        health_status = {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "database": "unknown"
        }
        
        # Quick database connectivity check
        try:
            db = next(get_db())
            # Simple query to test database
            result = db.exec("SELECT 1").first()
            health_status["database"] = "connected" if result else "error"
        except Exception as db_error:
            logger.warning(f"Database health check failed: {db_error}")
            health_status["database"] = "disconnected"
            health_status["status"] = "degraded"
        finally:
            try:
                db.close()
            except:
                pass
        
        return health_status
        
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {
            "status": "unhealthy", 
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }

def get_crud_db(db: Session):
    yield from get_db()

# Add CRUD routers for SQLModels



logger.info("FastAPI application started.")
