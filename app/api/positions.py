"""
Position management API endpoints.
"""
from typing import List, Optional
from uuid import UUID
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..core.dependencies import get_current_user_id
from ..repositories.position_repository import PositionRepository
from ..schemas.position import (
    PositionCreate,
    PositionUpdate,
    PositionResponse,
    PositionListResponse
)
from ..schemas.enums import PositionStatus


router = APIRouter(prefix="/positions", tags=["positions"])


def get_position_repository(db: Session = Depends(get_db)) -> PositionRepository:
    """Dependency to get position repository instance."""
    return PositionRepository(db)


@router.post("/", response_model=PositionResponse, status_code=status.HTTP_201_CREATED)
async def create_position(
    position_data: PositionCreate,
    current_user_id: UUID = Depends(get_current_user_id),
    position_repo: PositionRepository = Depends(get_position_repository)
):
    """
    Create a new job position.
    
    Creates a new position record for the authenticated user with the provided details.
    """
    try:
        position = position_repo.create(current_user_id, position_data)
        return PositionResponse.model_validate(position)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create position: {str(e)}"
        )


@router.get("/", response_model=PositionListResponse)
async def list_positions(
    status_filter: Optional[PositionStatus] = Query(None, alias="status", description="Filter by position status"),
    company: Optional[str] = Query(None, description="Filter by company name (partial match)"),
    date_from: Optional[date] = Query(None, description="Filter positions from this application date"),
    date_to: Optional[date] = Query(None, description="Filter positions up to this application date"),
    search: Optional[str] = Query(None, description="Search in title, company, or description"),
    sort_by: str = Query("application_date", description="Field to sort by"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$", description="Sort order: asc or desc"),
    page: int = Query(1, ge=1, description="Page number (1-based)"),
    per_page: int = Query(20, ge=1, le=100, description="Number of items per page"),
    current_user_id: UUID = Depends(get_current_user_id),
    position_repo: PositionRepository = Depends(get_position_repository)
):
    """
    List all positions for the authenticated user.
    
    Supports filtering by status, company, date range, and search terms.
    Results are paginated and can be sorted by various fields.
    """
    # Calculate skip value for pagination
    skip = (page - 1) * per_page
    
    try:
        positions, total = position_repo.get_all_for_user(
            user_id=current_user_id,
            status=status_filter,
            company=company,
            date_from=date_from,
            date_to=date_to,
            search=search,
            sort_by=sort_by,
            sort_order=sort_order,
            skip=skip,
            limit=per_page
        )
        
        # Calculate pagination metadata
        total_pages = (total + per_page - 1) // per_page
        has_next = page < total_pages
        has_prev = page > 1
        
        return PositionListResponse(
            positions=[PositionResponse.model_validate(pos) for pos in positions],
            total=total,
            page=page,
            per_page=per_page,
            has_next=has_next,
            has_prev=has_prev
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to retrieve positions: {str(e)}"
        )


@router.get("/{position_id}", response_model=PositionResponse)
async def get_position(
    position_id: UUID,
    current_user_id: UUID = Depends(get_current_user_id),
    position_repo: PositionRepository = Depends(get_position_repository)
):
    """
    Get a specific position by ID.
    
    Returns the position details if it exists and belongs to the authenticated user.
    """
    position = position_repo.get_by_id(position_id, current_user_id)
    if not position:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Position not found"
        )
    
    return PositionResponse.model_validate(position)


@router.put("/{position_id}", response_model=PositionResponse)
async def update_position(
    position_id: UUID,
    position_data: PositionUpdate,
    current_user_id: UUID = Depends(get_current_user_id),
    position_repo: PositionRepository = Depends(get_position_repository)
):
    """
    Update a specific position.
    
    Updates the position with the provided data if it exists and belongs to the authenticated user.
    Only provided fields will be updated.
    """
    position = position_repo.update(position_id, current_user_id, position_data)
    if not position:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Position not found"
        )
    
    return PositionResponse.model_validate(position)


@router.delete("/{position_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_position(
    position_id: UUID,
    current_user_id: UUID = Depends(get_current_user_id),
    position_repo: PositionRepository = Depends(get_position_repository)
):
    """
    Delete a specific position.
    
    Deletes the position and all associated interview records if it exists and belongs to the authenticated user.
    """
    success = position_repo.delete(position_id, current_user_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Position not found"
        )