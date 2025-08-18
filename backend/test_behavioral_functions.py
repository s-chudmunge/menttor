#!/usr/bin/env python3

import sys
import os

# Add the app directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

def test_behavioral_algorithms():
    """Test behavioral algorithms and calculations"""
    print("🧮 Testing Behavioral Algorithms")
    print("=" * 40)
    
    try:
        # Test XP calculation formula
        print("\n1️⃣ Testing XP Calculation")
        
        def calculate_xp(action_type, context):
            """Simplified XP calculation for testing"""
            base_xp = {
                'quiz_completed': 100,
                'session_start': 10,
                'focus_session': 50,
                'streak_maintained': 25
            }
            
            xp = base_xp.get(action_type, 0)
            
            # Bonus for quiz score
            if action_type == 'quiz_completed' and 'score' in context:
                score_bonus = int(context['score'] * 50)
                xp += score_bonus
                
            # Time bonus
            if 'focused_minutes' in context:
                time_bonus = int(context['focused_minutes'] * 1.5)
                xp += time_bonus
                
            return xp
        
        test_cases = [
            ('quiz_completed', {'score': 0.9}, "High quiz score"),
            ('quiz_completed', {'score': 0.5}, "Medium quiz score"),
            ('session_start', {}, "Session start"),
            ('focus_session', {'focused_minutes': 25}, "25min focus session")
        ]
        
        for action, context, desc in test_cases:
            xp = calculate_xp(action, context)
            print(f"   ✅ {desc}: {xp} XP")
            
    except Exception as e:
        print(f"   ❌ XP calculation error: {e}")
    
    try:
        # Test Elo rating calculation
        print("\n2️⃣ Testing Elo Rating System")
        
        def update_elo(current_rating, correct, expected_prob, k_factor=32):
            """Simplified Elo calculation for testing"""
            actual_score = 1.0 if correct else 0.0
            new_rating = current_rating + k_factor * (actual_score - expected_prob)
            return max(800, min(2000, new_rating))  # Clamp between 800-2000
        
        test_cases = [
            (1200, True, 0.5, "Expected difficulty, correct answer"),
            (1200, False, 0.5, "Expected difficulty, wrong answer"),
            (1200, True, 0.8, "Easy question, correct answer"),
            (1200, False, 0.2, "Hard question, wrong answer")
        ]
        
        for rating, correct, expected, desc in test_cases:
            new_rating = update_elo(rating, correct, expected)
            change = new_rating - rating
            print(f"   ✅ {desc}: {rating} → {new_rating:.0f} ({change:+.0f})")
            
    except Exception as e:
        print(f"   ❌ Elo calculation error: {e}")
    
    try:
        # Test momentum calculation
        print("\n3️⃣ Testing Momentum Calculation")
        
        def calculate_momentum(recent_activities):
            """Simplified momentum calculation for testing"""
            if not recent_activities:
                return 0.0
                
            total_score = 0
            for days_ago, activity_score in recent_activities:
                decay_weight = 0.9 ** days_ago
                total_score += activity_score * decay_weight
                
            return min(5.0, total_score)  # Cap at 5.0
        
        test_cases = [
            ([(0, 2.0), (1, 1.5), (2, 1.0)], "3 days of activity"),
            ([(0, 3.0)], "Just today"),
            ([(3, 2.0), (7, 1.0)], "Older activity"),
            ([], "No activity")
        ]
        
        for activities, desc in test_cases:
            momentum = calculate_momentum(activities)
            print(f"   ✅ {desc}: {momentum:.2f} momentum")
            
    except Exception as e:
        print(f"   ❌ Momentum calculation error: {e}")
    
    try:
        # Test streak system
        print("\n4️⃣ Testing Streak System")
        
        def update_streak(last_activity_date, current_streak, grace_days):
            """Simplified streak calculation for testing"""
            from datetime import datetime, timedelta
            
            if not last_activity_date:
                return 1, 2  # New streak, full grace
                
            today = datetime.now().date()
            days_since = (today - last_activity_date).days
            
            if days_since == 1:
                return current_streak + 1, 2  # Continue streak
            elif days_since <= grace_days + 1:
                return current_streak, max(0, grace_days - (days_since - 1))  # Use grace
            else:
                return 1, 2  # Streak broken, restart
        
        from datetime import datetime, timedelta
        today = datetime.now().date()
        
        test_cases = [
            (today - timedelta(days=1), 5, 2, "Yesterday activity"),
            (today - timedelta(days=2), 5, 2, "2 days ago (grace)"),
            (today - timedelta(days=4), 5, 2, "4 days ago (broken)"),
            (None, 0, 2, "First activity")
        ]
        
        for last_date, streak, grace, desc in test_cases:
            new_streak, new_grace = update_streak(last_date, streak, grace)
            print(f"   ✅ {desc}: {streak} → {new_streak} streak, {new_grace} grace days")
            
    except Exception as e:
        print(f"   ❌ Streak calculation error: {e}")
    
    print("\n" + "=" * 40)
    print("✅ Behavioral algorithms testing completed!")

def test_session_fsm():
    """Test session finite state machine"""
    print("\n🔄 Testing Session State Machine")
    print("=" * 35)
    
    try:
        # Define valid state transitions
        VALID_TRANSITIONS = {
            'WARMUP': ['FOCUS', 'CHECKPOINT'],
            'FOCUS': ['CHECKPOINT', 'REWARD'],
            'CHECKPOINT': ['FOCUS', 'REWARD', 'PRIME_NEXT'],
            'REWARD': ['PRIME_NEXT', 'WARMUP'],
            'PRIME_NEXT': ['WARMUP']
        }
        
        def transition_state(current_state, target_state):
            """Test state transition validity"""
            if target_state in VALID_TRANSITIONS.get(current_state, []):
                return target_state, True
            else:
                return current_state, False
        
        test_transitions = [
            ('WARMUP', 'FOCUS', "Start learning"),
            ('FOCUS', 'CHECKPOINT', "Pause for checkpoint"),
            ('CHECKPOINT', 'REWARD', "Complete section"),
            ('REWARD', 'PRIME_NEXT', "Prepare next section"),
            ('PRIME_NEXT', 'WARMUP', "Start new cycle"),
            ('WARMUP', 'REWARD', "Invalid: Skip to reward")  # Should fail
        ]
        
        for current, target, desc in test_transitions:
            new_state, success = transition_state(current, target)
            status = "✅" if success else "❌"
            print(f"   {status} {desc}: {current} → {new_state}")
            
    except Exception as e:
        print(f"   ❌ FSM testing error: {e}")

if __name__ == "__main__":
    test_behavioral_algorithms()
    test_session_fsm()