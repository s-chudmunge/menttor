import json
import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from database.session import get_db
from schemas import QuizSubmission, QuizResult, QuestionResult
from sql_models import User, QuizAttempt, UserProgress, Question, QuizActivityLog, QuizSession, Quiz, SpacedRepetition, Roadmap
from .auth import get_current_user
from core.websocket_manager import manager
from utils.sm2_algorithm import sm2_algorithm, calculate_next_review_date
from utils.subtopic_id_generator import generate_subtopic_id
from services.behavioral_service import BehavioralService
from datetime import date, datetime
from .progress import _calculate_progress_status # Import the helper function

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/quizzes/submit", response_model=QuizResult)
async def submit_quiz(
    submission: QuizSubmission,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not submission.answers:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No answers provided.",
        )

    active_session = db.exec(
        select(QuizSession).where(
            QuizSession.user_id == current_user.id,
            QuizSession.session_token == submission.session_token
        )
    ).first()

    if not active_session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active quiz session found for this subtopic."
        )

    quiz = db.get(Quiz, active_session.quiz_id)
    if not quiz:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz not found."
        )

    if not quiz.questions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Quiz has no questions.",
        )

    score = 0
    question_results = []

    for answer in submission.answers:
        question = next((q for q in quiz.questions if q.get('id') == answer.question_id), None)

        if not question:
            continue

        is_correct = (answer.selected_option_id is not None) and \
                     (str(answer.selected_option_id) == str(question.get('correct_answer_id')))

        if is_correct:
            score += 1

        try:
            question_results.append(QuestionResult(
                question_id=question.get('id'),
                selected_answer_id=answer.selected_option_id,
                correct_answer_id=question.get('correct_answer_id'),
                is_correct=is_correct,
                explanation=question.get('explanation')
            ))
        except Exception as e:
            print(f"Skipping invalid question result: {e}")
            continue

    if not quiz.questions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Quiz has no questions.",
        )

    final_score = score
    # Use the stored sub_topic_id from the session if available, otherwise generate one
    sub_topic_id = active_session.sub_topic_id or generate_subtopic_id(quiz.module_title or "", quiz.topic_title or "", active_session.sub_topic_title)
    
    logger.info(f"DEBUG: Quiz submission - session sub_topic_id: {active_session.sub_topic_id}")
    logger.info(f"DEBUG: Quiz submission - generated sub_topic_id fallback: {generate_subtopic_id(quiz.module_title or '', quiz.topic_title or '', active_session.sub_topic_title)}")
    logger.info(f"DEBUG: Quiz submission - final sub_topic_id used: {sub_topic_id}")

    quiz_attempt = QuizAttempt(
        user_id=current_user.id,
        quiz_id=quiz.id,
        score=final_score,
        total_questions=len(quiz.questions),
        sub_topic_id=sub_topic_id,
        question_results=[qr.model_dump() for qr in question_results]
    )
    db.add(quiz_attempt)
    db.flush()

    # Update UserProgress for quiz completion
    # Try to get the most recent roadmap (likely the active one) rather than just the first
    roadmap = db.exec(
        select(Roadmap)
        .where(Roadmap.user_id == current_user.id)
        .order_by(Roadmap.id.desc())  # Get most recent roadmap by ID
    ).first()
    roadmap_id = roadmap.id if roadmap else None
    
    logger.info(f"DEBUG: Using roadmap_id: {roadmap_id} for progress update")
    
    if roadmap_id:
        progress = db.exec(
            select(UserProgress)
            .where(UserProgress.user_id == current_user.id, UserProgress.sub_topic_id == sub_topic_id)
        ).first()

        if progress:
            logger.info(f"DEBUG: Updating existing progress for sub_topic_id: {sub_topic_id}")
            progress.quiz_completed = True
            if progress.quiz_best_score is None or final_score > progress.quiz_best_score:
                progress.quiz_best_score = final_score
            # Ensure the progress record has the correct roadmap_id
            progress.roadmap_id = roadmap_id
            progress.status = _calculate_progress_status(progress) # Recalculate status
            progress.completed_at = datetime.utcnow() if progress.status == "completed" else None
            logger.info(f"DEBUG: Updated progress status: {progress.status}, score: {progress.quiz_best_score}, roadmap_id: {progress.roadmap_id}")
        else:
            logger.info(f"DEBUG: Creating new progress for sub_topic_id: {sub_topic_id}")
            progress = UserProgress(
                user_id=current_user.id,
                sub_topic_id=sub_topic_id,
                roadmap_id=roadmap_id,
                quiz_completed=True,
                quiz_best_score=final_score,
            )
            progress.status = _calculate_progress_status(progress) # Recalculate status
            progress.completed_at = datetime.utcnow() if progress.status == "completed" else None
            logger.info(f"DEBUG: Created progress status: {progress.status}, score: {progress.quiz_best_score}, roadmap_id: {progress.roadmap_id}")
        db.add(progress)

    # Award XP for quiz completion
    behavioral_service = BehavioralService(db)
    score_percentage = (final_score / len(quiz.questions)) * 100 if quiz.questions else 0
    xp_result = behavioral_service.award_xp(
        current_user.id, 
        "quiz_completion", 
        {
            "score": score_percentage,
            "total_questions": len(quiz.questions),
            "correct_answers": final_score
        }
    )
    logger.info(f"DEBUG: Awarded {xp_result['xp_earned']} XP for quiz completion. Total XP: {xp_result['total_xp']}")

    for result in question_results:
        quality_response = 5 if result.is_correct else 0

        spaced_repetition_entry = db.exec(
            select(SpacedRepetition).where(
                SpacedRepetition.user_id == current_user.id,
                SpacedRepetition.question_id == result.question_id
            )
        ).first()

        if spaced_repetition_entry:
            easiness_factor, repetitions, interval = sm2_algorithm(
                spaced_repetition_entry.easiness_factor,
                spaced_repetition_entry.repetitions,
                spaced_repetition_entry.interval,
                quality_response
            )
            spaced_repetition_entry.easiness_factor = easiness_factor
            spaced_repetition_entry.repetitions = repetitions
            spaced_repetition_entry.interval = interval
            spaced_repetition_entry.next_review_date = calculate_next_review_date(date.today(), interval)
            db.add(spaced_repetition_entry)
        else:
            initial_easiness_factor = 2.5
            initial_repetitions = 0
            initial_interval = 0

            easiness_factor, repetitions, interval = sm2_algorithm(
                initial_easiness_factor,
                initial_repetitions,
                initial_interval,
                quality_response
            )
            
            new_spaced_repetition_entry = SpacedRepetition(
                user_id=current_user.id,
                quiz_id=quiz.id,
                question_id=result.question_id,
                sub_topic_id=quiz_attempt.sub_topic_id,
                easiness_factor=easiness_factor,
                repetitions=repetitions,
                interval=interval,
                next_review_date=calculate_next_review_date(date.today(), interval)
            )
            db.add(new_spaced_repetition_entry)
    
    quiz_activity_log = QuizActivityLog(
        user_id=current_user.id,
        quiz_id=quiz.id,
        quiz_attempt_id=quiz_attempt.id,
        fullscreen_violations=submission.violations.get('fullscreen', 0),
        visibility_violations=submission.violations.get('visibility', 0),
        final_action=submission.final_action,
    )
    db.add(quiz_activity_log)

    db.delete(active_session)
    db.commit()

    quiz_result_response = QuizResult(
        attempt_id=quiz_attempt.id,
        score=final_score,
        total_questions=len(quiz.questions),
        message="Quiz submitted successfully!",
        question_results=question_results
    )

    await manager.broadcast_to_user(current_user.id, json.dumps({"event": "quizCompleted", "sub_topic_id": quiz_attempt.sub_topic_id, "payload": quiz_result_response.model_dump()}))

    return quiz_result_response
