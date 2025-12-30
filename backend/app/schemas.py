from typing import List, Optional, Dict, Any, Union, Literal, Annotated
from datetime import datetime, date
from sqlmodel import SQLModel, Field
from pydantic import BaseModel
import uuid

# Removed settings import to avoid circular dependency during startup

class Token(SQLModel):
    access_token: str
    token_type: str
    user_id: int
    user_email: str

class TokenData(SQLModel):
    email: Optional[str] = None

class UserUpdate(SQLModel):
    email: Optional[str] = None
    full_name: Optional[str] = None
    is_active: Optional[bool] = None
    is_admin: Optional[bool] = None

class QuestionBase(BaseModel):
    id: int
    question_text: str
    options: List[Dict[str, Any]]
    correct_answer_id: Union[str, int]
    explanation: Optional[str] = None

class QuizAIResponse(BaseModel):
    questions: List[QuestionBase]
    model: str
    session_token: Optional[str] = None
    time_limit: Optional[int] = None

class QuizGenerateRequest(SQLModel):
    sub_topic_title: str
    sub_topic_id: Optional[str] = None  # The actual ID from the roadmap
    subject: str
    goal: str
    time_value: int
    time_unit: str
    model: str
    module_title: str
    topic_title: str
    num_questions: int = 5 # Default to 5 questions
    learn_content_context: Optional[str] = None  # Learn content for contextual quiz generation

class QuizResponse(BaseModel):
    id: int
    topic_title: str
    sub_topic_id: str
    questions: List[QuestionBase]
    time_limit: Optional[int] = None

class QuizSubmission(SQLModel):
    session_token: str
    answers: List['Answer']
    violations: Dict[str, Any]
    final_action: str

class Answer(SQLModel):
    question_id: int
    selected_option_id: Optional[Union[str, int]] = None

class QuestionResult(SQLModel):
    question_id: Optional[int] = None
    selected_answer_id: Optional[Union[str, int]] = None
    correct_answer_id: Optional[Union[str, int]] = None
    is_correct: Optional[bool] = None
    explanation: Optional[str] = None

class QuizResult(SQLModel):
    attempt_id: int
    score: float
    total_questions: int
    message: str
    question_results: List[QuestionResult]

class QuizResultResponse(SQLModel):
    id: Optional[int] = None
    user_id: int
    quiz_id: int
    sub_topic_id: Optional[str] = None
    score: Optional[float] = None
    total_questions: Optional[int] = None
    question_results: Optional[List[QuestionResult]] = None
    completed_at: Optional[datetime] = None
    completed: bool = True



class RecommendedReview(SQLModel):
    sub_topic_id: str
    sub_topic_title: str
    module_title: str
    topic_title: str
    subject: str
    next_review_date: date

class Subtopic(SQLModel):
    id: str
    title: str
    has_learn: bool
    has_quiz: bool
    has_code_challenge: bool

class RoadmapTopic(SQLModel):
    id: str
    title: str
    subtopics: List[Subtopic]

class RoadmapModule(SQLModel):
    id: str
    title: str
    timeline: str
    topics: List[RoadmapTopic]

class RoadmapPlan(SQLModel):
    modules: List[RoadmapModule]

class RoadmapAIResponse(SQLModel):
    title: str
    description: str
    roadmap_plan: RoadmapPlan
    model: Optional[str] = None

class RoadmapCreateRequest(SQLModel):
    subject: str
    goal: str
    time_value: int
    time_unit: str
    model: Optional[str] = None

class RoadmapResponse(SQLModel):
    id: int
    user_id: int
    title: str
    description: Optional[str] = None
    roadmap_plan: List[Dict[str, Any]]  # Changed to List for frontend compatibility
    subject: Optional[str] = None
    goal: Optional[str] = None
    time_value: Optional[int] = None
    time_unit: Optional[str] = None
    model: Optional[str] = None

# New schemas for Performance Analysis
class UserPerformanceDetailsResponse(SQLModel):
    user_id: int
    quizzes_completed: int
    average_score: float
    total_score: int
    total_questions_answered: int
    overall_accuracy: float
    historical_quiz_results: List[QuizResultResponse]
    score_trajectory: Optional[List[float]] = None # Assuming a list of scores over time

