#!/usr/bin/env python3
"""
Test script for Google Cloud SQL connection
Run this to verify your Cloud SQL Auth Proxy setup is working
"""

import os
import sys
import logging
from pathlib import Path

# Add the app directory to Python path
sys.path.insert(0, str(Path(__file__).parent / 'app'))

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_cloud_sql_connection():
    """Test the Cloud SQL connection"""
    print("🔧 Testing Google Cloud SQL connection...")
    print(f"USE_CLOUD_SQL_AUTH_PROXY: {os.getenv('USE_CLOUD_SQL_AUTH_PROXY', 'false')}")
    print(f"GOOGLE_CLOUD_PROJECT_ID: {os.getenv('GOOGLE_CLOUD_PROJECT_ID', 'not set')}")
    print(f"CLOUD_SQL_INSTANCE_NAME: {os.getenv('CLOUD_SQL_INSTANCE_NAME', 'menttor-db-instance')}")
    
    try:
        # Test import of Cloud SQL module
        from database.cloud_sql import cloud_sql_connector
        print("✅ Cloud SQL module imported successfully")
        
        # Test creating engine
        engine = cloud_sql_connector.create_cloud_sql_engine()
        print("✅ Cloud SQL engine created successfully")
        
        # Test connection
        with engine.connect() as conn:
            result = conn.execute("SELECT version();")
            version = result.fetchone()
            print(f"✅ Database connection successful!")
            print(f"Database version: {version[0] if version else 'Unknown'}")
        
        return True
        
    except ImportError as e:
        print(f"❌ Import error: {e}")
        print("Make sure you've installed the required dependencies:")
        print("pip install google-cloud-sql-connector pg8000")
        return False
        
    except Exception as e:
        print(f"❌ Connection error: {e}")
        print("\nTroubleshooting steps:")
        print("1. Check your GOOGLE_APPLICATION_CREDENTIALS_JSON is valid JSON")
        print("2. Verify your service account has Cloud SQL Client role")
        print("3. Ensure the Cloud SQL instance name and project ID are correct")
        print("4. Check that the database user and password are correct")
        return False

def test_fallback_connection():
    """Test the fallback direct connection"""
    print("\n🔧 Testing fallback direct connection...")
    
    try:
        from database.session import engine
        print("✅ Direct connection engine created successfully")
        
        # Test connection
        with engine.connect() as conn:
            result = conn.execute("SELECT version();")
            version = result.fetchone()
            print(f"✅ Direct database connection successful!")
            print(f"Database version: {version[0] if version else 'Unknown'}")
        
        return True
        
    except Exception as e:
        print(f"❌ Direct connection error: {e}")
        return False

if __name__ == "__main__":
    print("Menttor Backend - Database Connection Test")
    print("=" * 50)
    
    # Load environment variables
    from dotenv import load_dotenv
    load_dotenv()
    
    success = False
    
    # Test Cloud SQL connection if enabled
    if os.getenv('USE_CLOUD_SQL_AUTH_PROXY', 'false').lower() == 'true':
        success = test_cloud_sql_connection()
    
    # Test fallback connection
    if not success:
        print("\nTrying fallback connection...")
        success = test_fallback_connection()
    
    if success:
        print("\n✅ Database connection test completed successfully!")
        sys.exit(0)
    else:
        print("\n❌ Database connection test failed!")
        sys.exit(1)