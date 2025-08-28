from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from datetime import datetime

# Request schemas
class PracticeSessionCreate(BaseModel):
    subtopic_ids: List[str]
    question_types: List[str]  # mcq, numerical, caseStudy, codeCompletion, debugging
    question_count: int
    time_limit: int  # in minutes
    hints_enabled: bool = True
    roadmap_id: int
    subject: str
    goal: str

class PracticeAnswerCreate(BaseModel):
    question_id: int
    user_answer: str
    time_spent: int  # seconds
    hint_used: bool = False

# Response schemas
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

class PracticeAnalytics(BaseModel):
    roadmap_id: int
    total_practice_sessions: int
    average_score: float
    total_time_spent: int  # minutes
    strongest_question_types: List[str]
    weakest_question_types: List[str]
    improvement_trend: Dict[str, float]  # last 30 days
    recommended_practice_areas: List[str]