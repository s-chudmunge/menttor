"""
Behavioral Design Service
Implements psychological principles for enhanced learning engagement
"""

import math
import random
from datetime import datetime, date, timedelta
from typing import Dict, List, Optional, Tuple, Any
from sqlmodel import Session, select
from sql_models import (
    User, UserBehavior, ConceptElo, LearningSession, MilestoneProgress,
    QuickChallenge, ChallengeAttempt, RewardEvent, DependencyMap,
    UserProgress, QuizAttempt, Roadmap
)

class BehavioralService:
    """Core service implementing behavioral design principles"""
    
    def __init__(self, db: Session):
        self.db = db
    
    # =============================================================================
    # XP AND PROGRESSION SYSTEM
    # =============================================================================
    
    def calculate_xp_earned(self, activity_type: str, context: Dict[str, Any]) -> int:
        """Calculate XP based on activity: xp = round(1.5 * focused_minutes + 2 * completed_quizzes + 3 * code_submissions)"""
        xp = 0
        
        if activity_type == "focus_time":
            xp += round(1.5 * context.get("minutes", 0))
        elif activity_type == "quiz_completion":
            score_multiplier = 1 + (context.get("score", 0) / 100) * 0.5  # Bonus for high scores
            xp += round(2 * score_multiplier)
        elif activity_type == "quiz_question":
            # Award XP for individual quiz questions
            base_xp = 3 if context.get("correct", False) else 1
            # Bonus for quick responses (under 10 seconds)
            response_time = context.get("response_time", 999)
            if response_time < 10 and context.get("correct", False):
                base_xp += 2
            # Confidence bonus
            confidence = context.get("confidence_level", 3)
            if confidence >= 4 and context.get("correct", False):
                base_xp += 1
            xp += base_xp
        elif activity_type == "subtopic_completion":
            xp += 5  # Base reward for completing learning
        elif activity_type == "code_submission":
            xp += 3
        elif activity_type == "streak_bonus":
            streak_length = context.get("streak", 0)
            xp += min(streak_length, 10)  # Cap streak bonus
        elif activity_type == "milestone_completion":
            xp += context.get("milestone_value", 20)
        elif activity_type == "quick_challenge":
            # Award XP for quick challenge completion
            xp += 5 if context.get("correct", False) else 2
            
        return max(0, xp)
    
    def award_xp(self, user_id: int, activity_type: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Award XP and check for level ups"""
        behavior = self.get_or_create_user_behavior(user_id)
        
        xp_earned = self.calculate_xp_earned(activity_type, context)
        behavior.total_xp += xp_earned
        
        # Check for level up
        level_up_occurred = False
        new_level = behavior.current_level
        
        while behavior.total_xp >= (behavior.current_level * 100 + behavior.xp_to_next_level):
            behavior.current_level += 1
            behavior.xp_to_next_level = behavior.current_level * 100  # Increasing XP requirements
            level_up_occurred = True
            new_level = behavior.current_level
        
        self.db.add(behavior)
        self.db.commit()
        
        return {
            "xp_earned": xp_earned,
            "total_xp": behavior.total_xp,
            "current_level": behavior.current_level,
            "xp_to_next_level": behavior.xp_to_next_level,
            "level_up_occurred": level_up_occurred,
            "new_level": new_level if level_up_occurred else None
        }
    
    # =============================================================================
    # STREAK SYSTEM WITH FORGIVENESS
    # =============================================================================
    
    def update_streak(self, user_id: int) -> Dict[str, Any]:
        """Update streak with 2-day grace period"""
        behavior = self.get_or_create_user_behavior(user_id)
        today = date.today()
        
        if behavior.last_activity_date is None:
            # First activity
            behavior.current_streak = 1
            behavior.last_activity_date = today
            behavior.grace_days_remaining = 2
        else:
            days_since_activity = (today - behavior.last_activity_date).days
            
            if days_since_activity == 0:
                # Same day activity - no change to streak
                pass
            elif days_since_activity == 1:
                # Perfect continuation
                behavior.current_streak += 1
                behavior.last_activity_date = today
                behavior.grace_days_remaining = 2
            elif days_since_activity <= (2 + behavior.grace_days_remaining):
                # Within grace period
                if days_since_activity > 1:
                    behavior.grace_days_remaining = max(0, behavior.grace_days_remaining - (days_since_activity - 1))
                behavior.current_streak += 1
                behavior.last_activity_date = today
            else:
                # Streak broken
                behavior.streak_broken_count += 1
                behavior.current_streak = 1
                behavior.last_activity_date = today
                behavior.grace_days_remaining = 2
        
        # Update longest streak
        if behavior.current_streak > behavior.longest_streak:
            behavior.longest_streak = behavior.current_streak
        
        self.db.add(behavior)
        self.db.commit()
        
        return {
            "current_streak": behavior.current_streak,
            "longest_streak": behavior.longest_streak,
            "grace_days_remaining": behavior.grace_days_remaining,
            "streak_just_broken": (behavior.current_streak == 1 and behavior.last_activity_date and 
                                 (date.today() - behavior.last_activity_date).days > (2 + behavior.grace_days_remaining))
        }
    
    # =============================================================================
    # ELO-BASED DIFFICULTY ADJUSTMENT
    # =============================================================================
    
    def update_concept_elo(self, user_id: int, concept_tag: str, outcome: float, item_difficulty: float = 1200.0) -> float:
        """Update Elo rating: g_new = g_old + K*(outcome - expected)"""
        concept_elo = self.db.exec(
            select(ConceptElo).where(
                ConceptElo.user_id == user_id,
                ConceptElo.concept_tag == concept_tag
            )
        ).first()
        
        if not concept_elo:
            concept_elo = ConceptElo(
                user_id=user_id,
                concept_tag=concept_tag,
                elo_rating=1200.0
            )
            self.db.add(concept_elo)
        
        # Calculate expected outcome
        expected = 1 / (1 + 10**((item_difficulty - concept_elo.elo_rating) / 400))
        
        # K factor decreases with more attempts (more stable ratings)
        k_factor = max(16, 32 - concept_elo.total_attempts // 10)
        
        # Update Elo
        concept_elo.elo_rating += k_factor * (outcome - expected)
        concept_elo.total_attempts += 1
        if outcome > 0.5:  # Consider >50% as correct
            concept_elo.correct_attempts += 1
        concept_elo.last_updated = datetime.utcnow()
        
        self.db.add(concept_elo)
        self.db.commit()
        
        return concept_elo.elo_rating
    
    def get_user_concept_elos(self, user_id: int) -> Dict[str, float]:
        """Get all concept Elo ratings for user"""
        concept_elos = self.db.exec(
            select(ConceptElo).where(ConceptElo.user_id == user_id)
        ).all()
        
        return {ce.concept_tag: ce.elo_rating for ce in concept_elos}
    
    # =============================================================================
    # SESSION STATE MACHINE
    # =============================================================================
    
    def create_learning_session(self, user_id: int, roadmap_id: int, session_plan: str = None) -> LearningSession:
        """Initialize a new learning session with FSM state"""
        time_of_day = self.get_time_of_day_bucket(datetime.now().hour)
        
        session = LearningSession(
            user_id=user_id,
            roadmap_id=roadmap_id,
            session_state="WARMUP",
            session_plan=session_plan,
            time_of_day_bucket=time_of_day,
            start_time=datetime.utcnow()
        )
        
        self.db.add(session)
        self.db.commit()
        self.db.refresh(session)
        
        return session
    
    def transition_session_state(self, session_id: int, new_state: str, context: Dict[str, Any] = None) -> LearningSession:
        """Transition session through FSM states"""
        session = self.db.get(LearningSession, session_id)
        if not session:
            raise ValueError(f"Session {session_id} not found")
        
        valid_transitions = {
            "WARMUP": ["FOCUS"],
            "FOCUS": ["CHECKPOINT", "FOCUS"],  # Allow staying in FOCUS for extending/toggling
            "CHECKPOINT": ["REWARD", "PRIME_NEXT"],
            "REWARD": ["PRIME_NEXT"],
            "PRIME_NEXT": ["WARMUP", "FOCUS"]  # Can continue or start new session
        }
        
        if new_state not in valid_transitions.get(session.session_state, []):
            raise ValueError(f"Invalid transition from {session.session_state} to {new_state}")
        
        session.session_state = new_state
        
        # Update state-specific flags
        if new_state == "FOCUS":
            session.warmup_completed = True
        elif new_state == "CHECKPOINT":
            session.focus_completed = True
        elif new_state == "REWARD":
            session.checkpoint_completed = True
        elif new_state == "PRIME_NEXT":
            session.reward_received = True
        
        # Store context data
        if context:
            if session.session_data is None:
                session.session_data = {}
            session.session_data.update(context)
        
        self.db.add(session)
        self.db.commit()
        
        return session
    
    def get_time_of_day_bucket(self, hour: int) -> str:
        """Categorize time of day for behavioral analysis"""
        if 5 <= hour < 12:
            return "morning"
        elif 12 <= hour < 17:
            return "afternoon"
        elif 17 <= hour < 22:
            return "evening"
        else:
            return "night"
    
    # =============================================================================
    # VARIABLE REWARD SYSTEM
    # =============================================================================
    
    def should_trigger_reward(self, user_id: int, event_type: str) -> bool:
        """Determine if reward should be triggered (p≈0.35 with modifiers)"""
        behavior = self.get_or_create_user_behavior(user_id)
        
        base_probability = 0.35
        
        # Apply modifiers
        probability = base_probability * behavior.reward_probability_modifier
        
        # Reduce probability if user got reward recently
        if behavior.last_reward_received:
            hours_since_reward = (datetime.utcnow() - behavior.last_reward_received).total_seconds() / 3600
            if hours_since_reward < 1:  # Less than 1 hour
                probability *= 0.5
        
        # Increase probability for milestone events
        if event_type in ["milestone_reached", "streak_milestone"]:
            probability *= 1.5
        
        return random.random() < min(probability, 0.8)  # Cap at 80%
    
    def create_reward_event(self, user_id: int, trigger_event: str, trigger_data: Dict[str, Any], session_id: int = None) -> Optional[RewardEvent]:
        """Create and return reward event if conditions are met"""
        if not self.should_trigger_reward(user_id, trigger_event):
            return None
        
        reward_type, reward_content = self.generate_reward_content(trigger_event, trigger_data)
        
        reward = RewardEvent(
            user_id=user_id,
            session_id=session_id,
            reward_type=reward_type,
            reward_content=reward_content,
            trigger_event=trigger_event,
            trigger_data=trigger_data
        )
        
        self.db.add(reward)
        
        # Update user behavior
        behavior = self.get_or_create_user_behavior(user_id)
        behavior.last_reward_received = datetime.utcnow()
        behavior.total_rewards_received += 1
        self.db.add(behavior)
        
        self.db.commit()
        self.db.refresh(reward)
        
        return reward
    
    def generate_reward_content(self, trigger_event: str, trigger_data: Dict[str, Any]) -> Tuple[str, Dict[str, Any]]:
        """Generate appropriate reward content based on trigger"""
        
        if trigger_event == "subtopic_completion":
            # Removed insight cards - just show celebration confetti
            return "confetti", {
                "style": "celebration",
                "duration": 2000,
                "particles": 50
            }
        
        elif trigger_event == "milestone_reached":
            return "achievement", {
                "title": f"🎉 {trigger_data.get('milestone_name', 'Milestone')} Unlocked!",
                "description": trigger_data.get('description', 'Great progress!'),
                "badge": trigger_data.get('badge', 'gold'),
                "benefits": trigger_data.get('benefits', [])
            }
        
        elif trigger_event == "streak_maintained":
            return "streak_bonus", {
                "title": f"🔥 {trigger_data.get('streak', 0)}-Day Streak!",
                "description": "Consistency is the key to mastery",
                "bonus_xp": trigger_data.get('bonus_xp', 5)
            }
        
        return "confetti", {"style": "simple", "duration": 1500}
    
    # =============================================================================
    # MILESTONE AND DEPENDENCY SYSTEM
    # =============================================================================
    
    def create_milestone(self, user_id: int, roadmap_id: int, milestone_type: str, 
                        name: str, description: str, target_value: int) -> MilestoneProgress:
        """Create a new milestone for tracking"""
        milestone = MilestoneProgress(
            user_id=user_id,
            roadmap_id=roadmap_id,
            milestone_type=milestone_type,
            milestone_name=name,
            milestone_description=description,
            target_value=target_value
        )
        
        self.db.add(milestone)
        self.db.commit()
        self.db.refresh(milestone)
        
        return milestone
    
    def update_milestone_progress(self, user_id: int, milestone_name: str, increment: int = 1) -> Optional[Dict[str, Any]]:
        """Update milestone progress and check for completion"""
        milestone = self.db.exec(
            select(MilestoneProgress).where(
                MilestoneProgress.user_id == user_id,
                MilestoneProgress.milestone_name == milestone_name,
                MilestoneProgress.completed == False
            )
        ).first()
        
        if not milestone:
            return None
        
        milestone.current_value += increment
        milestone.completion_percentage = min(100.0, (milestone.current_value / milestone.target_value) * 100)
        
        milestone_completed = False
        if milestone.current_value >= milestone.target_value and not milestone.completed:
            milestone.completed = True
            milestone.completed_at = datetime.utcnow()
            milestone_completed = True
        
        self.db.add(milestone)
        self.db.commit()
        
        return {
            "milestone": milestone,
            "just_completed": milestone_completed,
            "progress_percentage": milestone.completion_percentage
        }
    
    def get_prerequisites_status(self, user_id: int, subtopic_id: str) -> Dict[str, Any]:
        """Get prerequisite status with mastery scores"""
        dependencies = self.db.exec(
            select(DependencyMap).where(DependencyMap.subtopic_id == subtopic_id)
        ).all()
        
        prerequisite_status = {}
        all_satisfied = True
        
        for dep in dependencies:
            # Get user's best quiz score for prerequisite
            best_attempt = self.db.exec(
                select(QuizAttempt).where(
                    QuizAttempt.user_id == user_id,
                    QuizAttempt.sub_topic_id == dep.prerequisite_id
                ).order_by(QuizAttempt.score.desc())
            ).first()
            
            score = best_attempt.score if best_attempt else 0
            is_satisfied = score >= dep.minimum_mastery_score
            
            prerequisite_status[dep.prerequisite_id] = {
                "score": score,
                "required_score": dep.minimum_mastery_score,
                "satisfied": is_satisfied,
                "strength": dep.dependency_strength
            }
            
            if not is_satisfied:
                all_satisfied = False
        
        return {
            "prerequisites": prerequisite_status,
            "all_satisfied": all_satisfied,
            "weak_prerequisites": [
                pid for pid, status in prerequisite_status.items() 
                if not status["satisfied"] and status["strength"] > 0.7
            ]
        }
    
    # =============================================================================
    # NUDGING AND PERSONALIZATION
    # =============================================================================
    
    def update_nudge_intensity(self, user_id: int, dismissed: bool = False) -> float:
        """Update nudge intensity based on user response"""
        behavior = self.get_or_create_user_behavior(user_id)
        
        if dismissed:
            behavior.dismissed_nudges_today += 1
            behavior.nudge_intensity = max(0.0, behavior.nudge_intensity - 0.4)
        else:
            # Positive interaction - can slowly increase intensity
            behavior.nudge_intensity = min(1.0, behavior.nudge_intensity + 0.1)
        
        self.db.add(behavior)
        self.db.commit()
        
        return behavior.nudge_intensity
    
    def should_show_nudge(self, user_id: int, nudge_type: str) -> bool:
        """Determine if nudge should be shown based on user's current intensity"""
        behavior = self.get_or_create_user_behavior(user_id)
        
        nudge_thresholds = {
            "quick_recall": 0.2,
            "progress_celebration": 0.3,
            "streak_reminder": 0.4,
            "focus_mode_suggestion": 0.5,
            "review_prompt": 0.6
        }
        
        return behavior.nudge_intensity >= nudge_thresholds.get(nudge_type, 0.5)
    
    def calculate_momentum_score(self, user_id: int) -> float:
        """Calculate momentum with decay: completed_subtopics_last_7d with decay w_d = 0.9^days_ago"""
        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        
        recent_progress = self.db.exec(
            select(UserProgress).where(
                UserProgress.user_id == user_id,
                UserProgress.completed_at >= seven_days_ago,
                UserProgress.status == "completed"
            )
        ).all()
        
        momentum = 0.0
        for progress in recent_progress:
            days_ago = (datetime.utcnow() - progress.completed_at).days
            decay_weight = 0.9 ** days_ago
            momentum += decay_weight
        
        # Update stored momentum
        behavior = self.get_or_create_user_behavior(user_id)
        behavior.momentum_score = momentum
        self.db.add(behavior)
        self.db.commit()
        
        return momentum
    
    def get_optimal_learning_time(self, user_id: int) -> Optional[Dict[str, Any]]:
        """Get user's optimal learning windows based on historical performance"""
        behavior = self.get_or_create_user_behavior(user_id)
        
        if not behavior.optimal_learning_windows:
            return None
        
        current_hour = datetime.now().hour
        current_bucket = self.get_time_of_day_bucket(current_hour)
        
        return {
            "current_window": behavior.optimal_learning_windows.get(current_bucket, {}),
            "best_window": max(
                behavior.optimal_learning_windows.items(),
                key=lambda x: x[1].get("completion_rate", 0)
            ) if behavior.optimal_learning_windows else None
        }
    
    # =============================================================================
    # PROGRESS COPY GENERATION
    # =============================================================================
    
    def generate_progress_copy(self, user_id: int, roadmap_id: int, copy_type: str = "metric") -> str:
        """Generate rotating progress copy: Metric → Distance → Identity"""
        behavior = self.get_or_create_user_behavior(user_id)
        
        # Get current progress
        total_progress = self.db.exec(
            select(UserProgress).where(
                UserProgress.user_id == user_id,
                UserProgress.roadmap_id == roadmap_id
            )
        ).all()
        
        completed_count = len([p for p in total_progress if p.status == "completed"])
        total_count = len(total_progress)
        percentage = round((completed_count / total_count) * 100) if total_count > 0 else 0
        
        if copy_type == "metric":
            return f"{percentage}% complete"
        
        elif copy_type == "distance":
            # Find next milestone
            next_milestone = self.db.exec(
                select(MilestoneProgress).where(
                    MilestoneProgress.user_id == user_id,
                    MilestoneProgress.roadmap_id == roadmap_id,
                    MilestoneProgress.completed == False
                ).order_by(MilestoneProgress.current_value.desc())
            ).first()
            
            if next_milestone:
                remaining = next_milestone.target_value - next_milestone.current_value
                return f"{remaining} steps to {next_milestone.milestone_name}"
            else:
                return f"{total_count - completed_count} subtopics to completion"
        
        elif copy_type == "identity":
            identity_phrases = [
                "You're the kind who finishes what they start—want to seal it now?",
                "Consistent learners like you unlock 90% more opportunities",
                "Your dedication shows—time to claim your progress",
                "Building expertise step by step—that's your style"
            ]
            return random.choice(identity_phrases)
        
        return f"{percentage}% complete"
    
    # =============================================================================
    # HELPER METHODS
    # =============================================================================
    
    def get_or_create_user_behavior(self, user_id: int) -> UserBehavior:
        """Get or create UserBehavior record"""
        behavior = self.db.exec(
            select(UserBehavior).where(UserBehavior.user_id == user_id)
        ).first()
        
        if not behavior:
            behavior = UserBehavior(user_id=user_id)
            self.db.add(behavior)
            self.db.commit()
            self.db.refresh(behavior)
        
        return behavior
    
    def reset_daily_counters(self, user_id: int):
        """Reset daily counters (called by scheduled task)"""
        behavior = self.get_or_create_user_behavior(user_id)
        behavior.dismissed_nudges_today = 0
        behavior.nudge_intensity = min(1.0, behavior.nudge_intensity + 0.2)  # Recovery
        
        self.db.add(behavior)
        self.db.commit()
    
    def get_user_stats(self, user_id: int) -> Dict[str, Any]:
        """Get comprehensive user behavioral stats"""
        behavior = self.get_or_create_user_behavior(user_id)
        momentum = self.calculate_momentum_score(user_id)
        
        return {
            "xp_stats": {
                "total_xp": behavior.total_xp,
                "current_level": behavior.current_level,
                "xp_to_next_level": behavior.xp_to_next_level,
                "progress_to_next": (behavior.total_xp % behavior.xp_to_next_level) / max(1, behavior.xp_to_next_level)
            },
            "streak_stats": {
                "current_streak": behavior.current_streak,
                "longest_streak": behavior.longest_streak,
                "grace_days_remaining": behavior.grace_days_remaining
            },
            "engagement_stats": {
                "momentum_score": momentum,
                "nudge_intensity": behavior.nudge_intensity,
                "total_rewards": behavior.total_rewards_received,
                "focus_time": behavior.total_focus_time
            },
            "learning_patterns": {
                "preferred_session_length": behavior.preferred_session_length,
                "optimal_windows": behavior.optimal_learning_windows
            }
        }