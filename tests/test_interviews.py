"""
Tests for interview management functionality.
"""
import pytest
from datetime import datetime, date, timedelta
from uuid import uuid4
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.main import app
from app.core.database import get_db
from app.models.user import User
from app.models.position import Position, PositionStatus
from app.models.interview import Interview, InterviewType, InterviewPlace, InterviewOutcome
from app.repositories.interview_repository import InterviewRepository
from app.schemas.interview import InterviewCreate, InterviewUpdate
from app.core.auth import create_access_token
from .conftest import override_get_db


app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


@pytest.fixture
def test_user(db_session: Session):
    """Create a test user."""
    user = User(
        email="test@example.com",
        password_hash="hashed_password",
        first_name="Test",
        last_name="User"
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def test_position(db_session: Session, test_user: User):
    """Create a test position."""
    position = Position(
        user_id=test_user.id,
        title="Software Engineer",
        company="Test Company",
        description="Test position description",
        location="Remote",
        salary_range="$80k-$120k",
        status=PositionStatus.APPLIED,
        application_date=date.today()
    )
    db_session.add(position)
    db_session.commit()
    db_session.refresh(position)
    return position


@pytest.fixture
def test_interview(db_session: Session, test_position: Position):
    """Create a test interview."""
    interview = Interview(
        position_id=test_position.id,
        type=InterviewType.TECHNICAL,
        place=InterviewPlace.VIDEO,
        scheduled_date=datetime.now() + timedelta(days=1),
        duration_minutes=60,
        notes="Technical interview with the team",
        outcome=InterviewOutcome.PENDING
    )
    db_session.add(interview)
    db_session.commit()
    db_session.refresh(interview)
    return interview


@pytest.fixture
def auth_headers(test_user: User):
    """Create authentication headers for test user."""
    token = create_access_token(data={"sub": str(test_user.id)})
    return {"Authorization": f"Bearer {token}"}


class TestInterviewRepository:
    """Test interview repository operations."""
    
    def test_create_interview(self, db_session: Session, test_position: Position):
        """Test creating a new interview."""
        repo = InterviewRepository(db_session)
        interview_data = InterviewCreate(
            type=InterviewType.HR,
            place=InterviewPlace.PHONE,
            scheduled_date=datetime.now() + timedelta(days=2),
            duration_minutes=30,
            notes="HR screening call",
            outcome=InterviewOutcome.PENDING
        )
        
        interview = repo.create(test_position.id, interview_data)
        
        assert interview.id is not None
        assert interview.position_id == test_position.id
        assert interview.type == InterviewType.HR
        assert interview.place == InterviewPlace.PHONE
        assert interview.duration_minutes == 30
        assert interview.notes == "HR screening call"
        assert interview.outcome == InterviewOutcome.PENDING
    
    def test_get_by_id(self, db_session: Session, test_interview: Interview):
        """Test getting interview by ID."""
        repo = InterviewRepository(db_session)
        
        interview = repo.get_by_id(test_interview.id)
        
        assert interview is not None
        assert interview.id == test_interview.id
        assert interview.type == test_interview.type
    
    def test_get_by_position(self, db_session: Session, test_position: Position):
        """Test getting interviews by position."""
        repo = InterviewRepository(db_session)
        
        # Create multiple interviews
        interview1 = Interview(
            position_id=test_position.id,
            type=InterviewType.HR,
            place=InterviewPlace.PHONE,
            scheduled_date=datetime.now() + timedelta(days=1),
            outcome=InterviewOutcome.PENDING
        )
        interview2 = Interview(
            position_id=test_position.id,
            type=InterviewType.TECHNICAL,
            place=InterviewPlace.VIDEO,
            scheduled_date=datetime.now() + timedelta(days=2),
            outcome=InterviewOutcome.PENDING
        )
        
        db_session.add_all([interview1, interview2])
        db_session.commit()
        
        interviews = repo.get_by_position(test_position.id)
        
        assert len(interviews) == 2
        # Should be ordered by scheduled date
        assert interviews[0].scheduled_date < interviews[1].scheduled_date
    
    def test_update_interview(self, db_session: Session, test_interview: Interview):
        """Test updating an interview."""
        repo = InterviewRepository(db_session)
        update_data = InterviewUpdate(
            outcome=InterviewOutcome.PASSED,
            notes="Updated notes after interview"
        )
        
        updated_interview = repo.update(test_interview.id, update_data)
        
        assert updated_interview is not None
        assert updated_interview.outcome == InterviewOutcome.PASSED
        assert updated_interview.notes == "Updated notes after interview"
        # Other fields should remain unchanged
        assert updated_interview.type == test_interview.type
        assert updated_interview.place == test_interview.place
    
    def test_delete_interview(self, db_session: Session, test_interview: Interview):
        """Test deleting an interview."""
        repo = InterviewRepository(db_session)
        
        success = repo.delete(test_interview.id)
        
        assert success is True
        
        # Verify interview is deleted
        deleted_interview = repo.get_by_id(test_interview.id)
        assert deleted_interview is None
    
    def test_get_by_id_and_position(self, db_session: Session, test_interview: Interview, test_position: Position):
        """Test getting interview by ID and position."""
        repo = InterviewRepository(db_session)
        
        interview = repo.get_by_id_and_position(test_interview.id, test_position.id)
        
        assert interview is not None
        assert interview.id == test_interview.id
        assert interview.position_id == test_position.id
        
        # Test with wrong position ID
        wrong_position_id = uuid4()
        interview = repo.get_by_id_and_position(test_interview.id, wrong_position_id)
        assert interview is None


class TestInterviewAPI:
    """Test interview API endpoints."""
    
    def test_create_interview(self, db_session: Session, test_position: Position, auth_headers: dict):
        """Test creating interview via API."""
        interview_data = {
            "type": "technical",
            "place": "video",
            "scheduled_date": (datetime.now() + timedelta(days=1)).isoformat(),
            "duration_minutes": 60,
            "notes": "Technical interview",
            "outcome": "pending"
        }
        
        response = client.post(
            f"/api/v1/positions/{test_position.id}/interviews",
            json=interview_data,
            headers=auth_headers
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["type"] == "technical"
        assert data["place"] == "video"
        assert data["position_id"] == str(test_position.id)
        assert data["duration_minutes"] == 60
        assert data["notes"] == "Technical interview"
        assert data["outcome"] == "pending"
    
    def test_create_interview_invalid_position(self, auth_headers: dict):
        """Test creating interview for non-existent position."""
        interview_data = {
            "type": "technical",
            "place": "video",
            "scheduled_date": (datetime.now() + timedelta(days=1)).isoformat(),
            "outcome": "pending"
        }
        
        response = client.post(
            f"/api/v1/positions/{uuid4()}/interviews",
            json=interview_data,
            headers=auth_headers
        )
        
        assert response.status_code == 404
        assert "Position not found" in response.json()["detail"]
    
    def test_list_interviews(self, db_session: Session, test_position: Position, test_interview: Interview, auth_headers: dict):
        """Test listing interviews for a position."""
        response = client.get(
            f"/api/v1/positions/{test_position.id}/interviews",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1
        assert len(data["interviews"]) == 1
        assert data["interviews"][0]["id"] == str(test_interview.id)
    
    def test_get_interview(self, test_interview: Interview, auth_headers: dict):
        """Test getting specific interview."""
        response = client.get(
            f"/api/v1/interviews/{test_interview.id}",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == str(test_interview.id)
        assert data["type"] == test_interview.type.value
        assert data["place"] == test_interview.place.value
    
    def test_update_interview(self, test_interview: Interview, auth_headers: dict):
        """Test updating interview."""
        update_data = {
            "outcome": "passed",
            "notes": "Great interview, candidate performed well"
        }
        
        response = client.put(
            f"/api/v1/interviews/{test_interview.id}",
            json=update_data,
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["outcome"] == "passed"
        assert data["notes"] == "Great interview, candidate performed well"
    
    def test_delete_interview(self, test_interview: Interview, auth_headers: dict):
        """Test deleting interview."""
        response = client.delete(
            f"/api/v1/interviews/{test_interview.id}",
            headers=auth_headers
        )
        
        assert response.status_code == 204
        
        # Verify interview is deleted
        response = client.get(
            f"/api/v1/interviews/{test_interview.id}",
            headers=auth_headers
        )
        assert response.status_code == 404
    
    def test_unauthorized_access(self, test_interview: Interview):
        """Test accessing interviews without authentication."""
        response = client.get(f"/api/v1/interviews/{test_interview.id}")
        assert response.status_code == 403
    
    def test_access_other_user_interview(self, db_session: Session):
        """Test accessing interview belonging to another user."""
        # Create another user and position
        other_user = User(
            email="other@example.com",
            password_hash="hashed_password",
            first_name="Other",
            last_name="User"
        )
        db_session.add(other_user)
        db_session.commit()
        
        other_position = Position(
            user_id=other_user.id,
            title="Other Position",
            company="Other Company",
            application_date=date.today()
        )
        db_session.add(other_position)
        db_session.commit()
        
        other_interview = Interview(
            position_id=other_position.id,
            type=InterviewType.HR,
            place=InterviewPlace.PHONE,
            scheduled_date=datetime.now() + timedelta(days=1),
            outcome=InterviewOutcome.PENDING
        )
        db_session.add(other_interview)
        db_session.commit()
        
        # Try to access with different user's token
        test_user = User(
            email="test@example.com",
            password_hash="hashed_password",
            first_name="Test",
            last_name="User"
        )
        db_session.add(test_user)
        db_session.commit()
        
        token = create_access_token(data={"sub": str(test_user.id)})
        headers = {"Authorization": f"Bearer {token}"}
        
        response = client.get(
            f"/api/v1/interviews/{other_interview.id}",
            headers=headers
        )
        assert response.status_code == 404


class TestCascadeDelete:
    """Test cascade deletion when positions are removed."""
    
    def test_position_deletion_removes_interviews(self, db_session: Session, test_position: Position, test_interview: Interview, auth_headers: dict):
        """Test that deleting a position also deletes associated interviews."""
        # Verify interview exists
        response = client.get(
            f"/api/v1/interviews/{test_interview.id}",
            headers=auth_headers
        )
        assert response.status_code == 200
        
        # Delete the position
        response = client.delete(
            f"/api/v1/positions/{test_position.id}",
            headers=auth_headers
        )
        assert response.status_code == 204
        
        # Verify interview is also deleted
        interview_in_db = db_session.query(Interview).filter(Interview.id == test_interview.id).first()
        assert interview_in_db is None


class TestSpecificInterviewUpdates:
    """Test specific interview update endpoints."""
    
    def test_update_interview_schedule(self, test_interview: Interview, auth_headers: dict):
        """Test updating interview scheduled date only."""
        new_date = (datetime.now() + timedelta(days=3)).isoformat()
        schedule_data = {
            "scheduled_date": new_date
        }
        
        response = client.put(
            f"/api/v1/interviews/{test_interview.id}/schedule",
            json=schedule_data,
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["scheduled_date"] == new_date
        # Other fields should remain unchanged
        assert data["type"] == test_interview.type.value
        assert data["place"] == test_interview.place.value
        assert data["outcome"] == test_interview.outcome.value
    
    def test_update_interview_notes(self, test_interview: Interview, auth_headers: dict):
        """Test updating interview notes only."""
        notes_data = {
            "notes": "Updated notes after the interview discussion"
        }
        
        response = client.put(
            f"/api/v1/interviews/{test_interview.id}/notes",
            json=notes_data,
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["notes"] == "Updated notes after the interview discussion"
        # Other fields should remain unchanged
        assert data["type"] == test_interview.type.value
        assert data["place"] == test_interview.place.value
        assert data["outcome"] == test_interview.outcome.value
    
    def test_update_interview_outcome_passed(self, test_interview: Interview, auth_headers: dict):
        """Test updating interview outcome to passed."""
        outcome_data = {
            "outcome": "passed"
        }
        
        response = client.put(
            f"/api/v1/interviews/{test_interview.id}/outcome",
            json=outcome_data,
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["outcome"] == "passed"
        # Other fields should remain unchanged
        assert data["type"] == test_interview.type.value
        assert data["place"] == test_interview.place.value
    
    def test_update_interview_outcome_failed_updates_position_status(self, db_session: Session, test_position: Position, test_interview: Interview, auth_headers: dict):
        """Test updating interview outcome to failed updates position status to rejected."""
        # Verify initial position status
        assert test_position.status == PositionStatus.APPLIED
        
        outcome_data = {
            "outcome": "failed"
        }
        
        response = client.put(
            f"/api/v1/interviews/{test_interview.id}/outcome",
            json=outcome_data,
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["outcome"] == "failed"
        
        # Verify position status was updated to rejected
        db_session.refresh(test_position)
        assert test_position.status == PositionStatus.REJECTED
    
    def test_update_interview_schedule_invalid_interview(self, auth_headers: dict):
        """Test updating schedule for non-existent interview."""
        schedule_data = {
            "scheduled_date": (datetime.now() + timedelta(days=1)).isoformat()
        }
        
        response = client.put(
            f"/api/v1/interviews/{uuid4()}/schedule",
            json=schedule_data,
            headers=auth_headers
        )
        
        assert response.status_code == 404
        assert "Interview not found" in response.json()["detail"]
    
    def test_update_interview_notes_invalid_interview(self, auth_headers: dict):
        """Test updating notes for non-existent interview."""
        notes_data = {
            "notes": "Some notes"
        }
        
        response = client.put(
            f"/api/v1/interviews/{uuid4()}/notes",
            json=notes_data,
            headers=auth_headers
        )
        
        assert response.status_code == 404
        assert "Interview not found" in response.json()["detail"]
    
    def test_update_interview_outcome_invalid_interview(self, auth_headers: dict):
        """Test updating outcome for non-existent interview."""
        outcome_data = {
            "outcome": "passed"
        }
        
        response = client.put(
            f"/api/v1/interviews/{uuid4()}/outcome",
            json=outcome_data,
            headers=auth_headers
        )
        
        assert response.status_code == 404
        assert "Interview not found" in response.json()["detail"]
    
    def test_update_interview_schedule_unauthorized(self, test_interview: Interview):
        """Test updating interview schedule without authentication."""
        schedule_data = {
            "scheduled_date": (datetime.now() + timedelta(days=1)).isoformat()
        }
        
        response = client.put(
            f"/api/v1/interviews/{test_interview.id}/schedule",
            json=schedule_data
        )
        
        assert response.status_code == 403
    
    def test_update_interview_notes_unauthorized(self, test_interview: Interview):
        """Test updating interview notes without authentication."""
        notes_data = {
            "notes": "Some notes"
        }
        
        response = client.put(
            f"/api/v1/interviews/{test_interview.id}/notes",
            json=notes_data
        )
        
        assert response.status_code == 403
    
    def test_update_interview_outcome_unauthorized(self, test_interview: Interview):
        """Test updating interview outcome without authentication."""
        outcome_data = {
            "outcome": "passed"
        }
        
        response = client.put(
            f"/api/v1/interviews/{test_interview.id}/outcome",
            json=outcome_data
        )
        
        assert response.status_code == 403