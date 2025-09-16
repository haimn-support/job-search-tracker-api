"""
Integration tests for authorization and data isolation.
"""
import pytest
from uuid import uuid4
from datetime import date, datetime
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.core.auth import create_access_token
from app.models.user import User
from app.models.position import Position
from app.models.interview import Interview
from app.schemas.enums import PositionStatus, InterviewType, InterviewPlace, InterviewOutcome


client = TestClient(app)


class TestDataIsolation:
    """Test data isolation between users."""
    
    @pytest.fixture
    def user1(self, db_session: Session) -> User:
        """Create first test user."""
        user = User(
            email="user1@example.com",
            password_hash="hashed_password_1",
            first_name="User",
            last_name="One"
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
        return user
    
    @pytest.fixture
    def user2(self, db_session: Session) -> User:
        """Create second test user."""
        user = User(
            email="user2@example.com",
            password_hash="hashed_password_2",
            first_name="User",
            last_name="Two"
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
        return user
    
    @pytest.fixture
    def user1_position(self, db_session: Session, user1: User) -> Position:
        """Create a position for user1."""
        position = Position(
            user_id=user1.id,
            title="Software Engineer",
            company="Company A",
            description="A great position",
            status=PositionStatus.APPLIED,
            application_date=date(2024, 1, 1)
        )
        db_session.add(position)
        db_session.commit()
        db_session.refresh(position)
        return position
    
    @pytest.fixture
    def user2_position(self, db_session: Session, user2: User) -> Position:
        """Create a position for user2."""
        position = Position(
            user_id=user2.id,
            title="Data Scientist",
            company="Company B",
            description="Another great position",
            status=PositionStatus.APPLIED,
            application_date=date(2024, 1, 2)
        )
        db_session.add(position)
        db_session.commit()
        db_session.refresh(position)
        return position
    
    @pytest.fixture
    def user1_interview(self, db_session: Session, user1_position: Position) -> Interview:
        """Create an interview for user1's position."""
        interview = Interview(
            position_id=user1_position.id,
            type=InterviewType.TECHNICAL,
            place=InterviewPlace.VIDEO,
            scheduled_date=datetime(2024, 1, 15, 10, 0, 0),
            duration_minutes=60,
            notes="Technical interview",
            outcome=InterviewOutcome.PENDING
        )
        db_session.add(interview)
        db_session.commit()
        db_session.refresh(interview)
        return interview
    
    @pytest.fixture
    def user1_headers(self, user1: User) -> dict:
        """Create authentication headers for user1."""
        token = create_access_token(data={"sub": str(user1.id)})
        return {"Authorization": f"Bearer {token}"}
    
    @pytest.fixture
    def user2_headers(self, user2: User) -> dict:
        """Create authentication headers for user2."""
        token = create_access_token(data={"sub": str(user2.id)})
        return {"Authorization": f"Bearer {token}"}
    
    def test_user_cannot_access_other_user_positions(
        self, user1_position: Position, user2_headers: dict
    ):
        """Test that user2 cannot access user1's position."""
        response = client.get(
            f"/api/v1/positions/{user1_position.id}",
            headers=user2_headers
        )
        
        assert response.status_code == 404  # Position not found for this user
    
    def test_user_cannot_list_other_user_positions(
        self, user1_position: Position, user2_position: Position, 
        user1_headers: dict, user2_headers: dict
    ):
        """Test that users only see their own positions in listings."""
        # User1 should only see their position
        response1 = client.get("/api/v1/positions/", headers=user1_headers)
        assert response1.status_code == 200
        data1 = response1.json()
        assert data1["total"] == 1
        assert data1["positions"][0]["id"] == str(user1_position.id)
        
        # User2 should only see their position
        response2 = client.get("/api/v1/positions/", headers=user2_headers)
        assert response2.status_code == 200
        data2 = response2.json()
        assert data2["total"] == 1
        assert data2["positions"][0]["id"] == str(user2_position.id)
    
    def test_user_cannot_update_other_user_position(
        self, user1_position: Position, user2_headers: dict
    ):
        """Test that user2 cannot update user1's position."""
        update_data = {
            "title": "Updated Title",
            "company": "Updated Company"
        }
        
        response = client.put(
            f"/api/v1/positions/{user1_position.id}",
            json=update_data,
            headers=user2_headers
        )
        
        assert response.status_code == 404  # Position not found for this user
    
    def test_user_cannot_delete_other_user_position(
        self, user1_position: Position, user2_headers: dict
    ):
        """Test that user2 cannot delete user1's position."""
        response = client.delete(
            f"/api/v1/positions/{user1_position.id}",
            headers=user2_headers
        )
        
        assert response.status_code == 404  # Position not found for this user
    
    def test_user_cannot_access_other_user_interviews(
        self, user1_interview: Interview, user2_headers: dict
    ):
        """Test that user2 cannot access user1's interview."""
        response = client.get(
            f"/api/v1/interviews/{user1_interview.id}",
            headers=user2_headers
        )
        
        assert response.status_code == 404  # Interview not found for this user
    
    def test_user_cannot_create_interview_for_other_user_position(
        self, user1_position: Position, user2_headers: dict
    ):
        """Test that user2 cannot create interview for user1's position."""
        interview_data = {
            "type": "technical",
            "place": "video",
            "scheduled_date": "2024-01-20T14:00:00",
            "duration_minutes": 45,
            "notes": "Follow-up interview"
        }
        
        response = client.post(
            f"/api/v1/positions/{user1_position.id}/interviews",
            json=interview_data,
            headers=user2_headers
        )
        
        assert response.status_code == 404  # Position not found for this user
    
    def test_user_cannot_update_other_user_interview(
        self, user1_interview: Interview, user2_headers: dict
    ):
        """Test that user2 cannot update user1's interview."""
        update_data = {
            "notes": "Updated notes",
            "outcome": "passed"
        }
        
        response = client.put(
            f"/api/v1/interviews/{user1_interview.id}",
            json=update_data,
            headers=user2_headers
        )
        
        assert response.status_code == 404  # Interview not found for this user
    
    def test_user_cannot_delete_other_user_interview(
        self, user1_interview: Interview, user2_headers: dict
    ):
        """Test that user2 cannot delete user1's interview."""
        response = client.delete(
            f"/api/v1/interviews/{user1_interview.id}",
            headers=user2_headers
        )
        
        assert response.status_code == 404  # Interview not found for this user
    
    def test_statistics_are_user_specific(
        self, user1_position: Position, user2_position: Position,
        user1_headers: dict, user2_headers: dict
    ):
        """Test that statistics are isolated per user."""
        # Get statistics for user1
        response1 = client.get("/api/v1/statistics/overview", headers=user1_headers)
        assert response1.status_code == 200
        stats1 = response1.json()
        
        # Get statistics for user2
        response2 = client.get("/api/v1/statistics/overview", headers=user2_headers)
        assert response2.status_code == 200
        stats2 = response2.json()
        
        # Each user should have their own statistics
        assert stats1["total_applications"] == 1
        assert stats2["total_applications"] == 1
        
        # Statistics should be different (different companies)
        assert stats1["companies"][0]["company"] != stats2["companies"][0]["company"]


class TestAuthorizationEdgeCases:
    """Test edge cases for authorization."""
    
    @pytest.fixture
    def test_user(self, db_session: Session) -> User:
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
    def auth_headers(self, test_user: User) -> dict:
        """Create authentication headers."""
        token = create_access_token(data={"sub": str(test_user.id)})
        return {"Authorization": f"Bearer {token}"}
    
    def test_access_nonexistent_position(self, auth_headers: dict):
        """Test accessing a position that doesn't exist."""
        fake_id = uuid4()
        response = client.get(f"/api/v1/positions/{fake_id}", headers=auth_headers)
        assert response.status_code == 404
    
    def test_access_nonexistent_interview(self, auth_headers: dict):
        """Test accessing an interview that doesn't exist."""
        fake_id = uuid4()
        response = client.get(f"/api/v1/interviews/{fake_id}", headers=auth_headers)
        assert response.status_code == 404
    
    def test_invalid_uuid_in_position_endpoint(self, auth_headers: dict):
        """Test accessing position endpoint with invalid UUID."""
        response = client.get("/api/v1/positions/invalid-uuid", headers=auth_headers)
        assert response.status_code == 422  # Validation error
    
    def test_invalid_uuid_in_interview_endpoint(self, auth_headers: dict):
        """Test accessing interview endpoint with invalid UUID."""
        response = client.get("/api/v1/interviews/invalid-uuid", headers=auth_headers)
        assert response.status_code == 422  # Validation error
    
    def test_expired_token_access(self, test_user: User):
        """Test accessing endpoints with expired token."""
        # Create an expired token (expires immediately)
        from datetime import timedelta
        token = create_access_token(
            data={"sub": str(test_user.id)}, 
            expires_delta=timedelta(seconds=-1)
        )
        headers = {"Authorization": f"Bearer {token}"}
        
        response = client.get("/api/v1/positions/", headers=headers)
        assert response.status_code == 401  # Unauthorized
    
    def test_malformed_token_access(self):
        """Test accessing endpoints with malformed token."""
        headers = {"Authorization": "Bearer malformed.token.here"}
        
        response = client.get("/api/v1/positions/", headers=headers)
        assert response.status_code == 401  # Unauthorized
    
    def test_missing_bearer_prefix(self, test_user: User):
        """Test accessing endpoints without Bearer prefix."""
        token = create_access_token(data={"sub": str(test_user.id)})
        headers = {"Authorization": token}  # Missing "Bearer " prefix
        
        response = client.get("/api/v1/positions/", headers=headers)
        assert response.status_code == 403  # Forbidden (no credentials)
    
    def test_empty_authorization_header(self):
        """Test accessing endpoints with empty authorization header."""
        headers = {"Authorization": ""}
        
        response = client.get("/api/v1/positions/", headers=headers)
        assert response.status_code == 403  # Forbidden (no credentials)


class TestCascadingAuthorization:
    """Test authorization for related resources."""
    
    @pytest.fixture
    def test_user(self, db_session: Session) -> User:
        """Create a test user."""
        user = User(
            email="cascade@example.com",
            password_hash="hashed_password",
            first_name="Cascade",
            last_name="User"
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
        return user
    
    @pytest.fixture
    def other_user(self, db_session: Session) -> User:
        """Create another test user."""
        user = User(
            email="other@example.com",
            password_hash="hashed_password",
            first_name="Other",
            last_name="User"
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
        return user
    
    @pytest.fixture
    def test_position(self, db_session: Session, test_user: User) -> Position:
        """Create a test position."""
        position = Position(
            user_id=test_user.id,
            title="Test Position",
            company="Test Company",
            status=PositionStatus.APPLIED,
            application_date=date(2024, 1, 1)
        )
        db_session.add(position)
        db_session.commit()
        db_session.refresh(position)
        return position
    
    @pytest.fixture
    def other_position(self, db_session: Session, other_user: User) -> Position:
        """Create a position for the other user."""
        position = Position(
            user_id=other_user.id,
            title="Other Position",
            company="Other Company",
            status=PositionStatus.APPLIED,
            application_date=date(2024, 1, 1)
        )
        db_session.add(position)
        db_session.commit()
        db_session.refresh(position)
        return position
    
    @pytest.fixture
    def test_interview(self, db_session: Session, test_position: Position) -> Interview:
        """Create a test interview."""
        interview = Interview(
            position_id=test_position.id,
            type=InterviewType.TECHNICAL,
            place=InterviewPlace.VIDEO,
            scheduled_date=datetime(2024, 1, 15, 10, 0, 0),
            outcome=InterviewOutcome.PENDING
        )
        db_session.add(interview)
        db_session.commit()
        db_session.refresh(interview)
        return interview
    
    @pytest.fixture
    def auth_headers(self, test_user: User) -> dict:
        """Create authentication headers for test user."""
        token = create_access_token(data={"sub": str(test_user.id)})
        return {"Authorization": f"Bearer {token}"}
    
    @pytest.fixture
    def other_headers(self, other_user: User) -> dict:
        """Create authentication headers for other user."""
        token = create_access_token(data={"sub": str(other_user.id)})
        return {"Authorization": f"Bearer {token}"}
    
    def test_list_interviews_for_owned_position(
        self, test_position: Position, test_interview: Interview, auth_headers: dict
    ):
        """Test listing interviews for a position owned by the user."""
        response = client.get(
            f"/api/v1/positions/{test_position.id}/interviews",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1
        assert data["interviews"][0]["id"] == str(test_interview.id)
    
    def test_list_interviews_for_other_user_position(
        self, other_position: Position, other_headers: dict
    ):
        """Test listing interviews for a position owned by another user."""
        response = client.get(
            f"/api/v1/positions/{other_position.id}/interviews",
            headers=other_headers
        )
        
        # Should succeed but return empty list since it's the other user's position
        # but accessed with other user's credentials
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 0
    
    def test_list_interviews_for_other_user_position_wrong_auth(
        self, other_position: Position, auth_headers: dict
    ):
        """Test listing interviews for another user's position with wrong auth."""
        response = client.get(
            f"/api/v1/positions/{other_position.id}/interviews",
            headers=auth_headers
        )
        
        # Should fail because position doesn't belong to authenticated user
        assert response.status_code == 404
    
    def test_create_interview_for_other_user_position(
        self, other_position: Position, auth_headers: dict
    ):
        """Test creating interview for another user's position."""
        interview_data = {
            "type": "technical",
            "place": "video",
            "scheduled_date": "2024-01-20T14:00:00"
        }
        
        response = client.post(
            f"/api/v1/positions/{other_position.id}/interviews",
            json=interview_data,
            headers=auth_headers
        )
        
        # Should fail because position doesn't belong to authenticated user
        assert response.status_code == 404