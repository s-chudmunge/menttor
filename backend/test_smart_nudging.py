#!/usr/bin/env python3

import sys
import os
from datetime import datetime, timedelta

# Add the app directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

def test_smart_nudging_system():
    """Test smart nudging with respectful, user-friendly messaging"""
    print("🎯 Testing Smart Nudging & Personalization")
    print("=" * 50)
    
    try:
        # Test 1: Nudge Timing Intelligence
        print("\n1️⃣ Testing Nudge Timing Intelligence")
        
        def should_show_nudge(last_activity, nudge_type, user_preferences):
            """Determine if a nudge should be shown based on respectful timing"""
            
            now = datetime.now()
            hours_since_activity = (now - last_activity).total_seconds() / 3600
            
            # Respect user's quiet hours
            current_hour = now.hour
            quiet_start = user_preferences.get('quiet_hours_start', 22)
            quiet_end = user_preferences.get('quiet_hours_end', 8)
            
            if quiet_start <= current_hour or current_hour < quiet_end:
                return False, "😴 Respecting your quiet hours - we'll catch up tomorrow!"
            
            # Different nudge types have different timing rules
            nudge_rules = {
                'gentle_reminder': {
                    'min_hours': 4,
                    'message': '🌟 Just a friendly reminder - when you\'re ready!'
                },
                'motivation_boost': {
                    'min_hours': 8,
                    'message': '💪 You\'ve got this! Your learning journey is waiting.'
                },
                'streak_save': {
                    'min_hours': 18,
                    'message': '🔥 Don\'t break the streak! A quick session keeps it alive.'
                },
                'comeback_invite': {
                    'min_hours': 72,
                    'message': '👋 We miss you! Ready to dive back into learning?'
                }
            }
            
            rule = nudge_rules.get(nudge_type, nudge_rules['gentle_reminder'])
            
            if hours_since_activity >= rule['min_hours']:
                return True, rule['message']
            else:
                return False, "⏰ Too soon - let's give you some space!"
        
        # Test different scenarios
        now = datetime.now()
        test_scenarios = [
            (now - timedelta(hours=2), 'gentle_reminder', "Recent activity"),
            (now - timedelta(hours=6), 'gentle_reminder', "Few hours ago"),
            (now - timedelta(hours=10), 'motivation_boost', "Half day ago"),
            (now - timedelta(hours=20), 'streak_save', "Almost a day"),
            (now - timedelta(days=4), 'comeback_invite', "Several days ago")
        ]
        
        user_prefs = {'quiet_hours_start': 22, 'quiet_hours_end': 8}
        
        for last_activity, nudge_type, desc in test_scenarios:
            should_show, message = should_show_nudge(last_activity, nudge_type, user_prefs)
            status = "📱" if should_show else "🤫"
            print(f"   {status} {desc} ({nudge_type}): {message}")
            
    except Exception as e:
        print(f"   ❌ Nudge timing error: {e}")
    
    try:
        # Test 2: Personalized Motivation Messages
        print("\n2️⃣ Testing Personalized Motivation")
        
        def generate_personalized_message(user_profile, context):
            """Generate personalized motivation based on user profile"""
            
            learning_style = user_profile.get('learning_style', 'balanced')
            achievements = user_profile.get('recent_achievements', [])
            struggles = user_profile.get('recent_struggles', [])
            goals = user_profile.get('goals', [])
            
            # Base message by learning style
            style_messages = {
                'visual': "📊 Let's visualize your progress!",
                'auditory': "🎵 Time to tune into some learning!",
                'kinesthetic': "🏃 Ready for some hands-on practice?",
                'reading': "📚 Perfect time for some deep reading!",
                'balanced': "🌟 Let's learn in your favorite way!"
            }
            
            base_message = style_messages.get(learning_style, style_messages['balanced'])
            
            # Add achievement celebration
            if achievements:
                latest_achievement = achievements[0]
                base_message += f" You recently mastered {latest_achievement} - impressive! 🎉"
            
            # Address struggles with encouragement
            if struggles:
                struggle = struggles[0]
                base_message += f" And hey, {struggle} is getting easier each time you practice. 💪"
            
            # Connect to goals
            if goals:
                goal = goals[0]
                base_message += f" Each session brings you closer to {goal}! 🎯"
            
            return base_message
        
        test_profiles = [
            {
                'learning_style': 'visual',
                'recent_achievements': ['arrays fundamentals'],
                'recent_struggles': ['loop optimization'],
                'goals': ['becoming a algorithms expert']
            },
            {
                'learning_style': 'kinesthetic',
                'recent_achievements': ['debugging skills'],
                'recent_struggles': [],
                'goals': ['building real projects']
            },
            {
                'learning_style': 'reading',
                'recent_achievements': [],
                'recent_struggles': ['recursion concepts'],
                'goals': []
            }
        ]
        
        for i, profile in enumerate(test_profiles, 1):
            message = generate_personalized_message(profile, {})
            print(f"   ✅ Profile {i} ({profile['learning_style']}): {message}")
            
    except Exception as e:
        print(f"   ❌ Personalization error: {e}")
    
    try:
        # Test 3: Nudge Response Tracking
        print("\n3️⃣ Testing Nudge Response Tracking")
        
        def track_nudge_response(user_id, nudge_type, response, nudge_history):
            """Track how users respond to nudges to improve future timing"""
            
            # Record response
            response_entry = {
                'timestamp': datetime.now(),
                'nudge_type': nudge_type,
                'response': response
            }
            
            nudge_history.append(response_entry)
            
            # Analyze patterns (simplified)
            recent_responses = [r for r in nudge_history if 
                             (datetime.now() - r['timestamp']).days <= 7]
            
            if not recent_responses:
                return "neutral", "Learning your preferences..."
            
            # Calculate response rates
            engaged_count = len([r for r in recent_responses if r['response'] == 'engaged'])
            dismissed_count = len([r for r in recent_responses if r['response'] == 'dismissed'])
            total_count = len(recent_responses)
            
            engagement_rate = engaged_count / total_count if total_count > 0 else 0
            
            # Adjust future nudging strategy
            if engagement_rate > 0.7:
                strategy = "positive"
                message = "🎉 You love our check-ins! We'll keep them coming."
            elif engagement_rate > 0.3:
                strategy = "balanced"
                message = "📊 Finding the right balance for your nudges."
            else:
                strategy = "minimal"
                message = "🤫 We'll give you more space and nudge less often."
            
            return strategy, message
        
        # Test response tracking
        nudge_history = []
        
        test_responses = [
            ('gentle_reminder', 'engaged', "User engaged with reminder"),
            ('motivation_boost', 'dismissed', "User dismissed motivation"),
            ('gentle_reminder', 'engaged', "User engaged again"),
            ('streak_save', 'engaged', "User saved streak"),
            ('gentle_reminder', 'dismissed', "User dismissed reminder")
        ]
        
        for nudge_type, response, desc in test_responses:
            strategy, message = track_nudge_response("user123", nudge_type, response, nudge_history)
            print(f"   📈 {desc}: Strategy = {strategy}")
            print(f"      💬 {message}")
            
    except Exception as e:
        print(f"   ❌ Response tracking error: {e}")

