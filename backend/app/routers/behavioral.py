"""
Behavioral Design API Routes
Handles all behavioral psychology features and tracking
"""

import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import Dict, List, Any, Optional
from datetime import datetime, date

from database.session import get_db
from core.auth import get_current_user
from sql_models import User, UserBehavior, LearningSession, QuickChallenge, ChallengeAttempt, RewardEvent
from services.behavioral_service import BehavioralService
from pydantic import BaseModel

router = APIRouter(prefix="/behavioral", tags=["behavioral"])
logger = logging.getLogger(__name__)

# ===== REQUEST/RESPONSE MODELS =====

class SessionCreateRequest(BaseModel):
    roadmap_id: int
    session_plan: Optional[str] = None
    estimated_duration: Optional[int] = 20

class SessionTransitionRequest(BaseModel):
    session_id: int
    new_state: str
    context: Optional[Dict[str, Any]] = None

class XPAwardRequest(BaseModel):
    activity_type: str  # "focus_time", "quiz_completion", "subtopic_completion", etc.
    context: Dict[str, Any]

class ChallengeAttemptRequest(BaseModel):
    challenge_id: int
    user_answer: str
    response_time_seconds: float
    confidence_level: Optional[int] = None
    attempt_context: str = "warmup"

class NudgeInteractionRequest(BaseModel):
    nudge_type: str
    interaction: str  # "dismissed", "engaged", "ignored"

class RewardEngagementRequest(BaseModel):
    reward_id: int
    engaged: bool
    engagement_time_seconds: Optional[float] = None

# ===== USER BEHAVIOR ENDPOINTS =====

@router.get("/user-stats")
async def get_user_behavioral_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """Get comprehensive user behavioral statistics"""
    try:
        user_id = current_user.id  # Extract ID while user is bound to session
        service = BehavioralService(db)
        return service.get_user_stats(user_id)
    except Exception as e:
        logger.error(f"Error getting user stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get user stats"
        )

