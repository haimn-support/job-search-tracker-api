"""
Position management API endpoints.
"""
from typing import List, Optional
from uuid import UUID
from datetime import date
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..core.dependencies import get_current_user_id
from ..core.exceptions import ResourceNotFoundException, DatabaseException, ValidationException
from ..repositories.position_repository import PositionRepository
from ..schemas.position import (
    PositionCreate,
    PositionUpdate,
    PositionStatusUpdate,
    PositionResponse,
    PositionListResponse
)
from ..schemas.enums import PositionStatus


router = APIRouter(prefix="/positions", tags=["Positions"])


def get_position_repository(db: Session = Depends(get_db)) -> PositionRepository:
    """Dependency to get position repository instance."""
    return PositionRepository(db)


@router.post(
    "/", 
    response_model=PositionResponse, 
    status_code=201,
    summary="Create a new job position",
    description="Create a new job position to track in your application process.",
    responses={
        201: {
            "description": "Position successfully created",
            "content": {
                "application/json": {
                    "example": {
                        "id": "123e4567-e89b-12d3-a456-426614174000",
                        "title": "Senior Software Engineer",
                        "company": "TechCorp",
                        "description": "Full-stack development with React and Python",
                        "location": "San Francisco, CA",
                        "salary_range": "$120k - $180k",
                        "status": "applied",
                        "application_date": "2024-01-15",
                        "created_at": "2024-01-15T10:30:00Z",
                        "updated_at": "2024-01-15T10:30:00Z",
                        "interviews": []
                    }
                }
            }
        },
        401: {"description": "Authentication required"},
        422: {"description": "Validation error"}
    }
)
async def create_position(
    position_data: PositionCreate,
    current_user_id: UUID = Depends(get_current_user_id),
    position_repo: PositionRepository = Depends(get_position_repository)
):
    """
    Create a new job position.
    
    Creates a new position record for the authenticated user with the provided details.
    All fields except description, location, and salary_range are required.
    
    **Example Request:**
    ```json
    {
        "title": "Senior Software Engineer",
        "company": "TechCorp",
        "description": "Full-stack development with React and Python",
        "location": "San Francisco, CA",
        "salary_range": "$120k - $180k",
        "status": "applied",
        "application_date": "2024-01-15"
    }
    ```
    """
    try:
        position = position_repo.create(current_user_id, position_data)
        return PositionResponse.model_validate(position)
    except Exception as e:
        raise DatabaseException(
            detail="Failed to create position",
            operation="position_creation"
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
        raise DatabaseException(
            detail="Failed to retrieve positions",
            operation="position_listing"
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
        raise ResourceNotFoundException(
            resource_type="Position",
            resource_id=str(position_id)
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
        raise ResourceNotFoundException(
            resource_type="Position",
            resource_id=str(position_id)
        )
    
    return PositionResponse.model_validate(position)


@router.put("/{position_id}/status", response_model=PositionResponse)
async def update_position_status(
    position_id: UUID,
    status_data: PositionStatusUpdate,
    current_user_id: UUID = Depends(get_current_user_id),
    position_repo: PositionRepository = Depends(get_position_repository)
):
    """
    Update the status of a specific position.
    
    Updates only the status field of the position if it exists and belongs to the authenticated user.
    This is a convenient endpoint for quick status updates without needing to send all position data.
    """
    position = position_repo.update_status(position_id, current_user_id, status_data.status)
    if not position:
        raise ResourceNotFoundException(
            resource_type="Position",
            resource_id=str(position_id)
        )
    
    return PositionResponse.model_validate(position)


@router.delete("/{position_id}", status_code=204)
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
        raise ResourceNotFoundException(
            resource_type="Position",
            resource_id=str(position_id)
        )