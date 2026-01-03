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

class GoalCreate(BaseModel):
    title: str
    description: Optional[str] = None

class GoalResponse(BaseModel):
    id: int
    user_id: int
    title: str
    description: Optional[str] = None


class RoadmapCreate(SQLModel):
    subject: str
    goal: str
    time_value: int
    time_unit: str
    model: Optional[str] = None
    prior_experience: Optional[str] = None


class RoadmapRead(SQLModel):
    id: int
    user_id: Optional[int] = None
    title: str
    description: str
    roadmap_plan: Dict[str, Any]
    subject: Optional[str] = None
    goal: Optional[str] = None
    time_value: Optional[int] = None
    time_unit: Optional[str] = None
    model: Optional[str] = None
    created_at: datetime
    updated_at: datetime

