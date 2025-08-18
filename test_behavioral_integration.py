#!/usr/bin/env python3
"""
Test script to verify behavioral integration with learning endpoints
"""

import requests
import time

BASE_URL = "http://localhost:8000"

def test_learning_endpoints():
    """Test the new learning endpoints with behavioral tracking"""
    
    # First, test getting learning content (which should now track XP)
    print("Testing learning content with behavioral tracking...")
    
    try:
        # Test learning content endpoint
        response = requests.get(f"{BASE_URL}/ml/learn", 
                              params={
                                  "subtopic": "Introduction to Python", 
                                  "subtopic_id": "intro-python-basics"
                              },
                              headers={"Authorization": "Bearer test_token"})
        
        if response.status_code == 200:
            print("✅ Learning content endpoint works")
            data = response.json()
            
            # Check if behavioral data is included
            if 'behavioral_data' in data:
                print("✅ Behavioral data included in response")
                behavioral = data['behavioral_data']
                print(f"   XP Earned: {behavioral.get('xp_earned', 0)}")
                print(f"   Total XP: {behavioral.get('total_xp', 0)}")
                print(f"   Current Level: {behavioral.get('current_level', 1)}")
                print(f"   Current Streak: {behavioral.get('current_streak', 1)}")
                print(f"   Level Up: {behavioral.get('level_up', False)}")
                print(f"   Milestone Completed: {behavioral.get('milestone_completed', False)}")
            else:
                print("⚠️  No behavioral data in response")
        else:
            print(f"❌ Learning content endpoint failed: {response.status_code}")
            print(response.text)
    except Exception as e:
        print(f"❌ Error testing learning endpoint: {e}")
    
    # Test time tracking endpoint
    print("\nTesting time tracking endpoint...")
    
    try:
        response = requests.post(f"{BASE_URL}/track-time",
                               json={
                                   "subtopic_id": "intro-python-basics",
                                   "time_spent_minutes": 5
                               },
                               headers={"Authorization": "Bearer test_token"})
        
        if response.status_code == 200:
            print("✅ Time tracking endpoint works")
            data = response.json()
            print(f"   XP Earned: {data.get('xp_earned', 0)}")
            print(f"   Total XP: {data.get('total_xp', 0)}")
        elif response.status_code == 404:
            print("⚠️  Time tracking endpoint failed: Roadmap not found (expected for test user)")
        else:
            print(f"❌ Time tracking endpoint failed: {response.status_code}")
            print(response.text)
    except Exception as e:
        print(f"❌ Error testing time tracking: {e}")
    
    # Test completion endpoint
    print("\nTesting completion endpoint...")
    
    try:
        response = requests.post(f"{BASE_URL}/complete-learning",
                               json={
                                   "subtopic_id": "intro-python-basics",
                                   "time_spent_minutes": 10
                               },
                               headers={"Authorization": "Bearer test_token"})
        
        if response.status_code == 200:
            print("✅ Completion endpoint works")
            data = response.json()
            behavioral = data.get('behavioral_data', {})
            print(f"   XP Earned: {behavioral.get('xp_earned', 0)}")
            print(f"   Total XP: {behavioral.get('total_xp', 0)}")
            print(f"   Current Level: {behavioral.get('current_level', 1)}")
            print(f"   Current Streak: {behavioral.get('current_streak', 1)}")
            print(f"   Milestone Completed: {behavioral.get('milestone_completed', False)}")
            print(f"   Reward Triggered: {behavioral.get('reward_triggered', False)}")
        elif response.status_code == 404:
            print("⚠️  Completion endpoint failed: Roadmap not found (expected for test user)")
        else:
            print(f"❌ Completion endpoint failed: {response.status_code}")
            print(response.text)
    except Exception as e:
        print(f"❌ Error testing completion endpoint: {e}")
    
    # Test behavioral stats endpoint
    print("\nTesting behavioral stats endpoint...")
    
    try:
        response = requests.get(f"{BASE_URL}/behavioral/user-stats",
                              headers={"Authorization": "Bearer test_token"})
        
        if response.status_code == 200:
            print("✅ Behavioral stats endpoint works")
            data = response.json()
            
            xp_stats = data.get('xp_stats', {})
            streak_stats = data.get('streak_stats', {})
            engagement_stats = data.get('engagement_stats', {})
            
            print(f"   Total XP: {xp_stats.get('total_xp', 0)}")
            print(f"   Current Level: {xp_stats.get('current_level', 1)}")
            print(f"   Current Streak: {streak_stats.get('current_streak', 0)}")
            print(f"   Longest Streak: {streak_stats.get('longest_streak', 0)}")
            print(f"   Momentum Score: {engagement_stats.get('momentum_score', 0)}")
            print(f"   Total Rewards: {engagement_stats.get('total_rewards', 0)}")
        else:
            print(f"❌ Behavioral stats endpoint failed: {response.status_code}")
            print(response.text)
    except Exception as e:
        print(f"❌ Error testing behavioral stats: {e}")

if __name__ == "__main__":
    print("🚀 Testing Behavioral Integration with Learning Endpoints")
    print("=" * 60)
    test_learning_endpoints()
    print("\n" + "=" * 60)
    print("✨ Test completed!")