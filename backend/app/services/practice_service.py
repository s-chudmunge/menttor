import uuid
import json
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from sqlmodel import Session, select
from sql_models import (
    PracticeSession, PracticeQuestion, PracticeAnswer, 
    Roadmap, UserProgress
)
from schemas import (
    PracticeSessionCreate, PracticeQuestionResponse,
    PracticeAnswerCreate, PracticeResultsResponse,
    PracticeAnswerResult, PracticeStrength, PracticeWeakness,
    PracticeHistoryResponse, PracticeSessionSummary
)
from services.ai_service import generate_practice_questions_ai
import logging

logger = logging.getLogger(__name__)

async def create_practice_session(
    db: Session, 
    user_id: int, 
    session_data: PracticeSessionCreate
) -> PracticeSession:
    """Create a new practice session"""
    
    session_token = str(uuid.uuid4())
    
    practice_session = PracticeSession(
        user_id=user_id,
        roadmap_id=session_data.roadmap_id,
        session_token=session_token,
        subtopic_ids=session_data.subtopic_ids,
        question_types=session_data.question_types,
        question_count=session_data.question_count,
        time_limit=session_data.time_limit,
        hints_enabled=session_data.hints_enabled,
        subject=session_data.subject,
        goal=session_data.goal,
        started_at=datetime.utcnow()
    )
    
    db.add(practice_session)
    db.commit()
    db.refresh(practice_session)
    
    return practice_session

async def generate_practice_questions(
    db: Session,
    session_id: int,
    subtopic_ids: List[str],
    question_types: List[str],
    question_count: int,
    subject: str,
    goal: str
) -> List[PracticeQuestionResponse]:
    """Generate questions for a practice session using AI"""
    
    # Get roadmap data for context
    session = db.get(PracticeSession, session_id)
    if not session:
        raise ValueError("Practice session not found")
    
    roadmap = db.get(Roadmap, session.roadmap_id)
    if not roadmap:
        raise ValueError("Roadmap not found")
    
    # Extract subtopic details from roadmap
    subtopic_details = extract_subtopic_details(roadmap, subtopic_ids)
    
    # Distribute questions across types and subtopics
    questions_per_type = distribute_questions(question_types, question_count)
    questions_per_subtopic = distribute_by_subtopics(subtopic_ids, question_count)
    
    generated_questions = []
    order_index = 0
    
    for question_type in question_types:
        type_count = questions_per_type[question_type]
        
        for subtopic_id in subtopic_ids:
            subtopic_count = min(
                type_count // len(subtopic_ids) + (1 if type_count % len(subtopic_ids) > 0 else 0),
                questions_per_subtopic[subtopic_id]
            )
            
            if subtopic_count == 0:
                continue
                
            # Generate questions using AI
            try:
                ai_questions = await generate_practice_questions_ai(
                    question_type=question_type,
                    subtopic_id=subtopic_id,
                    subtopic_details=subtopic_details[subtopic_id],
                    count=subtopic_count,
                    subject=subject,
                    goal=goal,
                    hints_enabled=session.hints_enabled,
                    model="vertexai:gemini-2.0-flash-lite"  # Use your default Vertex AI model
                )
                
                # Save questions to database
                for ai_question in ai_questions:
                    # Extract data from PracticeQuestionResponse object
                    question_data = {
                        "question": ai_question.question,
                        "options": ai_question.options,
                        "correct_answer": "A",  # Default for MCQ, will be updated based on question type
                        "explanation": "Explanation will be added during answer evaluation",
                        "hint": ai_question.hint if session.hints_enabled and ai_question.hint else None,
                        "code_snippet": ai_question.code_snippet
                    }
                    
                    practice_question = PracticeQuestion(
                        session_id=session_id,
                        subtopic_id=subtopic_id,
                        question_type=question_type,
                        question_data=question_data,
                        difficulty=ai_question.difficulty,
                        order_index=order_index,
                        model_used="vertexai:gemini-2.0-flash-lite",
                        generation_prompt=f"Generated {question_type} question for {subtopic_id}"
                    )
                    
                    db.add(practice_question)
                    db.commit()
                    db.refresh(practice_question)
                    
                    # Create response object using the AI question data
                    question_response = PracticeQuestionResponse(
                        id=practice_question.id,
                        question_type=ai_question.question_type,
                        question=ai_question.question,
                        options=ai_question.options,
                        hint=ai_question.hint,
                        code_snippet=ai_question.code_snippet,
                        difficulty=ai_question.difficulty,
                        subtopic_id=ai_question.subtopic_id,
                        order_index=order_index
                    )
                    
                    generated_questions.append(question_response)
                    order_index += 1
                    
            except Exception as e:
                logger.error(f"Error generating questions for {question_type}/{subtopic_id}: {e}")
                # Continue with other questions
                continue
    
    # Shuffle questions to mix types and subtopics
    import random
    random.shuffle(generated_questions)
    
    # Update order indices after shuffle
    for i, question in enumerate(generated_questions):
        question.order_index = i
        # Update in database too
        db_question = db.get(PracticeQuestion, question.id)
        if db_question:
            db_question.order_index = i
            db.add(db_question)
    
    db.commit()
    
    return generated_questions

