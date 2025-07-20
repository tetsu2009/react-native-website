from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Literal
import uuid
from datetime import datetime, timedelta
import jwt
from passlib.context import CryptContext
import secrets


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', secrets.token_hex(32))
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# Create the main app without a prefix
app = FastAPI(title="Reality+ API", description="API pour l'application Reality+")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# ============================================================================
# DATA MODELS - Reality+ Application
# ============================================================================

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    username: str
    password_hash: str
    first_name: str
    last_name: str
    phone_number: Optional[str] = None
    avatar_base64: Optional[str] = None
    
    # Gamification
    xp: int = 0
    level: int = 1
    total_money_earned: float = 0.0
    current_balance: float = 0.0
    
    # Stats
    missions_completed: int = 0
    missions_in_progress: int = 0
    streak_days: int = 0
    last_activity: datetime = Field(default_factory=datetime.utcnow)
    
    # Account
    is_active: bool = True
    email_verified: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class UserCreate(BaseModel):
    email: EmailStr
    username: str
    password: str
    first_name: str
    last_name: str
    phone_number: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    username: str
    first_name: str
    last_name: str
    phone_number: Optional[str]
    avatar_base64: Optional[str]
    xp: int
    level: int
    total_money_earned: float
    current_balance: float
    missions_completed: int
    missions_in_progress: int
    streak_days: int
    last_activity: datetime
    created_at: datetime

class Mission(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    category: Literal["photo", "walk", "recycle", "help", "other"]
    difficulty: Literal["easy", "medium", "hard"]
    
    # Rewards
    xp_reward: int
    money_reward: float
    
    # Requirements
    requires_photo: bool = False
    requires_location: bool = False
    min_photos: int = 1
    max_photos: int = 5
    location_radius_meters: Optional[int] = None
    target_location: Optional[dict] = None  # {"lat": float, "lng": float, "address": str}
    
    # Scheduling
    is_daily: bool = False
    is_active: bool = True
    available_from: datetime = Field(default_factory=datetime.utcnow)
    available_until: Optional[datetime] = None
    
    # Stats
    completion_count: int = 0
    success_rate: float = 100.0
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: str  # admin user id

class MissionCreate(BaseModel):
    title: str
    description: str
    category: Literal["photo", "walk", "recycle", "help", "other"]
    difficulty: Literal["easy", "medium", "hard"]
    xp_reward: int
    money_reward: float
    requires_photo: bool = False
    requires_location: bool = False
    min_photos: int = 1
    max_photos: int = 5
    is_daily: bool = False
    available_until: Optional[datetime] = None

class MissionSubmission(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    mission_id: str
    user_id: str
    
    # Submission data
    photos_base64: List[str] = []
    location_data: Optional[dict] = None  # {"lat": float, "lng": float, "accuracy": float}
    notes: Optional[str] = None
    
    # Validation
    status: Literal["pending", "approved", "rejected"] = "pending"
    review_notes: Optional[str] = None
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    
    # Timestamps
    submitted_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None

class MissionSubmissionCreate(BaseModel):
    mission_id: str
    photos_base64: List[str] = []
    location_data: Optional[dict] = None
    notes: Optional[str] = None

class Transaction(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    mission_id: Optional[str] = None
    submission_id: Optional[str] = None
    
    # Transaction details
    type: Literal["mission_reward", "bonus", "withdrawal", "refund"]
    xp_amount: int = 0
    money_amount: float = 0.0
    description: str
    
    # Status
    status: Literal["pending", "completed", "failed"] = "completed"
    
    created_at: datetime = Field(default_factory=datetime.utcnow)

# Auth Token Response
class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Hello World"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
