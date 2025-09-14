"""
Repository layer for position data access operations.
"""
from typing import List, Optional
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc, asc
from datetime import date
from ..models.position import Position, PositionStatus
from ..schemas.position import PositionCreate, PositionUpdate


class PositionRepository:
    """Repository for position data access operations."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create(self, user_id: UUID, position_data: PositionCreate) -> Position:
        """
        Create a new position for a user.
        
        Args:
            user_id: The ID of the user creating the position
            position_data: Position creation data
            
        Returns:
            The created Position object
        """
        db_position = Position(
            user_id=user_id,
            **position_data.model_dump()
        )
        self.db.add(db_position)
        self.db.commit()
        self.db.refresh(db_position)
        return db_position
    
    def get_by_id(self, position_id: UUID, user_id: UUID) -> Optional[Position]:
        """
        Get a position by ID, ensuring it belongs to the specified user.
        
        Args:
            position_id: The position ID to retrieve
            user_id: The user ID to verify ownership
            
        Returns:
            The Position object if found and owned by user, None otherwise
        """
        return self.db.query(Position).filter(
            and_(Position.id == position_id, Position.user_id == user_id)
        ).first()
    
    def get_all_for_user(
        self,
        user_id: UUID,
        status: Optional[PositionStatus] = None,
        company: Optional[str] = None,
        date_from: Optional[date] = None,
        date_to: Optional[date] = None,
        search: Optional[str] = None,
        sort_by: str = "application_date",
        sort_order: str = "desc",
        skip: int = 0,
        limit: int = 100
    ) -> tuple[List[Position], int]:
        """
        Get all positions for a user with optional filtering, sorting, and pagination.
        
        Args:
            user_id: The user ID to get positions for
            status: Optional status filter
            company: Optional company name filter
            date_from: Optional start date filter
            date_to: Optional end date filter
            search: Optional search term for title or company
            sort_by: Field to sort by (default: application_date)
            sort_order: Sort order - 'asc' or 'desc' (default: desc)
            skip: Number of records to skip for pagination
            limit: Maximum number of records to return
            
        Returns:
            Tuple of (positions list, total count)
        """
        query = self.db.query(Position).filter(Position.user_id == user_id)
        
        # Apply filters
        if status:
            query = query.filter(Position.status == status)
        
        if company:
            query = query.filter(Position.company.ilike(f"%{company}%"))
        
        if date_from:
            query = query.filter(Position.application_date >= date_from)
        
        if date_to:
            query = query.filter(Position.application_date <= date_to)
        
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                or_(
                    Position.title.ilike(search_term),
                    Position.company.ilike(search_term),
                    Position.description.ilike(search_term)
                )
            )
        
        # Get total count before pagination
        total = query.count()
        
        # Apply sorting
        sort_column = getattr(Position, sort_by, Position.application_date)
        if sort_order.lower() == "asc":
            query = query.order_by(asc(sort_column))
        else:
            query = query.order_by(desc(sort_column))
        
        # Apply pagination
        positions = query.offset(skip).limit(limit).all()
        
        return positions, total
    
    def update(self, position_id: UUID, user_id: UUID, position_data: PositionUpdate) -> Optional[Position]:
        """
        Update a position, ensuring it belongs to the specified user.
        
        Args:
            position_id: The position ID to update
            user_id: The user ID to verify ownership
            position_data: Position update data
            
        Returns:
            The updated Position object if found and owned by user, None otherwise
        """
        db_position = self.get_by_id(position_id, user_id)
        if not db_position:
            return None
        
        # Update only provided fields
        update_data = position_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_position, field, value)
        
        self.db.commit()
        self.db.refresh(db_position)
        return db_position
    
    def update_status(self, position_id: UUID, user_id: UUID, status: PositionStatus) -> Optional[Position]:
        """
        Update only the status of a position, ensuring it belongs to the specified user.
        
        Args:
            position_id: The position ID to update
            user_id: The user ID to verify ownership
            status: New position status
            
        Returns:
            The updated Position object if found and owned by user, None otherwise
        """
        db_position = self.get_by_id(position_id, user_id)
        if not db_position:
            return None
        
        db_position.status = status
        self.db.commit()
        self.db.refresh(db_position)
        return db_position
    
    def delete(self, position_id: UUID, user_id: UUID) -> bool:
        """
        Delete a position, ensuring it belongs to the specified user.
        
        Args:
            position_id: The position ID to delete
            user_id: The user ID to verify ownership
            
        Returns:
            True if position was deleted, False if not found or not owned by user
        """
        db_position = self.get_by_id(position_id, user_id)
        if not db_position:
            return False
        
        self.db.delete(db_position)
        self.db.commit()
        return True
    
    def exists(self, position_id: UUID, user_id: UUID) -> bool:
        """
        Check if a position exists and belongs to the specified user.
        
        Args:
            position_id: The position ID to check
            user_id: The user ID to verify ownership
            
        Returns:
            True if position exists and is owned by user, False otherwise
        """
        return self.db.query(Position).filter(
            and_(Position.id == position_id, Position.user_id == user_id)
        ).first() is not None