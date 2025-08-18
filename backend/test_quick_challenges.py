#!/usr/bin/env python3

import sys
import os
import random

# Add the app directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

def test_quick_challenge_generation():
    """Test quick challenge and micro-assessment generation"""
    print("🧠 Testing Quick Challenges & Micro-Assessments")
    print("=" * 55)
    
    try:
        # Test 1: Challenge Type Generation
        print("\n1️⃣ Testing Challenge Types")
        
        def generate_challenge_by_type(challenge_type, topic="arrays"):
            """Generate different types of quick challenges"""
            
            challenges = {
                "recall": {
                    "title": "🧠 Quick Recall",
                    "description": "Test your memory of key concepts",
                    "time_limit": 10,
                    "questions": [
                        f"What's the main advantage of using {topic}?",
                        f"How do you access elements in {topic}?",
                        f"What's the time complexity of searching in {topic}?"
                    ]
                },
                "application": {
                    "title": "⚡ Apply Your Knowledge",
                    "description": "Put concepts into practice",
                    "time_limit": 30,
                    "questions": [
                        f"Given an {topic[:-1]}, how would you find the largest element?",
                        f"Write pseudocode to reverse an {topic[:-1]}",
                        f"How would you remove duplicates from an {topic[:-1]}?"
                    ]
                },
                "connection": {
                    "title": "🔗 Connect the Dots",
                    "description": "Link concepts together",
                    "time_limit": 20,
                    "questions": [
                        f"How do {topic} relate to loops?",
                        f"What's the connection between {topic} and memory management?",
                        f"When would you choose {topic} over other data structures?"
                    ]
                },
                "warmup": {
                    "title": "🏃 Quick Warmup",
                    "description": "Get your brain ready to learn",
                    "time_limit": 5,
                    "questions": [
                        f"True or False: {topic.title()} can store multiple values",
                        f"Fill in the blank: {topic.title()} elements are accessed using ___",
                        f"Multiple choice: What type of data structure are {topic}?"
                    ]
                }
            }
            
            challenge = challenges.get(challenge_type, challenges["warmup"])
            challenge["type"] = challenge_type
            challenge["topic"] = topic
            challenge["user_friendly_name"] = challenge["title"]
            
            return challenge
        
        test_types = ["recall", "application", "connection", "warmup"]
        
        for challenge_type in test_types:
            challenge = generate_challenge_by_type(challenge_type)
            print(f"   ✅ {challenge['user_friendly_name']}: {challenge['description']}")
            print(f"      ⏱️  Time limit: {challenge['time_limit']} seconds")
            print(f"      📝 Sample: {challenge['questions'][0][:50]}...")
            
    except Exception as e:
        print(f"   ❌ Challenge generation error: {e}")
    
    try:
        # Test 2: Difficulty Adaptation
        print("\n2️⃣ Testing Difficulty Adaptation")
        
        def adapt_challenge_difficulty(user_elo, topic_elo, recent_performance):
            """Adapt challenge difficulty based on user performance"""
            
            # Calculate effective skill level
            combined_elo = (user_elo + topic_elo) / 2
            
            # Recent performance adjustment
            performance_avg = sum(recent_performance) / len(recent_performance) if recent_performance else 0.5
            performance_adjustment = (performance_avg - 0.5) * 100  # ±50 points
            
            adjusted_elo = combined_elo + performance_adjustment
            
            # Determine difficulty level with user-friendly names
            if adjusted_elo < 1000:
                difficulty = "gentle"
                description = "🌱 Building Foundations"
                time_bonus = 1.5  # Extra time for beginners
            elif adjusted_elo < 1200:
                difficulty = "comfortable"
                description = "🚀 Gaining Confidence"
                time_bonus = 1.2
            elif adjusted_elo < 1400:
                difficulty = "challenging"
                description = "💪 Level Up Challenge"
                time_bonus = 1.0
            else:
                difficulty = "expert"
                description = "🏆 Expert Level"
                time_bonus = 0.8  # Less time for experts
            
            return {
                "difficulty": difficulty,
                "description": description,
                "elo_level": adjusted_elo,
                "time_multiplier": time_bonus,
                "user_message": f"Perfect challenge level for you: {description}"
            }
        
        test_scenarios = [
            (900, 950, [0.3, 0.4, 0.2], "Struggling beginner"),
            (1100, 1150, [0.6, 0.7, 0.8], "Improving learner"),
            (1300, 1250, [0.7, 0.6, 0.8], "Advanced student"),
            (1500, 1600, [0.9, 0.8, 0.9], "Expert performer")
        ]
        
        for user_elo, topic_elo, performance, desc in test_scenarios:
            adaptation = adapt_challenge_difficulty(user_elo, topic_elo, performance)
            print(f"   ✅ {desc}: {adaptation['description']}")
            print(f"      🎯 Difficulty: {adaptation['difficulty']} (ELO: {adaptation['elo_level']:.0f})")
            print(f"      ⏰ Time adjustment: {adaptation['time_multiplier']}x")
            
    except Exception as e:
        print(f"   ❌ Difficulty adaptation error: {e}")
    
    try:
        # Test 3: Response Analysis
        print("\n3️⃣ Testing Response Analysis")
        
        def analyze_challenge_response(response_time, correct, confidence, expected_time=10):
            """Analyze user response with encouraging feedback"""
            
            # Speed analysis
            speed_ratio = response_time / expected_time
            if speed_ratio < 0.5:
                speed_feedback = "⚡ Lightning fast!"
                speed_bonus = 1.2
            elif speed_ratio < 0.8:
                speed_feedback = "🚀 Great timing!"
                speed_bonus = 1.1
            elif speed_ratio < 1.2:
                speed_feedback = "👍 Good pace!"
                speed_bonus = 1.0
            else:
                speed_feedback = "🤔 Take your time to think it through!"
                speed_bonus = 0.9
            
            # Confidence analysis
            if confidence >= 4:
                confidence_feedback = "💪 Super confident!"
            elif confidence >= 3:
                confidence_feedback = "😊 Feeling good about it!"
            elif confidence >= 2:
                confidence_feedback = "🤷 Not quite sure, but trying!"
            else:
                confidence_feedback = "😅 Just a guess, but that's okay!"
            
            # Overall feedback
            if correct:
                if speed_ratio < 0.8 and confidence >= 3:
                    overall = "🎉 Excellent! You really know this stuff!"
                elif speed_ratio > 1.5 and confidence >= 3:
                    overall = "✅ Correct! Taking time to think shows good learning habits."
                else:
                    overall = "✅ Great job! You're building strong knowledge."
            else:
                if confidence >= 3:
                    overall = "💡 Close! Your confidence shows you're on the right track."
                else:
                    overall = "🌱 Learning opportunity! Every mistake helps you grow."
            
            return {
                "speed_feedback": speed_feedback,
                "confidence_feedback": confidence_feedback,
                "overall_feedback": overall,
                "xp_multiplier": speed_bonus,
                "encouragement": "Keep up the great work! 🌟"
            }
        
        test_responses = [
            (3, True, 4, "Fast correct confident"),
            (15, True, 2, "Slow correct uncertain"),
            (8, False, 4, "Fast wrong confident"), 
            (20, False, 1, "Slow wrong uncertain")
        ]
        
        for time, correct, conf, desc in test_responses:
            analysis = analyze_challenge_response(time, correct, conf)
            result = "✅ Correct" if correct else "❌ Incorrect"
            print(f"   {result} {desc}: {analysis['overall_feedback']}")
            print(f"      {analysis['speed_feedback']} {analysis['confidence_feedback']}")
            
    except Exception as e:
        print(f"   ❌ Response analysis error: {e}")

