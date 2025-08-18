#!/usr/bin/env python3

import sys
import os

# Add the app directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from app.main import app
from fastapi.testclient import TestClient

def test_behavioral_endpoints():
    client = TestClient(app)
    
    print('Testing behavioral API endpoints...')
    
    # Test user stats endpoint
    try:
        response = client.get('/behavioral/user-stats?user_id=test-user-123')
        print(f'✓ Behavioral user-stats endpoint: {response.status_code}')
        if response.status_code != 200:
            print(f'  Response: {response.text[:300]}')
    except Exception as e:
        print(f'✗ Error testing user-stats: {e}')
    
    # Test session creation
    try:
        session_data = {'user_id': 'test-user-123', 'roadmap_id': 1, 'estimated_duration': 30}
        response = client.post('/behavioral/session/create', json=session_data)
        print(f'✓ Behavioral session creation: {response.status_code}')
        if response.status_code != 200:
            print(f'  Response: {response.text[:300]}')
    except Exception as e:
        print(f'✗ Error testing session creation: {e}')
    
    # Test XP award
    try:
        xp_data = {'user_id': 'test-user-123', 'action_type': 'quiz_completed', 'context': {'score': 0.8}}
        response = client.post('/behavioral/xp/award', json=xp_data)
        print(f'✓ XP award endpoint: {response.status_code}')
        if response.status_code != 200:
            print(f'  Response: {response.text[:300]}')
    except Exception as e:
        print(f'✗ Error testing XP award: {e}')
    
    # Test Elo ratings endpoint
    try:
        response = client.get('/behavioral/elo-ratings?user_id=test-user-123')
        print(f'✓ Elo ratings endpoint: {response.status_code}')
        if response.status_code != 200:
            print(f'  Response: {response.text[:300]}')
    except Exception as e:
        print(f'✗ Error testing Elo ratings: {e}')
    
    print('\nBehavioral API endpoint tests completed!')

if __name__ == '__main__':
    test_behavioral_endpoints()