#!/usr/bin/env python3

import sys
import os

# Add the app directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

async def test_behavioral_service():
    """Test the behavioral service directly"""
    print("🧠 Testing Behavioral Service Functionality")
    print("=" * 50)
    
    try:
        from app.services.behavioral_service import BehavioralService
        from app.database.session import get_db
        from sqlmodel import Session, create_engine
        from app.core.config import settings
        
        # Create test database connection
        engine = create_engine(settings.DATABASE_URL)
        
        with Session(engine) as session:
            service = BehavioralService(session)
            test_user_id = "test-user-123"
            
            print(f"\n🔍 Testing with user ID: {test_user_id}")
            
            # Test 1: XP Calculation
            print("\n1️⃣ Testing XP System")
            try:
                xp_earned = service.calculate_xp_earned(
                    action_type="quiz_completed",
                    context={"score": 0.85, "time_spent": 300}
                )
                print(f"   ✅ XP calculation: {xp_earned} XP for quiz completion")
            except Exception as e:
                print(f"   ❌ XP calculation error: {e}")
            
            # Test 2: User Stats Creation/Retrieval
            print("\n2️⃣ Testing User Stats")
            try:
                stats = await service.get_user_stats(test_user_id)
                print(f"   ✅ User stats retrieved: Level {stats.get('xp_stats', {}).get('current_level', 'Unknown')}")
                print(f"   📊 XP: {stats.get('xp_stats', {}).get('total_xp', 0)}")
                print(f"   🔥 Streak: {stats.get('streak_stats', {}).get('current_streak', 0)} days")
            except Exception as e:
                print(f"   ❌ User stats error: {e}")
            
            # Test 3: Elo Rating System
            print("\n3️⃣ Testing Elo Rating System")
            try:
                elo_ratings = await service.get_user_elo_ratings(test_user_id)
                print(f"   ✅ Elo ratings retrieved: {len(elo_ratings)} concepts")
                
                # Test Elo update
                updated_elo = service.update_concept_elo(
                    user_id=test_user_id,
                    concept_tag="arrays", 
                    correct=True,
                    expected_probability=0.5
                )
                print(f"   ✅ Elo update: arrays rating = {updated_elo:.1f}")
            except Exception as e:
                print(f"   ❌ Elo system error: {e}")
            
            # Test 4: Learning Session Creation
            print("\n4️⃣ Testing Learning Session")
            try:
                session_data = await service.create_learning_session(
                    user_id=test_user_id,
                    roadmap_id=1,
                    estimated_duration=30,
                    session_plan="Test learning session"
                )
                session_id = session_data.get('session_id')
                print(f"   ✅ Session created: ID {session_id}")
                
                # Test session transition
                if session_id:
                    transition = await service.transition_session_state(
                        session_id=session_id,
                        new_state="FOCUS"
                    )
                    print(f"   ✅ Session transition: {transition.get('new_state')}")
            except Exception as e:
                print(f"   ❌ Session system error: {e}")
            
            # Test 5: Momentum Calculation
            print("\n5️⃣ Testing Momentum System")
            try:
                momentum = await service.calculate_momentum_score(test_user_id)
                print(f"   ✅ Momentum score: {momentum:.2f}")
            except Exception as e:
                print(f"   ❌ Momentum system error: {e}")
            
            # Test 6: Quick Challenge Generation
            print("\n6️⃣ Testing Quick Challenge System")
            try:
                challenge = await service.generate_warmup_challenge("test-subtopic")
                if challenge:
                    print(f"   ✅ Challenge generated: {challenge.get('question', 'No question')[:50]}...")
                else:
                    print(f"   ⚠️  No challenge available (expected for test data)")
            except Exception as e:
                print(f"   ❌ Challenge system error: {e}")
            
            # Test 7: Smart Nudging
            print("\n7️⃣ Testing Smart Nudging")
            try:
                should_show = await service.should_show_nudge(test_user_id, "quick_recall")
                show_text = "Show" if should_show else "Don't show"
                print(f"   ✅ Nudge decision: {show_text} quick_recall")
                
                # Record interaction
                await service.record_nudge_interaction(test_user_id, "quick_recall", "engaged")
                print(f"   ✅ Nudge interaction recorded")
            except Exception as e:
                print(f"   ❌ Nudging system error: {e}")
                
            print("\n" + "=" * 50)
            print("✅ Behavioral service testing completed!")
            
    except ImportError as e:
        print(f"❌ Import error: {e}")
    except Exception as e:
        print(f"❌ General error: {e}")

def test_behavioral_models():
    """Test behavioral database models"""
    print("\n🗄️ Testing Behavioral Database Models")
    print("=" * 30)
    
    try:
        from app.sql_models import UserBehavior, ConceptElo, LearningSession, MilestoneProgress
        print("✅ All behavioral models imported successfully")
        
        # Test model creation (without saving)
        user_behavior = UserBehavior(
            user_id=123,
            total_xp=1500,
            current_level=5,
            current_streak=7
        )
        print(f"✅ UserBehavior model: Level {user_behavior.current_level}, {user_behavior.total_xp} XP")
        
        concept_elo = ConceptElo(
            user_id=123,
            concept_tag="arrays",
            elo_rating=1250.0
        )
        print(f"✅ ConceptElo model: {concept_elo.concept_tag} = {concept_elo.elo_rating}")
        
        learning_session = LearningSession(
            user_id=123,
            roadmap_id=1,
            session_state="WARMUP",
            estimated_duration=30
        )
        print(f"✅ LearningSession model: {learning_session.session_state}, {learning_session.estimated_duration}min")
        
    except Exception as e:
        print(f"❌ Model testing error: {e}")

if __name__ == "__main__":
    import asyncio
    
    test_behavioral_models()
    asyncio.run(test_behavioral_service())