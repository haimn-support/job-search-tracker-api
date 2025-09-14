"""
Common Pydantic schemas used across the application.
"""
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, Any, Dict


class ErrorDetail(BaseModel):
    """Schema for error details."""
    code: str = Field(..., description="Error code")
    message: str = Field(..., description="Human readable error message")
    details: Optional[str] = Field(None, description="Additional error details")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Error timestamp")


class ValidationErrorDetail(BaseModel):
    """Schema for validation error details."""
    field: str = Field(..., description="Field that failed validation")
    message: str = Field(..., description="Validation error message")
    value: Optional[Any] = Field(None, description="Invalid value that was provided")


class ValidationErrorResponse(BaseModel):
    """Schema for validation error response."""
    error: str = Field(default="Validation Error", description="Error type")
    message: str = Field(default="Request validation failed", description="Error message")
    details: list[ValidationErrorDetail] = Field(..., description="List of validation errors")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Error timestamp")


class PaginationParams(BaseModel):
    """Schema for pagination parameters."""
    page: int = Field(default=1, ge=1, description="Page number (1-based)")
    per_page: int = Field(default=20, ge=1, le=100, description="Items per page (max 100)")


class FilterParams(BaseModel):
    """Schema for common filtering parameters."""
    search: Optional[str] = Field(None, max_length=255, description="Search term")
    sort_by: Optional[str] = Field(None, description="Field to sort by")
    sort_order: Optional[str] = Field(default="asc", pattern="^(asc|desc)$", description="Sort order")


class SuccessResponse(BaseModel):
    """Schema for success response."""
    message: str = Field(..., description="Success message")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Response timestamp")


class HealthCheckResponse(BaseModel):
    """Schema for health check response."""
    status: str = Field(..., description="Service status")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Check timestamp")
    database: str = Field(..., description="Database connection status")
    version: str = Field(..., description="API version")