"""
Pydantic schemas for position-related operations.
"""
from pydantic import BaseModel, Field, ConfigDict
from uuid import UUID
from datetime import datetime, date
from typing import Optional, List
from .enums import PositionStatus


class PositionBase(BaseModel):
    """Base position schema with common fields."""
    title: str = Field(..., max_length=255, description="Job position title")
    company: str = Field(..., max_length=255, description="Company name")
    description: Optional[str] = Field(None, description="Job description")
    location: Optional[str] = Field(None, max_length=255, description="Job location")
    salary_range: Optional[str] = Field(None, max_length=100, description="Salary range")
    status: PositionStatus = Field(default=PositionStatus.APPLIED, description="Application status")
    application_date: date = Field(..., description="Date when application was submitted")


class PositionCreate(PositionBase):
    """Schema for creating a new position."""
    pass


class PositionUpdate(BaseModel):
    """Schema for updating an existing position."""
    title: Optional[str] = Field(None, max_length=255, description="Job position title")
    company: Optional[str] = Field(None, max_length=255, description="Company name")
    description: Optional[str] = Field(None, description="Job description")
    location: Optional[str] = Field(None, max_length=255, description="Job location")
    salary_range: Optional[str] = Field(None, max_length=100, description="Salary range")
    status: Optional[PositionStatus] = Field(None, description="Application status")
    application_date: Optional[date] = Field(None, description="Date when application was submitted")


class PositionResponse(PositionBase):
    """Schema for position response data."""
    id: UUID = Field(..., description="Position unique identifier")
    user_id: UUID = Field(..., description="Owner user identifier")
    created_at: datetime = Field(..., description="Position creation timestamp")
    updated_at: datetime = Field(..., description="Position last update timestamp")
    interviews: List['InterviewResponse'] = Field(default=[], description="Associated interviews")

    model_config = ConfigDict(from_attributes=True)


class PositionListResponse(BaseModel):
    """Schema for paginated position list response."""
    positions: List[PositionResponse] = Field(..., description="List of positions")
    total: int = Field(..., description="Total number of positions")
    page: int = Field(..., description="Current page number")
    per_page: int = Field(..., description="Number of items per page")
    has_next: bool = Field(..., description="Whether there are more pages")
    has_prev: bool = Field(..., description="Whether there are previous pages")


# Forward reference resolution
from .interview import InterviewResponse
PositionResponse.model_rebuild()