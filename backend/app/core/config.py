import os
from pathlib import Path
from typing import Optional, List
from pydantic import computed_field, Field
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# Load .env as soon as this module is imported
load_dotenv(Path(__file__).resolve().parent.parent.parent / ".env")

class Settings(BaseSettings):
    # Database configuration - supports both individual params and full URL
    # Updated to use Aiven PostgreSQL for better reliability
    DATABASE_URL: Optional[str] = None
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_USER: str = ""
    POSTGRES_PASSWORD: str = ""
    POSTGRES_DB: str = ""
    REDIS_URL: str = "rediss://default:AfDaAAIncDEwNzhmZDg0ZDI5OTQ0YmNjODNkMmM0MDM2MzdhMzI3YXAxNjE2NTg@caring-goose-61658.upstash.io:6379"
    ENVIRONMENT: str = "development"
    SECRET_KEY: str
    
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    OPENROUTER_API_KEY: Optional[str] = None
    DATABASE_ECHO: bool = False
    AT_RISK_THRESHOLD: float = 0.2
    DEFAULT_QUIZ_TIME_LIMIT: int = 10
    GOOGLE_CLIENT_ID: str
    GOOGLE_CLIENT_SECRET: str
    HUGGINGFACE_HUB_TOKEN: Optional[str] = None
    HF_API_TOKEN: Optional[str] = None
    DISABLE_IMAGE_GENERATION: bool = False  # Set to True to disable image generation temporarily
    OPENAI_API_KEY: Optional[str] = None
    VERTEX_AI_PROJECT_ID: Optional[str] = None
    VERTEX_AI_REGION: Optional[str] = "us-central1"
    VERTEX_AI_MODEL_ID: Optional[str] = "gemini-2.5-flash-lite"
    
    # Default AI Models for different use cases - centralized configuration
    # Using gemini-2.5-flash-lite: Good balance of performance and cost
    DEFAULT_ROADMAP_MODEL: str = "gemini-2.5-flash-lite"
    DEFAULT_QUIZ_MODEL: str = "gemini-2.5-flash-lite"
    DEFAULT_FEEDBACK_MODEL: str = "gemini-2.5-flash-lite"
    DEFAULT_LEARNING_CONTENT_MODEL: str = "gemini-2.5-flash-lite"
    DEFAULT_VISUALIZATION_MODEL: str = "gemini-2.5-flash"
    
    # Learning Resources Model - using Gemini 2.5 Pro for higher quality resource generation
    DEFAULT_LEARNING_RESOURCES_MODEL: str = "gemini-2.5-pro"

    FIREBASE_CREDENTIALS: Optional[str] = None
    
    CORS_ALLOWED_ORIGINS: str = Field(
        default="http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000,http://127.0.0.1:3001",
        description="Comma-separated list of allowed CORS origins"
    )
    
    # Google Cloud Configuration (for other services)
    GOOGLE_CLOUD_PROJECT_ID: Optional[str] = None
    GOOGLE_APPLICATION_CREDENTIALS_JSON: Optional[str] = None

    @computed_field
    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ALLOWED_ORIGINS.split(",")]

    def get_database_url(self) -> str:
        import logging
        logger = logging.getLogger(__name__)
        
        # If DATABASE_URL is provided (for production), use it directly
        if self.DATABASE_URL:
            logger.info(f"Using DATABASE_URL: {self.DATABASE_URL[:50]}...")
            return self.DATABASE_URL
        
        # Check if using Cloud SQL Unix socket (starts with /cloudsql/)
        if self.POSTGRES_HOST.startswith("/cloudsql/"):
            # For Unix socket connections, use query parameter format
            url = f"postgresql+psycopg2://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@/{self.POSTGRES_DB}?host={self.POSTGRES_HOST}"
            logger.info(f"Using Cloud SQL Unix socket connection - Socket: {self.POSTGRES_HOST}, DB: {self.POSTGRES_DB}")
        else:
            # Standard TCP connection for development/other environments
            url = f"postgresql+psycopg2://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
            logger.info(f"Using TCP connection - Host: {self.POSTGRES_HOST}:{self.POSTGRES_PORT}, DB: {self.POSTGRES_DB}")
        
        return url

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"

settings = Settings()