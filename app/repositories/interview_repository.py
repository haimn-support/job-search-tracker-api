"""
Repository layer for interview data access operations.
"""
from typing import List, Optional
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import and_, desc, asc
from ..models.interview import Interview
from ..schemas.interview import InterviewCreate, InterviewUpdate


class InterviewRepository:
    """Repository for interview data access operations."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create(self, position_id: UUID, interview_data: InterviewCreate) -> Interview:
        """
        Create a new interview for a position.
        
        Args:
            position_id: The ID of the position this interview belongs to
            interview_data: Interview creation data
            
        Returns:
            The created Interview object
        """
        db_interview = Interview(
            position_id=position_id,
            **interview_data.model_dump()
        )
        self.db.add(db_interview)
        self.db.commit()
        self.db.refresh(db_interview)
        return db_interview
    
    def get_by_id(self, interview_id: UUID) -> Optional[Interview]:
        """
        Get an interview by ID.
        
        Args:
            interview_id: The interview ID to retrieve
            
        Returns:
            The Interview object if found, None otherwise
        """
        return self.db.query(Interview).filter(Interview.id == interview_id).first()
    
    def get_by_position(self, position_id: UUID) -> List[Interview]:
        """
        Get all interviews for a specific position.
        
        Args:
            position_id: The position ID to get interviews for
            
        Returns:
            List of Interview objects ordered by scheduled date
        """
        return self.db.query(Interview).filter(
            Interview.position_id == position_id
        ).order_by(asc(Interview.scheduled_date)).all()
    
    def update(self, interview_id: UUID, interview_data: InterviewUpdate) -> Optional[Interview]:
        """
        Update an interview.
        
        Args:
            interview_id: The interview ID to update
            interview_data: Interview update data
            
        Returns:
            The updated Interview object if found, None otherwise
        """
        db_interview = self.get_by_id(interview_id)
        if not db_interview:
            return None
        
        # Update only provided fields
        update_data = interview_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_interview, field, value)
        
        self.db.commit()
        self.db.refresh(db_interview)
        return db_interview
    
    def delete(self, interview_id: UUID) -> bool:
        """
        Delete an interview.
        
        Args:
            interview_id: The interview ID to delete
            
        Returns:
            True if interview was deleted, False if not found
        """
        db_interview = self.get_by_id(interview_id)
        if not db_interview:
            return False
        
        self.db.delete(db_interview)
        self.db.commit()
        return True
    
    def exists(self, interview_id: UUID) -> bool:
        """
        Check if an interview exists.
        
        Args:
            interview_id: The interview ID to check
            
        Returns:
            True if interview exists, False otherwise
        """
        return self.db.query(Interview).filter(Interview.id == interview_id).first() is not None
    
    def get_by_id_and_position(self, interview_id: UUID, position_id: UUID) -> Optional[Interview]:
        """
        Get an interview by ID, ensuring it belongs to the specified position.
        
        Args:
            interview_id: The interview ID to retrieve
            position_id: The position ID to verify ownership
            
        Returns:
            The Interview object if found and belongs to position, None otherwise
        """
        return self.db.query(Interview).filter(
            and_(Interview.id == interview_id, Interview.position_id == position_id)
        ).first()