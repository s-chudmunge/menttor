import logging
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from fastapi import FastAPI, Depends, WebSocket, status
from app.core.config import settings
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

class COOPMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["Cross-Origin-Opener-Policy"] = "same-origin-allow-popups"
        return response

from app.core.websocket_manager import manager
from sqlmodel import Session

from app.database.session import create_db_and_tables, get_db
from app.sql_models import User
from app.routers import health, roadmaps

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
)


app.add_middleware(COOPMiddleware)
app.include_router(health.router)
app.include_router(roadmaps.router)

@app.get("/")
async def root():
    """Root endpoint for basic connectivity check"""
    return {"message": "Menttor API is running", "status": "ok"}
