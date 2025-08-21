import logging
from dotenv import load_dotenv

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
from routers import auth, ml_insights, quiz, quiz_results, quiz_review, roadmaps, learn, spaced_repetition, models, quiz_submission, visualize, progress, behavioral, image_generation, activity

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

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
def on_startup():
    create_db_and_tables()
    logger.info("Database tables created/checked.")

app.include_router(auth.router)
app.include_router(ml_insights.router)
app.include_router(quiz.router)
app.include_router(quiz_results.router)
app.include_router(quiz_review.router)

app.include_router(roadmaps.router)
app.include_router(learn.router, prefix="/learn")
app.include_router(spaced_repetition.router)
app.include_router(models.router)
app.include_router(quiz_submission.router)
app.include_router(visualize.router)
app.include_router(progress.router)
app.include_router(behavioral.router)
app.include_router(activity.router)
app.include_router(image_generation.router, prefix="/images")

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

@app.get("/test-simple")
async def test_simple_endpoint():
    return {"message": "Simple test endpoint is working!"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

def get_crud_db(db: Session):
    yield from get_db()

# Add CRUD routers for SQLModels



logger.info("FastAPI application started.")
