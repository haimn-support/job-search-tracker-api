"""
Tests for Pydantic schemas validation.
"""
import pytest
from datetime import datetime, date, timedelta
from uuid import uuid4
from pydantic import ValidationError

from app.schemas import (
    # Enums
    PositionStatus, InterviewType, InterviewPlace, InterviewOutcome,
    # User schemas
    UserCreate, UserLogin, UserResponse, TokenResponse,
    # Position schemas
    PositionCreate, PositionUpdate, PositionResponse,
    # Interview schemas
    InterviewCreate, InterviewUpdate, InterviewResponse,
    # Statistics schemas
    StatisticsOverview, TimelineStatistics, CompanyStatistics, StatisticsFilters,
    # Common schemas
    PaginationParams, FilterParams, ValidationErrorDetail
)


class TestEnums:
    """Test enum validation."""
    
    def test_position_status_values(self):
        """Test PositionStatus enum values."""
        assert PositionStatus.APPLIED == "applied"
        assert PositionStatus.SCREENING == "screening"
        assert PositionStatus.INTERVIEWING == "interviewing"
        assert PositionStatus.OFFER == "offer"
        assert PositionStatus.REJECTED == "rejected"
        assert PositionStatus.WITHDRAWN == "withdrawn"
    
    def test_interview_type_values(self):
        """Test InterviewType enum values."""
        assert InterviewType.TECHNICAL == "technical"
        assert InterviewType.BEHAVIORAL == "behavioral"
        assert InterviewType.HR == "hr"
        assert InterviewType.FINAL == "final"
    
    def test_interview_place_values(self):
        """Test InterviewPlace enum values."""
        assert InterviewPlace.PHONE == "phone"
        assert InterviewPlace.VIDEO == "video"
        assert InterviewPlace.ONSITE == "onsite"
    
    def test_interview_outcome_values(self):
        """Test InterviewOutcome enum values."""
        assert InterviewOutcome.PENDING == "pending"
        assert InterviewOutcome.PASSED == "passed"
        assert InterviewOutcome.FAILED == "failed"
        assert InterviewOutcome.CANCELLED == "cancelled"


class TestUserSchemas:
    """Test user-related schemas."""
    
    def test_user_create_valid(self):
        """Test valid user creation."""
        user_data = {
            "email": "test@example.com",
            "password": "password123",
            "first_name": "John",
            "last_name": "Doe"
        }
        user = UserCreate(**user_data)
        assert user.email == "test@example.com"
        assert user.password == "password123"
        assert user.first_name == "John"
        assert user.last_name == "Doe"
    
    def test_user_create_minimal(self):
        """Test user creation with minimal required fields."""
        user_data = {
            "email": "test@example.com",
            "password": "password123"
        }
        user = UserCreate(**user_data)
        assert user.email == "test@example.com"
        assert user.password == "password123"
        assert user.first_name is None
        assert user.last_name is None
    
    def test_user_create_invalid_email(self):
        """Test user creation with invalid email."""
        user_data = {
            "email": "invalid-email",
            "password": "password123"
        }
        with pytest.raises(ValidationError) as exc_info:
            UserCreate(**user_data)
        assert "value is not a valid email address" in str(exc_info.value)
    
    def test_user_create_short_password(self):
        """Test user creation with short password."""
        user_data = {
            "email": "test@example.com",
            "password": "short"
        }
        with pytest.raises(ValidationError) as exc_info:
            UserCreate(**user_data)
        assert "at least 8 characters" in str(exc_info.value)
    
    def test_user_login_valid(self):
        """Test valid user login."""
        login_data = {
            "email": "test@example.com",
            "password": "password123"
        }
        login = UserLogin(**login_data)
        assert login.email == "test@example.com"
        assert login.password == "password123"
    
    def test_token_response_valid(self):
        """Test valid token response."""
        token_data = {
            "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9",
            "expires_in": 3600
        }
        token = TokenResponse(**token_data)
        assert token.access_token == "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9"
        assert token.token_type == "bearer"
        assert token.expires_in == 3600


