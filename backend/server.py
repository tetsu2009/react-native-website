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
    
    # Premium System
    premium_tier: Literal["free", "bronze", "silver", "gold"] = "free"
    premium_expires: Optional[datetime] = None
    premium_multiplier: float = 1.0  # 1.0=free, 1.5=bronze, 2.0=silver, 3.0=gold
    
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
    premium_tier: str
    premium_expires: Optional[datetime]
    premium_multiplier: float
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
    type: Literal["mission_reward", "bonus", "withdrawal", "refund", "premium_upgrade"]
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

def get_premium_multiplier(tier: str) -> float:
    """Get reward multiplier based on premium tier"""
    multipliers = {
        "free": 1.0,
        "bronze": 1.5,  # +50% gains
        "silver": 2.0,  # +100% gains
        "gold": 3.0     # +200% gains
    }
    return multipliers.get(tier, 1.0)

def update_user_premium_status(user: User) -> User:
    """Update user premium status and multiplier"""
    if user.premium_expires and user.premium_expires < datetime.utcnow():
        user.premium_tier = "free"
        user.premium_expires = None
    
    user.premium_multiplier = get_premium_multiplier(user.premium_tier)
    return user

# ============================================================================
# PREMIUM SYSTEM ENDPOINTS
# ============================================================================

@api_router.get("/premium/tiers")
async def get_premium_tiers():
    """Get available premium tiers"""
    return {
        "tiers": [
            {
                "name": "free",
                "display_name": "Gratuit",
                "multiplier": 1.0,
                "price_monthly": 0,
                "benefits": ["Missions de base", "Gains standard"]
            },
            {
                "name": "bronze",
                "display_name": "Bronze",
                "multiplier": 1.5,
                "price_monthly": 4.99,
                "benefits": ["Missions de base", "+50% gains", "Support prioritaire"]
            },
            {
                "name": "silver", 
                "display_name": "Silver",
                "multiplier": 2.0,
                "price_monthly": 9.99,
                "benefits": ["Toutes missions", "+100% gains", "Missions exclusives", "Support prioritaire"]
            },
            {
                "name": "gold",
                "display_name": "Gold",
                "multiplier": 3.0,
                "price_monthly": 19.99,
                "benefits": ["Toutes missions", "+200% gains", "Missions VIP", "Support 24/7", "Bonus quotidien"]
            }
        ]
    }