class GenerateFeedbackRequest(SQLModel):
    user_id: int
    performance_details: Dict[str, Any]
    model: Optional[str] = "openrouter:meta-llama/llama-3.2-3b-instruct:free"  # Free OpenRouter model

class GenerateFeedbackResponse(SQLModel):
    feedback_text: str

class LearningContentRequest(SQLModel):
    subtopic: str
    subject: str
    goal: str
    model: str
    max_output_tokens: Optional[int] = None



class RoadmapUpdate(SQLModel):
    title: Optional[str] = None
    description: Optional[str] = None
    roadmap_plan: Optional[List[RoadmapModule]] = None

class QuizResultUpdate(SQLModel):
    score: Optional[int] = None
    total_questions: Optional[int] = None
    question_results: Optional[List[QuestionResult]] = None

class SpacedRepetitionUpdate(SQLModel):
    easiness_factor: Optional[float] = None
    repetitions: Optional[int] = None
    interval: Optional[int] = None
    next_review_date: Optional[date] = None

class UserPerformanceUpdate(SQLModel):
    quizzes_completed: Optional[int] = None
    total_score: Optional[int] = None
    total_questions_answered: Optional[int] = None
    average_score: Optional[float] = None
    overall_accuracy: Optional[float] = None

# UserSession schemas removed - was over-engineered
# Resume functionality now simplified and uses progress data directly

class UserProgressRead(SQLModel):
    id: Optional[int] = None
    user_id: int
    sub_topic_id: str
    roadmap_id: int
    status: str
    completed_at: Optional[datetime] = None
    learn_completed: bool
    quiz_completed: bool
    quiz_best_score: Optional[float] = None
    code_challenge_completed: bool
    last_accessed_at: Optional[datetime] = None
    time_spent_learning: int

class RecommendedReviewQueryResult(SQLModel):
    sub_topic_id: str
    sub_topic_title: str
    module_title: str
    topic_title: str
    subject: str
    next_review_date: date

# Removed duplicate LearningContentResponse - using the BaseModel version with List[ContentBlock] below

class LearningContentOutlineRequest(SQLModel):
    subtopic: str
    subject: str
    goal: str
    model: str
    max_output_tokens: Optional[int] = None

class LearningContentOutlineResponse(SQLModel):
    outline: List[str]

class LearningContentChunkRequest(SQLModel):
    subtopic: str
    subject: str
    goal: str
    model: str
    chunk_title: str
    context: str # The main content or previous chunks for context
    max_output_tokens: Optional[int] = None

class LearningContentChunkResponse(SQLModel):
    content: str

class ThreeDVisualizationRequest(SQLModel):
    description: str
    model: str
    max_output_tokens: Optional[int] = None

class ThreeDVisualizationResponse(SQLModel):
    html_content: str
    model: str

# --- New Structured Learning Content Schemas ---

class HeadingBlock(BaseModel):
    type: Literal['heading']
    data: Dict[str, Any] # {'level': 1 | 2 | 3, 'text': string}

class ParagraphBlock(BaseModel):
    type: Literal['paragraph']
    data: Dict[str, Any] # {'text': string}

class ProgressiveDisclosureBlock(BaseModel):
    type: Literal['progressive_disclosure']
    data: Dict[str, Any] # {'key_idea': string, 'summary': string, 'full_text': string, 'visual_url'?: string}

class ActiveRecallBlock(BaseModel):
    type: Literal['active_recall']
    data: Dict[str, Any] # {'question': string, 'answer': string}

class DualCodingBlock(BaseModel):
    type: Literal['dual_coding']
    data: Dict[str, Any] # {'text': string, 'visual_url': string, 'position': 'left' | 'right'}

class ComparisonTableBlock(BaseModel):
    type: Literal['comparison_table']
    data: Dict[str, Any] # {'headers': string[], 'rows': string[][]}

class CalloutBlock(BaseModel):
    type: Literal['callout']
    data: Dict[str, Any] # {'text': string, 'style': 'metaphor' | 'analogy' | 'example' | 'warning'}

class MermaidDiagramBlock(BaseModel):
    type: Literal['mermaid_diagram']
    data: Dict[str, Any] # {'chart': string}