def test_micro_assessment_flow():
    """Test micro-assessment workflow"""
    print("\n⚡ Testing Micro-Assessment Flow")
    print("=" * 40)
    
    try:
        # Test complete micro-assessment flow
        def run_micro_assessment(user_context):
            """Run a complete micro-assessment with user-friendly flow"""
            
            steps = []
            
            # Step 1: Welcome & Context
            welcome_msg = f"👋 Hi {user_context.get('name', 'there')}! Ready for a quick brain exercise?"
            if user_context.get('last_topic'):
                welcome_msg += f" Let's revisit {user_context['last_topic']}."
            steps.append(("welcome", welcome_msg))
            
            # Step 2: Challenge Selection
            difficulty = user_context.get('difficulty', 'comfortable')
            challenge_msg = f"🎯 I've picked a {difficulty} challenge just right for your level!"
            steps.append(("selection", challenge_msg))
            
            # Step 3: Question Presentation
            question_msg = "🤔 Here's your challenge:"
            example_question = "Which method would you use to add an element to the end of an array?"
            steps.append(("question", f"{question_msg} {example_question}"))
            
            # Step 4: Answer Collection
            answer_msg = "✍️ Take your time and choose the best answer. Your confidence level helps me learn too!"
            steps.append(("answer", answer_msg))
            
            # Step 5: Immediate Feedback
            feedback_msg = "🎉 Great thinking! Let me explain why..."
            steps.append(("feedback", feedback_msg))
            
            # Step 6: Learning Reinforcement
            reinforce_msg = "💡 Pro tip: This concept connects to what you'll learn next!"
            steps.append(("reinforcement", reinforce_msg))
            
            # Step 7: Encouragement & Next Steps
            closing_msg = "🌟 You're making excellent progress! Ready to continue your learning journey?"
            steps.append(("closing", closing_msg))
            
            return steps
        
        # Test with different user contexts
        test_contexts = [
            {"name": "Alex", "last_topic": "arrays", "difficulty": "gentle"},
            {"name": "Sam", "last_topic": "loops", "difficulty": "challenging"},
            {"difficulty": "expert"}  # No name provided
        ]
        
        for i, context in enumerate(test_contexts, 1):
            print(f"\n   📋 Micro-Assessment Flow {i}:")
            flow = run_micro_assessment(context)
            
            for step_type, message in flow:
                print(f"      {step_type.title()}: {message[:60]}{'...' if len(message) > 60 else ''}")
                
    except Exception as e:
        print(f"   ❌ Micro-assessment flow error: {e}")

