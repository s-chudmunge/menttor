from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select, func, and_, or_
from datetime import datetime, date, timedelta
from typing import List, Dict, Any, Optional
from collections import defaultdict

from database.session import get_db
from sql_models import User, UserProgress, QuizAttempt, LearningSession, UserBehavior
from .auth import get_current_user

router = APIRouter(prefix="/activity", tags=["activity"])

@router.get("/calendar")
async def get_activity_calendar(
    days: int = Query(365, ge=7, le=365, description="Number of days to retrieve"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get activity calendar data for the last N days (like GitHub contributions)"""
    try:
        # Calculate date range
        end_date = date.today()
        start_date = end_date - timedelta(days=days-1)
        
        # Initialize calendar with all dates
        calendar_data = {}
        current_date = start_date
        while current_date <= end_date:
            calendar_data[current_date.isoformat()] = {
                "date": current_date.isoformat(),
                "count": 0,
                "level": 0,
                "activities": []
            }
            current_date += timedelta(days=1)
        
        # Get learning progress activities
        progress_activities = db.exec(
            select(UserProgress).where(
                and_(
                    UserProgress.user_id == current_user.id,
                    or_(
                        UserProgress.completed_at >= start_date,
                        UserProgress.last_accessed_at >= start_date
                    )
                )
            )
        ).all()
        
        # Get quiz activities
        quiz_activities = db.exec(
            select(QuizAttempt).where(
                and_(
                    QuizAttempt.user_id == current_user.id,
                    func.date(QuizAttempt.attempted_at) >= start_date
                )
            )
        ).all()
        
        # Get learning sessions
        learning_sessions = db.exec(
            select(LearningSession).where(
                and_(
                    LearningSession.user_id == current_user.id,
                    func.date(LearningSession.start_time) >= start_date
                )
            )
        ).all()
        
        # Process learning progress
        for progress in progress_activities:
            # Use completion date or last accessed date
            activity_date = None
            if progress.completed_at:
                activity_date = progress.completed_at.date()
            elif progress.last_accessed_at:
                activity_date = progress.last_accessed_at.date()
            
            if activity_date and activity_date.isoformat() in calendar_data:
                calendar_data[activity_date.isoformat()]["count"] += 1
                calendar_data[activity_date.isoformat()]["activities"].append({
                    "type": "learn",
                    "title": "Learning Activity",
                    "description": f"Subtopic: {progress.sub_topic_id}",
                    "completed": progress.learn_completed
                })
        
        # Process quiz activities
        for quiz in quiz_activities:
            quiz_date = quiz.attempted_at.date()
            if quiz_date.isoformat() in calendar_data:
                calendar_data[quiz_date.isoformat()]["count"] += 1
                calendar_data[quiz_date.isoformat()]["activities"].append({
                    "type": "quiz",
                    "title": "Quiz Completed",
                    "description": f"Score: {quiz.score}/{quiz.total_questions}",
                    "score": quiz.score
                })
        
        # Process learning sessions
        for session in learning_sessions:
            session_date = session.start_time.date()
            if session_date.isoformat() in calendar_data:
                calendar_data[session_date.isoformat()]["count"] += 1
                calendar_data[session_date.isoformat()]["activities"].append({
                    "type": "session",
                    "title": "Learning Session",
                    "description": f"Duration: {session.actual_duration or session.estimated_duration} minutes",
                    "duration": session.actual_duration or session.estimated_duration
                })
        
        # Calculate activity levels (0-4 based on daily count)
        counts = [day_data["count"] for day_data in calendar_data.values()]
        max_count = max(counts) if counts else 0
        
        if max_count > 0:
            for day_data in calendar_data.values():
                count = day_data["count"]
                if count == 0:
                    day_data["level"] = 0
                elif count <= max_count * 0.25:
                    day_data["level"] = 1
                elif count <= max_count * 0.5:
                    day_data["level"] = 2
                elif count <= max_count * 0.75:
                    day_data["level"] = 3
                else:
                    day_data["level"] = 4
        
        # Calculate summary stats
        total_contributions = sum(counts)
        
        # Calculate current streak
        current_streak = 0
        dates_list = sorted(calendar_data.keys(), reverse=True)
        for date_str in dates_list:
            if calendar_data[date_str]["count"] > 0:
                current_streak += 1
            else:
                break
        
        return {
            "calendar": list(calendar_data.values()),
            "summary": {
                "total_contributions": total_contributions,
                "current_streak": current_streak,
                "max_daily_count": max_count,
                "active_days": len([d for d in calendar_data.values() if d["count"] > 0])
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch activity calendar: {str(e)}")

@router.get("/recent")
async def get_recent_activity(
    limit: int = Query(20, ge=1, le=50, description="Number of recent activities to retrieve"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get recent activity feed (like GitHub activity feed)"""
    try:
        activities = []
        
        # Get recent learning progress
        recent_progress = db.exec(
            select(UserProgress).where(
                UserProgress.user_id == current_user.id
            ).order_by(UserProgress.last_accessed_at.desc()).limit(limit)
        ).all()
        
        for progress in recent_progress:
            if progress.last_accessed_at:
                activities.append({
                    "id": f"learn-{progress.id}",
                    "type": "learn",
                    "title": "Learning Activity" if progress.learn_completed else "Started Learning",
                    "description": f"Subtopic: {progress.sub_topic_id}",
                    "timestamp": progress.last_accessed_at.isoformat(),
                    "metadata": {
                        "subtopic": progress.sub_topic_id,
                        "completed": progress.learn_completed,
                        "time_spent": progress.time_spent_learning
                    }
                })
        
        # Get recent quiz attempts
        recent_quizzes = db.exec(
            select(QuizAttempt).where(
                QuizAttempt.user_id == current_user.id
            ).order_by(QuizAttempt.attempted_at.desc()).limit(limit)
        ).all()
        
        for quiz in recent_quizzes:
            activities.append({
                "id": f"quiz-{quiz.id}",
                "type": "quiz",
                "title": "Completed Quiz",
                "description": f"Score: {quiz.score}/{quiz.total_questions}",
                "timestamp": quiz.attempted_at.isoformat(),
                "metadata": {
                    "score": quiz.score,
                    "total_questions": quiz.total_questions,
                    "accuracy": round((quiz.score / quiz.total_questions) * 100, 1) if quiz.total_questions > 0 else 0
                }
            })
        
        # Get recent learning sessions
        recent_sessions = db.exec(
            select(LearningSession).where(
                LearningSession.user_id == current_user.id
            ).order_by(LearningSession.start_time.desc()).limit(limit)
        ).all()
        
        for session in recent_sessions:
            activities.append({
                "id": f"session-{session.id}",
                "type": "session",
                "title": "Learning Session",
                "description": f"Duration: {session.actual_duration or session.estimated_duration} minutes",
                "timestamp": session.start_time.isoformat(),
                "metadata": {
                    "duration": session.actual_duration or session.estimated_duration,
                    "state": session.session_state,
                    "subtopics_completed": session.subtopics_completed
                }
            })
        
        # Sort all activities by timestamp (most recent first)
        activities.sort(key=lambda x: x["timestamp"], reverse=True)
        
        # Return limited number of activities
        return activities[:limit]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch recent activity: {str(e)}")

@router.get("/stats")
async def get_activity_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get overall activity statistics"""
    try:
        # Get user behavior stats
        user_behavior = db.exec(
            select(UserBehavior).where(UserBehavior.user_id == current_user.id)
        ).first()
        
        # Get total learning time
        total_learning_time = db.exec(
            select(func.sum(UserProgress.time_spent_learning)).where(
                UserProgress.user_id == current_user.id
            )
        ).scalar_one_or_none() or 0
        
        # Get total completed items
        completed_items = db.exec(
            select(func.count(UserProgress.id)).where(
                and_(
                    UserProgress.user_id == current_user.id,
                    UserProgress.learn_completed == True
                )
            )
        ).scalar_one_or_none() or 0
        
        # Get total quiz attempts
        total_quizzes = db.exec(
            select(func.count(QuizAttempt.id)).where(
                QuizAttempt.user_id == current_user.id
            )
        ).scalar_one_or_none() or 0
        
        # Get average quiz score
        avg_quiz_score = db.exec(
            select(func.avg(QuizAttempt.score)).where(
                QuizAttempt.user_id == current_user.id
            )
        ).scalar_one_or_none() or 0
        
        return {
            "total_xp": user_behavior.total_xp if user_behavior else 0,
            "current_level": user_behavior.current_level if user_behavior else 1,
            "current_streak": user_behavior.current_streak if user_behavior else 0,
            "longest_streak": user_behavior.longest_streak if user_behavior else 0,
            "total_focus_time": user_behavior.total_focus_time if user_behavior else 0,
            "total_learning_time_seconds": total_learning_time,
            "total_learning_time_hours": round(total_learning_time / 3600, 1),
            "completed_items": completed_items,
            "total_quizzes": total_quizzes,
            "average_quiz_score": round(avg_quiz_score, 1) if avg_quiz_score else 0
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch activity stats: {str(e)}")