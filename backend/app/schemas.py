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
