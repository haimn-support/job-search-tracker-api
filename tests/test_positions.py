"""
Integration tests for position management endpoints.
"""
import pytest
from datetime import date, datetime
from uuid import uuid4
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.main import app
from app.core.database import get_db
from app.models.user import User
from app.models.position import Position, PositionStatus
from app.core.auth import create_access_token
from tests.conftest import TestingSessionLocal, override_get_db


# Override the database dependency
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
def auth_headers(test_user: User):
    """Create authentication headers for test user."""
    token = create_access_token(data={"sub": str(test_user.id)})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def test_position_data():
    """Sample position data for API testing (with string date)."""
    return {
        "title": "Senior Software Engineer",
        "company": "Tech Corp",
        "description": "Full-stack development role",
        "location": "San Francisco, CA",
        "salary_range": "$120k - $150k",
        "status": "applied",
        "application_date": "2024-01-15"
    }


@pytest.fixture
def test_position_db_data():
    """Sample position data for database testing (with Python date)."""
    return {
        "title": "Senior Software Engineer",
        "company": "Tech Corp",
        "description": "Full-stack development role",
        "location": "San Francisco, CA",
        "salary_range": "$120k - $150k",
        "status": "applied",
        "application_date": date(2024, 1, 15)
    }


@pytest.fixture
def created_position(db_session: Session, test_user: User, test_position_db_data: dict):
    """Create a test position in the database."""
    position = Position(
        user_id=test_user.id,
        **test_position_db_data
    )
    db_session.add(position)
    db_session.commit()
    db_session.refresh(position)
    return position