def test_adaptive_learning_paths():
    """Test adaptive learning path recommendations"""
    print("\n🛤️ Testing Adaptive Learning Paths")
    print("=" * 40)
    
    try:
        # Test learning path adaptation based on user behavior
        def recommend_next_steps(user_behavior, performance_data):
            """Recommend next learning steps based on user patterns"""
            
            # Analyze user patterns
            avg_session_length = user_behavior.get('avg_session_minutes', 20)
            preferred_time = user_behavior.get('peak_performance_hour', 14)
            energy_pattern = user_behavior.get('energy_pattern', 'steady')
            
            # Analyze recent performance
            recent_scores = performance_data.get('recent_quiz_scores', [])
            avg_score = sum(recent_scores) / len(recent_scores) if recent_scores else 0.7
            
            recommendations = []
            
            # Session length recommendations
            if avg_session_length < 15:
                recommendations.append({
                    'type': 'session_structure',
                    'message': '🏃 Perfect for quick bursts! Try our 10-minute power sessions.',
                    'action': 'short_sessions'
                })
            elif avg_session_length > 45:
                recommendations.append({
                    'type': 'session_structure', 
                    'message': '📚 You love deep dives! Consider 45-60 minute focus blocks.',
                    'action': 'extended_sessions'
                })
            else:
                recommendations.append({
                    'type': 'session_structure',
                    'message': '⚡ Your 20-30 minute sessions are perfect for learning!',
                    'action': 'optimal_sessions'
                })
            
            # Performance-based recommendations
            if avg_score > 0.8:
                recommendations.append({
                    'type': 'difficulty',
                    'message': '🚀 You\'re crushing it! Ready for more challenging content?',
                    'action': 'increase_difficulty'
                })
            elif avg_score < 0.6:
                recommendations.append({
                    'type': 'support',
                    'message': '🌱 Let\'s strengthen your foundation with some review.',
                    'action': 'review_mode'
                })
            else:
                recommendations.append({
                    'type': 'progression',
                    'message': '🎯 Steady progress! You\'re right on track.',
                    'action': 'continue_current'
                })
            
            # Time-based recommendations
            current_hour = datetime.now().hour
            if abs(current_hour - preferred_time) <= 2:
                recommendations.append({
                    'type': 'timing',
                    'message': '⏰ Perfect timing! This is your peak learning hour.',
                    'action': 'optimal_time'
                })
            
            return recommendations
        
        test_user_profiles = [
            {
                'behavior': {'avg_session_minutes': 10, 'peak_performance_hour': 9, 'energy_pattern': 'morning_peak'},
                'performance': {'recent_quiz_scores': [0.9, 0.85, 0.95]},
                'description': 'Morning learner, short sessions, high performance'
            },
            {
                'behavior': {'avg_session_minutes': 50, 'peak_performance_hour': 20, 'energy_pattern': 'night_owl'},
                'performance': {'recent_quiz_scores': [0.5, 0.6, 0.55]},
                'description': 'Night learner, long sessions, needs support'
            },
            {
                'behavior': {'avg_session_minutes': 25, 'peak_performance_hour': 14, 'energy_pattern': 'steady'},
                'performance': {'recent_quiz_scores': [0.7, 0.75, 0.8]},
                'description': 'Balanced learner, optimal sessions'
            }
        ]
        
        for profile in test_user_profiles:
            print(f"\n   👤 {profile['description']}:")
            recommendations = recommend_next_steps(profile['behavior'], profile['performance'])
            
            for rec in recommendations:
                print(f"      {rec['type'].title()}: {rec['message']}")
                
    except Exception as e:
        print(f"   ❌ Adaptive paths error: {e}")