class TestPositionSchemas:
    """Test position-related schemas."""
    
    def test_position_create_valid(self):
        """Test valid position creation."""
        position_data = {
            "title": "Software Engineer",
            "company": "Tech Corp",
            "description": "Great opportunity",
            "location": "San Francisco, CA",
            "salary_range": "$100k-$150k",
            "status": PositionStatus.APPLIED,
            "application_date": date.today()
        }
        position = PositionCreate(**position_data)
        assert position.title == "Software Engineer"
        assert position.company == "Tech Corp"
        assert position.status == PositionStatus.APPLIED
    
    def test_position_create_minimal(self):
        """Test position creation with minimal required fields."""
        position_data = {
            "title": "Software Engineer",
            "company": "Tech Corp",
            "application_date": date.today()
        }
        position = PositionCreate(**position_data)
        assert position.title == "Software Engineer"
        assert position.company == "Tech Corp"
        assert position.status == PositionStatus.APPLIED  # default value
        assert position.description is None
    
    def test_position_create_missing_required(self):
        """Test position creation with missing required fields."""
        position_data = {
            "title": "Software Engineer"
            # Missing company and application_date
        }
        with pytest.raises(ValidationError) as exc_info:
            PositionCreate(**position_data)
        errors = exc_info.value.errors()
        error_fields = [error['loc'][0] for error in errors]
        assert 'company' in error_fields
        assert 'application_date' in error_fields
    
    def test_position_update_partial(self):
        """Test position update with partial data."""
        update_data = {
            "status": PositionStatus.INTERVIEWING,
            "notes": "Had first interview"
        }
        # This should not raise an error since all fields are optional
        position_update = PositionUpdate(**update_data)
        assert position_update.status == PositionStatus.INTERVIEWING


class TestInterviewSchemas:
    """Test interview-related schemas."""
    
    def test_interview_create_valid(self):
        """Test valid interview creation."""
        future_date = datetime.now() + timedelta(days=1)
        interview_data = {
            "type": InterviewType.TECHNICAL,
            "place": InterviewPlace.VIDEO,
            "scheduled_date": future_date,
            "duration_minutes": 60,
            "notes": "Technical screening",
            "outcome": InterviewOutcome.PENDING
        }
        interview = InterviewCreate(**interview_data)
        assert interview.type == InterviewType.TECHNICAL
        assert interview.place == InterviewPlace.VIDEO
        assert interview.duration_minutes == 60
        assert interview.outcome == InterviewOutcome.PENDING
    
    def test_interview_create_minimal(self):
        """Test interview creation with minimal required fields."""
        future_date = datetime.now() + timedelta(days=1)
        interview_data = {
            "type": InterviewType.HR,
            "place": InterviewPlace.PHONE,
            "scheduled_date": future_date
        }
        interview = InterviewCreate(**interview_data)
        assert interview.type == InterviewType.HR
        assert interview.place == InterviewPlace.PHONE
        assert interview.outcome == InterviewOutcome.PENDING  # default value
        assert interview.duration_minutes is None
    
    def test_interview_invalid_duration(self):
        """Test interview creation with invalid duration."""
        future_date = datetime.now() + timedelta(days=1)
        interview_data = {
            "type": InterviewType.TECHNICAL,
            "place": InterviewPlace.VIDEO,
            "scheduled_date": future_date,
            "duration_minutes": 0  # Invalid: must be positive
        }
        with pytest.raises(ValidationError) as exc_info:
            InterviewCreate(**interview_data)
        assert "Input should be greater than or equal to 1" in str(exc_info.value)
    
    def test_interview_duration_bounds(self):
        """Test interview duration boundary validation."""
        future_date = datetime.now() + timedelta(days=1)
        
        # Test minimum boundary (should pass)
        interview_data = {
            "type": InterviewType.TECHNICAL,
            "place": InterviewPlace.VIDEO,
            "scheduled_date": future_date,
            "duration_minutes": 1
        }
        interview = InterviewCreate(**interview_data)
        assert interview.duration_minutes == 1
        
        # Test maximum boundary (should pass)
        interview_data["duration_minutes"] = 480
        interview = InterviewCreate(**interview_data)
        assert interview.duration_minutes == 480
        
        # Test over maximum (should fail)
        interview_data["duration_minutes"] = 481
        with pytest.raises(ValidationError):
            InterviewCreate(**interview_data)