class ThreeDVisualizationBlock(BaseModel):
    type: Literal['3d_visualization']
    data: Dict[str, Any] # {'description': string}

ContentBlock = Annotated[
    Union[
        HeadingBlock,
        ParagraphBlock,
        ProgressiveDisclosureBlock,
        ActiveRecallBlock,
        DualCodingBlock,
        ComparisonTableBlock,
        CalloutBlock,
        MermaidDiagramBlock,
        ThreeDVisualizationBlock
    ],
    Field(discriminator="type")
]

class BehavioralData(BaseModel):
    xp_earned: int = 0
    total_xp: int = 0
    current_level: int = 1
    level_up: bool = False
    current_streak: int = 1
    milestone_completed: bool = False

# Practice Session Schemas
class PracticeQuestionResponse(BaseModel):
    id: int
    question_type: str
    question: str
    options: Optional[List[str]] = None
    hint: Optional[str] = None
    code_snippet: Optional[str] = None
    difficulty: str
    subtopic_id: str
    order_index: int

class PracticeSessionResponse(BaseModel):
    session_id: int
    session_token: str
    questions: List[PracticeQuestionResponse]
    time_limit: int
    hints_enabled: bool
    question_count: int
    subtopic_ids: List[str]
    question_types: List[str]
    roadmap_id: int
    subject: str
    goal: str

class PracticeAnswerCreate(BaseModel):
    question_id: int
    user_answer: str
    time_spent: int  # seconds
    hint_used: bool = False

# Library Resources Schema (separate from roadmap learning resources)
class LibraryResource(BaseModel):
    """Individual library resource for library content pages"""
    title: str
    url: str
    type: str  # 'documentation', 'tutorial', 'video', 'blog', 'paper', 'wikipedia'
    description: str

class LearningContentResponse(BaseModel):
    id: Optional[int] = None
    content: List[ContentBlock]
    model: str
    subject: Optional[str] = None
    goal: Optional[str] = None
    subtopic: Optional[str] = None
    subtopic_id: Optional[str] = None
    roadmap_id: Optional[int] = None
    
    # Library resources (only included for library content generation)
    resources: Optional[List[LibraryResource]] = None
    
    # Enhanced fields for save/share functionality
    is_saved: bool = False
    is_generated: bool = False
    is_public: bool = False
    share_token: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    # Behavioral tracking data
    behavioral_data: Optional[BehavioralData] = None

class TimeSummaryResponse(BaseModel):
    total_time_spent: int
    period: str

class NextSubtopicResponse(BaseModel):
    module_title: str
    topic_title: str
    subtopic_title: str
    subtopic_id: str
    status: str

# Curated Roadmaps Schemas

class CuratedRoadmapResponse(SQLModel):
    """Response schema for curated roadmaps (public access)"""
    id: int
    title: str
    description: str
    category: str
    subcategory: Optional[str] = None
    difficulty: str
    is_featured: bool
    is_verified: bool
    
    # Engagement metrics for public display
    view_count: int
    adoption_count: int
    average_rating: float
    
    # Learning metadata
    roadmap_plan: List[Dict[str, Any]]
    estimated_hours: Optional[int] = None
    prerequisites: List[str]
    learning_outcomes: List[str]
    tags: List[str]
    target_audience: Optional[str] = None
    slug: Optional[str] = None
    
    created_at: datetime
    updated_at: datetime

class CuratedRoadmapListResponse(SQLModel):
    """Response for browsing curated roadmaps"""
    id: int
    title: str
    description: str
    category: str
    subcategory: Optional[str] = None
    difficulty: str
    is_featured: bool
    is_verified: bool
    
    # Summary metrics
    view_count: int
    adoption_count: int
    average_rating: float
    estimated_hours: Optional[int] = None
    tags: List[str]
    target_audience: Optional[str] = None
    slug: Optional[str] = None

class CuratedRoadmapSearchRequest(SQLModel):
    """Request schema for searching curated roadmaps"""
    query: Optional[str] = None
    category: Optional[str] = None
    subcategory: Optional[str] = None
    difficulty: Optional[str] = None
    tags: Optional[List[str]] = None
    min_rating: Optional[float] = None
    featured_only: Optional[bool] = False
    verified_only: Optional[bool] = False
    
    # Pagination
    page: int = 1
    per_page: int = 200  # Show all roadmaps by default
    
    # Sorting
    sort_by: str = "popularity"  # popularity, rating, recent, alphabetical

