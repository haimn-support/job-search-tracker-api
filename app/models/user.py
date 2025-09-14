"""
User model for authentication and user management.
"""
from sqlalchemy import Column, String
from sqlalchemy.orm import relationship
from .base import BaseModel


class User(BaseModel):
    """User model for storing user account information."""
    
    __tablename__ = "users"
    
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    first_name = Column(String(100), nullable=True)
    last_name = Column(String(100), nullable=True)
    
    # Relationships
    positions = relationship("Position", back_populates="user", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<User(id={self.id}, email={self.email})>"