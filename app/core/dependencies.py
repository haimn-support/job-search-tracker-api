"""
FastAPI dependencies for authentication and database access.
"""
from typing import Optional
from uuid import UUID
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from .database import get_db
from .auth import get_user_id_from_token
from ..models.user import User


# HTTP Bearer token security scheme
security = HTTPBearer()


async def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> UUID:
    """
    Extract and validate user ID from JWT token.
    
    Args:
        credentials: HTTP Bearer credentials containing the JWT token
        
    Returns:
        The authenticated user's UUID
        
    Raises:
        HTTPException: If token is invalid or user ID cannot be extracted
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        user_id_str = get_user_id_from_token(credentials.credentials)
        if user_id_str is None:
            raise credentials_exception
        
        user_id = UUID(user_id_str)
        return user_id
    except (ValueError, TypeError):
        raise credentials_exception


async def get_current_user(
    user_id: UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db)
) -> User:
    """
    Get the current authenticated user from the database.
    
    Args:
        user_id: The authenticated user's UUID
        db: Database session
        
    Returns:
        The authenticated User object
        
    Raises:
        HTTPException: If user is not found in database
    """
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


# Optional authentication dependency for endpoints that may or may not require auth
async def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False)),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """
    Get the current user if authenticated, otherwise return None.
    
    Args:
        credentials: Optional HTTP Bearer credentials
        db: Database session
        
    Returns:
        The authenticated User object if valid token provided, None otherwise
    """
    if credentials is None:
        return None
    
    try:
        user_id_str = get_user_id_from_token(credentials.credentials)
        if user_id_str is None:
            return None
        
        user_id = UUID(user_id_str)
        user = db.query(User).filter(User.id == user_id).first()
        return user
    except (ValueError, TypeError):
        return None