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


router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/register", 
    response_model=UserResponse, 
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user account",
    description="Create a new user account with email and password. Email must be unique.",
    responses={
        201: {
            "description": "User successfully registered",
            "content": {
                "application/json": {
                    "example": {
                        "id": "123e4567-e89b-12d3-a456-426614174000",
                        "email": "user@example.com",
                        "first_name": "John",
                        "last_name": "Doe",
                        "created_at": "2024-01-15T10:30:00Z",
                        "updated_at": "2024-01-15T10:30:00Z"
                    }
                }
            }
        },
        409: {
            "description": "Email already exists",
            "content": {
                "application/json": {
                    "example": {
                        "error": {
                            "code": "EMAIL_ALREADY_EXISTS",
                            "message": "A user with this email already exists",
                            "details": "Please use a different email address or try logging in",
                            "timestamp": "2024-01-15T10:30:00Z"
                        }
                    }
                }
            }
        },
        422: {
            "description": "Validation error",
            "content": {
                "application/json": {
                    "example": {
                        "detail": [
                            {
                                "loc": ["body", "email"],
                                "msg": "field required",
                                "type": "value_error.missing"
                            }
                        ]
                    }
                }
            }
        }
    }
)
async def register(
    user_data: UserCreate,
    db: Session = Depends(get_db)
):
    """
    Register a new user account.
    
    Creates a new user account with the provided email and password.
    The email must be unique across all users.
    
    **Example Request:**
    ```json
    {
        "email": "user@example.com",
        "password": "securepassword123",
        "first_name": "John",
        "last_name": "Doe"
    }
    ```
    """
    auth_service = AuthService(db)
    user = auth_service.register_user(user_data)
    return UserResponse.model_validate(user)


@router.post(
    "/login", 
    response_model=TokenResponse,
    summary="Authenticate user and get access token",
    description="Login with email and password to receive a JWT access token for API authentication.",
    responses={
        200: {
            "description": "Login successful",
            "content": {
                "application/json": {
                    "example": {
                        "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                        "token_type": "bearer",
                        "expires_in": 3600
                    }
                }
            }
        },
        401: {
            "description": "Invalid credentials",
            "content": {
                "application/json": {
                    "example": {
                        "error": {
                            "code": "INVALID_CREDENTIALS",
                            "message": "Invalid email or password",
                            "details": "Please check your credentials and try again",
                            "timestamp": "2024-01-15T10:30:00Z"
                        }
                    }
                }
            }
        }
    }
)
async def login(
    login_data: UserLogin,
    db: Session = Depends(get_db)
):
    """
    Authenticate user and return access token.
    
    Login with your email and password to receive a JWT access token.
    Use this token in the Authorization header for subsequent API calls.
    
    **Example Request:**
    ```json
    {
        "username": "user@example.com",
        "password": "securepassword123"
    }
    ```
    
    **Using the token:**
    ```
    Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
    ```
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