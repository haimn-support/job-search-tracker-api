"""
Authorization utilities and middleware for user context and data isolation.
"""
from typing import Optional
from uuid import UUID
from fastapi import Request, Depends
from sqlalchemy.orm import Session
from .database import get_db
from .dependencies import get_current_user_id, get_current_user
from .exceptions import AuthorizationException
from ..models.user import User
from ..models.position import Position
from ..models.interview import Interview


class UserContext:
    """
    User context object that holds the current user information.
    
    This is injected into requests to provide easy access to user data
    and enable authorization checks throughout the application.
    """
    
    def __init__(self, user_id: UUID, user: Optional[User] = None):
        self.user_id = user_id
        self.user = user
    
    def __str__(self):
        return f"UserContext(user_id={self.user_id})"
    
    def __repr__(self):
        return self.__str__()


async def get_user_context(
    current_user_id: UUID = Depends(get_current_user_id)
) -> UserContext:
    """
    Create a user context object for the current authenticated user.
    
    Args:
        current_user_id: The authenticated user's ID
        
    Returns:
        UserContext object containing user information
    """
    return UserContext(user_id=current_user_id)


async def get_user_context_with_user(
    current_user: User = Depends(get_current_user)
) -> UserContext:
    """
    Create a user context object with full user data for the current authenticated user.
    
    Args:
        current_user: The authenticated User object
        
    Returns:
        UserContext object containing user information and full user data
    """
    return UserContext(user_id=current_user.id, user=current_user)


def verify_position_ownership(
    position: Position,
    user_context: UserContext
) -> None:
    """
    Verify that a position belongs to the current user.
    
    Args:
        position: The position to verify
        user_context: The current user context
        
    Raises:
        AuthorizationException: If position doesn't belong to the user
    """
    if position.user_id != user_context.user_id:
        raise AuthorizationException(
            detail="Access denied to this position",
            resource_type="Position"
        )


def verify_interview_ownership(
    interview: Interview,
    position: Position,
    user_context: UserContext
) -> None:
    """
    Verify that an interview belongs to the current user through its position.
    
    Args:
        interview: The interview to verify
        position: The position associated with the interview
        user_context: The current user context
        
    Raises:
        AuthorizationException: If interview doesn't belong to the user
    """
    if position.user_id != user_context.user_id:
        raise AuthorizationException(
            detail="Access denied to this interview",
            resource_type="Interview"
        )
    
    if interview.position_id != position.id:
        raise AuthorizationException(
            detail="Interview does not belong to the specified position",
            resource_type="Interview"
        )


class AuthorizationService:
    """
    Service class for centralized authorization logic.
    
    Provides methods for checking user permissions and enforcing
    data isolation rules across the application.
    """
    
    def __init__(self, db: Session):
        self.db = db
    
    def can_access_position(self, position_id: UUID, user_id: UUID) -> bool:
        """
        Check if a user can access a specific position.
        
        Args:
            position_id: The position ID to check
            user_id: The user ID to verify
            
        Returns:
            True if user can access the position, False otherwise
        """
        position = self.db.query(Position).filter(
            Position.id == position_id,
            Position.user_id == user_id
        ).first()
        return position is not None
    
    def can_access_interview(self, interview_id: UUID, user_id: UUID) -> bool:
        """
        Check if a user can access a specific interview.
        
        Args:
            interview_id: The interview ID to check
            user_id: The user ID to verify
            
        Returns:
            True if user can access the interview, False otherwise
        """
        interview = self.db.query(Interview).join(Position).filter(
            Interview.id == interview_id,
            Position.user_id == user_id
        ).first()
        return interview is not None
    
    def get_user_position(self, position_id: UUID, user_id: UUID) -> Optional[Position]:
        """
        Get a position if it belongs to the user.
        
        Args:
            position_id: The position ID to retrieve
            user_id: The user ID to verify ownership
            
        Returns:
            The Position object if it belongs to the user, None otherwise
        """
        return self.db.query(Position).filter(
            Position.id == position_id,
            Position.user_id == user_id
        ).first()
    
    def get_user_interview(self, interview_id: UUID, user_id: UUID) -> Optional[tuple[Interview, Position]]:
        """
        Get an interview and its position if they belong to the user.
        
        Args:
            interview_id: The interview ID to retrieve
            user_id: The user ID to verify ownership
            
        Returns:
            Tuple of (Interview, Position) if they belong to the user, None otherwise
        """
        result = self.db.query(Interview, Position).join(Position).filter(
            Interview.id == interview_id,
            Position.user_id == user_id
        ).first()
        
        if result:
            return result[0], result[1]  # interview, position
        return None


def get_authorization_service(db: Session = Depends(get_db)) -> AuthorizationService:
    """
    Dependency to get authorization service instance.
    
    Args:
        db: Database session
        
    Returns:
        AuthorizationService instance
    """
    return AuthorizationService(db)


# Middleware function to inject user context into request state
async def user_context_middleware(request: Request, call_next):
    """
    Middleware to inject user context into request state.
    
    This middleware attempts to extract user information from the request
    and makes it available throughout the request lifecycle.
    
    Args:
        request: The incoming request
        call_next: The next middleware/handler in the chain
        
    Returns:
        The response from the next handler
    """
    # Initialize user context as None
    request.state.user_context = None
    
    # Try to extract user context from authorization header
    authorization = request.headers.get("Authorization")
    if authorization and authorization.startswith("Bearer "):
        try:
            from .auth import get_user_id_from_token
            token = authorization.split(" ")[1]
            user_id_str = get_user_id_from_token(token)
            if user_id_str:
                user_id = UUID(user_id_str)
                request.state.user_context = UserContext(user_id=user_id)
        except (ValueError, TypeError):
            # Invalid token or user ID, leave context as None
            pass
    
    # Process the request
    response = await call_next(request)
    return response


def get_request_user_context(request: Request) -> Optional[UserContext]:
    """
    Get user context from request state.
    
    Args:
        request: The current request
        
    Returns:
        UserContext if available, None otherwise
    """
    try:
        return getattr(request.state, 'user_context', None)
    except AttributeError:
        # Request has no state attribute
        return None