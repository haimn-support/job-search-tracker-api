"""
Tests for statistics endpoints and service.
"""
import pytest
from datetime import date, datetime, timedelta
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.core.database import get_db
from app.models.user import User
from app.models.position import Position, PositionStatus
from app.models.interview import Interview, InterviewType, InterviewPlace, InterviewOutcome
from app.services.statistics_service import StatisticsService
from app.schemas.statistics import StatisticsFilters
from app.core.auth import create_access_token
from tests.conftest import override_get_db

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


class TestStatisticsService:
    """Test cases for StatisticsService."""
    
    def test_overview_statistics_empty_data(self, db_session: Session, test_user):
        """Test overview statistics with no data."""
        service = StatisticsService(db_session)
        stats = service.get_overview_statistics(test_user.id)
        
        assert stats.total_applications == 0
        assert stats.total_companies == 0
        assert stats.total_interviews == 0
        assert stats.response_rate == 0.0
        assert stats.interview_rate == 0.0
        assert stats.offer_rate == 0.0
        
        # Check that all status breakdowns are zero
        for status_count in stats.status_breakdown.values():
            assert status_count == 0
        
        for type_count in stats.interview_type_breakdown.values():
            assert type_count == 0
        
        for outcome_count in stats.interview_outcome_breakdown.values():
            assert outcome_count == 0
    
    def test_overview_statistics_with_data(self, db_session: Session, test_user):
        """Test overview statistics with sample data."""
        # Create test positions
        positions = [
            Position(
                user_id=test_user.id,
                title="Software Engineer",
                company="TechCorp",
                status=PositionStatus.INTERVIEWING,
                application_date=date.today() - timedelta(days=10)
            ),
            Position(
                user_id=test_user.id,
                title="Backend Developer",
                company="StartupInc",
                status=PositionStatus.OFFER,
                application_date=date.today() - timedelta(days=5)
            ),
            Position(
                user_id=test_user.id,
                title="Full Stack Developer",
                company="BigTech",
                status=PositionStatus.REJECTED,
                application_date=date.today() - timedelta(days=15)
            ),
            Position(
                user_id=test_user.id,
                title="DevOps Engineer",
                company="TechCorp",  # Same company as first position
                status=PositionStatus.APPLIED,
                application_date=date.today() - timedelta(days=2)
            )
        ]
        
        for pos in positions:
            db_session.add(pos)
        db_session.commit()
        
        # Refresh to get IDs
        for pos in positions:
            db_session.refresh(pos)
        
        # Create test interviews
        interviews = [
            Interview(
                position_id=positions[0].id,
                type=InterviewType.TECHNICAL,
                place=InterviewPlace.VIDEO,
                scheduled_date=datetime.now() + timedelta(days=1),
                outcome=InterviewOutcome.PENDING
            ),
            Interview(
                position_id=positions[1].id,
                type=InterviewType.HR,
                place=InterviewPlace.PHONE,
                scheduled_date=datetime.now() - timedelta(days=2),
                outcome=InterviewOutcome.PASSED
            ),
            Interview(
                position_id=positions[1].id,
                type=InterviewType.FINAL,
                place=InterviewPlace.ONSITE,
                scheduled_date=datetime.now() - timedelta(days=1),
                outcome=InterviewOutcome.PASSED
            )
        ]
        
        for interview in interviews:
            db_session.add(interview)
        db_session.commit()
        
        # Test statistics
        service = StatisticsService(db_session)
        stats = service.get_overview_statistics(test_user.id)
        
        assert stats.total_applications == 4
        assert stats.total_companies == 3  # TechCorp, StartupInc, BigTech
        assert stats.total_interviews == 3
        
        # Response rate: 3 out of 4 positions have status other than APPLIED
        assert stats.response_rate == 75.0
        
        # Interview rate: 2 out of 4 positions have interviews
        assert stats.interview_rate == 50.0
        
        # Offer rate: 1 out of 4 positions have OFFER status
        assert stats.offer_rate == 25.0
        
        # Check status breakdown
        from app.schemas.enums import PositionStatus as SchemaStatus
        assert stats.status_breakdown[SchemaStatus.APPLIED] == 1
        assert stats.status_breakdown[SchemaStatus.INTERVIEWING] == 1
        assert stats.status_breakdown[SchemaStatus.OFFER] == 1
        assert stats.status_breakdown[SchemaStatus.REJECTED] == 1
        assert stats.status_breakdown[SchemaStatus.SCREENING] == 0
        assert stats.status_breakdown[SchemaStatus.WITHDRAWN] == 0
    
    def test_timeline_statistics(self, db_session: Session, test_user):
        """Test timeline statistics calculation."""
        # Create positions across different months
        positions = [
            Position(
                user_id=test_user.id,
                title="Engineer 1",
                company="Company A",
                status=PositionStatus.APPLIED,
                application_date=date(2024, 1, 15)
            ),
            Position(
                user_id=test_user.id,
                title="Engineer 2",
                company="Company B",
                status=PositionStatus.INTERVIEWING,
                application_date=date(2024, 1, 20)
            ),
            Position(
                user_id=test_user.id,
                title="Engineer 3",
                company="Company C",
                status=PositionStatus.OFFER,
                application_date=date(2024, 2, 10)
            )
        ]
        
        for pos in positions:
            db_session.add(pos)
        db_session.commit()
        
        # Refresh to get IDs
        for pos in positions:
            db_session.refresh(pos)
        
        # Create interviews
        interviews = [
            Interview(
                position_id=positions[1].id,
                type=InterviewType.TECHNICAL,
                place=InterviewPlace.VIDEO,
                scheduled_date=datetime(2024, 1, 25, 10, 0),
                outcome=InterviewOutcome.PASSED
            ),
            Interview(
                position_id=positions[2].id,
                type=InterviewType.HR,
                place=InterviewPlace.PHONE,
                scheduled_date=datetime(2024, 2, 15, 14, 0),
                outcome=InterviewOutcome.PASSED
            )
        ]
        
        for interview in interviews:
            db_session.add(interview)
        db_session.commit()
        
        # Test timeline statistics
        service = StatisticsService(db_session)
        filters = StatisticsFilters(
            start_date=date(2024, 1, 1),
            end_date=date(2024, 2, 28)
        )
        stats = service.get_timeline_statistics(test_user.id, filters)
        
        assert stats.period_start == date(2024, 1, 1)
        assert stats.period_end == date(2024, 2, 28)
        
        # Check applications per month
        assert len(stats.applications_per_month) == 2
        jan_apps = next(month for month in stats.applications_per_month if month["month"] == "2024-01")
        feb_apps = next(month for month in stats.applications_per_month if month["month"] == "2024-02")
        
        assert jan_apps["count"] == 2
        assert feb_apps["count"] == 1
        
        # Check interviews per month
        assert len(stats.interviews_per_month) == 2
        jan_interviews = next(month for month in stats.interviews_per_month if month["month"] == "2024-01")
        feb_interviews = next(month for month in stats.interviews_per_month if month["month"] == "2024-02")
        
        assert jan_interviews["count"] == 1
        assert feb_interviews["count"] == 1
    
    def test_company_statistics(self, db_session: Session, test_user):
        """Test company-based statistics calculation."""
        # Create positions for different companies
        positions = [
            Position(
                user_id=test_user.id,
                title="Engineer 1",
                company="TechCorp",
                status=PositionStatus.OFFER,
                application_date=date.today() - timedelta(days=10)
            ),
            Position(
                user_id=test_user.id,
                title="Engineer 2",
                company="TechCorp",
                status=PositionStatus.REJECTED,
                application_date=date.today() - timedelta(days=5)
            ),
            Position(
                user_id=test_user.id,
                title="Developer",
                company="StartupInc",
                status=PositionStatus.INTERVIEWING,
                application_date=date.today() - timedelta(days=3)
            )
        ]
        
        for pos in positions:
            db_session.add(pos)
        db_session.commit()
        
        # Refresh to get IDs
        for pos in positions:
            db_session.refresh(pos)
        
        # Create interviews
        interviews = [
            Interview(
                position_id=positions[0].id,
                type=InterviewType.TECHNICAL,
                place=InterviewPlace.VIDEO,
                scheduled_date=datetime.now() - timedelta(days=8),
                outcome=InterviewOutcome.PASSED
            ),
            Interview(
                position_id=positions[2].id,
                type=InterviewType.HR,
                place=InterviewPlace.PHONE,
                scheduled_date=datetime.now() - timedelta(days=1),
                outcome=InterviewOutcome.PENDING
            )
        ]
        
        for interview in interviews:
            db_session.add(interview)
        db_session.commit()
        
        # Test company statistics
        service = StatisticsService(db_session)
        stats = service.get_company_statistics(test_user.id)
        
        assert stats.total_companies == 2
        assert len(stats.companies) == 2
        
        # Find TechCorp stats (should be first due to higher application count)
        techcorp_stats = next(company for company in stats.companies if company.company_name == "TechCorp")
        startup_stats = next(company for company in stats.companies if company.company_name == "StartupInc")
        
        # TechCorp statistics
        assert techcorp_stats.total_applications == 2
        assert techcorp_stats.total_interviews == 1
        assert techcorp_stats.success_rate == 50.0  # 1 offer out of 2 applications
        
        # StartupInc statistics
        assert startup_stats.total_applications == 1
        assert startup_stats.total_interviews == 1
        assert startup_stats.success_rate == 0.0  # No offers yet
    
    def test_statistics_with_filters(self, db_session: Session, test_user):
        """Test statistics with date and company filters."""
        # Create positions with different dates and companies
        positions = [
            Position(
                user_id=test_user.id,
                title="Old Position",
                company="OldCompany",
                status=PositionStatus.REJECTED,
                application_date=date(2023, 12, 1)
            ),
            Position(
                user_id=test_user.id,
                title="Recent Position",
                company="NewCompany",
                status=PositionStatus.OFFER,
                application_date=date(2024, 1, 15)
            )
        ]
        
        for pos in positions:
            db_session.add(pos)
        db_session.commit()
        
        service = StatisticsService(db_session)
        
        # Test date filter
        filters = StatisticsFilters(start_date=date(2024, 1, 1))
        stats = service.get_overview_statistics(test_user.id, filters)
        
        assert stats.total_applications == 1
        assert stats.total_companies == 1
        
        # Test company filter
        filters = StatisticsFilters(company="NewCompany")
        stats = service.get_overview_statistics(test_user.id, filters)
        
        assert stats.total_applications == 1
        assert stats.offer_rate == 100.0