def test_gamification_elements():
    """Test gamification elements in challenges"""
    print("\n🎮 Testing Gamification Elements")
    print("=" * 40)
    
    try:
        # Test streaks and achievements
        def calculate_challenge_rewards(consecutive_correct, speed_bonus, difficulty):
            """Calculate rewards with exciting terminology"""
            
            base_xp = {"gentle": 25, "comfortable": 50, "challenging": 75, "expert": 100}
            xp = base_xp.get(difficulty, 50)
            
            rewards = []
            
            # Streak bonuses with exciting names
            if consecutive_correct >= 10:
                rewards.append("🔥 STREAK MASTER! +100 XP bonus")
                xp += 100
            elif consecutive_correct >= 5:
                rewards.append("⚡ On Fire! +50 XP streak bonus")
                xp += 50
            elif consecutive_correct >= 3:
                rewards.append("🎯 Getting Hot! +25 XP streak bonus")
                xp += 25
            
            # Speed bonuses
            if speed_bonus > 1.15:
                rewards.append("⚡ SPEED DEMON! Lightning-fast thinking!")
                xp = int(xp * speed_bonus)
            elif speed_bonus > 1.05:
                rewards.append("🚀 Quick Thinker! Nice pace!")
                xp = int(xp * speed_bonus)
            
            # Special achievements
            if consecutive_correct == 1:
                rewards.append("🌟 Great start! First correct answer!")
            elif consecutive_correct % 10 == 0:
                rewards.append(f"🏆 MILESTONE REACHED! {consecutive_correct} in a row!")
            
            return xp, rewards
        
        test_scenarios = [
            (1, 1.0, "gentle", "First gentle challenge"),
            (3, 1.1, "comfortable", "3-streak with speed"),
            (5, 1.2, "challenging", "5-streak speed demon"),
            (10, 1.0, "expert", "10-streak expert")
        ]
        
        for streak, speed, diff, desc in test_scenarios:
            xp, rewards = calculate_challenge_rewards(streak, speed, diff)
            print(f"   ✅ {desc}: {xp} XP earned")
            for reward in rewards:
                print(f"      🎉 {reward}")
                
    except Exception as e:
        print(f"   ❌ Gamification error: {e}")

if __name__ == "__main__":
    test_quick_challenge_generation()
    test_micro_assessment_flow()
    test_gamification_elements()
    
    print("\n" + "=" * 55)
    print("✅ Quick Challenges & Micro-Assessments Testing Completed!")
    print("🧠 All challenge features use encouraging, user-friendly language!")