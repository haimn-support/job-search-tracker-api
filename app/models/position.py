"""
Position model for tracking job applications.
"""
from sqlalchemy import Column, String, Text, Date, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from enum import Enum
from .base import BaseModel


class PositionStatus(str, Enum):
    """Enum for position application status."""
    APPLIED = "applied"
    SCREENING = "screening"
    INTERVIEWING = "interviewing"
    OFFER = "offer"
    REJECTED = "rejected"
    WITHDRAWN = "withdrawn"


class Position(BaseModel):
    """Position model for storing job application information."""
    
    __tablename__ = "positions"
    
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    company = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    location = Column(String(255), nullable=True)
    salary_range = Column(String(100), nullable=True)
    status = Column(
        SQLEnum(PositionStatus, name="position_status"),
        default=PositionStatus.APPLIED,
        nullable=False,
        index=True
    )
    application_date = Column(Date, nullable=False, index=True)
    
    # Relationships
    user = relationship("User", back_populates="positions")
    interviews = relationship("Interview", back_populates="position", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Position(id={self.id}, title={self.title}, company={self.company}, status={self.status.value})>"