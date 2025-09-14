"""
Interview management API endpoints.
"""
from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..core.dependencies import get_current_user_id
from ..repositories.interview_repository import InterviewRepository
from ..repositories.position_repository import PositionRepository
from ..schemas.interview import (
    InterviewCreate,
    InterviewUpdate,
    InterviewResponse,
    InterviewListResponse,
    InterviewScheduleUpdate,
    InterviewNotesUpdate,
    InterviewOutcomeUpdate
)
from ..models.position import PositionStatus
from ..models.interview import InterviewOutcome


router = APIRouter(tags=["interviews"])


def get_interview_repository(db: Session = Depends(get_db)) -> InterviewRepository:
    """Dependency to get interview repository instance."""
    return InterviewRepository(db)


def get_position_repository(db: Session = Depends(get_db)) -> PositionRepository:
    """Dependency to get position repository instance."""
    return PositionRepository(db)


@router.post("/positions/{position_id}/interviews", response_model=InterviewResponse, status_code=status.HTTP_201_CREATED)
async def create_interview(
    position_id: UUID,
    interview_data: InterviewCreate,
    current_user_id: UUID = Depends(get_current_user_id),
    interview_repo: InterviewRepository = Depends(get_interview_repository),
    position_repo: PositionRepository = Depends(get_position_repository)
):
    """
    Create a new interview for a position.
    
    Creates a new interview record for the specified position if it exists and belongs to the authenticated user.
    """
    # Verify position exists and belongs to user
    position = position_repo.get_by_id(position_id, current_user_id)
    if not position:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Position not found"
        )
    
    try:
        interview = interview_repo.create(position_id, interview_data)
        return InterviewResponse.model_validate(interview)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create interview: {str(e)}"
        )


@router.get("/positions/{position_id}/interviews", response_model=InterviewListResponse)
async def list_interviews(
    position_id: UUID,
    current_user_id: UUID = Depends(get_current_user_id),
    interview_repo: InterviewRepository = Depends(get_interview_repository),
    position_repo: PositionRepository = Depends(get_position_repository)
):
    """
    List all interviews for a position.
    
    Returns all interview records for the specified position if it exists and belongs to the authenticated user.
    Interviews are ordered by scheduled date.
    """
    # Verify position exists and belongs to user
    position = position_repo.get_by_id(position_id, current_user_id)
    if not position:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Position not found"
        )
    
    try:
        interviews = interview_repo.get_by_position(position_id)
        return InterviewListResponse(
            interviews=[InterviewResponse.model_validate(interview) for interview in interviews],
            total=len(interviews)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to retrieve interviews: {str(e)}"
        )


@router.get("/interviews/{interview_id}", response_model=InterviewResponse)
async def get_interview(
    interview_id: UUID,
    current_user_id: UUID = Depends(get_current_user_id),
    interview_repo: InterviewRepository = Depends(get_interview_repository),
    position_repo: PositionRepository = Depends(get_position_repository)
):
    """
    Get a specific interview by ID.
    
    Returns the interview details if it exists and its associated position belongs to the authenticated user.
    """
    interview = interview_repo.get_by_id(interview_id)
    if not interview:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview not found"
        )
    
    # Verify the interview's position belongs to the user
    position = position_repo.get_by_id(interview.position_id, current_user_id)
    if not position:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview not found"
        )
    
    return InterviewResponse.model_validate(interview)


@router.put("/interviews/{interview_id}", response_model=InterviewResponse)
async def update_interview(
    interview_id: UUID,
    interview_data: InterviewUpdate,
    current_user_id: UUID = Depends(get_current_user_id),
    interview_repo: InterviewRepository = Depends(get_interview_repository),
    position_repo: PositionRepository = Depends(get_position_repository)
):
    """
    Update a specific interview.
    
    Updates the interview with the provided data if it exists and its associated position belongs to the authenticated user.
    Only provided fields will be updated.
    """
    interview = interview_repo.get_by_id(interview_id)
    if not interview:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview not found"
        )
    
    # Verify the interview's position belongs to the user
    position = position_repo.get_by_id(interview.position_id, current_user_id)
    if not position:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview not found"
        )
    
    try:
        updated_interview = interview_repo.update(interview_id, interview_data)
        if not updated_interview:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Interview not found"
            )
        
        return InterviewResponse.model_validate(updated_interview)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to update interview: {str(e)}"
        )


