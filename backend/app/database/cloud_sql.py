import os
import json
import logging
from typing import Optional
from sqlalchemy import create_engine, Engine
from google.cloud.sql.connector import Connector
import asyncpg
import asyncio

logger = logging.getLogger(__name__)

class CloudSQLConnector:
    """Google Cloud SQL Auth Proxy connector for secure database connections"""
    
    def __init__(self):
        self.connector = None
        self.engine = None
        
    def initialize_connector(self) -> Optional[Connector]:
        """Initialize Google Cloud SQL Connector with service account credentials"""
        try:
            # Get credentials from environment variable
            credentials_json = os.getenv('GOOGLE_APPLICATION_CREDENTIALS_JSON')
            if not credentials_json:
                logger.warning("GOOGLE_APPLICATION_CREDENTIALS_JSON not found, falling back to default authentication")
                return None
            
            # Parse JSON credentials and write to temporary file
            credentials_dict = json.loads(credentials_json)
            
            # Create temporary credentials file
            temp_credentials_path = '/tmp/google_credentials.json'
            with open(temp_credentials_path, 'w') as f:
                json.dump(credentials_dict, f)
            
            # Set the environment variable for Google Cloud SDK
            os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = temp_credentials_path
            
            # Initialize connector
            self.connector = Connector()
            logger.info("Google Cloud SQL Connector initialized successfully")
            return self.connector
            
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON in GOOGLE_APPLICATION_CREDENTIALS_JSON: {e}")
            return None
        except Exception as e:
            logger.error(f"Failed to initialize Cloud SQL Connector: {e}")
            return None
    
    def get_connection_string(self) -> str:
        """Get the appropriate database connection string"""
        # Cloud SQL instance details
        instance_name = os.getenv('CLOUD_SQL_INSTANCE_NAME', 'menttor-db-instance')
        project_id = os.getenv('GOOGLE_CLOUD_PROJECT_ID')
        region = os.getenv('CLOUD_SQL_REGION', 'asia-south1')  # Adjust based on your region
        
        db_user = os.getenv('POSTGRES_USER', 'admin-db')
        db_password = os.getenv('POSTGRES_PASSWORD', 'tyson2012')
        db_name = os.getenv('POSTGRES_DB', 'menttor-db')
        
        if not project_id:
            logger.error("GOOGLE_CLOUD_PROJECT_ID environment variable is required")
            raise ValueError("GOOGLE_CLOUD_PROJECT_ID environment variable is required")
        
        # Cloud SQL connection name format: project:region:instance
        connection_name = f"{project_id}:{region}:{instance_name}"
        
        # For Cloud SQL Proxy, we use a special connection string
        # The connector will handle the authentication and proxy setup
        return f"postgresql+psycopg://{db_user}:{db_password}@/{db_name}?host=/cloudsql/{connection_name}"
    
    def create_cloud_sql_engine(self) -> Engine:
        """Create SQLAlchemy engine with Cloud SQL Auth Proxy"""
        try:
            connector = self.initialize_connector()
            
            if not connector:
                # Fall back to direct connection if Cloud SQL Connector is not available
                logger.warning("Cloud SQL Connector not available, using direct connection")
                return self._create_direct_engine()
            
            # Cloud SQL instance connection details
            project_id = os.getenv('GOOGLE_CLOUD_PROJECT_ID')
            region = os.getenv('CLOUD_SQL_REGION', 'asia-south1')
            instance_name = os.getenv('CLOUD_SQL_INSTANCE_NAME', 'menttor-db-instance')
            
            db_user = os.getenv('POSTGRES_USER', 'admin-db')
            db_password = os.getenv('POSTGRES_PASSWORD', 'tyson2012')
            db_name = os.getenv('POSTGRES_DB', 'menttor-db')
            
            connection_name = f"{project_id}:{region}:{instance_name}"
            
            def get_conn():
                """Connection factory for SQLAlchemy"""
                conn = connector.connect(
                    connection_name,
                    "pg8000",  # Using pg8000 driver
                    user=db_user,
                    password=db_password,
                    db=db_name
                )
                return conn
            
            # Create engine with custom connection factory
            engine = create_engine(
                "postgresql+pg8000://",
                creator=get_conn,
                pool_size=10,
                max_overflow=20,
                pool_recycle=3600,
                pool_pre_ping=True,
                pool_timeout=30,
                connect_args={
                    "application_name": "menttorlabs_backend",
                }
            )
            
            logger.info("Cloud SQL engine created successfully")
            return engine
            
        except Exception as e:
            logger.error(f"Failed to create Cloud SQL engine: {e}")
            logger.info("Falling back to direct connection")
            return self._create_direct_engine()
    
    def _create_direct_engine(self) -> Engine:
        """Create SQLAlchemy engine with direct connection (fallback)"""
        from core.config import settings
        
        engine = create_engine(
            settings.get_database_url(),
            echo=settings.DATABASE_ECHO,
            pool_size=20,
            max_overflow=30,
            pool_recycle=3600,
            pool_pre_ping=True,
            pool_timeout=30,
            connect_args={
                "connect_timeout": 30,
                "application_name": "menttorlabs_backend",
                "options": "-c statement_timeout=60000"
            }
        )
        
        logger.info("Direct connection engine created")
        return engine
    
    def close(self):
        """Close the connector"""
        if self.connector:
            self.connector.close()
            self.connector = None

# Global connector instance
cloud_sql_connector = CloudSQLConnector()