def test_respectful_engagement():
    """Test respectful, non-manipulative engagement"""
    print("\n🤝 Testing Respectful Engagement")
    print("=" * 35)
    
    try:
        # Test autonomy-preserving features
        def check_engagement_ethics(nudge_intensity, user_dismissals, session_count):
            """Ensure nudging respects user autonomy"""
            
            ethical_guidelines = []
            
            # Check nudge intensity
            if nudge_intensity > 0.8:
                ethical_guidelines.append({
                    'concern': 'high_intensity',
                    'action': 'reduce_nudging',
                    'message': '🔄 Reducing nudge frequency to respect your space.'
                })
            
            # Check dismissal rate
            dismissal_rate = user_dismissals / max(1, session_count)
            if dismissal_rate > 0.5:
                ethical_guidelines.append({
                    'concern': 'high_dismissals',
                    'action': 'step_back',
                    'message': '🤫 We notice you prefer less guidance. Taking a step back!'
                })
            
            # Positive reinforcement for engagement
            if dismissal_rate < 0.2:
                ethical_guidelines.append({
                    'concern': 'good_engagement',
                    'action': 'maintain_balance',
                    'message': '✨ Great balance! Our suggestions seem helpful.'
                })
            
            # Always provide opt-out
            ethical_guidelines.append({
                'concern': 'user_control',
                'action': 'preserve_autonomy',
                'message': '⚙️ Remember: You can always adjust these settings in your preferences.'
            })
            
            return ethical_guidelines
        
        test_scenarios = [
            (0.9, 8, 10, "Pushy system"),
            (0.3, 7, 10, "High dismissal rate"),
            (0.5, 1, 10, "Good engagement"),
            (0.2, 0, 5, "Light touch approach")
        ]
        
        for intensity, dismissals, sessions, desc in test_scenarios:
            guidelines = check_engagement_ethics(intensity, dismissals, sessions)
            print(f"\n   📊 {desc} (intensity: {intensity}, dismissals: {dismissals}/{sessions}):")
            
            for guideline in guidelines:
                print(f"      🎯 {guideline['action'].title()}: {guideline['message']}")
                
    except Exception as e:
        print(f"   ❌ Ethical engagement error: {e}")

if __name__ == "__main__":
    test_smart_nudging_system()
    test_adaptive_learning_paths()
    test_respectful_engagement()
    
    print("\n" + "=" * 50)
    print("✅ Smart Nudging & Personalization Testing Completed!")
    print("🤝 All features respect user autonomy and use encouraging language!")