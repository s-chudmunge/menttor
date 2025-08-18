from sqlmodel import select

from backend.app.schemas import QuestionResult
from backend.app.sql_models import QuizAttempt
from backend.app.database.session import get_db, create_db_and_tables
from pydantic import ValidationError
import json

def clean_quiz_attempts():
    create_db_and_tables()
    db = next(get_db())
    attempts = db.exec(select(QuizAttempt)).all()
    for attempt in attempts:
        cleaned_results = []
        for qr in attempt.question_results or []:
            try:
                # Convert & validate
                qr_fixed = QuestionResult(**qr)
                cleaned_results.append(qr_fixed.model_dump())
            except ValidationError:
                # Attempt auto-fix
                try:
                    qr["question_id"] = int(qr.get("question_id", 0))
                    qr["is_correct"] = bool(qr.get("is_correct"))
                    qr_fixed = QuestionResult(**qr)
                    cleaned_results.append(qr_fixed.model_dump())
                except Exception:
                    continue  # skip unfixable

        attempt.question_results = cleaned_results
        db.add(attempt)

    db.commit()

if __name__ == "__main__":
    clean_quiz_attempts()
