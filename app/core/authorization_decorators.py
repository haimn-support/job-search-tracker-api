"""
Authorization decorators for enhanced security and data isolation.
"""
from functools import wraps
from typing import Callable, Any
from uuid import UUID
from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session
from .database import get_db
from .authorization import UserContext, get_user_context, AuthorizationService
from .exceptions import AuthorizationException, ResourceNotFoundException


def require_position_ownership(position_id_param: str = "position_id"):
    """
    Decorator to ensure the current user owns the specified position.
    
    Args:
        position_id_param: Name of the parameter containing the position ID
        
    Returns:
        Decorator function
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Extract position_id from kwargs
            position_id = kwargs.get(position_id_param)
            if not position_id:
                raise ValueError(f"Parameter '{position_id_param}' not found in function arguments")
            
            # Get user context and authorization service from dependencies
            user_context = None
            auth_service = None
            db = None
            
            # Look for dependencies in kwargs
            for key, value in kwargs.items():
                if isinstance(value, UserContext):
                    user_context = value
                elif isinstance(value, AuthorizationService):
                    auth_service = value
                elif isinstance(value, Session):
                    db = value
            
            # If we don't have auth_service, create one from db
            if not auth_service and db:
                auth_service = AuthorizationService(db)
            
            if not user_context or not auth_service:
                raise ValueError("Required dependencies (UserContext, AuthorizationService) not found")
            
            # Check if user can access the position
            if not auth_service.can_access_position(position_id, user_context.user_id):
                raise AuthorizationException(
                    detail=f"Access denied to position {position_id}",
                    resource_type="Position"
                )
            
            return await func(*args, **kwargs)
        return wrapper
    return decorator


def require_interview_ownership(interview_id_param: str = "interview_id"):
    """
    Decorator to ensure the current user owns the specified interview.
    
    Args:
        interview_id_param: Name of the parameter containing the interview ID
        
    Returns:
        Decorator function
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Extract interview_id from kwargs
            interview_id = kwargs.get(interview_id_param)
            if not interview_id:
                raise ValueError(f"Parameter '{interview_id_param}' not found in function arguments")
            
            # Get user context and authorization service from dependencies
            user_context = None
            auth_service = None
            db = None
            
            # Look for dependencies in kwargs
            for key, value in kwargs.items():
                if isinstance(value, UserContext):
                    user_context = value
                elif isinstance(value, AuthorizationService):
                    auth_service = value
                elif isinstance(value, Session):
                    db = value
            
            # If we don't have auth_service, create one from db
            if not auth_service and db:
                auth_service = AuthorizationService(db)
            
            if not user_context or not auth_service:
                raise ValueError("Required dependencies (UserContext, AuthorizationService) not found")
            
            # Check if user can access the interview
            if not auth_service.can_access_interview(interview_id, user_context.user_id):
                raise AuthorizationException(
                    detail=f"Access denied to interview {interview_id}",
                    resource_type="Interview"
                )
            
            return await func(*args, **kwargs)
        return wrapper
    return decorator


def require_resource_ownership(resource_type: str, resource_id_param: str):
    """
    Generic decorator to ensure the current user owns the specified resource.
    
    Args:
        resource_type: Type of resource (e.g., "Position", "Interview")
        resource_id_param: Name of the parameter containing the resource ID
        
    Returns:
        Decorator function
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Extract resource_id from kwargs
            resource_id = kwargs.get(resource_id_param)
            if not resource_id:
                raise ValueError(f"Parameter '{resource_id_param}' not found in function arguments")
            
            # Get user context and authorization service from dependencies
            user_context = None
            auth_service = None
            db = None
            
            # Look for dependencies in kwargs
            for key, value in kwargs.items():
                if isinstance(value, UserContext):
                    user_context = value
                elif isinstance(value, AuthorizationService):
                    auth_service = value
                elif isinstance(value, Session):
                    db = value
            
            # If we don't have auth_service, create one from db
            if not auth_service and db:
                auth_service = AuthorizationService(db)
            
            if not user_context or not auth_service:
                raise ValueError("Required dependencies (UserContext, AuthorizationService) not found")
            
            # Check ownership based on resource type
            can_access = False
            if resource_type.lower() == "position":
                can_access = auth_service.can_access_position(resource_id, user_context.user_id)
            elif resource_type.lower() == "interview":
                can_access = auth_service.can_access_interview(resource_id, user_context.user_id)
            
            if not can_access:
                raise AuthorizationException(
                    detail=f"Access denied to {resource_type.lower()} {resource_id}",
                    resource_type=resource_type
                )
            
            return await func(*args, **kwargs)
        return wrapper
    return decorator


# Dependency functions for enhanced authorization
async def require_authenticated_user(
    user_context: UserContext = Depends(get_user_context)
) -> UserContext:
    """
    Dependency that ensures a user is authenticated.
    
    Args:
        user_context: The user context from authentication
        
    Returns:
        The user context if authenticated
        
    Raises:
        AuthorizationException: If user is not authenticated
    """
    if not user_context or not user_context.user_id:
        raise AuthorizationException(detail="Authentication required")
    return user_context


async def get_owned_position(
    position_id: UUID,
    user_context: UserContext = Depends(get_user_context),
    auth_service: AuthorizationService = Depends(AuthorizationService)
):
    """
    Dependency that gets a position and ensures the user owns it.
    
    Args:
        position_id: The position ID to retrieve
        user_context: The current user context
        auth_service: The authorization service
        
    Returns:
        The Position object if owned by the user
        
    Raises:
        ResourceNotFoundException: If position not found
        AuthorizationException: If user doesn't own the position
    """
    position = auth_service.get_user_position(position_id, user_context.user_id)
    if not position:
        raise ResourceNotFoundException(
            resource_type="Position",
            resource_id=str(position_id)
        )
    return position


async def get_owned_interview(
    interview_id: UUID,
    user_context: UserContext = Depends(get_user_context),
    auth_service: AuthorizationService = Depends(AuthorizationService)
):
    """
    Dependency that gets an interview and ensures the user owns it.
    
    Args:
        interview_id: The interview ID to retrieve
        user_context: The current user context
        auth_service: The authorization service
        
    Returns:
        Tuple of (Interview, Position) if owned by the user
        
    Raises:
        ResourceNotFoundException: If interview not found
        AuthorizationException: If user doesn't own the interview
    """
    result = auth_service.get_user_interview(interview_id, user_context.user_id)
    if not result:
        raise ResourceNotFoundException(
            resource_type="Interview",
            resource_id=str(interview_id)
        )
    return result  # (interview, position)