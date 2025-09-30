# database.py
import os
from sqlmodel import SQLModel
from dotenv import load_dotenv
from models import Habit
from typing import List
from supabase import create_client, Client

load_dotenv()

DATABASE_URL = os.getenv("SUPABASE_URL")
DATABASE_KEY = os.getenv("SUPABASE_KEY")

supabase: Client = create_client(DATABASE_URL, DATABASE_KEY)

def get_all_habits(user_id: str = None) -> List[Habit]:
    """Fetch all habits, optionally for a specific user"""
    query = supabase.table("habits").select("*")
    if user_id:
        query = query.eq("user_id", user_id)
    result = query.execute()   # <-- fixed typo

    habits = []
    for item in result.data:
        habit = Habit(
            id=item.get("id"),
            user_id=item.get("user_id"),
            name=item.get("name"),
            description=item.get("description"),
            created_at=item.get("created_at")
        )
        habits.append(habit)
    return habits


def add_habit(habit: Habit):
    """Insert habit in the database via Supabase"""
    # If DB expects uuid type, ensure user_id is a valid UUID string
    data = {
        "user_id": habit.user_id,
        "name": habit.name,
        "description": habit.description,
        "created_at": habit.created_at.isoformat()
    }

    return supabase.table("habits").insert(data).execute()