@api_router.post("/premium/upgrade")
async def upgrade_premium(
    tier: Literal["bronze", "silver", "gold"],
    duration_months: int = 1,
    current_user: User = Depends(get_current_user)
):
    """Upgrade user to premium tier (mock payment for demo)"""
    
    if tier == "free":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot upgrade to free tier"
        )
    
    # Calculate expiration date
    if current_user.premium_expires and current_user.premium_expires > datetime.utcnow():
        # Extend existing premium
        new_expiration = current_user.premium_expires + timedelta(days=30 * duration_months)
    else:
        # New premium subscription
        new_expiration = datetime.utcnow() + timedelta(days=30 * duration_months)
    
    # Update user premium status
    await db.users.update_one(
        {"id": current_user.id},
        {
            "$set": {
                "premium_tier": tier,
                "premium_expires": new_expiration,
                "premium_multiplier": get_premium_multiplier(tier),
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    # Create transaction record
    prices = {"bronze": 4.99, "silver": 9.99, "gold": 19.99}
    total_price = prices[tier] * duration_months
    
    transaction = Transaction(
        user_id=current_user.id,
        type="premium_upgrade",
        money_amount=-total_price,  # Negative because it's a payment
        description=f"Upgrade vers {tier.title()} Premium - {duration_months} mois"
    )
    
    await db.transactions.insert_one(transaction.dict())
    
    return {
        "message": f"Félicitations ! Vous êtes maintenant {tier.title()} Premium",
        "tier": tier,
        "expires": new_expiration,
        "multiplier": get_premium_multiplier(tier)
    }

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

# ============================================================================
# MISSION MANAGEMENT ENDPOINTS
# ============================================================================

@api_router.get("/missions", response_model=List[Mission])
async def get_available_missions():
    """Get all available missions for users"""
    missions = await db.missions.find({
        "is_active": True,
        "$or": [
            {"available_until": None},
            {"available_until": {"$gte": datetime.utcnow()}}
        ]
    }).to_list(100)
    return [Mission(**mission) for mission in missions]

@api_router.get("/missions/{mission_id}", response_model=Mission)
async def get_mission(mission_id: str):
    """Get a specific mission by ID"""
    mission = await db.missions.find_one({"id": mission_id, "is_active": True})
    if not mission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mission not found"
        )
    return Mission(**mission)

@api_router.post("/missions", response_model=Mission, status_code=status.HTTP_201_CREATED)
async def create_mission(
    mission_data: MissionCreate,
    current_user: User = Depends(get_current_user)
):
    """Create a new mission (admin only for now)"""
    
    # Create mission
    mission_dict = mission_data.dict()
    mission_dict["created_by"] = current_user.id
    
    new_mission = Mission(**mission_dict)
    
    # Save to database
    await db.missions.insert_one(new_mission.dict())
    
    return new_mission

@api_router.get("/my-missions", response_model=List[dict])
async def get_my_missions(current_user: User = Depends(get_current_user)):
    """Get user's mission history and current submissions"""
    
    # Get user's submissions
    submissions = await db.mission_submissions.find({
        "user_id": current_user.id
    }).to_list(100)
    
    # Get mission details for each submission
    mission_history = []
    for submission in submissions:
        mission = await db.missions.find_one({"id": submission["mission_id"]})
        if mission:
            mission_history.append({
                "mission": Mission(**mission),
                "submission": MissionSubmission(**submission),
                "status": submission["status"]
            })
    
    return mission_history

# ============================================================================
# MISSION SUBMISSION ENDPOINTS
# ============================================================================

@api_router.post("/missions/{mission_id}/submit", response_model=MissionSubmission)
async def submit_mission(
    mission_id: str,
    submission_data: MissionSubmissionCreate,
    current_user: User = Depends(get_current_user)
):
    """Submit a completed mission"""
    
    # Verify mission exists
    mission = await db.missions.find_one({"id": mission_id, "is_active": True})
    if not mission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mission not found"
        )
    
    mission_obj = Mission(**mission)
    
    # Check if user already submitted this mission recently (prevent spam)
    existing_submission = await db.mission_submissions.find_one({
        "user_id": current_user.id,
        "mission_id": mission_id,
        "status": {"$in": ["pending", "approved"]},
        "submitted_at": {"$gte": datetime.utcnow() - timedelta(hours=24)}
    })
    
    if existing_submission and not mission_obj.is_daily:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mission already submitted recently"
        )
    
    # Validate submission based on mission requirements
    if mission_obj.requires_photo and len(submission_data.photos_base64) < mission_obj.min_photos:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Mission requires at least {mission_obj.min_photos} photos"
        )
    
    if len(submission_data.photos_base64) > mission_obj.max_photos:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Maximum {mission_obj.max_photos} photos allowed"
        )
    
    # Create submission
    submission_dict = submission_data.dict()
    submission_dict["user_id"] = current_user.id
    
    new_submission = MissionSubmission(**submission_dict)
    
    # Save to database
    await db.mission_submissions.insert_one(new_submission.dict())
    
    # Update user stats
    await db.users.update_one(
        {"id": current_user.id},
        {"$inc": {"missions_in_progress": 1}}
    )
    
    return new_submission

@api_router.get("/submissions", response_model=List[MissionSubmission])
async def get_all_submissions(current_user: User = Depends(get_current_user)):
    """Get all submissions for review (admin functionality)"""
    submissions = await db.mission_submissions.find().to_list(100)
    return [MissionSubmission(**submission) for submission in submissions]