async def submit_practice_answer(
    db: Session,
    session_id: int,
    user_id: int,
    answer_data: PracticeAnswerCreate
) -> PracticeAnswer:
    """Submit and evaluate a practice answer"""
    from fastapi import HTTPException, status
    import logging
    
    logger = logging.getLogger(__name__)
    
    # Verify session belongs to user
    session = db.get(PracticeSession, session_id)
    if not session:
        logger.error(f"Session {session_id} not found")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Practice session {session_id} not found"
        )
    
    if session.user_id != user_id:
        logger.error(f"Session {session_id} belongs to user {session.user_id}, but request from user {user_id}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this practice session"
        )
    
    # Get question details
    question = db.get(PracticeQuestion, answer_data.question_id)
    if not question:
        logger.error(f"Question {answer_data.question_id} not found")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Question {answer_data.question_id} not found"
        )
    
    if question.session_id != session_id:
        logger.error(f"Question {answer_data.question_id} belongs to session {question.session_id}, but request for session {session_id}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Question {answer_data.question_id} does not belong to session {session_id}"
        )
    
    # Use fast manual evaluation for deployment stability
    is_correct = _evaluate_answer(
        user_answer=answer_data.user_answer,
        correct_answer=question.question_data.get("correct_answer", ""),
        question_type=question.question_type
    )
    
    # Save answer with AI evaluation feedback
    practice_answer = PracticeAnswer(
        session_id=session_id,
        question_id=answer_data.question_id,
        user_answer=answer_data.user_answer,
        is_correct=is_correct,
        time_spent=answer_data.time_spent,
        hint_used=answer_data.hint_used
    )
    
    db.add(practice_answer)
    db.commit()
    # Remove refresh to avoid session binding issues
    
    return practice_answer

def _evaluate_answer(user_answer: str, correct_answer: str, question_type: str) -> bool:
    """Evaluate if the user's answer is correct based on question type"""
    
    if question_type == 'mcq':
        # For MCQ, exact match after normalizing
        return user_answer.strip().lower() == correct_answer.strip().lower()
    
    elif question_type == 'numerical':
        # For numerical, try to parse as float and compare with tolerance
        try:
            user_num = float(user_answer.strip())
            correct_num = float(correct_answer.strip())
            # Allow 1% tolerance for floating point precision
            tolerance = abs(correct_num * 0.01) if correct_num != 0 else 0.01
            return abs(user_num - correct_num) <= tolerance
        except (ValueError, TypeError):
            # Fallback to string comparison if parsing fails
            return user_answer.strip().lower() == correct_answer.strip().lower()
    
    elif question_type in ['codeCompletion', 'debugging']:
        # For code questions, check if key elements are present
        user_clean = user_answer.strip().replace(' ', '').replace('\n', '').replace('\t', '')
        correct_clean = correct_answer.strip().replace(' ', '').replace('\n', '').replace('\t', '')
        
        # More flexible matching for code - check if the key answer is contained
        if correct_clean in user_clean or user_clean in correct_clean:
            return True
            
        # Also check for common variations
        return user_answer.strip().lower() == correct_answer.strip().lower()
    
    elif question_type == 'caseStudy':
        # For case studies, more flexible matching - check key terms
        user_words = set(user_answer.strip().lower().split())
        correct_words = set(correct_answer.strip().lower().split())
        
        # If 70% of the correct answer words are present, consider it correct
        if len(correct_words) > 0:
            overlap = len(user_words.intersection(correct_words))
            return (overlap / len(correct_words)) >= 0.7
        
        return user_answer.strip().lower() == correct_answer.strip().lower()
    
    else:
        # Default: exact match
        return user_answer.strip().lower() == correct_answer.strip().lower()

