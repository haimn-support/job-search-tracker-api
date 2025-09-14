"""
Interview model for tracking interview stages.
"""
from sqlalchemy import Column, String, Text, DateTime, Integer, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from enum import Enum
from .base import BaseModel


class InterviewType(str, Enum):
    """Enum for interview types."""
    TECHNICAL = "technical"
    BEHAVIORAL = "behavioral"
    HR = "hr"
    FINAL = "final"


class InterviewPlace(str, Enum):
    """Enum for interview places/formats."""
    PHONE = "phone"
    VIDEO = "video"
    ONSITE = "onsite"


class InterviewOutcome(str, Enum):
    """Enum for interview outcomes."""
    PENDING = "pending"
    PASSED = "passed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class Interview(BaseModel):
    """Interview model for storing interview stage information."""
    
    __tablename__ = "interviews"
    
    position_id = Column(UUID(as_uuid=True), ForeignKey("positions.id", ondelete="CASCADE"), nullable=False, index=True)
    type = Column(
        SQLEnum(InterviewType, name="interview_type"),
        nullable=False
    )
    place = Column(
        SQLEnum(InterviewPlace, name="interview_place"),
        nullable=False
    )
    scheduled_date = Column(DateTime(timezone=True), nullable=False, index=True)
    duration_minutes = Column(Integer, nullable=True)
    notes = Column(Text, nullable=True)
    outcome = Column(
        SQLEnum(InterviewOutcome, name="interview_outcome"),
        default=InterviewOutcome.PENDING,
        nullable=False
    )
    
    # Relationships
    position = relationship("Position", back_populates="interviews")
    
    def __repr__(self):
        return f"<Interview(id={self.id}, type={self.type.value}, place={self.place.value}, outcome={self.outcome.value}, scheduled_date={self.scheduled_date})>"