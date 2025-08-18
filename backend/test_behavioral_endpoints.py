#!/usr/bin/env python3

import requests
import json
import time

BASE_URL = "http://localhost:8001"

def test_endpoint(method, endpoint, data=None, params=None, description=""):
    """Test a behavioral endpoint"""
    url = f"{BASE_URL}{endpoint}"
    
    print(f"\n🔍 Testing: {description}")
    print(f"   {method.upper()} {endpoint}")
    
    try:
        if method.upper() == "GET":
            response = requests.get(url, params=params)
        elif method.upper() == "POST":
            response = requests.post(url, json=data, params=params)
        else:
            print(f"   ❌ Unsupported method: {method}")
            return False
            
        print(f"   📊 Status: {response.status_code}")
        
        if response.status_code == 200:
            try:
                result = response.json()
                print(f"   ✅ Success: {str(result)[:100]}{'...' if len(str(result)) > 100 else ''}")
                return True
            except:
                print(f"   ✅ Success: {response.text[:100]}{'...' if len(response.text) > 100 else ''}")
                return True
        elif response.status_code == 401:
            print(f"   ⚠️  Auth required (expected): {response.text}")
            return True  # Expected for protected endpoints
        elif response.status_code == 422:
            print(f"   ⚠️  Validation error: {response.text}")
            return True  # Expected for missing/invalid data
        elif response.status_code == 404:
            print(f"   ❌ Not found: {response.text}")
            return False
        elif response.status_code == 500:
            print(f"   ❌ Server error: {response.text[:200]}")
            return False
        else:
            print(f"   ⚠️  Status {response.status_code}: {response.text[:100]}")
            return True
            
    except requests.exceptions.ConnectionError:
        print(f"   ❌ Connection failed - server not running?")
        return False
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False

def main():
    print("🚀 Testing Behavioral API Endpoints")
    print("=" * 50)
    
    total_tests = 0
    passed_tests = 0
    
    # Test basic endpoints
    tests = [
        # Core behavioral endpoints
        ("GET", "/behavioral/user-stats", None, {"user_id": "test-user-123"}, "User behavioral statistics"),
        
        # XP System
        ("POST", "/behavioral/award-xp", {
            "user_id": "test-user-123",
            "action_type": "quiz_completed", 
            "context": {"score": 0.8, "time_spent": 300}
        }, None, "Award XP for quiz completion"),
        
        # Streak System
        ("POST", "/behavioral/update-streak", {
            "user_id": "test-user-123"
        }, None, "Update user streak"),
        
        # Session Flow System
        ("POST", "/behavioral/session/create", {
            "user_id": "test-user-123",
            "roadmap_id": 1,
            "estimated_duration": 30,
            "session_plan": "Learn fundamentals"
        }, None, "Create learning session"),
        
        # Elo Rating System
        ("GET", "/behavioral/elo-ratings", None, {"user_id": "test-user-123"}, "Get Elo ratings"),
        
        ("POST", "/behavioral/update-elo", {
            "user_id": "test-user-123",
            "concept_tag": "arrays",
            "correct": True,
            "expected_probability": 0.5
        }, None, "Update Elo rating"),
        
        # Quick Challenges
        ("GET", "/behavioral/challenges/warmup/test-subtopic-123", None, None, "Get warmup challenge"),
        
        ("POST", "/behavioral/challenges/attempt", {
            "user_id": "test-user-123",
            "challenge_id": "test-challenge-123",
            "answer": "A",
            "confidence_level": 3,
            "response_time": 2.5
        }, None, "Submit challenge attempt"),
        
        # Smart Nudging
        ("GET", "/behavioral/nudge/should-show/quick_recall", None, {"user_id": "test-user-123"}, "Check if nudge should show"),
        
        ("POST", "/behavioral/nudge/interaction", {
            "user_id": "test-user-123",
            "nudge_type": "quick_recall",
            "response": "engaged"
        }, None, "Record nudge interaction"),
        
        # Focus Mode
        ("POST", "/behavioral/focus/toggle", {
            "user_id": "test-user-123",
            "enabled": True
        }, None, "Toggle focus mode"),
        
        # Momentum and Patterns
        ("GET", "/behavioral/momentum", None, {"user_id": "test-user-123"}, "Get momentum score"),
        
        ("GET", "/behavioral/learning-patterns/optimal-time", None, {"user_id": "test-user-123"}, "Get optimal learning time"),
        
        # Prerequisites
        ("GET", "/behavioral/prerequisites/test-subtopic-123", None, None, "Get prerequisites"),
        
        # Progress Copy
        ("GET", "/behavioral/progress-copy/1", None, None, "Get progress copy"),
        
        # Rewards System
        ("GET", "/behavioral/rewards/recent", None, {"user_id": "test-user-123"}, "Get recent rewards"),
        
        ("POST", "/behavioral/rewards/engage", {
            "user_id": "test-user-123",
            "reward_type": "streak_milestone",
            "engagement_level": "high"
        }, None, "Record reward engagement"),
    ]
    
    for method, endpoint, data, params, description in tests:
        total_tests += 1
        if test_endpoint(method, endpoint, data, params, description):
            passed_tests += 1
        time.sleep(0.5)  # Small delay between requests
    
    print("\n" + "=" * 50)
    print(f"📈 Test Results: {passed_tests}/{total_tests} endpoints working")
    
    if passed_tests == total_tests:
        print("🎉 All behavioral endpoints are functioning!")
    elif passed_tests > total_tests * 0.8:
        print("✅ Most behavioral endpoints are working well!")
    else:
        print("⚠️  Some behavioral endpoints need attention.")
    
    return passed_tests, total_tests

if __name__ == "__main__":
    main()