"""
Custom exception classes for the Interview Position Tracker API.

This module defines custom exceptions that provide more specific error handling
and better error messages for different types of failures in the application.
"""
from typing import Any, Dict, Optional
from fastapi import HTTPException, status


class BaseAPIException(HTTPException):
    """
    Base exception class for all API-related exceptions.
    
    Provides a consistent structure for error responses with additional
    context and error codes.
    """
    
    def __init__(
        self,
        status_code: int,
        detail: str,
        error_code: str,
        headers: Optional[Dict[str, Any]] = None,
        context: Optional[Dict[str, Any]] = None
    ):
        super().__init__(status_code=status_code, detail=detail, headers=headers)
        self.error_code = error_code
        self.context = context or {}


class ValidationException(BaseAPIException):
    """
    Exception raised when request validation fails.
    
    Used for input validation errors, schema validation failures,
    and other data validation issues.
    """
    
    def __init__(
        self,
        detail: str = "Validation failed",
        field_errors: Optional[Dict[str, str]] = None,
        context: Optional[Dict[str, Any]] = None
    ):
        super().__init__(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=detail,
            error_code="VALIDATION_ERROR",
            context=context
        )
        self.field_errors = field_errors or {}


class ResourceNotFoundException(BaseAPIException):
    """
    Exception raised when a requested resource is not found.
    
    Used for 404 errors when positions, interviews, or users are not found.
    """
    
    def __init__(
        self,
        resource_type: str,
        resource_id: Optional[str] = None,
        detail: Optional[str] = None
    ):
        if not detail:
            if resource_id:
                detail = f"{resource_type} with ID '{resource_id}' not found"
            else:
                detail = f"{resource_type} not found"
        
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=detail,
            error_code="RESOURCE_NOT_FOUND",
            context={"resource_type": resource_type, "resource_id": resource_id}
        )


class AuthenticationException(BaseAPIException):
    """
    Exception raised when authentication fails.
    
    Used for invalid credentials, expired tokens, and other auth-related errors.
    """
    
    def __init__(
        self,
        detail: str = "Authentication failed",
        headers: Optional[Dict[str, Any]] = None
    ):
        auth_headers = {"WWW-Authenticate": "Bearer"}
        if headers:
            auth_headers.update(headers)
        
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            error_code="AUTHENTICATION_ERROR",
            headers=auth_headers
        )


class AuthorizationException(BaseAPIException):
    """
    Exception raised when authorization fails.
    
    Used when a user tries to access resources they don't have permission for.
    """
    
    def __init__(
        self,
        detail: str = "Access denied",
        resource_type: Optional[str] = None
    ):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=detail,
            error_code="AUTHORIZATION_ERROR",
            context={"resource_type": resource_type}
        )


class ConflictException(BaseAPIException):
    """
    Exception raised when a resource conflict occurs.
    
    Used for duplicate email registration, conflicting updates, etc.
    """
    
    def __init__(
        self,
        detail: str = "Resource conflict",
        resource_type: Optional[str] = None
    ):
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            detail=detail,
            error_code="RESOURCE_CONFLICT",
            context={"resource_type": resource_type}
        )


class DatabaseException(BaseAPIException):
    """
    Exception raised when database operations fail.
    
    Used for database connection errors, transaction failures, etc.
    """
    
    def __init__(
        self,
        detail: str = "Database operation failed",
        operation: Optional[str] = None
    ):
        super().__init__(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=detail,
            error_code="DATABASE_ERROR",
            context={"operation": operation}
        )


class BusinessLogicException(BaseAPIException):
    """
    Exception raised when business logic validation fails.
    
    Used for domain-specific validation errors that aren't simple input validation.
    """
    
    def __init__(
        self,
        detail: str,
        rule: Optional[str] = None
    ):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=detail,
            error_code="BUSINESS_LOGIC_ERROR",
            context={"rule": rule}
        )


class ExternalServiceException(BaseAPIException):
    """
    Exception raised when external service calls fail.
    
    Used for third-party API failures, cloud service errors, etc.
    """
    
    def __init__(
        self,
        detail: str = "External service unavailable",
        service_name: Optional[str] = None
    ):
        super().__init__(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=detail,
            error_code="EXTERNAL_SERVICE_ERROR",
            context={"service_name": service_name}
        )


class RateLimitException(BaseAPIException):
    """
    Exception raised when rate limits are exceeded.
    
    Used for API rate limiting and abuse prevention.
    """
    
    def __init__(
        self,
        detail: str = "Rate limit exceeded",
        retry_after: Optional[int] = None
    ):
        headers = {}
        if retry_after:
            headers["Retry-After"] = str(retry_after)
        
        super().__init__(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=detail,
            error_code="RATE_LIMIT_ERROR",
            headers=headers,
            context={"retry_after": retry_after}
        )