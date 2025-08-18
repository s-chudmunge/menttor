#!/usr/bin/env python3

import sys
import os

# Add the app directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

def test_behavioral_imports():
    print('Testing behavioral system imports...')
    
    try:
        from app.routers.behavioral import router
        print('✓ Behavioral router imported successfully')
        
        # Check if routes are defined
        routes = [route.path for route in router.routes]
        print(f'✓ Found {len(routes)} behavioral routes:')
        for route in routes[:10]:  # Show first 10 routes
            print(f'  - {route}')
        if len(routes) > 10:
            print(f'  ... and {len(routes) - 10} more routes')
            
    except Exception as e:
        print(f'✗ Error importing behavioral router: {e}')
    
    try:
        from app.services.behavioral_service import BehavioralService
        print('✓ Behavioral service imported successfully')
    except Exception as e:
        print(f'✗ Error importing behavioral service: {e}')
    
    try:
        from app.sql_models import UserBehavior, ConceptElo, LearningSession
        print('✓ Behavioral SQL models imported successfully')
    except Exception as e:
        print(f'✗ Error importing behavioral models: {e}')

def test_main_app():
    print('\nTesting main app configuration...')
    
    try:
        from app.main import app
        print('✓ Main FastAPI app imported successfully')
        
        # Check if behavioral routes are included
        all_routes = []
        for route in app.routes:
            if hasattr(route, 'path'):
                all_routes.append(route.path)
        
        behavioral_routes = [r for r in all_routes if '/behavioral' in r]
        print(f'✓ Found {len(behavioral_routes)} behavioral routes in main app')
        
    except Exception as e:
        print(f'✗ Error testing main app: {e}')

if __name__ == '__main__':
    test_behavioral_imports()
    test_main_app()