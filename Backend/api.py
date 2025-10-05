import os
from dotenv import load_dotenv
load_dotenv()

from datetime import datetime, timezone
from typing import Optional, List, Dict

from fastapi import FastAPI, Depends, HTTPException, Header, status
from fastapi.responses import PlainTextResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests

from supabase import create_client, Client

# --- env ---
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_ANON_KEY or not SUPABASE_SERVICE_ROLE_KEY:
    raise RuntimeError("Set SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY in env")

# small Supabase service client only for auth operations (validate token)
supabase_service: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

# PostgREST base URL
SUPABASE_REST = SUPABASE_URL.rstrip("/") + "/rest/v1"
ANON_KEY = SUPABASE_ANON_KEY


def supabase_headers_for_token(token: str) -> dict:
    """Headers required for PostgREST requests that respect RLS."""
    return {
        "Authorization": f"Bearer {token}",
        "apikey": ANON_KEY,
        "Content-Type": "application/json",
        "Accept": "application/json"
    }


# --- FastAPI app ---
app = FastAPI(title="Habit Backend (REST)")

# ✅ Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # allow localhost:3000 for frontend; restrict later in prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Temporary debug exception handler (ok for local dev)
@app.exception_handler(Exception)
async def debug_exception_handler(request, exc):
    import traceback
    tb = "".join(traceback.format_exception(type(exc), exc, exc.__traceback__))
    print("DEBUG EXCEPTION:\n", tb)
    return PlainTextResponse(tb, status_code=500)


# --- Pydantic models ---
class HabitIn(BaseModel):
    name: str
    description: Optional[str] = None
    is_public: Optional[bool] = False


class HabitOut(HabitIn):
    id: int
    user_id: str
    created_at: datetime


class ProfileIn(BaseModel):
    username: Optional[str] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None


class ProfileOut(ProfileIn):
    id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


# --- Auth dependency ---
def get_current_user(authorization: Optional[str] = Header(None)) -> Dict[str, str]:
    """
    Validate token using service role client and return dict with 'id' and 'token'.
    Raises 401 if missing/invalid.
    """
    if not authorization:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing Authorization header")
    token = authorization.split("Bearer ")[-1].strip()
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing token")

    try:
        user_resp = supabase_service.auth.get_user(token)
        user = None
        if hasattr(user_resp, "user"):
            user = user_resp.user
        elif isinstance(user_resp, dict) and "user" in user_resp:
            user = user_resp["user"]
        else:
            user = user_resp
    except Exception:
        user = None

    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")

    user_id = getattr(user, "id", None) or (user.get("id") if isinstance(user, dict) else None)
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Could not get user id from token")

    return {"id": user_id, "token": token}


# --- Helper functions that call PostgREST (REST) ---
def get_user_habits_via_rest(user_token: str, user_id: str) -> list:
    url = f"{SUPABASE_REST}/habits?select=*&user_id=eq.{user_id}"
    resp = requests.get(url, headers=supabase_headers_for_token(user_token))
    if resp.status_code >= 400:
        raise HTTPException(status_code=resp.status_code, detail=resp.text)
    return resp.json()


def insert_habit_via_rest(user_token: str, payload: dict) -> dict:
    url = f"{SUPABASE_REST}/habits"
    headers = supabase_headers_for_token(user_token)
    headers["Prefer"] = "return=representation"
    resp = requests.post(url, headers=headers, json=payload)
    if resp.status_code >= 400:
        raise HTTPException(status_code=resp.status_code, detail=resp.text)
    data = resp.json()
    return data[0] if isinstance(data, list) and data else data


def update_habit_via_rest(user_token: str, habit_id: int, payload: dict, user_id: str):
    url = f"{SUPABASE_REST}/habits?id=eq.{habit_id}&user_id=eq.{user_id}"
    headers = supabase_headers_for_token(user_token)
    headers["Prefer"] = "return=representation"
    resp = requests.patch(url, headers=headers, json=payload)
    if resp.status_code >= 400:
        raise HTTPException(status_code=resp.status_code, detail=resp.text)
    data = resp.json()
    return data[0] if isinstance(data, list) and data else data


