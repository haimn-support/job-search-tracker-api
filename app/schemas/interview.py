"""
Pydantic schemas for interview-related operations.
"""
from pydantic import BaseModel, Field, field_validator, ConfigDict
from uuid import UUID
from datetime import datetime
from typing import Optional
from .enums import InterviewType, InterviewPlace, InterviewOutcome


class InterviewBase(BaseModel):
    """Base interview schema with common fields."""
    type: InterviewType = Field(..., description="Type of interview")
    place: InterviewPlace = Field(..., description="Format/location of interview")
    scheduled_date: datetime = Field(..., description="Scheduled date and time of interview")
    duration_minutes: Optional[int] = Field(None, ge=1, le=480, description="Interview duration in minutes")
    notes: Optional[str] = Field(None, description="Additional notes about the interview")
    outcome: InterviewOutcome = Field(default=InterviewOutcome.PENDING, description="Interview outcome")

    @field_validator('scheduled_date')
    @classmethod
    def validate_scheduled_date(cls, v):
        """Validate that scheduled date is not in the past (allowing some buffer for timezone differences)."""
        # Note: In production, you might want to be more lenient or handle timezones properly
        return v

    @field_validator('duration_minutes')
    @classmethod
    def validate_duration(cls, v):
        """Validate duration is reasonable if provided."""
        if v is not None and v <= 0:
            raise ValueError('Duration must be positive')
        return v


class InterviewCreate(InterviewBase):
    """Schema for creating a new interview."""
    pass


class InterviewUpdate(BaseModel):
    """Schema for updating an existing interview."""
    type: Optional[InterviewType] = Field(None, description="Type of interview")
    place: Optional[InterviewPlace] = Field(None, description="Format/location of interview")
    scheduled_date: Optional[datetime] = Field(None, description="Scheduled date and time of interview")
    duration_minutes: Optional[int] = Field(None, ge=1, le=480, description="Interview duration in minutes")
    notes: Optional[str] = Field(None, description="Additional notes about the interview")
    outcome: Optional[InterviewOutcome] = Field(None, description="Interview outcome")

    @field_validator('scheduled_date')
    @classmethod
    def validate_scheduled_date(cls, v):
        """Validate that scheduled date is not in the past if provided."""
        if v is not None:
            # Note: In production, you might want to be more lenient or handle timezones properly
            pass
        return v

    @field_validator('duration_minutes')
    @classmethod
    def validate_duration(cls, v):
        """Validate duration is reasonable if provided."""
        if v is not None and v <= 0:
            raise ValueError('Duration must be positive')
        return v


class InterviewResponse(InterviewBase):
    """Schema for interview response data."""
    id: UUID = Field(..., description="Interview unique identifier")
    position_id: UUID = Field(..., description="Associated position identifier")
    created_at: datetime = Field(..., description="Interview creation timestamp")
    updated_at: datetime = Field(..., description="Interview last update timestamp")

    model_config = ConfigDict(from_attributes=True)


class InterviewListResponse(BaseModel):
    """Schema for interview list response."""
    interviews: list[InterviewResponse] = Field(..., description="List of interviews")
    total: int = Field(..., description="Total number of interviews")