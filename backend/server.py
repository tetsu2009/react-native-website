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

# ============================================================================
# AUTHENTICATION UTILITIES
# ============================================================================

def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create a JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get current authenticated user from JWT token"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
    
    user = await db.users.find_one({"id": user_id})
    if user is None:
        raise credentials_exception
    
    return User(**user)

def calculate_level_from_xp(xp: int) -> int:
    """Calculate user level based on XP (100 XP per level)"""
    return max(1, (xp // 100) + 1)

async def user_exists(email: str, username: str) -> dict:
    """Check if user exists by email or username"""
    email_exists = await db.users.find_one({"email": email}) is not None
    username_exists = await db.users.find_one({"username": username}) is not None
    return {"email": email_exists, "username": username_exists}

# ============================================================================
# AUTHENTICATION ENDPOINTS
# ============================================================================

@api_router.post("/auth/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register_user(user_data: UserCreate):
    """Register a new user"""
    
    # Check if user already exists
    existing = await user_exists(user_data.email, user_data.username)
    if existing["email"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    if existing["username"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken"
        )
    
    # Create new user
    user_dict = user_data.dict()
    user_dict.pop("password")
    user_dict["password_hash"] = hash_password(user_data.password)
    
    new_user = User(**user_dict)
    
    # Save to database
    await db.users.insert_one(new_user.dict())
    
    # Create access token
    access_token = create_access_token(data={"sub": new_user.id})
    
    # Return token with user data
    user_response = UserResponse(**new_user.dict())
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=user_response
    )

@api_router.post("/auth/login", response_model=Token)
async def login_user(credentials: UserLogin):
    """Login existing user"""
    
    # Find user by email
    user_doc = await db.users.find_one({"email": credentials.email})
    if not user_doc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    user = User(**user_doc)
    
    # Verify password
    if not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Check if account is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account is deactivated"
        )
    
    # Update last activity
    await db.users.update_one(
        {"id": user.id},
        {"$set": {"last_activity": datetime.utcnow()}}
    )
    
    # Create access token
    access_token = create_access_token(data={"sub": user.id})
    
    # Return token with user data
    user_response = UserResponse(**user.dict())
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=user_response
    )

@api_router.get("/auth/me", response_model=UserResponse)
async def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """Get current user profile"""
    return UserResponse(**current_user.dict())

@api_router.put("/auth/profile", response_model=UserResponse)
async def update_user_profile(
    first_name: Optional[str] = None,
    last_name: Optional[str] = None,
    phone_number: Optional[str] = None,
    avatar_base64: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Update user profile"""
    
    update_data = {}
    if first_name is not None:
        update_data["first_name"] = first_name
    if last_name is not None:
        update_data["last_name"] = last_name
    if phone_number is not None:
        update_data["phone_number"] = phone_number
    if avatar_base64 is not None:
        update_data["avatar_base64"] = avatar_base64
    
    update_data["updated_at"] = datetime.utcnow()
    
    # Update in database
    await db.users.update_one(
        {"id": current_user.id},
        {"$set": update_data}
    )
    
    # Get updated user
    updated_user_doc = await db.users.find_one({"id": current_user.id})
    updated_user = User(**updated_user_doc)
    
    return UserResponse(**updated_user.dict())

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