def delete_habit_via_rest(user_token: str, habit_id: int, user_id: str):
    url = f"{SUPABASE_REST}/habits?id=eq.{habit_id}&user_id=eq.{user_id}"
    resp = requests.delete(url, headers=supabase_headers_for_token(user_token))
    if resp.status_code >= 400:
        raise HTTPException(status_code=resp.status_code, detail=resp.text)
    return resp.json()


def list_public_habits_via_rest():
    url = f"{SUPABASE_REST}/habits?select=*&is_public=eq.true"
    resp = requests.get(url, headers={"apikey": ANON_KEY, "Accept": "application/json"})
    if resp.status_code >= 400:
        raise HTTPException(status_code=resp.status_code, detail=resp.text)
    return resp.json()


def get_profile_via_rest(user_token: str, user_id: str):
    url = f"{SUPABASE_REST}/profiles?id=eq.{user_id}"
    resp = requests.get(url, headers=supabase_headers_for_token(user_token))
    if resp.status_code >= 400:
        raise HTTPException(status_code=resp.status_code, detail=resp.text)
    data = resp.json()
    return data[0] if isinstance(data, list) and data else None


def upsert_profile_via_rest(user_token: str, data: dict):
    url = f"{SUPABASE_REST}/profiles"
    headers = supabase_headers_for_token(user_token)
    headers["Prefer"] = "return=representation"
    resp = requests.post(url, headers=headers, json=data)
    if resp.status_code >= 400:
        raise HTTPException(status_code=resp.status_code, detail=resp.text)
    data = resp.json()
    return data[0] if isinstance(data, list) and data else data


# --- Habits endpoints ---
@app.post("/habits", response_model=dict)
def create_habit(user: Dict[str, str] = Depends(get_current_user), habit: HabitIn = None):
    if not habit:
        raise HTTPException(status_code=400, detail="Missing habit payload")
    token = user["token"]
    user_id = user["id"]
    payload = {
        "user_id": user_id,
        "name": habit.name,
        "description": habit.description,
        "is_public": habit.is_public,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    inserted = insert_habit_via_rest(token, payload)
    return {"ok": True, "data": inserted}


@app.get("/habits", response_model=List[HabitOut])
def list_private_habits(user: Dict[str, str] = Depends(get_current_user)):
    token = user["token"]
    user_id = user["id"]
    rows = get_user_habits_via_rest(token, user_id)
    return rows


@app.get("/habits/public", response_model=List[HabitOut])
def list_public_habits():
    return list_public_habits_via_rest()


@app.put("/habits/{habit_id}", response_model=dict)
def update_habit(habit_id: int, habit: HabitIn = None, user: Dict[str, str] = Depends(get_current_user)):
    if not habit:
        raise HTTPException(status_code=400, detail="Missing habit payload")
    token = user["token"]
    user_id = user["id"]
    payload = {
        "name": habit.name,
        "description": habit.description,
        "is_public": habit.is_public,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    updated = update_habit_via_rest(token, habit_id, payload, user_id)
    return {"ok": True, "data": updated}


@app.delete("/habits/{habit_id}", response_model=dict)
def delete_habit(habit_id: int, user: Dict[str, str] = Depends(get_current_user)):
    token = user["token"]
    user_id = user["id"]
    deleted = delete_habit_via_rest(token, habit_id, user_id)
    return {"ok": True, "data": deleted}


# --- Profiles endpoints ---
@app.get("/profiles/me", response_model=ProfileOut)
def get_my_profile(user: Dict[str, str] = Depends(get_current_user)):
    token = user["token"]
    user_id = user["id"]
    profile = get_profile_via_rest(token, user_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile


@app.put("/profiles/me", response_model=dict)
def upsert_my_profile(profile: ProfileIn, user: Dict[str, str] = Depends(get_current_user)):
    token = user["token"]
    user_id = user["id"]
    data = {
        "id": user_id,
        "username": profile.username,
        "avatar_url": profile.avatar_url,
        "bio": profile.bio,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    res = upsert_profile_via_rest(token, data)
    return {"ok": True, "data": res}
