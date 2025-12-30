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
    REDIS_URL: Optional[str] = None
    ENVIRONMENT: str = "development"
    SECRET_KEY: str
    
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    OPENROUTER_API_KEY: Optional[str] = None
    DEEPSEEK_KEY: Optional[str] = None
    DATABASE_ECHO: bool = False
    AT_RISK_THRESHOLD: float = 0.2
    DEFAULT_QUIZ_TIME_LIMIT: int = 10

    # Supabase Configuration
    SUPABASE_URL: Optional[str] = None
    SUPABASE_KEY: Optional[str] = None
    SUPABASE_SERVICE_KEY: Optional[str] = None  # For admin operations

    # Google OAuth (Optional - for legacy support)
    GOOGLE_CLIENT_ID: Optional[str] = None
    GOOGLE_CLIENT_SECRET: Optional[str] = None

    HUGGINGFACE_HUB_TOKEN: Optional[str] = None
    HF_API_TOKEN: Optional[str] = None
    DISABLE_IMAGE_GENERATION: bool = False  # Set to True to disable image generation temporarily
    OPENAI_API_KEY: Optional[str] = None
    VERTEX_AI_PROJECT_ID: Optional[str] = None
    VERTEX_AI_REGION: Optional[str] = "us-central1"
    VERTEX_AI_MODEL_ID: Optional[str] = "gemini-2.5-flash-lite"
    
    # Default AI Models for different use cases - centralized configuration
    # Using Google Gemma 3n 2B (free) from OpenRouter as the default model
    DEFAULT_ROADMAP_MODEL: str = "deepseek:deepseek/deepseek-chat"
    DEFAULT_QUIZ_MODEL: str = "openrouter:google/gemma-3n-e2b-it:free"
    DEFAULT_FEEDBACK_MODEL: str = "openrouter:google/gemma-3n-e2b-it:free"
    DEFAULT_LEARNING_CONTENT_MODEL: str = "openrouter:google/gemma-3n-e2b-it:free"
    DEFAULT_VISUALIZATION_MODEL: str = "openrouter:google/gemma-3n-e2b-it:free"
    DEFAULT_LEARNING_RESOURCES_MODEL: str = "openrouter:google/gemma-3n-e2b-it:free"

    FIREBASE_CREDENTIALS: Optional[str] = None  # Legacy - can be removed after migration
    
    CORS_ALLOWED_ORIGINS: str = Field(
        default="http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000,http://127.0.0.1:3001,https://menttor.live,https://www.menttor.live,http://menttor.live,http://www.menttor.live",
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
            url = self.DATABASE_URL
            # Fix postgres:// to postgresql+psycopg2:// for SQLAlchemy
            if url.startswith("postgres://"):
                url = url.replace("postgres://", "postgresql+psycopg2://", 1)
            logger.info(f"Using DATABASE_URL: {url[:50]}...")
            return url
        
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

import logging
logging.basicConfig(level=logging.INFO)
logging.info(f"OpenRouter API Key Loaded: {'*' * (len(settings.OPENROUTER_API_KEY) - 4) + settings.OPENROUTER_API_KEY[-4:] if settings.OPENROUTER_API_KEY else 'Not Set'}")

