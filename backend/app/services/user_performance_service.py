from sqlmodel import Session, select
from sql_models import UserPerformance

def update_user_performance(user_id: int, score: int, total_questions: int, db: Session):
    user_performance = db.exec(select(UserPerformance).where(UserPerformance.user_id == user_id)).first()

    if user_performance:
        user_performance.quizzes_completed += 1
        user_performance.total_score += score
        user_performance.total_questions_answered += total_questions
        user_performance.average_score = user_performance.total_score / user_performance.quizzes_completed
        user_performance.overall_accuracy = (user_performance.total_score / user_performance.total_questions_answered) * 100
    else:
        user_performance = UserPerformance(
            user_id=user_id,
            quizzes_completed=1,
            total_score=score,
            total_questions_answered=total_questions,
            average_score=float(score),
            overall_accuracy=float((score / total_questions) * 100) if total_questions > 0 else 0.0
        )
        db.add(user_performance)

    db.commit()
    db.refresh(user_performance)