@router.delete("/interviews/{interview_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_interview(
    interview_id: UUID,
    current_user_id: UUID = Depends(get_current_user_id),
    interview_repo: InterviewRepository = Depends(get_interview_repository),
    position_repo: PositionRepository = Depends(get_position_repository)
):
    """
    Delete a specific interview.
    
    Deletes the interview if it exists and its associated position belongs to the authenticated user.
    """
    interview = interview_repo.get_by_id(interview_id)
    if not interview:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview not found"
        )
    
    # Verify the interview's position belongs to the user
    position = position_repo.get_by_id(interview.position_id, current_user_id)
    if not position:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview not found"
        )
    
    success = interview_repo.delete(interview_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview not found"
        )


@router.put("/interviews/{interview_id}/schedule", response_model=InterviewResponse)
async def update_interview_schedule(
    interview_id: UUID,
    schedule_data: InterviewScheduleUpdate,
    current_user_id: UUID = Depends(get_current_user_id),
    interview_repo: InterviewRepository = Depends(get_interview_repository),
    position_repo: PositionRepository = Depends(get_position_repository)
):
    """
    Update the scheduled date of a specific interview.
    
    Updates only the scheduled date of the interview if it exists and its associated position belongs to the authenticated user.
    """
    interview = interview_repo.get_by_id(interview_id)
    if not interview:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview not found"
        )
    
    # Verify the interview's position belongs to the user
    position = position_repo.get_by_id(interview.position_id, current_user_id)
    if not position:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview not found"
        )
    
    try:
        # Create an InterviewUpdate with only the scheduled_date
        update_data = InterviewUpdate(scheduled_date=schedule_data.scheduled_date)
        updated_interview = interview_repo.update(interview_id, update_data)
        if not updated_interview:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Interview not found"
            )
        
        return InterviewResponse.model_validate(updated_interview)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to update interview schedule: {str(e)}"
        )


@router.put("/interviews/{interview_id}/notes", response_model=InterviewResponse)
async def update_interview_notes(
    interview_id: UUID,
    notes_data: InterviewNotesUpdate,
    current_user_id: UUID = Depends(get_current_user_id),
    interview_repo: InterviewRepository = Depends(get_interview_repository),
    position_repo: PositionRepository = Depends(get_position_repository)
):
    """
    Update the notes of a specific interview.
    
    Updates only the notes of the interview if it exists and its associated position belongs to the authenticated user.
    """
    interview = interview_repo.get_by_id(interview_id)
    if not interview:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview not found"
        )
    
    # Verify the interview's position belongs to the user
    position = position_repo.get_by_id(interview.position_id, current_user_id)
    if not position:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview not found"
        )
    
    try:
        # Create an InterviewUpdate with only the notes
        update_data = InterviewUpdate(notes=notes_data.notes)
        updated_interview = interview_repo.update(interview_id, update_data)
        if not updated_interview:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Interview not found"
            )
        
        return InterviewResponse.model_validate(updated_interview)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to update interview notes: {str(e)}"
        )


@router.put("/interviews/{interview_id}/outcome", response_model=InterviewResponse)
async def update_interview_outcome(
    interview_id: UUID,
    outcome_data: InterviewOutcomeUpdate,
    current_user_id: UUID = Depends(get_current_user_id),
    interview_repo: InterviewRepository = Depends(get_interview_repository),
    position_repo: PositionRepository = Depends(get_position_repository)
):
    """
    Update the outcome of a specific interview.
    
    Updates only the outcome of the interview if it exists and its associated position belongs to the authenticated user.
    If the outcome is 'failed', the associated position status will be updated to 'rejected'.
    """
    interview = interview_repo.get_by_id(interview_id)
    if not interview:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview not found"
        )
    
    # Verify the interview's position belongs to the user
    position = position_repo.get_by_id(interview.position_id, current_user_id)
    if not position:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview not found"
        )
    
    try:
        # Create an InterviewUpdate with only the outcome
        update_data = InterviewUpdate(outcome=outcome_data.outcome)
        updated_interview = interview_repo.update(interview_id, update_data)
        if not updated_interview:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Interview not found"
            )
        
        # If outcome is failed, update position status to rejected
        if outcome_data.outcome == InterviewOutcome.FAILED:
            position_repo.update_status(interview.position_id, current_user_id, PositionStatus.REJECTED)
        
        return InterviewResponse.model_validate(updated_interview)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to update interview outcome: {str(e)}"
        )