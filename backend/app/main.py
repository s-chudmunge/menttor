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
# Import new models conditionally
try:
    from sql_models import RoadmapResource
    print("✅ RoadmapResource model imported")
except ImportError as e:
    print(f"⚠️  RoadmapResource model not available: {e}")
from routers import auth, ml_insights, quiz, quiz_results, quiz_review, roadmaps, learn, spaced_repetition, models, quiz_submission, visualize, progress, behavioral, image_generation, activity, curated_roadmaps, monitoring, video_generation, promotional_images, static_data, practice, admin, health, admin_management, library, db_test, subtopic_generator_api

# Import learning_resources with error handling for deployment
try:
    from routers import learning_resources
    LEARNING_RESOURCES_AVAILABLE = True
    print("✅ Learning resources router imported successfully")
except ImportError as e:
    print(f"⚠️  Warning: Learning resources router not available: {e}")
    LEARNING_RESOURCES_AVAILABLE = False
except Exception as e:
    print(f"⚠️  Error importing learning resources router: {e}")
    LEARNING_RESOURCES_AVAILABLE = False

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
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
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
        
        # Initialize database monitoring and optimization systems
        try:
            from database.monitor import db_monitor
            from database.cache import query_cache
            from database.batch import batch_processor
            
            logger.info("📊 Database monitoring systems initialized")
            logger.info(f"🗄️  Query cache: {query_cache.max_size} entries max")
            logger.info(f"📦 Batch processor: {batch_processor.batch_size} operations per batch")
            
        except Exception as e:
            logger.warning(f"⚠️ Monitoring systems initialization failed: {e}")
            
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
app.include_router(video_generation.router)
app.include_router(promotional_images.router)
app.include_router(curated_roadmaps.router)
if LEARNING_RESOURCES_AVAILABLE:
    app.include_router(learning_resources.router, prefix="/learning-resources")
    print("✅ Learning resources router registered")
else:
    print("⚠️  Learning resources router skipped due to import error")
app.include_router(health.router)
app.include_router(static_data.router)
app.include_router(monitoring.router)
app.include_router(practice.router)
app.include_router(admin.router)
app.include_router(admin_management.router)
app.include_router(library.router)
app.include_router(subtopic_generator_api.router)
app.include_router(db_test.router)

# Temporary migration endpoint
from migration_endpoint import migration_router
app.include_router(migration_router)

# Temporary database test endpoint
@app.get("/test-db")
async def test_database():
    """Test database connectivity"""
    try:
        from database.session import engine
        from sqlalchemy import text
        
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1 as test"))
            data = result.fetchone()
            
            # Test table existence
            tables_result = conn.execute(text("""
                SELECT COUNT(*) as table_count 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
            """))
            table_count = tables_result.fetchone()[0]
            
            return {
                "status": "success",
                "message": "Database connection working!",
                "test_query": data[0],
                "tables_count": table_count
            }
            
    except Exception as e:
        return {
            "status": "error", 
            "message": f"Database connection failed: {str(e)}"
        }

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
        
        # Quick database connectivity check with proper session management
        try:
            from sqlmodel import text
            db_session = next(get_db())
            try:
                # Simple query to test database
                result = db_session.exec(text("SELECT 1")).first()
                health_status["database"] = "connected" if result else "error"
            finally:
                db_session.close()
        except Exception as db_error:
            logger.warning(f"Database health check failed: {db_error}")
            health_status["database"] = "disconnected"
            health_status["status"] = "degraded"
        
        return health_status
        
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {
            "status": "unhealthy", 
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }

@app.get("/pool-status")
async def pool_status():
    """Connection pool monitoring endpoint"""
    try:
        from database.session import get_pool_status
        from datetime import datetime
        
        pool_info = get_pool_status()
        
        # Add timestamp and calculate metrics
        pool_info.update({
            "timestamp": datetime.utcnow().isoformat(),
            "total_connections": pool_info["checked_in"] + pool_info["checked_out"],
            "utilization_pct": round((pool_info["checked_out"] / max(pool_info["pool_size"], 1)) * 100, 2),
            "available_connections": pool_info["pool_size"] - pool_info["checked_out"],
            "status": "ok" if pool_info["checked_out"] < pool_info["pool_size"] * 0.8 else "high_usage"
        })
        
        return pool_info
        
    except Exception as e:
        logger.error(f"Pool status check failed: {e}")
        return {
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }

def get_crud_db(db: Session):
    yield from get_db()

# Add CRUD routers for SQLModels



logger.info("FastAPI application started.")
# Privacy policy deployment trigger - updated frontend privacy page
# Fixed Redis URL scheme and removed deprecated reward engagement endpoint
# Updated CI/CD workflow to use Artifact Registry with proper permissions
# Testing CI/CD pipeline with clean service account JSON key
# Deploy trigger comment
# Another deploy trigger
# Deploy with fixed permissions
# Deploy with corrected database password
# Deploy with password without newline
# Deploy trigger - Fixed authentication and environment variables for Cloud Run
# Deploy trigger - Add library endpoints for neural network architectures content regeneration
