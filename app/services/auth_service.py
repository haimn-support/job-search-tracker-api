"""
Authentication service for user registration and login operations.
"""
from datetime import timedelta
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status
from ..core.auth import verify_password, get_password_hash, create_access_token
from ..core.config import settings
from ..models.user import User
from ..schemas.user import UserCreate, UserLogin, TokenResponse


class AuthService:
    """Service class for authentication operations."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def register_user(self, user_data: UserCreate) -> User:
        """
        Register a new user.
        
        Args:
            user_data: User registration data
            
        Returns:
            The created User object
            
        Raises:
            HTTPException: If email already exists or registration fails
        """
        # Check if user already exists
        existing_user = self.db.query(User).filter(User.email == user_data.email).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already registered"
            )
        
        # Hash the password
        hashed_password = get_password_hash(user_data.password)
        
        # Create new user
        db_user = User(
            email=user_data.email,
            password_hash=hashed_password,
            first_name=user_data.first_name,
            last_name=user_data.last_name
        )
        
        try:
            self.db.add(db_user)
            self.db.commit()
            self.db.refresh(db_user)
            return db_user
        except IntegrityError:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already registered"
            )
    
    def authenticate_user(self, login_data: UserLogin) -> Optional[User]:
        """
        Authenticate a user with email and password.
        
        Args:
            login_data: User login credentials
            
        Returns:
            The authenticated User object if credentials are valid, None otherwise
        """
        user = self.db.query(User).filter(User.email == login_data.email).first()
        if not user:
            return None
        
        if not verify_password(login_data.password, user.password_hash):
            return None
        
        return user
    
    def create_access_token_for_user(self, user: User) -> TokenResponse:
        """
        Create an access token for a user.
        
        Args:
            user: The user to create a token for
            
        Returns:
            Token response with access token and metadata
        """
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": str(user.id)},
            expires_delta=access_token_expires
        )
        
        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60  # Convert to seconds
        )
    
    def login_user(self, login_data: UserLogin) -> TokenResponse:
        """
        Login a user and return an access token.
        
        Args:
            login_data: User login credentials
            
        Returns:
            Token response with access token
            
        Raises:
            HTTPException: If credentials are invalid
        """
        user = self.authenticate_user(login_data)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        return self.create_access_token_for_user(user)