class TestStatisticsSchemas:
    """Test statistics-related schemas."""
    
    def test_statistics_overview_valid(self):
        """Test valid statistics overview."""
        stats_data = {
            "total_applications": 10,
            "total_companies": 8,
            "total_interviews": 5,
            "response_rate": 50.0,
            "interview_rate": 30.0,
            "offer_rate": 10.0,
            "status_breakdown": {
                PositionStatus.APPLIED: 5,
                PositionStatus.INTERVIEWING: 3,
                PositionStatus.REJECTED: 2
            },
            "interview_type_breakdown": {
                InterviewType.TECHNICAL: 3,
                InterviewType.HR: 2
            },
            "interview_outcome_breakdown": {
                InterviewOutcome.PENDING: 2,
                InterviewOutcome.PASSED: 2,
                InterviewOutcome.FAILED: 1
            }
        }
        stats = StatisticsOverview(**stats_data)
        assert stats.total_applications == 10
        assert stats.response_rate == 50.0
        assert len(stats.status_breakdown) == 3
    
    def test_statistics_filters_valid(self):
        """Test valid statistics filters."""
        filter_data = {
            "start_date": date(2023, 1, 1),
            "end_date": date(2023, 12, 31),
            "company": "Tech Corp",
            "status": PositionStatus.APPLIED
        }
        filters = StatisticsFilters(**filter_data)
        assert filters.start_date == date(2023, 1, 1)
        assert filters.company == "Tech Corp"
        assert filters.status == PositionStatus.APPLIED
    
    def test_statistics_filters_empty(self):
        """Test statistics filters with no filters."""
        filters = StatisticsFilters()
        assert filters.start_date is None
        assert filters.end_date is None
        assert filters.company is None
        assert filters.status is None


class TestCommonSchemas:
    """Test common schemas."""
    
    def test_pagination_params_valid(self):
        """Test valid pagination parameters."""
        pagination_data = {
            "page": 2,
            "per_page": 50
        }
        pagination = PaginationParams(**pagination_data)
        assert pagination.page == 2
        assert pagination.per_page == 50
    
    def test_pagination_params_defaults(self):
        """Test pagination parameters with defaults."""
        pagination = PaginationParams()
        assert pagination.page == 1
        assert pagination.per_page == 20
    
    def test_pagination_params_invalid(self):
        """Test invalid pagination parameters."""
        # Test negative page
        with pytest.raises(ValidationError):
            PaginationParams(page=0)
        
        # Test per_page too large
        with pytest.raises(ValidationError):
            PaginationParams(per_page=101)
        
        # Test negative per_page
        with pytest.raises(ValidationError):
            PaginationParams(per_page=0)
    
    def test_filter_params_valid(self):
        """Test valid filter parameters."""
        filter_data = {
            "search": "engineer",
            "sort_by": "created_at",
            "sort_order": "desc"
        }
        filters = FilterParams(**filter_data)
        assert filters.search == "engineer"
        assert filters.sort_by == "created_at"
        assert filters.sort_order == "desc"
    
    def test_filter_params_invalid_sort_order(self):
        """Test invalid sort order."""
        filter_data = {
            "sort_order": "invalid"
        }
        with pytest.raises(ValidationError) as exc_info:
            FilterParams(**filter_data)
        assert "String should match pattern" in str(exc_info.value)
    
    def test_validation_error_detail(self):
        """Test validation error detail schema."""
        error_data = {
            "field": "email",
            "message": "Invalid email format",
            "value": "invalid-email"
        }
        error = ValidationErrorDetail(**error_data)
        assert error.field == "email"
        assert error.message == "Invalid email format"
        assert error.value == "invalid-email"


class TestSchemaIntegration:
    """Test schema integration and relationships."""
    
    def test_position_response_with_interviews(self):
        """Test position response with nested interviews."""
        position_data = {
            "id": uuid4(),
            "user_id": uuid4(),
            "title": "Software Engineer",
            "company": "Tech Corp",
            "description": "Great opportunity",
            "location": "San Francisco, CA",
            "salary_range": "$100k-$150k",
            "status": PositionStatus.APPLIED,
            "application_date": date.today(),
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
            "interviews": [
                {
                    "id": uuid4(),
                    "position_id": uuid4(),
                    "type": InterviewType.TECHNICAL,
                    "place": InterviewPlace.VIDEO,
                    "scheduled_date": datetime.now() + timedelta(days=1),
                    "duration_minutes": 60,
                    "notes": "Technical screening",
                    "outcome": InterviewOutcome.PENDING,
                    "created_at": datetime.now(),
                    "updated_at": datetime.now()
                }
            ]
        }
        
        # This should work without issues due to forward reference resolution
        position = PositionResponse(**position_data)
        assert len(position.interviews) == 1
        assert position.interviews[0].type == InterviewType.TECHNICAL