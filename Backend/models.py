# models.py
from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime, timezone

class Habit(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: Optional[str] = Field(default=None, index=True)   # store UUID string
    name: str
    description: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
