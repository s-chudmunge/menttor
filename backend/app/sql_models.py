from typing import Optional, List, Dict, Any
from sqlmodel import Field, SQLModel, Column, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy import DateTime # Import DateTime
from datetime import datetime, date
import uuid

class UserBase(SQLModel):
    email: str
    is_active: bool = True
    is_admin: bool = False
    display_name: Optional[str] = None
    profile_completed: bool = False
    onboarding_completed: bool = False

class UserCreate(UserBase):
    password: Optional[str] = None

class UserRead(UserBase):
    id: int

class User(UserBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    supabase_uid: Optional[str] = Field(default=None, unique=True, index=True)
    firebase_uid: Optional[str] = Field(default=None, unique=True, index=True)  # Keep for migration
    hashed_password: Optional[str] = ""

class GoalBase(SQLModel):
    title: str
    description: Optional[str] = None

class GoalCreate(GoalBase):
    pass

class GoalRead(GoalBase):
    id: int
    user_id: int

class Goal(GoalBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(index=True, foreign_key="user.id")


class Roadmap(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: Optional[int] = Field(default=None, index=True, foreign_key="user.id")
    title: str
    description: str
    roadmap_plan: Dict[str, Any] = Field(default={}, sa_column=Column(JSONB))
    subject: Optional[str] = None
    goal: Optional[str] = None
    time_value: Optional[int] = None
    time_unit: Optional[str] = None
    model: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow, sa_column_kwargs={"onupdate": datetime.utcnow})