async def get_practice_results(
    db: Session,
    session_id: int,
    user_id: int
) -> PracticeResultsResponse:
    """Get detailed results for a completed practice session"""
    
    # Verify session
    session = db.get(PracticeSession, session_id)
    if not session or session.user_id != user_id:
        raise ValueError("Invalid session")
    
    # Mark session as completed if not already
    if session.status != "completed":
        session.status = "completed"
        session.completed_at = datetime.utcnow()
        if session.started_at:
            session.total_time_spent = int((session.completed_at - session.started_at).total_seconds())
    
    # Get all answers
    answers = db.exec(
        select(PracticeAnswer).where(PracticeAnswer.session_id == session_id)
    ).all()
    
    # Get all questions
    questions = db.exec(
        select(PracticeQuestion).where(PracticeQuestion.session_id == session_id)
    ).all()
    
    # Calculate basic metrics
    correct_answers = len([a for a in answers if a.is_correct])
    total_questions = len(questions)
    final_score = (correct_answers / total_questions * 100) if total_questions > 0 else 0
    hints_used = len([a for a in answers if a.hint_used])
    total_time = session.total_time_spent or 0
    
    # Update session with final results
    session.final_score = final_score
    session.correct_answers = correct_answers
    session.hints_used = hints_used
    db.add(session)
    db.commit()
    
    # Build detailed results
    question_results = []
    for question in questions:
        answer = next((a for a in answers if a.question_id == question.id), None)
        if answer:
            question_results.append(PracticeAnswerResult(
                question_id=question.id,
                user_answer=answer.user_answer,
                correct_answer=question.question_data.get("correct_answer", ""),
                is_correct=answer.is_correct,
                explanation=question.question_data.get("explanation", ""),
                time_spent=answer.time_spent,
                hint_used=answer.hint_used
            ))
    
    # Analyze performance
    performance_analysis = analyze_practice_performance(questions, answers, session)
    
    return PracticeResultsResponse(
        session_id=session_id,
        final_score=final_score,
        correct_answers=correct_answers,
        total_questions=total_questions,
        total_time=total_time,
        hints_used=hints_used,
        strengths=performance_analysis["strengths"],
        weaknesses=performance_analysis["weaknesses"],
        question_results=question_results,
        performance_by_type=performance_analysis["by_type"],
        performance_by_difficulty=performance_analysis["by_difficulty"],
        completed_at=session.completed_at or datetime.utcnow()
    )

def extract_subtopic_details(roadmap: Roadmap, subtopic_ids: List[str]) -> Dict[str, Dict[str, Any]]:
    """Extract subtopic details from roadmap structure"""
    details = {}
    
    if not roadmap.roadmap_plan:
        return details
    
    modules = roadmap.roadmap_plan.get("modules", []) if isinstance(roadmap.roadmap_plan, dict) else roadmap.roadmap_plan
    
    for module in modules:
        if not isinstance(module, dict) or "topics" not in module:
            continue
            
        for topic in module.get("topics", []):
            if not isinstance(topic, dict) or "subtopics" not in topic:
                continue
                
            for subtopic in topic.get("subtopics", []):
                if not isinstance(subtopic, dict):
                    continue
                    
                subtopic_id = subtopic.get("id", "")
                if subtopic_id in subtopic_ids:
                    details[subtopic_id] = {
                        "title": subtopic.get("title", ""),
                        "module_title": module.get("title", ""),
                        "topic_title": topic.get("title", ""),
                        "description": subtopic.get("description", "")
                    }
    
    return details

def distribute_questions(question_types: List[str], total_count: int) -> Dict[str, int]:
    """Distribute questions evenly across question types"""
    base_count = total_count // len(question_types)
    remainder = total_count % len(question_types)
    
    distribution = {}
    for i, q_type in enumerate(question_types):
        distribution[q_type] = base_count + (1 if i < remainder else 0)
    
    return distribution

def distribute_by_subtopics(subtopic_ids: List[str], total_count: int) -> Dict[str, int]:
    """Distribute questions evenly across subtopics"""
    base_count = total_count // len(subtopic_ids)
    remainder = total_count % len(subtopic_ids)
    
    distribution = {}
    for i, subtopic_id in enumerate(subtopic_ids):
        distribution[subtopic_id] = base_count + (1 if i < remainder else 0)
    
    return distribution

def evaluate_answer(user_answer: str, correct_answer: str, question_type: str) -> bool:
    """Evaluate if user answer is correct based on question type"""
    
    if question_type == "mcq":
        return user_answer == correct_answer
    
    elif question_type == "numerical":
        try:
            # Handle numerical answers with some tolerance
            user_num = float(user_answer)
            correct_num = float(correct_answer)
            return abs(user_num - correct_num) < 0.01
        except ValueError:
            return user_answer == correct_answer
    
    elif question_type in ["caseStudy", "debugging", "codeCompletion"]:
        # For text-based answers, use similarity matching
        return calculate_text_similarity(user_answer, correct_answer) > 0.8
    
    return False

