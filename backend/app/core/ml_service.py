from datetime import date, timedelta
from sqlmodel import Session, select
from sql_models import UserPerformance, QuizResult, SpacedRepetition

def sm2_algorithm(easiness_factor: float, repetitions: int, interval: int, quality_response: int):
    if quality_response >= 3:
        if repetitions == 0:
            interval = 1
        elif repetitions == 1:
            interval = 6
        else:
            interval = round(interval * easiness_factor)
        repetitions += 1
    else:
        repetitions = 0
        interval = 1
    
    easiness_factor = easiness_factor + (0.1 - (5 - quality_response) * (0.08 + (5 - quality_response) * 0.02))
    if easiness_factor < 1.3:
        easiness_factor = 1.3
    
    return easiness_factor, repetitions, interval

def calculate_next_review_date(last_review_date: date, interval: int) -> date:
    return last_review_date + timedelta(days=interval)

def update_user_performance(user_id: int, score: int, total_questions: int, db: Session):
    user_performance = db.exec(select(UserPerformance).where(UserPerformance.user_id == user_id)).first()
    
    if user_performance:
        user_performance.quizzes_completed += 1
        user_performance.total_score += score
        user_performance.total_questions_answered += total_questions
        user_performance.average_score = user_performance.total_score / user_performance.total_questions_answered
    else:
        user_performance = UserPerformance(
            user_id=user_id,
            quizzes_completed=1,
            total_score=score,
            total_questions_answered=total_questions,
            average_score=float(score) / total_questions if total_questions > 0 else 0.0
        )
        db.add(user_performance)