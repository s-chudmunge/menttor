import uuid
import logging
import asyncio
import json
from datetime import datetime, timedelta
from typing import List, Optional, AsyncGenerator
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlmodel import Session, select
from database.session import get_db
from core.auth import get_current_user
from sql_models import User
from schemas import (
    PracticeSessionCreate,
    PracticeSessionResponse,
    PracticeQuestionResponse,
    PracticeAnswerCreate,
    PracticeResultsResponse
)
from services.practice_service import (
    create_practice_session,
    generate_practice_questions,
    submit_practice_answer,
    get_practice_results,
    get_user_practice_history
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/practice", tags=["practice"])

@router.post("/sessions", response_model=PracticeSessionResponse)
async def create_practice_session_endpoint(
    session_data: PracticeSessionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new practice session with generated questions"""
    try:
        # Create practice session
        session = await create_practice_session(
            db=db,
            user_id=current_user.id,
            session_data=session_data
        )
        
        # Generate questions based on selected subtopics and question types
        questions = await generate_practice_questions(
            db=db,
            session_id=session.id,
            subtopic_ids=session_data.subtopic_ids,
            question_types=session_data.question_types,
            question_count=session_data.question_count,
            subject=session_data.subject,
            goal=session_data.goal
        )
        
        return PracticeSessionResponse(
            session_id=session.id,
            session_token=session.session_token,
            questions=questions,
            time_limit=session_data.time_limit,
            hints_enabled=session_data.hints_enabled
        )
        
    except Exception as e:
        logger.error(f"Error creating practice session: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create practice session: {str(e)}"
        )

@router.post("/sessions/stream")
async def create_practice_session_stream(
    session_data: PracticeSessionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create practice session and stream questions as they're generated"""
    
    async def generate_stream() -> AsyncGenerator[str, None]:
        try:
            # Import here to avoid circular imports
            from services.practice_service import create_practice_session
            from services.ai_service import generate_practice_questions_ai
            from sql_models import PracticeSession, PracticeQuestion, Roadmap
            
            # Create the session first
            session = await create_practice_session(
                db=db,
                user_id=current_user.id,
                session_data=session_data
            )
            
            # Send session creation event
            session_event = {
                "type": "session_created",
                "data": {
                    "session_id": session.id,
                    "session_token": session.session_token,
                    "time_limit": session_data.time_limit,
                    "hints_enabled": session_data.hints_enabled
                }
            }
            yield f"data: {json.dumps(session_event)}\n\n"
            
            # Get roadmap data
            roadmap = db.get(Roadmap, session_data.roadmap_id)
            if not roadmap:
                error_event = {"type": "error", "data": {"message": "Roadmap not found"}}
                yield f"data: {json.dumps(error_event)}\n\n"
                return
            
            # Extract subtopic details
            from services.practice_service import extract_subtopic_details, distribute_questions
            subtopic_details = extract_subtopic_details(roadmap, session_data.subtopic_ids)
            questions_per_type = distribute_questions(session_data.question_types, session_data.question_count)
            
            order_index = 0
            total_generated = 0
            
            # Create a balanced distribution of questions across types and subtopics
            question_distribution = []
            for question_type in session_data.question_types:
                type_count = questions_per_type[question_type]
                for i in range(type_count):
                    if total_generated < session_data.question_count:
                        subtopic_id = session_data.subtopic_ids[i % len(session_data.subtopic_ids)]
                        question_distribution.append((question_type, subtopic_id))
                        total_generated += 1
            
            # Reset total_generated for actual generation
            total_generated = 0
            
            # Generate questions in batches of 3 for better streaming
            batch_size = 3
            for i in range(0, len(question_distribution), batch_size):
                batch = question_distribution[i:i + batch_size]
                
                for question_type, subtopic_id in batch:
                    if total_generated >= session_data.question_count:
                        break
                    
                    try:
                        # Generate single question for better control
                        ai_questions = await generate_practice_questions_ai(
                            question_type=question_type,
                            subtopic_id=subtopic_id,
                            subtopic_details=subtopic_details[subtopic_id],
                            count=1,  # Generate one question at a time
                            subject=session_data.subject,
                            goal=session_data.goal,
                            hints_enabled=session_data.hints_enabled,
                            model="vertexai:gemini-2.0-flash-lite"
                        )
                        
                        # If no questions generated, skip this iteration
                        if not ai_questions:
                            logger.warning(f"No {question_type} questions generated for {subtopic_id}")
                            continue
                        
                        # Save and stream the single question
                        for ai_question in ai_questions:
                            # Save to database
                            question_data = {
                                "question": ai_question.question,
                                "options": ai_question.options,
                                "correct_answer": "A",
                                "explanation": "Explanation will be added during answer evaluation",
                                "hint": ai_question.hint if session_data.hints_enabled and ai_question.hint else None,
                                "code_snippet": ai_question.code_snippet
                            }
                            
                            practice_question = PracticeQuestion(
                                session_id=session.id,
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
                            
                            # Stream question immediately
                            question_response = PracticeQuestionResponse(
                                id=practice_question.id,
                                question_type=ai_question.question_type,
                                question=ai_question.question,
                                options=ai_question.options,
                                hint=ai_question.hint,
                                code_snippet=ai_question.code_snippet,
                                difficulty=ai_question.difficulty,
                                subtopic_id=subtopic_id,
                                order_index=order_index
                            )
                            
                            # Ensure JSON safety by sanitizing question data
                            try:
                                # Create question response with safe JSON serialization
                                question_dict = question_response.dict()
                                
                                # Sanitize text fields to prevent JSON issues
                                for field in ['question', 'hint']:
                                    if question_dict.get(field):
                                        # Escape quotes and newlines properly
                                        question_dict[field] = str(question_dict[field]).replace('"', '\\"').replace('\n', '\\n')
                                
                                # Sanitize code snippet if present
                                if question_dict.get('code_snippet'):
                                    question_dict['code_snippet'] = str(question_dict['code_snippet']).replace('"', '\\"').replace('\n', '\\n')
                                
                                # Sanitize options if present
                                if question_dict.get('options') and isinstance(question_dict['options'], list):
                                    question_dict['options'] = [str(opt).replace('"', '\\"').replace('\n', '\\n') for opt in question_dict['options']]
                                
                                question_event = {
                                    "type": "question_ready",
                                    "data": question_dict
                                }
                                json_data = json.dumps(question_event, ensure_ascii=False, separators=(',', ':'))
                                yield f"data: {json_data}\n\n"
                                
                            except (TypeError, ValueError) as json_e:
                                logger.error(f"JSON serialization error for question: {json_e}")
                                # Use fallback question to keep session going
                                fallback_question = {
                                    "type": "question_ready", 
                                    "data": {
                                        "id": practice_question.id,
                                        "question_type": question_type,
                                        "question": f"Practice question about {subtopic_details[subtopic_id].get('title', 'this topic')}",
                                        "options": ["Option A", "Option B", "Option C", "Option D"] if question_type == 'mcq' else None,
                                        "hint": "Think about the key concepts",
                                        "code_snippet": None,
                                        "difficulty": "medium",
                                        "subtopic_id": subtopic_id,
                                        "order_index": order_index
                                    }
                                }
                                yield f"data: {json.dumps(fallback_question)}\n\n"
                            
                            order_index += 1
                            total_generated += 1
                            
                            # Send progress update
                            progress_event = {
                                "type": "progress",
                                "data": {
                                    "generated": total_generated,
                                    "total": session_data.question_count,
                                    "percentage": int((total_generated / session_data.question_count) * 100)
                                }
                            }
                            yield f"data: {json.dumps(progress_event)}\n\n"
                            
                            # Small delay to prevent overwhelming
                            await asyncio.sleep(0.1)
                            
                            # Check if we've generated enough questions
                            if total_generated >= session_data.question_count:
                                break
                            
                    except Exception as e:
                        logger.error(f"Error generating {question_type} questions: {e}")
                        error_event = {
                            "type": "error",
                            "data": {"message": f"Failed to generate some {question_type} questions"}
                        }
                        yield f"data: {json.dumps(error_event)}\n\n"
                
                # Break out of outer loop if we've generated enough
                if total_generated >= session_data.question_count:
                    break
            
            # Send completion event
            completion_event = {
                "type": "complete",
                "data": {
                    "total_questions": total_generated,
                    "session_token": session.session_token
                }
            }
            yield f"data: {json.dumps(completion_event)}\n\n"
            
        except Exception as e:
            logger.error(f"Error in streaming session creation: {e}")
            error_event = {
                "type": "error", 
                "data": {"message": f"Failed to create practice session: {str(e)}"}
            }
            yield f"data: {json.dumps(error_event)}\n\n"
    
    return StreamingResponse(
        generate_stream(),
        media_type="text/plain",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive"}
    )

@router.get("/sessions/{session_token}")
async def get_practice_session(
    session_token: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get practice session data by session token"""
    try:
        from sql_models import PracticeSession, PracticeQuestion
        
        # Find session by token
        session = db.exec(
            select(PracticeSession).where(
                PracticeSession.session_token == session_token,
                PracticeSession.user_id == current_user.id
            )
        ).first()
        
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Practice session not found"
            )
        
        # Get questions for this session
        questions = db.exec(
            select(PracticeQuestion).where(
                PracticeQuestion.session_id == session.id
            ).order_by(PracticeQuestion.order_index)
        ).all()
        
        # Convert to response format
        question_responses = []
        for q in questions:
            # Extract data from JSONB question_data field
            question_data = q.question_data
            question_responses.append(PracticeQuestionResponse(
                id=q.id,
                question_type=q.question_type,
                question=question_data.get('question', ''),
                options=question_data.get('options', []),
                hint=question_data.get('hint'),
                code_snippet=question_data.get('code_snippet'),
                difficulty=q.difficulty,
                subtopic_id=q.subtopic_id,
                order_index=q.order_index
            ))
        
        return PracticeSessionResponse(
            session_id=session.id,
            session_token=session.session_token,
            questions=question_responses,
            time_limit=session.time_limit,
            hints_enabled=session.hints_enabled,
            question_count=session.question_count,
            subtopic_ids=session.subtopic_ids,
            question_types=session.question_types,
            roadmap_id=session.roadmap_id,
            subject=session.subject,
            goal=session.goal
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching practice session: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch practice session: {str(e)}"
        )

@router.post("/sessions/{session_token}/answers")
async def submit_answer(
    session_token: str,
    answer_data: PracticeAnswerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Submit an answer for a practice question"""
    try:
        from sql_models import PracticeSession
        
        # Find session by token
        session = db.exec(
            select(PracticeSession).where(
                PracticeSession.session_token == session_token,
                PracticeSession.user_id == current_user.id
            )
        ).first()
        
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Practice session not found"
            )
        
        result = await submit_practice_answer(
            db=db,
            session_id=session.id,
            user_id=current_user.id,
            answer_data=answer_data
        )
        
        return {
            "success": True, 
            "is_correct": result.is_correct
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error submitting answer: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to submit answer: {str(e)}"
        )

@router.post("/sessions/{session_id}/complete")
async def complete_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark practice session as complete and return results"""
    try:
        results = await get_practice_results(
            db=db,
            session_id=session_id,
            user_id=current_user.id
        )
        
        return results
        
    except Exception as e:
        logger.error(f"Error completing session: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to complete session: {str(e)}"
        )

@router.get("/sessions/{session_id}/results", response_model=PracticeResultsResponse)
async def get_session_results(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get detailed results for a completed practice session"""
    try:
        results = await get_practice_results(
            db=db,
            session_id=session_id,
            user_id=current_user.id
        )
        return results
        
    except Exception as e:
        logger.error(f"Error fetching results: {e}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session results not found"
        )

@router.get("/history")
async def get_practice_history(
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get user's practice session history"""
    try:
        history = await get_user_practice_history(
            db=db,
            user_id=current_user.id,
            limit=limit
        )
        return history
        
    except Exception as e:
        logger.error(f"Error fetching practice history: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch practice history"
        )

@router.get("/analytics/{roadmap_id}")
async def get_practice_analytics(
    roadmap_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get practice analytics for a specific roadmap"""
    try:
        # Calculate practice statistics for the roadmap
        analytics = await get_practice_analytics_for_roadmap(
            db=db,
            user_id=current_user.id,
            roadmap_id=roadmap_id
        )
        return analytics
        
    except Exception as e:
        logger.error(f"Error fetching analytics: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch practice analytics"
        )