@api_router.put("/submissions/{submission_id}/review")
async def review_submission(
    submission_id: str,
    status: Literal["approved", "rejected"],
    review_notes: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Approve or reject a mission submission (admin only)"""
    
    # Get submission
    submission_doc = await db.mission_submissions.find_one({"id": submission_id})
    if not submission_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Submission not found"
        )
    
    submission = MissionSubmission(**submission_doc)
    
    # Get mission details for reward calculation
    mission_doc = await db.missions.find_one({"id": submission.mission_id})
    if not mission_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mission not found"
        )
    
    mission = Mission(**mission_doc)
    
    # Update submission status
    update_data = {
        "status": status,
        "review_notes": review_notes,
        "reviewed_by": current_user.id,
        "reviewed_at": datetime.utcnow()
    }
    
    if status == "approved":
        update_data["completed_at"] = datetime.utcnow()
    
    await db.mission_submissions.update_one(
        {"id": submission_id},
        {"$set": update_data}
    )
    
    # If approved, reward the user
    if status == "approved":
        # Get user
        user_doc = await db.users.find_one({"id": submission.user_id})
        if user_doc:
            user = User(**user_doc)
            user = update_user_premium_status(user)  # Update premium status
            
            # Calculate rewards with premium multiplier
            base_xp = mission.xp_reward
            base_money = mission.money_reward
            
            final_xp = int(base_xp * user.premium_multiplier)
            final_money = round(base_money * user.premium_multiplier, 2)
            
            # Calculate new stats
            new_xp = user.xp + final_xp
            new_level = calculate_level_from_xp(new_xp)
            new_balance = user.current_balance + final_money
            new_total_earned = user.total_money_earned + final_money
            
            # Update user stats
            await db.users.update_one(
                {"id": submission.user_id},
                {
                    "$set": {
                        "xp": new_xp,
                        "level": new_level,
                        "current_balance": new_balance,
                        "total_money_earned": new_total_earned,
                        "premium_tier": user.premium_tier,
                        "premium_expires": user.premium_expires,
                        "premium_multiplier": user.premium_multiplier
                    },
                    "$inc": {
                        "missions_completed": 1,
                        "missions_in_progress": -1
                    }
                }
            )
            
            # Create transaction record
            multiplier_text = f" (x{user.premium_multiplier} Premium)" if user.premium_multiplier > 1.0 else ""
            transaction = Transaction(
                user_id=submission.user_id,
                mission_id=mission.id,
                submission_id=submission_id,
                type="mission_reward",
                xp_amount=final_xp,
                money_amount=final_money,
                description=f"Récompense pour mission: {mission.title}{multiplier_text}"
            )
            
            await db.transactions.insert_one(transaction.dict())
            
            # Update mission stats
            await db.missions.update_one(
                {"id": mission.id},
                {"$inc": {"completion_count": 1}}
            )
    
    elif status == "rejected":
        # Update user stats (remove from in_progress)
        await db.users.update_one(
            {"id": submission.user_id},
            {"$inc": {"missions_in_progress": -1}}
        )
    
    return {"message": f"Submission {status} successfully", "status": status}

# ============================================================================
# TRANSACTION ENDPOINTS
# ============================================================================

@api_router.get("/my-transactions", response_model=List[Transaction])
async def get_my_transactions(current_user: User = Depends(get_current_user)):
    """Get user's transaction history"""
    transactions = await db.transactions.find({
        "user_id": current_user.id
    }).sort("created_at", -1).to_list(50)
    
    return [Transaction(**transaction) for transaction in transactions]

# ============================================================================
# BASIC ENDPOINTS
# ============================================================================

@api_router.get("/")
async def root():
    """API Health Check"""
    return {
        "message": "Reality+ API is running!",
        "version": "1.0.0",
        "status": "healthy"
    }

@api_router.get("/health")
async def health_check():
    """Detailed health check"""
    try:
        # Test database connection
        await db.users.find_one()
        db_status = "connected"
    except Exception as e:
        db_status = f"error: {str(e)}"
    
    return {
        "api": "healthy",
        "database": db_status,
        "timestamp": datetime.utcnow()
    }

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
