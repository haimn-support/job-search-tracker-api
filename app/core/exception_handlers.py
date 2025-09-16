"""
Global exception handlers for the Interview Position Tracker API.

This module provides centralized exception handling to ensure consistent
error responses across the entire application.
"""
import logging
from datetime import datetime
from typing import Dict, Any
from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
from pydantic import ValidationError

from .exceptions import BaseAPIException, DatabaseException, ValidationException

# Configure logger
logger = logging.getLogger(__name__)


def create_error_response(
    error_code: str,
    message: str,
    status_code: int,
    details: Dict[str, Any] = None,
    field_errors: Dict[str, str] = None
) -> JSONResponse:
    """
    Create a standardized error response.
    
    Args:
        error_code: Unique error code for the error type
        message: Human-readable error message
        status_code: HTTP status code
        details: Additional error details
        field_errors: Field-specific validation errors
        
    Returns:
        JSONResponse with standardized error format
    """
    error_data = {
        "error": {
            "code": error_code,
            "message": message,
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
    }
    
    if details:
        error_data["error"]["details"] = details
    
    if field_errors:
        error_data["error"]["field_errors"] = field_errors
    
    return JSONResponse(
        status_code=status_code,
        content=error_data
    )


async def base_api_exception_handler(request: Request, exc: BaseAPIException) -> JSONResponse:
    """
    Handle custom BaseAPIException and its subclasses.
    
    Args:
        request: The FastAPI request object
        exc: The BaseAPIException instance
        
    Returns:
        JSONResponse with standardized error format
    """
    logger.warning(
        f"API Exception: {exc.error_code} - {exc.detail}",
        extra={
            "error_code": exc.error_code,
            "status_code": exc.status_code,
            "context": exc.context,
            "path": request.url.path,
            "method": request.method
        }
    )
    
    field_errors = None
    if isinstance(exc, ValidationException):
        field_errors = exc.field_errors
    
    return create_error_response(
        error_code=exc.error_code,
        message=exc.detail,
        status_code=exc.status_code,
        details=exc.context,
        field_errors=field_errors
    )


async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    """
    Handle standard FastAPI HTTPException.
    
    Args:
        request: The FastAPI request object
        exc: The HTTPException instance
        
    Returns:
        JSONResponse with standardized error format
    """
    logger.warning(
        f"HTTP Exception: {exc.status_code} - {exc.detail}",
        extra={
            "status_code": exc.status_code,
            "path": request.url.path,
            "method": request.method
        }
    )
    
    # Map common HTTP status codes to error codes
    error_code_map = {
        400: "BAD_REQUEST",
        401: "UNAUTHORIZED",
        403: "FORBIDDEN",
        404: "NOT_FOUND",
        405: "METHOD_NOT_ALLOWED",
        409: "CONFLICT",
        422: "VALIDATION_ERROR",
        429: "RATE_LIMIT_ERROR",
        500: "INTERNAL_SERVER_ERROR",
        502: "BAD_GATEWAY",
        503: "SERVICE_UNAVAILABLE",
        504: "GATEWAY_TIMEOUT"
    }
    
    error_code = error_code_map.get(exc.status_code, "HTTP_ERROR")
    
    return create_error_response(
        error_code=error_code,
        message=exc.detail,
        status_code=exc.status_code
    )


async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """
    Handle FastAPI request validation errors.
    
    Args:
        request: The FastAPI request object
        exc: The RequestValidationError instance
        
    Returns:
        JSONResponse with standardized error format including field-specific errors
    """
    logger.warning(
        f"Validation Error: {len(exc.errors())} validation errors",
        extra={
            "errors": exc.errors(),
            "path": request.url.path,
            "method": request.method
        }
    )
    
    # Format field errors for better user experience
    field_errors = {}
    for error in exc.errors():
        field_path = " -> ".join(str(loc) for loc in error["loc"][1:])  # Skip 'body' prefix
        error_msg = error["msg"]
        error_type = error["type"]
        
        # Customize error messages for better UX
        if error_type == "missing":
            error_msg = "This field is required"
        elif error_type == "string_too_short":
            error_msg = f"Must be at least {error.get('ctx', {}).get('limit_value', 'N/A')} characters"
        elif error_type == "string_too_long":
            error_msg = f"Must be no more than {error.get('ctx', {}).get('limit_value', 'N/A')} characters"
        elif error_type == "value_error.email":
            error_msg = "Must be a valid email address"
        elif error_type == "type_error.integer":
            error_msg = "Must be a valid integer"
        elif error_type == "type_error.float":
            error_msg = "Must be a valid number"
        elif error_type == "value_error.datetime":
            error_msg = "Must be a valid date and time"
        elif error_type == "value_error.date":
            error_msg = "Must be a valid date"
        elif error_type == "value_error.uuid":
            error_msg = "Must be a valid UUID"
        
        field_errors[field_path or "root"] = error_msg
    
    return create_error_response(
        error_code="VALIDATION_ERROR",
        message="Request validation failed",
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        field_errors=field_errors
    )


async def pydantic_validation_exception_handler(request: Request, exc: ValidationError) -> JSONResponse:
    """
    Handle Pydantic validation errors.
    
    Args:
        request: The FastAPI request object
        exc: The ValidationError instance
        
    Returns:
        JSONResponse with standardized error format
    """
    logger.warning(
        f"Pydantic Validation Error: {len(exc.errors())} validation errors",
        extra={
            "errors": exc.errors(),
            "path": request.url.path,
            "method": request.method
        }
    )
    
    # Format field errors similar to RequestValidationError
    field_errors = {}
    for error in exc.errors():
        field_path = " -> ".join(str(loc) for loc in error["loc"])
        field_errors[field_path] = error["msg"]
    
    return create_error_response(
        error_code="VALIDATION_ERROR",
        message="Data validation failed",
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        field_errors=field_errors
    )


async def sqlalchemy_exception_handler(request: Request, exc: SQLAlchemyError) -> JSONResponse:
    """
    Handle SQLAlchemy database errors.
    
    Args:
        request: The FastAPI request object
        exc: The SQLAlchemyError instance
        
    Returns:
        JSONResponse with standardized error format
    """
    logger.error(
        f"Database Error: {type(exc).__name__} - {str(exc)}",
        extra={
            "exception_type": type(exc).__name__,
            "path": request.url.path,
            "method": request.method
        },
        exc_info=True
    )
    
    # Handle specific SQLAlchemy errors
    if isinstance(exc, IntegrityError):
        # Check for common integrity constraint violations
        error_msg = str(exc.orig) if hasattr(exc, 'orig') else str(exc)
        
        if "unique constraint" in error_msg.lower() or "duplicate" in error_msg.lower():
            return create_error_response(
                error_code="RESOURCE_CONFLICT",
                message="A resource with this information already exists",
                status_code=status.HTTP_409_CONFLICT
            )
        elif "foreign key constraint" in error_msg.lower():
            return create_error_response(
                error_code="INVALID_REFERENCE",
                message="Referenced resource does not exist",
                status_code=status.HTTP_400_BAD_REQUEST
            )
        elif "not null constraint" in error_msg.lower():
            return create_error_response(
                error_code="VALIDATION_ERROR",
                message="Required field is missing",
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY
            )
    
    # Generic database error
    return create_error_response(
        error_code="DATABASE_ERROR",
        message="A database error occurred",
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
    )


async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """
    Handle any unhandled exceptions.
    
    Args:
        request: The FastAPI request object
        exc: The Exception instance
        
    Returns:
        JSONResponse with standardized error format
    """
    logger.error(
        f"Unhandled Exception: {type(exc).__name__} - {str(exc)}",
        extra={
            "exception_type": type(exc).__name__,
            "path": request.url.path,
            "method": request.method
        },
        exc_info=True
    )
    
    return create_error_response(
        error_code="INTERNAL_SERVER_ERROR",
        message="An unexpected error occurred",
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
    )