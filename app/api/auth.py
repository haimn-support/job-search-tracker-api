"""
Authentication API endpoints for user registration and login.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..core.dependencies import get_current_user
from ..services.auth_service import AuthService
from ..schemas.user import UserCreate, UserLogin, UserResponse, TokenResponse
from ..models.user import User


router = APIRouter(prefix="/auth", tags=["authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserCreate,
    db: Session = Depends(get_db)
):
    """
    Register a new user account.
    
    Args:
        user_data: User registration data including email and password
        db: Database session
        
    Returns:
        The created user information (without password)
        
    Raises:
        HTTPException: If email already exists or registration fails
    """
    auth_service = AuthService(db)
    user = auth_service.register_user(user_data)
    return UserResponse.model_validate(user)


@router.post("/login", response_model=TokenResponse)
async def login(
    login_data: UserLogin,
    db: Session = Depends(get_db)
):
    """
    Authenticate user and return access token.
    
    Args:
        login_data: User login credentials (email and password)
        db: Database session
        
    Returns:
        JWT access token and metadata
        
    Raises:
        HTTPException: If credentials are invalid
    """
    auth_service = AuthService(db)
    return auth_service.login_user(login_data)


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """
    Get current authenticated user information.
    
    Args:
        current_user: The authenticated user from JWT token
        
    Returns:
        Current user information
    """
    return UserResponse.model_validate(current_user)


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Refresh the access token for the current user.
    
    Args:
        current_user: The authenticated user from JWT token
        db: Database session
        
    Returns:
        New JWT access token and metadata
    """
    auth_service = AuthService(db)
    return auth_service.create_access_token_for_user(current_user)