def calculate_text_similarity(text1: str, text2: str) -> float:
    """Calculate similarity between two text strings"""
    # Simple word-based similarity for now
    # In production, you might want to use more sophisticated NLP
    words1 = set(text1.lower().split())
    words2 = set(text2.lower().split())
    
    if not words1 and not words2:
        return 1.0
    if not words1 or not words2:
        return 0.0
    
    intersection = words1.intersection(words2)
    union = words1.union(words2)
    
    return len(intersection) / len(union)

def analyze_practice_performance(
    questions: List[PracticeQuestion], 
    answers: List[PracticeAnswer], 
    session: PracticeSession
) -> Dict[str, Any]:
    """Analyze performance and identify strengths/weaknesses"""
    
    # Performance by question type
    type_performance = {}
    for question in questions:
        q_type = question.question_type
        if q_type not in type_performance:
            type_performance[q_type] = {"correct": 0, "total": 0}
        
        type_performance[q_type]["total"] += 1
        answer = next((a for a in answers if a.question_id == question.id), None)
        if answer and answer.is_correct:
            type_performance[q_type]["correct"] += 1
    
    # Performance by difficulty
    difficulty_performance = {}
    for question in questions:
        difficulty = question.difficulty
        if difficulty not in difficulty_performance:
            difficulty_performance[difficulty] = {"correct": 0, "total": 0}
        
        difficulty_performance[difficulty]["total"] += 1
        answer = next((a for a in answers if a.question_id == question.id), None)
        if answer and answer.is_correct:
            difficulty_performance[difficulty]["correct"] += 1
    
    # Identify strengths and weaknesses
    strengths = []
    weaknesses = []
    
    type_labels = {
        "mcq": "Multiple Choice Questions",
        "numerical": "Numerical Problem Solving",
        "caseStudy": "Case Study Analysis",
        "codeCompletion": "Code Completion",
        "debugging": "Debugging Skills"
    }
    
    for q_type, performance in type_performance.items():
        if performance["total"] == 0:
            continue
            
        score = (performance["correct"] / performance["total"]) * 100
        label = type_labels.get(q_type, q_type)
        
        if score >= 80:
            strengths.append(PracticeStrength(
                category=label,
                score=score,
                description=f"Strong performance in {label.lower()} with {performance['correct']}/{performance['total']} correct"
            ))
        elif score < 60:
            weaknesses.append(PracticeWeakness(
                category=label,
                score=score,
                description=f"Room for improvement in {label.lower()}",
                improvement_suggestion=f"Focus on practicing {label.lower()} more frequently"
            ))
    
    return {
        "strengths": strengths,
        "weaknesses": weaknesses,
        "by_type": {k: {"correct": v["correct"], "total": v["total"], "percentage": (v["correct"]/v["total"]*100) if v["total"] > 0 else 0} for k, v in type_performance.items()},
        "by_difficulty": {k: {"correct": v["correct"], "total": v["total"], "percentage": (v["correct"]/v["total"]*100) if v["total"] > 0 else 0} for k, v in difficulty_performance.items()}
    }

async def get_user_practice_history(
    db: Session,
    user_id: int,
    limit: int = 10
) -> PracticeHistoryResponse:
    """Get user's practice session history"""
    
    sessions = db.exec(
        select(PracticeSession)
        .where(PracticeSession.user_id == user_id)
        .where(PracticeSession.status == "completed")
        .order_by(PracticeSession.completed_at.desc())
        .limit(limit)
    ).all()
    
    session_summaries = []
    total_sessions = len(sessions)
    total_score = 0
    total_questions = 0
    
    for session in sessions:
        if session.final_score is not None:
            session_summaries.append(PracticeSessionSummary(
                id=session.id,
                score=session.final_score,
                questions_count=session.question_count,
                time_spent=session.total_time_spent or 0,
                completed_at=session.completed_at,
                subject=session.subject
            ))
            total_score += session.final_score
            total_questions += session.question_count
    
    average_score = (total_score / len(session_summaries)) if session_summaries else 0
    
    return PracticeHistoryResponse(
        sessions=session_summaries,
        total_sessions=total_sessions,
        average_score=average_score,
        total_questions_answered=total_questions
    )