class CuratedRoadmapAdoptRequest(SQLModel):
    """Request to adopt a curated roadmap"""
    curated_roadmap_id: int
    customize_title: Optional[str] = None  # Allow user to customize title

class CuratedRoadmapAdoptResponse(SQLModel):
    """Response after adopting a curated roadmap"""
    success: bool
    message: str
    personal_roadmap_id: int
    adoption_id: int

class CuratedRoadmapCategoriesResponse(SQLModel):
    """Response for available categories"""
    categories: Dict[str, List[str]]  # category -> [subcategories]

# Practice/Exam System Schemas

class PracticeSessionCreate(BaseModel):
    subtopic_ids: List[str]
    question_types: List[str]  # mcq, numerical, caseStudy, codeCompletion, debugging
    question_count: int
    time_limit: int  # in minutes
    hints_enabled: bool = True
    roadmap_id: int
    subject: str
    goal: str

class PracticeQuestionResponse(BaseModel):
    id: int
    question_type: str
    question: str
    options: Optional[List[str]] = None
    hint: Optional[str] = None
    code_snippet: Optional[str] = None
    difficulty: str
    subtopic_id: str
    order_index: int

class PracticeSessionResponse(BaseModel):
    session_id: int
    session_token: str
    questions: List[PracticeQuestionResponse]
    time_limit: int
    hints_enabled: bool

class PracticeAnswerResult(BaseModel):
    question_id: int
    user_answer: str
    correct_answer: str
    is_correct: bool
    explanation: str
    time_spent: int
    hint_used: bool

class PracticeStrength(BaseModel):
    category: str
    score: float
    description: str

class PracticeWeakness(BaseModel):
    category: str
    score: float
    description: str
    improvement_suggestion: str

class PracticeResultsResponse(BaseModel):
    session_id: int
    final_score: float
    correct_answers: int
    total_questions: int
    total_time: int  # seconds
    hints_used: int
    
    # Performance analysis
    strengths: List[PracticeStrength]
    weaknesses: List[PracticeWeakness]
    
    # Detailed results
    question_results: List[PracticeAnswerResult]
    
    # Performance by type
    performance_by_type: Dict[str, Dict[str, Any]]
    performance_by_difficulty: Dict[str, Dict[str, Any]]
    
    completed_at: datetime

class PracticeSessionSummary(BaseModel):
    id: int
    score: float
    questions_count: int
    time_spent: int
    completed_at: datetime
    subject: str

class PracticeHistoryResponse(BaseModel):
    sessions: List[PracticeSessionSummary]
    total_sessions: int
    average_score: float
    total_questions_answered: int

# Learning Resources Schemas

class LearningResourceRequest(BaseModel):
    """Request schema for generating learning resources"""
    roadmap_id: int
    topic: str
    category: str
    max_resources: int = 30
    model: str = "openrouter:google/gemma-3n-e2b-it:free"
    max_output_tokens: int = 3000
    roadmap_title: Optional[str] = ""
    roadmap_description: Optional[str] = ""

class LearningResourceBase(BaseModel):
    """Individual learning resource"""
    title: str
    url: str
    type: str  # 'documentation', 'tutorial', 'video', 'blog', 'paper', 'wikipedia'
    description: str

class LearningResourceCreate(LearningResourceBase):
    """Schema for creating a learning resource"""
    curated_roadmap_id: int

class LearningResourceResponse(LearningResourceBase):
    """Response schema for a learning resource"""
    id: int
    curated_roadmap_id: int
    is_active: bool
    created_at: datetime

class GenerateResourcesRequest(BaseModel):
    """Request to generate resources for a roadmap"""
    curated_roadmap_id: int

class GenerateResourcesResponse(BaseModel):
    """Response with generated learning resources"""
    success: bool
    resources: List[LearningResourceBase]
    total_generated: int
    error: Optional[str] = None

class RoadmapResourcesResponse(BaseModel):
    """Response with all resources for a roadmap"""
    resources: List[LearningResourceResponse]
    total_count: int