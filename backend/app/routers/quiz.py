import uuid
import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from database.session import get_db
from schemas import QuizGenerateRequest, QuizAIResponse, QuizResponse, QuestionBase
from services.ai_service import generate_quiz_content
from core.auth import get_current_user
from sql_models import User, QuizSession, Quiz, Question

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/quizzes")

@router.post("/generate_quiz", response_model=QuizAIResponse, status_code=status.HTTP_200_OK)
async def generate_quiz(
    request: QuizGenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Generates a quiz using AI based on the provided parameters."""
    user_id = current_user.id
    
    logger.info(f"DEBUG: Quiz generation request - sub_topic_id: {request.sub_topic_id}, sub_topic_title: {request.sub_topic_title}")

    existing_quiz = db.exec(
        select(Quiz).where(
            Quiz.subject == request.subject,
            Quiz.module_title == request.module_title,
            Quiz.topic_title == request.topic_title,
            Quiz.title == f"Quiz on {request.sub_topic_title}"
        )
    ).first()

    if existing_quiz:
        # If a quiz already exists, create a new session for it
        logger.info(f"DEBUG: Found existing quiz, creating session with sub_topic_id: {request.sub_topic_id}")
        session_token = str(uuid.uuid4())
        quiz_session = QuizSession(
            user_id=user_id,
            quiz_id=existing_quiz.id,
            sub_topic_title=request.sub_topic_title,
            sub_topic_id=request.sub_topic_id,  # FIX: Also store subtopic_id for existing quizzes
            session_token=session_token,
        )
        db.add(quiz_session)
        db.commit()
        db.refresh(quiz_session)
        logger.info(f"DEBUG: Created quiz session with sub_topic_id: {quiz_session.sub_topic_id}")

        response_questions = []
        for q_dict in existing_quiz.questions:
            response_questions.append(QuestionBase(**q_dict))

        return QuizAIResponse(
            questions=response_questions,
            model=request.model, # Since we're not generating a new one, use the request's model
            session_token=quiz_session.session_token,
            time_limit=existing_quiz.time_limit
        )

    try:
        quiz_response = await generate_quiz_content(request)

        # Create a new Quiz entry
        new_quiz = Quiz(
            title=f"Quiz on {request.sub_topic_title}",
            description=f"AI-generated quiz for {request.sub_topic_title}",
            subject=request.subject,
            module_title=request.module_title,
            topic_title=request.topic_title,
            topic_id=hash(request.topic_title) % (2**31 - 1), # Simple hash for topic_id
            time_limit=request.time_value * (60 if request.time_unit == "minutes" else 1), # Convert to seconds if needed
            questions=[q.model_dump() for q in quiz_response.questions]
        )
        db.add(new_quiz)
        db.commit()
        db.refresh(new_quiz)

        # Create a new QuizSession
        logger.info(f"DEBUG: Creating new quiz session with sub_topic_id: {request.sub_topic_id}")
        session_token = str(uuid.uuid4())
        quiz_session = QuizSession(
            user_id=user_id,
            quiz_id=new_quiz.id,  # Link to the newly created quiz
            sub_topic_title=request.sub_topic_title,
            sub_topic_id=request.sub_topic_id,  # Store the actual subtopic ID from roadmap
            session_token=session_token,
        )
        db.add(quiz_session)
        db.commit()
        db.refresh(quiz_session)
        logger.info(f"DEBUG: Created new quiz session with sub_topic_id: {quiz_session.sub_topic_id}")

        # Convert the stored dictionaries back to schemas.QuestionBase for the response
        response_questions = []
        for q_dict in new_quiz.questions:
            response_questions.append(QuestionBase(**q_dict))

        # Return the AI response, which includes the questions
        return QuizAIResponse(
            questions=response_questions,
            model=quiz_response.model,
            session_token=quiz_session.session_token,
            time_limit=new_quiz.time_limit
        )
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {e}",
        )

@router.get("/{quiz_id}", response_model=QuizResponse)
def get_quiz(
    quiz_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    user_id = current_user.id
    quiz = db.get(Quiz, quiz_id)
    if not quiz:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")
    # Convert the stored dictionaries back to schemas.QuestionBase for the response
    response_questions = []
    for q_dict in quiz.questions:
        response_questions.append(QuestionBase(**q_dict))

    # Extract sub_topic_id from the quiz title
    sub_topic_id = quiz.title.replace("Quiz on ", "")

    return QuizResponse(
        id=quiz.id,
        topic_title=quiz.topic_title,
        sub_topic_id=sub_topic_id,
        questions=response_questions,
        time_limit=quiz.time_limit # Include time_limit from the Quiz object
    )