class TestCreatePosition:
    """Test cases for creating positions."""
    
    def test_create_position_success(self, auth_headers: dict, test_position_data: dict):
        """Test successful position creation."""
        response = client.post(
            "/api/v1/positions/",
            json=test_position_data,
            headers=auth_headers
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["title"] == test_position_data["title"]
        assert data["company"] == test_position_data["company"]
        assert data["status"] == test_position_data["status"]
        assert "id" in data
        assert "created_at" in data
        assert "updated_at" in data
    
    def test_create_position_missing_required_fields(self, auth_headers: dict):
        """Test position creation with missing required fields."""
        incomplete_data = {
            "title": "Software Engineer"
            # Missing company and application_date
        }
        
        response = client.post(
            "/api/v1/positions/",
            json=incomplete_data,
            headers=auth_headers
        )
        
        assert response.status_code == 422
    
    def test_create_position_invalid_status(self, auth_headers: dict, test_position_data: dict):
        """Test position creation with invalid status."""
        test_position_data["status"] = "invalid_status"
        
        response = client.post(
            "/api/v1/positions/",
            json=test_position_data,
            headers=auth_headers
        )
        
        assert response.status_code == 422
    
    def test_create_position_unauthorized(self, test_position_data: dict):
        """Test position creation without authentication."""
        response = client.post(
            "/api/v1/positions/",
            json=test_position_data
        )
        
        assert response.status_code == 403


class TestListPositions:
    """Test cases for listing positions."""
    
    def test_list_positions_empty(self, auth_headers: dict):
        """Test listing positions when none exist."""
        response = client.get("/api/v1/positions/", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["positions"] == []
        assert data["total"] == 0
        assert data["page"] == 1
        assert data["per_page"] == 20
        assert data["has_next"] is False
        assert data["has_prev"] is False
    
    def test_list_positions_with_data(self, auth_headers: dict, created_position: Position):
        """Test listing positions with existing data."""
        response = client.get("/api/v1/positions/", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["positions"]) == 1
        assert data["total"] == 1
        assert data["positions"][0]["id"] == str(created_position.id)
        assert data["positions"][0]["title"] == created_position.title
    
    def test_list_positions_with_status_filter(self, auth_headers: dict, db_session: Session, test_user: User):
        """Test listing positions with status filter."""
        # Create positions with different statuses
        position1 = Position(
            user_id=test_user.id,
            title="Position 1",
            company="Company 1",
            status=PositionStatus.APPLIED,
            application_date=date(2024, 1, 15)
        )
        position2 = Position(
            user_id=test_user.id,
            title="Position 2",
            company="Company 2",
            status=PositionStatus.INTERVIEWING,
            application_date=date(2024, 1, 16)
        )
        db_session.add_all([position1, position2])
        db_session.commit()
        
        # Filter by applied status
        response = client.get(
            "/api/v1/positions/?status=applied",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["positions"]) == 1
        assert data["positions"][0]["status"] == "applied"
    
    def test_list_positions_with_company_filter(self, auth_headers: dict, db_session: Session, test_user: User):
        """Test listing positions with company filter."""
        # Create positions with different companies
        position1 = Position(
            user_id=test_user.id,
            title="Position 1",
            company="Tech Corp",
            status=PositionStatus.APPLIED,
            application_date=date(2024, 1, 15)
        )
        position2 = Position(
            user_id=test_user.id,
            title="Position 2",
            company="Other Company",
            status=PositionStatus.APPLIED,
            application_date=date(2024, 1, 16)
        )
        db_session.add_all([position1, position2])
        db_session.commit()
        
        # Filter by company
        response = client.get(
            "/api/v1/positions/?company=Tech",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["positions"]) == 1
        assert "Tech" in data["positions"][0]["company"]
    
    def test_list_positions_with_date_filter(self, auth_headers: dict, db_session: Session, test_user: User):
        """Test listing positions with date range filter."""
        # Create positions with different dates
        position1 = Position(
            user_id=test_user.id,
            title="Position 1",
            company="Company 1",
            status=PositionStatus.APPLIED,
            application_date=date(2024, 1, 10)
        )
        position2 = Position(
            user_id=test_user.id,
            title="Position 2",
            company="Company 2",
            status=PositionStatus.APPLIED,
            application_date=date(2024, 1, 20)
        )
        db_session.add_all([position1, position2])
        db_session.commit()
        
        # Filter by date range
        response = client.get(
            "/api/v1/positions/?date_from=2024-01-15&date_to=2024-01-25",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["positions"]) == 1
        assert data["positions"][0]["application_date"] == "2024-01-20"
    
    def test_list_positions_with_search(self, auth_headers: dict, db_session: Session, test_user: User):
        """Test listing positions with search filter."""
        # Create positions with different titles
        position1 = Position(
            user_id=test_user.id,
            title="Senior Python Developer",
            company="Company 1",
            status=PositionStatus.APPLIED,
            application_date=date(2024, 1, 15)
        )
        position2 = Position(
            user_id=test_user.id,
            title="Frontend Engineer",
            company="Company 2",
            status=PositionStatus.APPLIED,
            application_date=date(2024, 1, 16)
        )
        db_session.add_all([position1, position2])
        db_session.commit()
        
        # Search for Python
        response = client.get(
            "/api/v1/positions/?search=Python",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["positions"]) == 1
        assert "Python" in data["positions"][0]["title"]
    
    def test_list_positions_pagination(self, auth_headers: dict, db_session: Session, test_user: User):
        """Test position listing pagination."""
        # Create multiple positions
        positions = []
        for i in range(5):
            position = Position(
                user_id=test_user.id,
                title=f"Position {i}",
                company=f"Company {i}",
                status=PositionStatus.APPLIED,
                application_date=date(2024, 1, 15 + i)
            )
            positions.append(position)
        
        db_session.add_all(positions)
        db_session.commit()
        
        # Test first page
        response = client.get(
            "/api/v1/positions/?page=1&per_page=2",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["positions"]) == 2
        assert data["total"] == 5
        assert data["page"] == 1
        assert data["per_page"] == 2
        assert data["has_next"] is True
        assert data["has_prev"] is False
        
        # Test second page
        response = client.get(
            "/api/v1/positions/?page=2&per_page=2",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["positions"]) == 2
        assert data["page"] == 2
        assert data["has_next"] is True
        assert data["has_prev"] is True
    
    def test_list_positions_unauthorized(self):
        """Test listing positions without authentication."""
        response = client.get("/api/v1/positions/")
        
        assert response.status_code == 403


class TestGetPosition:
    """Test cases for getting a specific position."""
    
    def test_get_position_success(self, auth_headers: dict, created_position: Position):
        """Test successful position retrieval."""
        response = client.get(
            f"/api/v1/positions/{created_position.id}",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == str(created_position.id)
        assert data["title"] == created_position.title
        assert data["company"] == created_position.company
    
    def test_get_position_not_found(self, auth_headers: dict):
        """Test getting a non-existent position."""
        fake_id = uuid4()
        response = client.get(
            f"/api/v1/positions/{fake_id}",
            headers=auth_headers
        )
        
        assert response.status_code == 404
    
    def test_get_position_unauthorized(self, created_position: Position):
        """Test getting a position without authentication."""
        response = client.get(f"/api/v1/positions/{created_position.id}")
        
        assert response.status_code == 403
    
    def test_get_position_other_user(self, db_session: Session, created_position: Position):
        """Test getting a position that belongs to another user."""
        # Create another user
        other_user = User(
            email="other@example.com",
            password_hash="hashed_password",
            first_name="Other",
            last_name="User"
        )
        db_session.add(other_user)
        db_session.commit()
        
        # Create token for other user
        token = create_access_token(data={"sub": str(other_user.id)})
        headers = {"Authorization": f"Bearer {token}"}
        
        response = client.get(
            f"/api/v1/positions/{created_position.id}",
            headers=headers
        )
        
        assert response.status_code == 404


class TestUpdatePosition:
    """Test cases for updating positions."""
    
    def test_update_position_success(self, auth_headers: dict, created_position: Position):
        """Test successful position update."""
        update_data = {
            "title": "Updated Title",
            "status": "interviewing"
        }
        
        response = client.put(
            f"/api/v1/positions/{created_position.id}",
            json=update_data,
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Updated Title"
        assert data["status"] == "interviewing"
        assert data["company"] == created_position.company  # Unchanged field
    
    def test_update_position_partial(self, auth_headers: dict, created_position: Position):
        """Test partial position update."""
        update_data = {
            "status": "rejected"
        }
        
        response = client.put(
            f"/api/v1/positions/{created_position.id}",
            json=update_data,
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "rejected"
        assert data["title"] == created_position.title  # Unchanged
    
    def test_update_position_not_found(self, auth_headers: dict):
        """Test updating a non-existent position."""
        fake_id = uuid4()
        update_data = {"title": "Updated Title"}
        
        response = client.put(
            f"/api/v1/positions/{fake_id}",
            json=update_data,
            headers=auth_headers
        )
        
        assert response.status_code == 404
    
    def test_update_position_invalid_data(self, auth_headers: dict, created_position: Position):
        """Test updating position with invalid data."""
        update_data = {
            "status": "invalid_status"
        }
        
        response = client.put(
            f"/api/v1/positions/{created_position.id}",
            json=update_data,
            headers=auth_headers
        )
        
        assert response.status_code == 422
    
    def test_update_position_unauthorized(self, created_position: Position):
        """Test updating a position without authentication."""
        update_data = {"title": "Updated Title"}
        
        response = client.put(
            f"/api/v1/positions/{created_position.id}",
            json=update_data
        )
        
        assert response.status_code == 403


class TestUpdatePositionStatus:
    """Test cases for updating position status."""
    
    def test_update_position_status_success(self, auth_headers: dict, created_position: Position):
        """Test successful position status update."""
        status_data = {"status": "interviewing"}
        
        response = client.put(
            f"/api/v1/positions/{created_position.id}/status",
            json=status_data,
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "interviewing"
        assert data["id"] == str(created_position.id)
        assert data["title"] == created_position.title  # Other fields unchanged
    
    def test_update_position_status_invalid_status(self, auth_headers: dict, created_position: Position):
        """Test updating position status with invalid status."""
        status_data = {"status": "invalid_status"}
        
        response = client.put(
            f"/api/v1/positions/{created_position.id}/status",
            json=status_data,
            headers=auth_headers
        )
        
        assert response.status_code == 422
    
    def test_update_position_status_not_found(self, auth_headers: dict):
        """Test updating status of a non-existent position."""
        fake_id = uuid4()
        status_data = {"status": "rejected"}
        
        response = client.put(
            f"/api/v1/positions/{fake_id}/status",
            json=status_data,
            headers=auth_headers
        )
        
        assert response.status_code == 404
    
    def test_update_position_status_unauthorized(self, created_position: Position):
        """Test updating position status without authentication."""
        status_data = {"status": "offer"}
        
        response = client.put(
            f"/api/v1/positions/{created_position.id}/status",
            json=status_data
        )
        
        assert response.status_code == 403
    
    def test_update_position_status_other_user(self, db_session: Session, created_position: Position):
        """Test updating status of a position that belongs to another user."""
        # Create another user
        other_user = User(
            email="other@example.com",
            password_hash="hashed_password",
            first_name="Other",
            last_name="User"
        )
        db_session.add(other_user)
        db_session.commit()
        
        # Create token for other user
        token = create_access_token(data={"sub": str(other_user.id)})
        headers = {"Authorization": f"Bearer {token}"}
        
        status_data = {"status": "rejected"}
        
        response = client.put(
            f"/api/v1/positions/{created_position.id}/status",
            json=status_data,
            headers=headers
        )
        
        assert response.status_code == 404
    
    def test_update_position_status_missing_status(self, auth_headers: dict, created_position: Position):
        """Test updating position status without providing status field."""
        response = client.put(
            f"/api/v1/positions/{created_position.id}/status",
            json={},
            headers=auth_headers
        )
        
        assert response.status_code == 422


class TestDeletePosition:
    """Test cases for deleting positions."""
    
    def test_delete_position_success(self, auth_headers: dict, created_position: Position):
        """Test successful position deletion."""
        response = client.delete(
            f"/api/v1/positions/{created_position.id}",
            headers=auth_headers
        )
        
        assert response.status_code == 204
        
        # Verify position is deleted
        get_response = client.get(
            f"/api/v1/positions/{created_position.id}",
            headers=auth_headers
        )
        assert get_response.status_code == 404
    
    def test_delete_position_not_found(self, auth_headers: dict):
        """Test deleting a non-existent position."""
        fake_id = uuid4()
        response = client.delete(
            f"/api/v1/positions/{fake_id}",
            headers=auth_headers
        )
        
        assert response.status_code == 404
    
    def test_delete_position_unauthorized(self, created_position: Position):
        """Test deleting a position without authentication."""
        response = client.delete(f"/api/v1/positions/{created_position.id}")
        
        assert response.status_code == 403
    
    def test_delete_position_other_user(self, db_session: Session, created_position: Position):
        """Test deleting a position that belongs to another user."""
        # Create another user
        other_user = User(
            email="other@example.com",
            password_hash="hashed_password",
            first_name="Other",
            last_name="User"
        )
        db_session.add(other_user)
        db_session.commit()
        
        # Create token for other user
        token = create_access_token(data={"sub": str(other_user.id)})
        headers = {"Authorization": f"Bearer {token}"}
        
        response = client.delete(
            f"/api/v1/positions/{created_position.id}",
            headers=headers
        )
        
        assert response.status_code == 404