from typing import Optional, List, Dict, Any
from sqlmodel import Field, SQLModel, Column, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy import DateTime # Import DateTime
from datetime import datetime, date
import uuid

class UserBase(SQLModel):
    email: str
    is_active: bool = True
    is_admin: bool = False
    display_name: Optional[str] = None
    profile_completed: bool = False
    onboarding_completed: bool = False

class UserCreate(UserBase):
    password: Optional[str] = None

class UserRead(UserBase):
    id: int

class User(UserBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    supabase_uid: Optional[str] = Field(default=None, unique=True, index=True)
    firebase_uid: Optional[str] = Field(default=None, unique=True, index=True)  # Keep for migration
    hashed_password: Optional[str] = ""

class GoalBase(SQLModel):
    title: str
    description: Optional[str] = None

class GoalCreate(GoalBase):
    pass

class GoalRead(GoalBase):
    id: int
    user_id: int

class Goal(GoalBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(index=True, foreign_key="user.id")

class RoadmapBase(SQLModel):
    title: str
    description: Optional[str] = None
    subject: Optional[str] = None
    goal: Optional[str] = None
    time_value: Optional[int] = None
    time_unit: Optional[str] = None
    model: Optional[str] = None
    roadmap_plan: List[Dict[str, Any]] = Field(sa_column=Column(JSONB))

class RoadmapCreate(RoadmapBase):
    pass

class RoadmapRead(RoadmapBase):
    id: int
    user_id: int

class Roadmap(RoadmapBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(index=True, foreign_key="user.id")

class QuestionBase(SQLModel):
    id: int
    question_text: str
    options: List[Dict[str, Any]] = Field(sa_column=Column(JSONB))
    correct_answer_id: str
    explanation: Optional[str] = None

class QuizBase(SQLModel):
    title: str
    description: Optional[str] = None
    subject: str
    module_title: Optional[str] = None
    topic_title: Optional[str] = None
    topic_id: Optional[int] = None # New field
    time_limit: Optional[int] = None # New field
    questions: List[QuestionBase]

class QuizCreate(QuizBase):
    pass

class QuizRead(QuizBase):
    id: int

class Quiz(QuizBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    questions: List[QuestionBase] = Field(default_factory=list, sa_column=Column(JSONB)) # Store questions as JSONB

class SpacedRepetitionBase(SQLModel):
    user_id: int
    quiz_id: int
    question_id: int
    sub_topic_id: Optional[str] = None # Added to link to subtopic
    easiness_factor: float
    repetitions: int
    interval: int
    next_review_date: date

class SpacedRepetitionCreate(SpacedRepetitionBase):
    pass

class SpacedRepetitionRead(SpacedRepetitionBase):
    id: int

class SpacedRepetition(SpacedRepetitionBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)

class UserProgress(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(index=True, foreign_key="user.id")
    sub_topic_id: str = Field(index=True)
    roadmap_id: int = Field(index=True, foreign_key="roadmap.id")
    status: str = Field(default="in_progress") # in_progress, completed
    completed_at: Optional[datetime] = Field(default=None)
    learn_completed: bool = Field(default=False)
    quiz_completed: bool = Field(default=False)
    quiz_best_score: Optional[float] = Field(default=None)
    code_challenge_completed: bool = Field(default=False)
    last_accessed_at: Optional[datetime] = Field(default=None)
    time_spent_learning: int = Field(default=0)

# UserSession removed - was over-engineered and caused 404 errors
# Resume functionality now uses UserProgress.last_accessed_at instead

try:
    from app.schemas import ContentBlock, QuestionResult # Import the ContentBlock type and QuestionResult
except ImportError:
    # Fallback for testing/CI environments
    ContentBlock = dict
    QuestionResult = dict

class LearningContentBase(SQLModel):
    subtopic: str
    content: List[ContentBlock] = Field(sa_column=Column(JSONB)) # Use JSONB for structured content
    model: str

class LearningContentCreate(LearningContentBase):
    pass

class LearningContentRead(LearningContentBase):
    id: int
    user_id: int

class LearningContent(LearningContentBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(index=True, foreign_key="user.id")
    model: str
    
    # Enhanced fields for save/share functionality
    is_saved: bool = Field(default=False)  # User explicitly saved this
    is_generated: bool = Field(default=False)  # Content was AI-generated
    is_public: bool = Field(default=False)  # Can be shared publicly
    share_token: Optional[str] = Field(default=None, index=True)  # Unique token for sharing
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Additional metadata for better organization
    subject: Optional[str] = Field(default=None)
    goal: Optional[str] = Field(default=None)
    subtopic_id: Optional[str] = Field(default=None, index=True)  # Reference to roadmap subtopic
    roadmap_id: Optional[int] = Field(default=None, index=True, foreign_key="roadmap.id")  # Reference to roadmap

class Question(QuestionBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)

class QuizAttempt(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(index=True, foreign_key="user.id")
    quiz_id: int = Field(index=True, foreign_key="quiz.id")
    score: float
    total_questions: int
    sub_topic_id: str = Field(index=True) # Added to link to subtopic
    question_results: List[QuestionResult] = Field(default_factory=list, sa_column=Column(JSONB)) # Store question results
    attempted_at: datetime = Field(default_factory=datetime.utcnow)
    completed: bool = Field(default=True)

class QuizActivityLog(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(index=True, foreign_key="user.id")
    quiz_id: int = Field(index=True, foreign_key="quiz.id")
    quiz_attempt_id: int = Field(index=True, foreign_key="quizattempt.id")
    fullscreen_violations: int = 0
    visibility_violations: int = 0
    final_action: str
    started_at: datetime = Field(default_factory=datetime.utcnow)
    ended_at: datetime = Field(default_factory=datetime.utcnow)

class QuizSession(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(index=True, foreign_key="user.id")
    quiz_id: int = Field(index=True, foreign_key="quiz.id")
    sub_topic_title: str = Field(index=True)
    sub_topic_id: Optional[str] = Field(default=None, index=True)  # Store the actual roadmap subtopic ID
    session_token: str = Field(unique=True, index=True)
    started_at: datetime = Field(default_factory=datetime.utcnow)

class UserPerformance(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(index=True, foreign_key="user.id")
    quizzes_completed: int = Field(default=0)
    total_score: int = Field(default=0)
    total_questions_answered: int = Field(default=0)
    total_correct_answers: int = Field(default=0)
    average_score: float = Field(default=0.0)
    overall_accuracy: float = Field(default=0.0)

# Practice Session Models

class PracticeSession(SQLModel, table=True):
    """Practice sessions for custom practice/exam mode"""
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(index=True, foreign_key="user.id")
    roadmap_id: int = Field(index=True, foreign_key="roadmap.id")
    session_token: str = Field(unique=True, index=True)
    
    # Configuration
    subtopic_ids: List[str] = Field(sa_column=Column(JSONB))
    question_types: List[str] = Field(sa_column=Column(JSONB))
    question_count: int
    time_limit: int  # in minutes
    hints_enabled: bool = Field(default=True)
    subject: str
    goal: str
    
    # Session tracking
    status: str = Field(default="active")  # active, completed, expired
    started_at: Optional[datetime] = Field(default=None)
    completed_at: Optional[datetime] = Field(default=None)
    total_time_spent: Optional[int] = Field(default=None)  # in seconds
    
    # Results
    final_score: Optional[float] = Field(default=None)
    correct_answers: Optional[int] = Field(default=None)
    hints_used: Optional[int] = Field(default=None)
    
    created_at: datetime = Field(default_factory=datetime.utcnow)

class PracticeQuestion(SQLModel, table=True):
    """Generated questions for practice sessions"""
    id: Optional[int] = Field(default=None, primary_key=True)
    session_id: int = Field(index=True, foreign_key="practicesession.id")
    subtopic_id: str = Field(index=True)
    
    # Question details
    question_type: str  # mcq, numerical, caseStudy, codeCompletion, debugging
    question_data: Dict[str, Any] = Field(sa_column=Column(JSONB))  # question, options, correct_answer, explanation, hint, code_snippet, etc.
    difficulty: str = Field(default="medium")  # easy, medium, hard
    order_index: int
    
    # AI generation details
    model_used: Optional[str] = Field(default=None)
    generation_prompt: Optional[str] = Field(default=None, sa_column=Column(Text))
    
    created_at: datetime = Field(default_factory=datetime.utcnow)

class PracticeAnswer(SQLModel, table=True):
    """User answers for practice questions"""
    id: Optional[int] = Field(default=None, primary_key=True)
    session_id: int = Field(index=True, foreign_key="practicesession.id")
    question_id: int = Field(index=True, foreign_key="practicequestion.id")
    
    # Answer details
    user_answer: str = Field(sa_column=Column(Text))
    is_correct: bool
    time_spent: int  # seconds spent on this question
    hint_used: bool = Field(default=False)
    
    # Metadata
    answered_at: datetime = Field(default_factory=datetime.utcnow)
    question_order: int = Field(default=0)  # order in which question was answered

# Behavioral Design System Models

class UserBehavior(SQLModel, table=True):
    """Tracks user behavioral patterns and preferences"""
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(index=True, foreign_key="user.id", unique=True)
    
    # XP and Progression System
    total_xp: int = Field(default=0)
    current_level: int = Field(default=1)
    xp_to_next_level: int = Field(default=100)
    
    # Streak System with Forgiveness
    current_streak: int = Field(default=0)
    longest_streak: int = Field(default=0)
    grace_days_remaining: int = Field(default=2)
    last_activity_date: Optional[date] = None
    streak_broken_count: int = Field(default=0)
    
    # Nudge and Personalization
    nudge_intensity: float = Field(default=1.0)  # 0.0-1.0 scale
    dismissed_nudges_today: int = Field(default=0)
    preferred_session_length: int = Field(default=20)  # minutes
    
    # Focus and Flow State
    focus_mode_enabled: bool = Field(default=False)
    focus_session_start: Optional[datetime] = None
    total_focus_time: int = Field(default=0)  # minutes
    
    # Time-of-day Learning Patterns
    optimal_learning_windows: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSONB))
    session_completion_by_hour: Optional[Dict[str, int]] = Field(default_factory=dict, sa_column=Column(JSONB))
    
    # Reward System
    last_reward_received: Optional[datetime] = None
    total_rewards_received: int = Field(default=0)
    reward_probability_modifier: float = Field(default=1.0)
    
    # Progress Metrics
    momentum_score: float = Field(default=0.0)  # decay-weighted recent activity
    consistency_score: float = Field(default=0.0)  # regularity of study sessions
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow, sa_column=Column(DateTime(timezone=True), onupdate=datetime.utcnow))

class ConceptElo(SQLModel, table=True):
    """Elo rating for each concept per user"""
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(index=True, foreign_key="user.id")
    concept_tag: str = Field(index=True)  # e.g., "arrays", "sorting", "graphs"
    elo_rating: float = Field(default=1200.0)
    total_attempts: int = Field(default=0)
    correct_attempts: int = Field(default=0)
    last_updated: datetime = Field(default_factory=datetime.utcnow)

class LearningSession(SQLModel, table=True):
    """Detailed session tracking for behavioral analysis"""
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(index=True, foreign_key="user.id")
    roadmap_id: int = Field(index=True, foreign_key="roadmap.id")
    
    # Session Flow State Machine
    session_state: str = Field(default="WARMUP")  # WARMUP, FOCUS, CHECKPOINT, REWARD, PRIME_NEXT
    session_plan: Optional[str] = None  # Implementation intention
    estimated_duration: int = Field(default=20)  # minutes
    actual_duration: Optional[int] = None  # minutes
    
    # Activities Completed
    warmup_completed: bool = Field(default=False)
    focus_completed: bool = Field(default=False)
    checkpoint_completed: bool = Field(default=False)
    reward_received: bool = Field(default=False)
    prime_next_action: Optional[str] = None  # "continue", "bank_win", "different_path"
    
    # Performance Metrics
    subtopics_completed: int = Field(default=0)
    quizzes_attempted: int = Field(default=0)
    average_quiz_score: Optional[float] = None
    flow_interruptions: int = Field(default=0)
    
    # Context
    start_time: datetime = Field(default_factory=datetime.utcnow)
    end_time: Optional[datetime] = None
    time_of_day_bucket: str = Field(default="")  # "morning", "afternoon", "evening", "night"
    
    # Behavioral Flags
    used_quick_recall: bool = Field(default=False)
    accepted_recommendations: int = Field(default=0)
    dismissed_nudges: int = Field(default=0)
    
    session_data: Optional[Dict[str, Any]] = Field(default_factory=dict, sa_column=Column(JSONB))

class MilestoneProgress(SQLModel, table=True):
    """Track milestone achievements and named checkpoints"""
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(index=True, foreign_key="user.id")
    roadmap_id: int = Field(index=True, foreign_key="roadmap.id")
    
    milestone_type: str = Field(index=True)  # "module", "checkpoint", "level", "streak"
    milestone_name: str  # "Foundations Gate", "Algorithm Bridge", "Level 5"
    milestone_description: str
    
    # Progress Tracking
    current_value: int = Field(default=0)
    target_value: int
    completion_percentage: float = Field(default=0.0)
    completed: bool = Field(default=False)
    completed_at: Optional[datetime] = None
    
    # Rewards and Recognition
    reward_claimed: bool = Field(default=False)
    unlock_benefits: Optional[List[str]] = Field(default_factory=list, sa_column=Column(JSONB))
    
    created_at: datetime = Field(default_factory=datetime.utcnow)

class QuickChallenge(SQLModel, table=True):
    """Micro-challenges for warmup and momentum building"""
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(index=True, foreign_key="user.id")
    subtopic_id: str = Field(index=True)
    
    challenge_type: str  # "mcq", "code_trace", "recall", "concept_match"
    question: str
    options: Optional[List[Dict[str, Any]]] = Field(default_factory=list, sa_column=Column(JSONB))
    correct_answer: str
    explanation: Optional[str] = None
    
    # Metadata
    difficulty_level: float = Field(default=1.0)
    estimated_time_seconds: int = Field(default=30)
    concept_tags: List[str] = Field(default_factory=list, sa_column=Column(JSONB))
    
    # Tracking
    times_attempted: int = Field(default=0)
    times_correct: int = Field(default=0)
    average_response_time: float = Field(default=0.0)
    
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ChallengeAttempt(SQLModel, table=True):
    """Individual attempts at quick challenges"""
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(index=True, foreign_key="user.id")
    challenge_id: int = Field(index=True, foreign_key="quickchallenge.id")
    session_id: Optional[int] = Field(foreign_key="learningsession.id")
    
    user_answer: str
    is_correct: bool
    response_time_seconds: float
    confidence_level: Optional[int] = None  # 1-5 scale
    
    # Context
    attempt_context: str = Field(default="warmup")  # "warmup", "checkpoint", "review"
    elo_before: Optional[float] = None
    elo_after: Optional[float] = None
    
    attempted_at: datetime = Field(default_factory=datetime.utcnow)

class RewardEvent(SQLModel, table=True):
    """Track reward distribution and user engagement"""
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(index=True, foreign_key="user.id")
    session_id: Optional[int] = Field(foreign_key="learningsession.id")
    
    reward_type: str  # "confetti", "insight_card", "achievement", "streak_bonus"
    reward_content: Optional[Dict[str, Any]] = Field(default_factory=dict, sa_column=Column(JSONB))
    
    # Trigger Context
    trigger_event: str  # "subtopic_completion", "milestone_reached", "streak_maintained"
    trigger_data: Optional[Dict[str, Any]] = Field(default_factory=dict, sa_column=Column(JSONB))
    
    # Engagement
    displayed: bool = Field(default=True)
    user_engaged: bool = Field(default=False)  # clicked, dismissed, etc.
    engagement_time_seconds: Optional[float] = None
    
    created_at: datetime = Field(default_factory=datetime.utcnow)

class DependencyMap(SQLModel, table=True):
    """Maps prerequisites and dependencies between subtopics"""
    id: Optional[int] = Field(default=None, primary_key=True)
    subtopic_id: str = Field(index=True)
    prerequisite_id: str = Field(index=True)
    roadmap_id: int = Field(index=True, foreign_key="roadmap.id")
    
    dependency_strength: float = Field(default=1.0)  # 0.0-1.0, how critical is this prereq
    minimum_mastery_score: float = Field(default=0.7)  # minimum score needed in prereq
    
    created_at: datetime = Field(default_factory=datetime.utcnow)

# Curated Roadmaps System - Public Catalog for High-Quality Learning Paths

class CuratedRoadmapBase(SQLModel):
    """High-quality, curated learning roadmaps for public browsing"""
    title: str = Field(max_length=200, description="Clear, descriptive roadmap title")
    description: str = Field(max_length=1000, description="Detailed description of learning outcomes")
    category: str = Field(max_length=50, index=True, description="Primary category (programming, data-science, etc)")
    subcategory: Optional[str] = Field(max_length=50, index=True, description="Specific subcategory")
    difficulty: str = Field(max_length=20, index=True, description="beginner, intermediate, advanced")
    
    # Quality and Curation Metrics
    is_featured: bool = Field(default=False, description="Featured on homepage")
    is_verified: bool = Field(default=False, description="Expert-verified quality")
    quality_score: float = Field(default=0.0, description="Internal quality rating 0-10")
    
    # Public Engagement Metrics
    view_count: int = Field(default=0, description="Public page views")
    adoption_count: int = Field(default=0, description="Users who adopted this roadmap")
    completion_rate: float = Field(default=0.0, description="% of adopters who completed")
    average_rating: float = Field(default=0.0, description="User ratings average")
    
    # Learning Path Metadata
    roadmap_plan: List[Dict[str, Any]] = Field(sa_column=Column(JSONB), description="Complete learning structure")
    estimated_hours: Optional[int] = Field(description="Total estimated learning time")
    prerequisites: Optional[List[str]] = Field(default_factory=list, sa_column=Column(JSONB), description="Required knowledge")
    learning_outcomes: Optional[List[str]] = Field(default_factory=list, sa_column=Column(JSONB), description="What learners will achieve")
    tags: List[str] = Field(default_factory=list, sa_column=Column(JSONB), description="Searchable tags")
    
    # SEO and Discovery
    slug: Optional[str] = Field(max_length=200, index=True, description="URL-friendly identifier")
    target_audience: Optional[str] = Field(max_length=200, description="Who this roadmap is for")
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow, sa_column=Column(DateTime(timezone=True), onupdate=datetime.utcnow))

class CuratedRoadmap(CuratedRoadmapBase, table=True):
    """Database model for curated roadmaps"""
    id: Optional[int] = Field(default=None, primary_key=True)

class UserCuratedRoadmapBase(SQLModel):
    """Tracks user adoption of curated roadmaps"""
    user_id: int = Field(foreign_key="user.id", description="User who adopted the roadmap")
    curated_roadmap_id: int = Field(foreign_key="curatedroadmap.id", description="Adopted curated roadmap")
    personal_roadmap_id: Optional[int] = Field(foreign_key="roadmap.id", description="User's personal copy")
    
    # User Feedback
    user_rating: Optional[int] = Field(description="User rating 1-5 stars")
    
    adopted_at: datetime = Field(default_factory=datetime.utcnow)

class UserCuratedRoadmap(UserCuratedRoadmapBase, table=True):
    """Database model for tracking user adoption of curated roadmaps"""
    id: Optional[int] = Field(default=None, primary_key=True)

class PromotionalImageBase(SQLModel):
    """Base model for promotional images generated by AI"""
    image_url: str = Field(description="Base64 data URL or storage URL of the image")
    prompt: str = Field(description="AI prompt used to generate the image")
    model: str = Field(description="AI model used for generation")
    concept: str = Field(description="Marketing concept/theme of the image")
    quality: str = Field(default="high", description="Generation quality setting")
    
    # Image metadata
    width: int = Field(default=1920, description="Image width in pixels")
    height: int = Field(default=1080, description="Image height in pixels")
    aspect_ratio: str = Field(default="16:9", description="Image aspect ratio")
    
    # Usage tracking
    is_active: bool = Field(default=True, description="Available for rotation")
    usage_count: int = Field(default=0, description="Times used on main page")
    last_used: Optional[datetime] = Field(default=None, description="Last time used")
    
    created_at: datetime = Field(default_factory=datetime.utcnow)

class PromotionalImage(PromotionalImageBase, table=True):
    """Database model for storing AI-generated promotional images"""
    id: Optional[int] = Field(default=None, primary_key=True)

# Learning Resources System - External links for roadmaps

class RoadmapResourceBase(SQLModel):
    """External learning resources for curated roadmaps"""
    curated_roadmap_id: int = Field(foreign_key="curatedroadmap.id", description="Associated curated roadmap")
    title: str = Field(max_length=200, description="Resource title")
    url: str = Field(max_length=500, description="Resource URL")
    type: str = Field(max_length=50, description="Resource type: documentation, blog, video, paper, wikipedia, tutorial, etc.")
    description: str = Field(max_length=500, description="Brief description of the resource")
    
    # Management fields
    is_active: bool = Field(default=True, description="Whether resource is visible")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_validated: Optional[datetime] = Field(default=None, description="Last time URL was verified")

class RoadmapResource(RoadmapResourceBase, table=True):
    """Database model for roadmap learning resources"""
    id: Optional[int] = Field(default=None, primary_key=True)