class TestStatisticsAPI:
    """Test cases for statistics API endpoints."""
    
    def test_get_overview_statistics_unauthorized(self):
        """Test overview statistics endpoint without authentication."""
        response = client.get("/api/v1/statistics/overview")
        assert response.status_code == 403  # FastAPI returns 403 for missing auth
    
    def test_get_overview_statistics_empty(self, auth_headers):
        """Test overview statistics endpoint with no data."""
        response = client.get("/api/v1/statistics/overview", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert data["total_applications"] == 0
        assert data["total_companies"] == 0
        assert data["total_interviews"] == 0
        assert data["response_rate"] == 0.0
        assert data["interview_rate"] == 0.0
        assert data["offer_rate"] == 0.0
    
    def test_get_overview_statistics_with_filters(self, auth_headers):
        """Test overview statistics endpoint with query filters."""
        # Test with date filters
        response = client.get(
            "/api/v1/statistics/overview",
            params={
                "start_date": "2024-01-01",
                "end_date": "2024-12-31",
                "company": "TechCorp",
                "status": "applied"
            },
            headers=auth_headers
        )
        assert response.status_code == 200
    
    def test_get_timeline_statistics(self, auth_headers):
        """Test timeline statistics endpoint."""
        response = client.get("/api/v1/statistics/timeline", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert "period_start" in data
        assert "period_end" in data
        assert "applications_per_month" in data
        assert "interviews_per_month" in data
        assert isinstance(data["applications_per_month"], list)
        assert isinstance(data["interviews_per_month"], list)
    
    def test_get_company_statistics(self, auth_headers):
        """Test company statistics endpoint."""
        response = client.get("/api/v1/statistics/companies", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert "companies" in data
        assert "total_companies" in data
        assert isinstance(data["companies"], list)
        assert data["total_companies"] == len(data["companies"])
    
    def test_statistics_endpoints_with_data(self, auth_headers, db_session: Session, test_user):
        """Test all statistics endpoints with sample data."""
        # Create sample data
        position = Position(
            user_id=test_user.id,
            title="Test Engineer",
            company="TestCorp",
            status=PositionStatus.INTERVIEWING,
            application_date=date.today() - timedelta(days=7)
        )
        db_session.add(position)
        db_session.commit()
        db_session.refresh(position)
        
        interview = Interview(
            position_id=position.id,
            type=InterviewType.TECHNICAL,
            place=InterviewPlace.VIDEO,
            scheduled_date=datetime.now() + timedelta(days=1),
            outcome=InterviewOutcome.PENDING
        )
        db_session.add(interview)
        db_session.commit()
        
        # Test overview statistics
        response = client.get("/api/v1/statistics/overview", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["total_applications"] == 1
        assert data["total_companies"] == 1
        assert data["total_interviews"] == 1
        
        # Test timeline statistics
        response = client.get("/api/v1/statistics/timeline", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data["applications_per_month"]) > 0
        
        # Test company statistics
        response = client.get("/api/v1/statistics/companies", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["total_companies"] == 1
        assert len(data["companies"]) == 1
        assert data["companies"][0]["company_name"] == "TestCorp"
        assert data["companies"][0]["total_applications"] == 1
        assert data["companies"][0]["total_interviews"] == 1


class TestStatisticsCalculations:
    """Test specific calculation methods in isolation."""
    
    def test_response_rate_calculation(self, db_session: Session, test_user):
        """Test response rate calculation with various scenarios."""
        service = StatisticsService(db_session)
        
        # Test with no positions
        assert service._calculate_response_rate([]) == 0.0
        
        # Create test positions
        positions = [
            Position(
                user_id=test_user.id,
                title="Position 1",
                company="Company A",
                status=PositionStatus.APPLIED,  # No response
                application_date=date.today()
            ),
            Position(
                user_id=test_user.id,
                title="Position 2",
                company="Company B",
                status=PositionStatus.SCREENING,  # Response
                application_date=date.today()
            ),
            Position(
                user_id=test_user.id,
                title="Position 3",
                company="Company C",
                status=PositionStatus.REJECTED,  # Response
                application_date=date.today()
            )
        ]
        
        # 2 out of 3 positions have responses (not APPLIED status)
        response_rate = service._calculate_response_rate(positions)
        assert response_rate == 66.67  # Rounded to 2 decimal places
    
    def test_interview_rate_calculation(self, db_session: Session, test_user):
        """Test interview rate calculation."""
        service = StatisticsService(db_session)
        
        # Create positions
        positions = [
            Position(id="pos1", user_id=test_user.id, title="Pos 1", company="Co A", application_date=date.today()),
            Position(id="pos2", user_id=test_user.id, title="Pos 2", company="Co B", application_date=date.today()),
            Position(id="pos3", user_id=test_user.id, title="Pos 3", company="Co C", application_date=date.today())
        ]
        
        # Create interviews for 2 out of 3 positions
        interviews = [
            Interview(position_id="pos1", type=InterviewType.TECHNICAL, place=InterviewPlace.VIDEO, scheduled_date=datetime.now()),
            Interview(position_id="pos2", type=InterviewType.HR, place=InterviewPlace.PHONE, scheduled_date=datetime.now())
        ]
        
        interview_rate = service._calculate_interview_rate(positions, interviews)
        assert interview_rate == 66.67  # 2 out of 3 positions have interviews
    
    def test_offer_rate_calculation(self, db_session: Session, test_user):
        """Test offer rate calculation."""
        service = StatisticsService(db_session)
        
        positions = [
            Position(
                user_id=test_user.id,
                title="Position 1",
                company="Company A",
                status=PositionStatus.OFFER,  # Offer
                application_date=date.today()
            ),
            Position(
                user_id=test_user.id,
                title="Position 2",
                company="Company B",
                status=PositionStatus.REJECTED,  # No offer
                application_date=date.today()
            ),
            Position(
                user_id=test_user.id,
                title="Position 3",
                company="Company C",
                status=PositionStatus.APPLIED,  # No offer
                application_date=date.today()
            )
        ]
        
        offer_rate = service._calculate_offer_rate(positions)
        assert offer_rate == 33.33  # 1 out of 3 positions have offers