@router.post("/award-xp")
async def award_experience_points(
    request: XPAwardRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """Award XP for user activities and check for level ups"""
    try:
        user_id = current_user.id  # Extract ID while user is bound to session
        service = BehavioralService(db)
        result = service.award_xp(user_id, request.activity_type, request.context)
        
        # Check for milestone updates
        if request.activity_type == "subtopic_completion":
            milestone_result = service.update_milestone_progress(user_id, "Foundation Builder", 1)
            if milestone_result and milestone_result["just_completed"]:
                result["milestone_completed"] = milestone_result
        
        return result
    except Exception as e:
        logger.error(f"Error awarding XP: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to award experience points"
        )

@router.post("/update-streak")
async def update_user_streak(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """Update user's learning streak"""
    try:
        user_id = current_user.id  # Extract ID while user is bound to session
        service = BehavioralService(db)
        return service.update_streak(user_id)
    except Exception as e:
        logger.error(f"Error updating streak: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update learning streak"
        )

@router.get("/progress-copy/{roadmap_id}")
async def get_progress_copy(
    roadmap_id: int,
    copy_type: str = "metric",  # metric, distance, identity
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, str]:
    """Get motivational progress copy"""
    try:
        user_id = current_user.id  # Extract ID while user is bound to session
        service = BehavioralService(db)
        copy_text = service.generate_progress_copy(user_id, roadmap_id, copy_type)
        return {"copy": copy_text, "type": copy_type}
    except Exception as e:
        logger.error(f"Error getting progress copy: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get progress copy"
        )

# ===== SESSION MANAGEMENT =====

@router.post("/session/create")
async def create_learning_session(
    request: SessionCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """Create new learning session with FSM state"""
    try:
        user_id = current_user.id  # Extract ID while user is bound to session
        service = BehavioralService(db)
        session = service.create_learning_session(
            user_id, request.roadmap_id, request.session_plan
        )
        
        return {
            "session_id": session.id,
            "state": session.session_state,
            "plan": session.session_plan,
            "time_bucket": session.time_of_day_bucket
        }
    except Exception as e:
        logger.error(f"Error creating learning session: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create learning session"
        )

@router.post("/session/transition")
async def transition_session_state(
    request: SessionTransitionRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Transition session through FSM states"""
    service = BehavioralService(db)
    
    user_id = user.id  # Extract ID while user is bound to session
    # Verify session belongs to user
    session = db.get(LearningSession, request.session_id)
    if not session or session.user_id != user_id:
        raise HTTPException(status_code=404, detail="Session not found")
    
    updated_session = service.transition_session_state(
        request.session_id, request.new_state, request.context
    )
    
    # Check for rewards on certain transitions
    reward = None
    if request.new_state == "CHECKPOINT":
        reward = service.create_reward_event(
            user_id, "checkpoint_reached", request.context or {}, request.session_id
        )
    
    return {
        "session_id": updated_session.id,
        "state": updated_session.session_state,
        "reward": reward.reward_content if reward else None
    }

@router.get("/session/{session_id}")
async def get_session_status(
    session_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Get current session status"""
    user_id = user.id  # Extract ID while user is bound to session
    session = db.get(LearningSession, session_id)
    if not session or session.user_id != user_id:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return {
        "session_id": session.id,
        "state": session.session_state,
        "start_time": session.start_time,
        "duration_minutes": int((datetime.utcnow() - session.start_time).total_seconds() / 60),
        "activities_completed": {
            "warmup": session.warmup_completed,
            "focus": session.focus_completed,
            "checkpoint": session.checkpoint_completed,
            "reward": session.reward_received
        },
        "session_data": session.session_data
    }

# ===== QUICK CHALLENGES =====

@router.get("/challenges/warmup/{subtopic_id}")
async def get_warmup_challenge(
    subtopic_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Get a quick challenge for warmup"""
    user_id = user.id  # Extract ID while user is bound to session
    # Get user's concept Elos to adjust difficulty
    service = BehavioralService(db)
    user_elos = service.get_user_concept_elos(user_id)
    
    # Find appropriate challenge (simplified for now)
    challenge = db.exec(
        select(QuickChallenge).where(
            QuickChallenge.subtopic_id == subtopic_id
        )
    ).first()
    
    if not challenge:
        # Generate a simple recall challenge
        challenge = QuickChallenge(
            user_id=user_id,
            subtopic_id=subtopic_id,
            challenge_type="mcq",
            question="Which concept did you learn in the previous session?",
            options=[
                {"id": "a", "text": "Arrays and indexing"},
                {"id": "b", "text": "Sorting algorithms"},
                {"id": "c", "text": "Binary trees"},
                {"id": "d", "text": "Hash tables"}
            ],
            correct_answer="a",
            explanation="This helps reinforce your previous learning."
        )
        db.add(challenge)
        db.commit()
        db.refresh(challenge)
    
    return {
        "challenge_id": challenge.id,
        "type": challenge.challenge_type,
        "question": challenge.question,
        "options": challenge.options,
        "estimated_seconds": challenge.estimated_time_seconds
    }

@router.post("/challenges/attempt")
async def submit_challenge_attempt(
    request: ChallengeAttemptRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Submit attempt at quick challenge"""
    challenge = db.get(QuickChallenge, request.challenge_id)
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")
    
    is_correct = request.user_answer.lower() == challenge.correct_answer.lower()
    
    user_id = user.id  # Extract ID while user is bound to session
    # Create attempt record
    attempt = ChallengeAttempt(
        user_id=user_id,
        challenge_id=request.challenge_id,
        user_answer=request.user_answer,
        is_correct=is_correct,
        response_time_seconds=request.response_time_seconds,
        confidence_level=request.confidence_level,
        attempt_context=request.attempt_context
    )
    db.add(attempt)
    
    # Update challenge statistics
    challenge.times_attempted += 1
    if is_correct:
        challenge.times_correct += 1
    
    challenge.average_response_time = (
        (challenge.average_response_time * (challenge.times_attempted - 1) + 
         request.response_time_seconds) / challenge.times_attempted
    )
    
    db.add(challenge)
    
    # Update concept Elo if we have concept tags
    service = BehavioralService(db)
    if challenge.concept_tags:
        for tag in challenge.concept_tags:
            outcome = 1.0 if is_correct else 0.0
            new_elo = service.update_concept_elo(user_id, tag, outcome)
    
    db.commit()
    
    # Award XP for correct answers
    xp_result = None
    if is_correct:
        xp_result = service.award_xp(user_id, "quick_challenge", {"correct": True})
    
    return {
        "correct": is_correct,
        "explanation": challenge.explanation,
        "response_time": request.response_time_seconds,
        "xp_earned": xp_result["xp_earned"] if xp_result else 0,
        "momentum_bonus": is_correct
    }

# ===== ELO AND DIFFICULTY =====

@router.get("/elo-ratings")
async def get_user_elo_ratings(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, float]:
    """Get user's concept Elo ratings"""
    user_id = user.id  # Extract ID while user is bound to session
    service = BehavioralService(db)
    return service.get_user_concept_elos(user_id)

@router.post("/update-elo")
async def update_concept_elo(
    concept_tag: str,
    outcome: float,
    item_difficulty: float = 1200.0,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, float]:
    """Update Elo rating for a concept"""
    user_id = user.id  # Extract ID while user is bound to session
    service = BehavioralService(db)
    new_elo = service.update_concept_elo(user_id, concept_tag, outcome, item_difficulty)
    
    return {
        "concept": concept_tag,
        "new_elo": new_elo,
        "outcome": outcome
    }

# ===== REWARDS SYSTEM =====

@router.get("/rewards/recent")
async def get_recent_rewards(
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> List[Dict[str, Any]]:
    """Get user's recent rewards"""
    try:
        # Access user_id immediately while user is still bound to session
        user_id = current_user.id
        
        rewards = db.exec(
            select(RewardEvent)
            .where(RewardEvent.user_id == user_id)
            .order_by(RewardEvent.created_at.desc())
            .limit(limit)
        ).all()
        
        return [
            {
                "id": reward.id,
                "type": reward.reward_type,
                "content": reward.reward_content,
                "trigger": reward.trigger_event,
                "created_at": reward.created_at,
                "engaged": reward.user_engaged
            }
            for reward in rewards
        ]
    except Exception as e:
        logger.error(f"Error getting recent rewards: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get recent rewards"
        )

@router.post("/rewards/engage")
async def engage_with_reward(
    request: RewardEngagementRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, str]:
    """Record user engagement with reward"""
    try:
        # Access user_id immediately while user is still bound to session
        user_id = current_user.id
        
        reward = db.get(RewardEvent, request.reward_id)
        if not reward or reward.user_id != user_id:
            raise HTTPException(status_code=404, detail="Reward not found")
        
        reward.user_engaged = request.engaged
        reward.engagement_time_seconds = request.engagement_time_seconds
        
        db.add(reward)
        db.commit()
        
        return {"status": "recorded"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error engaging with reward: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to record engagement"
        )

# ===== NUDGING SYSTEM =====

@router.post("/nudge/interaction")
async def record_nudge_interaction(
    request: NudgeInteractionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """Record user interaction with nudge"""
    try:
        user_id = current_user.id  # Extract ID while user is bound to session
        service = BehavioralService(db)
        
        dismissed = request.interaction == "dismissed"
        new_intensity = service.update_nudge_intensity(user_id, dismissed)
        
        return {
            "nudge_type": request.nudge_type,
            "interaction": request.interaction,
            "new_intensity": new_intensity
        }
    except Exception as e:
        logger.error(f"Error recording nudge interaction: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to record nudge interaction"
        )

@router.get("/nudge/should-show/{nudge_type}")
async def should_show_nudge(
    nudge_type: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, bool]:
    """Check if nudge should be shown to user"""
    user_id = user.id  # Extract ID while user is bound to session
    service = BehavioralService(db)
    should_show = service.should_show_nudge(user_id, nudge_type)
    
    return {"should_show": should_show}

# ===== LEARNING PATTERNS =====

@router.get("/learning-patterns/optimal-time")
async def get_optimal_learning_time(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Get user's optimal learning time windows"""
    user_id = user.id  # Extract ID while user is bound to session
    service = BehavioralService(db)
    optimal_time = service.get_optimal_learning_time(user_id)
    
    if not optimal_time:
        return {"status": "insufficient_data"}
    
    return optimal_time

@router.get("/prerequisites/{subtopic_id}")
async def get_prerequisite_status(
    subtopic_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Get prerequisite status for a subtopic"""
    user_id = user.id  # Extract ID while user is bound to session
    service = BehavioralService(db)
    return service.get_prerequisites_status(user_id, subtopic_id)

# ===== MOMENTUM AND CONSISTENCY =====

@router.get("/momentum")
async def get_momentum_score(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, float]:
    """Get user's current momentum score"""
    user_id = user.id  # Extract ID while user is bound to session
    service = BehavioralService(db)
    momentum = service.calculate_momentum_score(user_id)
    
    return {"momentum_score": momentum}

# ===== FOCUS MODE =====

@router.post("/focus/toggle")
async def toggle_focus_mode(
    enable: bool,
    duration_minutes: int = 20,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Toggle focus mode for user"""
    user_id = user.id  # Extract ID while user is bound to session
    behavior = db.exec(
        select(UserBehavior).where(UserBehavior.user_id == user_id)
    ).first()
    
    if not behavior:
        behavior = UserBehavior(user_id=user_id)
    
    if enable:
        behavior.focus_mode_enabled = True
        behavior.focus_session_start = datetime.utcnow()
        behavior.preferred_session_length = duration_minutes
    else:
        # Calculate focus time
        if behavior.focus_session_start:
            focus_duration = int((datetime.utcnow() - behavior.focus_session_start).total_seconds() / 60)
            behavior.total_focus_time += focus_duration
        
        behavior.focus_mode_enabled = False
        behavior.focus_session_start = None
    
    db.add(behavior)
    db.commit()
    
    return {
        "focus_mode_enabled": behavior.focus_mode_enabled,
        "total_focus_time": behavior.total_focus_time,
        "session_length": duration_minutes if enable else 0
    }