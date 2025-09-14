"""
Unit tests for database models.
"""
import pytest
from datetime import date, datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import IntegrityError
from app.models import Base, User, Position, Interview, PositionStatus, InterviewType, InterviewPlace, InterviewOutcome


# Test database setup
@pytest.fixture(scope="function")
def db_session():
    """Create a test database session."""
    engine = create_engine("sqlite:///:memory:", echo=False)
    Base.metadata.create_all(engine)
    
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = SessionLocal()
    
    yield session
    
    session.close()


@pytest.fixture
def sample_user(db_session):
    """Create a sample user for testing."""
    user = User(
        email="test@example.com",
        password_hash="hashed_password",
        first_name="John",
        last_name="Doe"
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def sample_position(db_session, sample_user):
    """Create a sample position for testing."""
    position = Position(
        user_id=sample_user.id,
        title="Software Engineer",
        company="Tech Corp",
        description="A great software engineering role",
        location="San Francisco, CA",
        salary_range="$100k - $150k",
        status=PositionStatus.APPLIED,
        application_date=date(2024, 1, 15)
    )
    db_session.add(position)
    db_session.commit()
    db_session.refresh(position)
    return position


class TestUser:
    """Test cases for User model."""
    
    def test_create_user(self, db_session):
        """Test creating a user with valid data."""
        user = User(
            email="test@example.com",
            password_hash="hashed_password",
            first_name="John",
            last_name="Doe"
        )
        db_session.add(user)
        db_session.commit()
        
        assert user.id is not None
        assert user.email == "test@example.com"
        assert user.password_hash == "hashed_password"
        assert user.first_name == "John"
        assert user.last_name == "Doe"
        assert user.created_at is not None
        assert user.updated_at is not None
    
    def test_user_email_unique_constraint(self, db_session):
        """Test that user email must be unique."""
        user1 = User(email="test@example.com", password_hash="hash1")
        user2 = User(email="test@example.com", password_hash="hash2")
        
        db_session.add(user1)
        db_session.commit()
        
        db_session.add(user2)
        with pytest.raises(IntegrityError):
            db_session.commit()
    
    def test_user_email_required(self, db_session):
        """Test that user email is required."""
        user = User(password_hash="hashed_password")
        db_session.add(user)
        
        with pytest.raises(IntegrityError):
            db_session.commit()
    
    def test_user_password_hash_required(self, db_session):
        """Test that user password_hash is required."""
        user = User(email="test@example.com")
        db_session.add(user)
        
        with pytest.raises(IntegrityError):
            db_session.commit()
    
    def test_user_repr(self, sample_user):
        """Test user string representation."""
        repr_str = repr(sample_user)
        assert "User" in repr_str
        assert str(sample_user.id) in repr_str
        assert sample_user.email in repr_str


class TestPosition:
    """Test cases for Position model."""
    
    def test_create_position(self, db_session, sample_user):
        """Test creating a position with valid data."""
        position = Position(
            user_id=sample_user.id,
            title="Software Engineer",
            company="Tech Corp",
            description="A great role",
            location="San Francisco, CA",
            salary_range="$100k - $150k",
            status=PositionStatus.APPLIED,
            application_date=date(2024, 1, 15)
        )
        db_session.add(position)
        db_session.commit()
        
        assert position.id is not None
        assert position.user_id == sample_user.id
        assert position.title == "Software Engineer"
        assert position.company == "Tech Corp"
        assert position.description == "A great role"
        assert position.location == "San Francisco, CA"
        assert position.salary_range == "$100k - $150k"
        assert position.status == PositionStatus.APPLIED
        assert position.application_date == date(2024, 1, 15)
        assert position.created_at is not None
        assert position.updated_at is not None
    
    def test_position_required_fields(self, db_session, sample_user):
        """Test that position required fields are enforced."""
        # Missing title
        position = Position(
            user_id=sample_user.id,
            company="Tech Corp",
            application_date=date(2024, 1, 15)
        )
        db_session.add(position)
        with pytest.raises(IntegrityError):
            db_session.commit()
        
        db_session.rollback()
        
        # Missing company
        position = Position(
            user_id=sample_user.id,
            title="Software Engineer",
            application_date=date(2024, 1, 15)
        )
        db_session.add(position)
        with pytest.raises(IntegrityError):
            db_session.commit()
    
    def test_position_user_relationship(self, db_session, sample_position):
        """Test position-user relationship."""
        assert sample_position.user is not None
        assert sample_position.user.email == "test@example.com"
        assert sample_position in sample_position.user.positions
    
    def test_position_default_status(self, db_session, sample_user):
        """Test that position status defaults to APPLIED."""
        position = Position(
            user_id=sample_user.id,
            title="Software Engineer",
            company="Tech Corp",
            application_date=date(2024, 1, 15)
        )
        db_session.add(position)
        db_session.commit()
        
        assert position.status == PositionStatus.APPLIED
    
    def test_position_cascade_delete(self, db_session, sample_position):
        """Test that deleting user cascades to positions."""
        user_id = sample_position.user_id
        position_id = sample_position.id
        
        # Delete the user
        db_session.delete(sample_position.user)
        db_session.commit()
        
        # Position should be deleted too
        deleted_position = db_session.query(Position).filter(Position.id == position_id).first()
        assert deleted_position is None
    
    def test_position_repr(self, sample_position):
        """Test position string representation."""
        repr_str = repr(sample_position)
        assert "Position" in repr_str
        assert sample_position.title in repr_str
        assert sample_position.company in repr_str
        assert sample_position.status.value in repr_str


class TestInterview:
    """Test cases for Interview model."""
    
    def test_create_interview(self, db_session, sample_position):
        """Test creating an interview with valid data."""
        interview = Interview(
            position_id=sample_position.id,
            type=InterviewType.TECHNICAL,
            place=InterviewPlace.VIDEO,
            scheduled_date=datetime(2024, 1, 20, 14, 0),
            duration_minutes=60,
            notes="Technical interview with the team",
            outcome=InterviewOutcome.PENDING
        )
        db_session.add(interview)
        db_session.commit()
        
        assert interview.id is not None
        assert interview.position_id == sample_position.id
        assert interview.type == InterviewType.TECHNICAL
        assert interview.place == InterviewPlace.VIDEO
        assert interview.scheduled_date == datetime(2024, 1, 20, 14, 0)
        assert interview.duration_minutes == 60
        assert interview.notes == "Technical interview with the team"
        assert interview.outcome == InterviewOutcome.PENDING
        assert interview.created_at is not None
        assert interview.updated_at is not None
    
    def test_interview_required_fields(self, db_session, sample_position):
        """Test that interview required fields are enforced."""
        # Missing type
        interview = Interview(
            position_id=sample_position.id,
            place=InterviewPlace.VIDEO,
            scheduled_date=datetime(2024, 1, 20, 14, 0)
        )
        db_session.add(interview)
        with pytest.raises(IntegrityError):
            db_session.commit()
        
        db_session.rollback()
        
        # Missing place
        interview = Interview(
            position_id=sample_position.id,
            type=InterviewType.TECHNICAL,
            scheduled_date=datetime(2024, 1, 20, 14, 0)
        )
        db_session.add(interview)
        with pytest.raises(IntegrityError):
            db_session.commit()
        
        db_session.rollback()
        
        # Missing scheduled_date
        interview = Interview(
            position_id=sample_position.id,
            type=InterviewType.TECHNICAL,
            place=InterviewPlace.VIDEO
        )
        db_session.add(interview)
        with pytest.raises(IntegrityError):
            db_session.commit()
    
    def test_interview_position_relationship(self, db_session, sample_position):
        """Test interview-position relationship."""
        interview = Interview(
            position_id=sample_position.id,
            type=InterviewType.TECHNICAL,
            place=InterviewPlace.ONSITE,
            scheduled_date=datetime(2024, 1, 20, 14, 0)
        )
        db_session.add(interview)
        db_session.commit()
        
        assert interview.position is not None
        assert interview.position.title == "Software Engineer"
        assert interview in interview.position.interviews
    
    def test_interview_default_outcome(self, db_session, sample_position):
        """Test that interview outcome defaults to PENDING."""
        interview = Interview(
            position_id=sample_position.id,
            type=InterviewType.BEHAVIORAL,
            place=InterviewPlace.PHONE,
            scheduled_date=datetime(2024, 1, 20, 14, 0)
        )
        db_session.add(interview)
        db_session.commit()
        
        assert interview.outcome == InterviewOutcome.PENDING
    
    def test_interview_cascade_delete(self, db_session, sample_position):
        """Test that deleting position cascades to interviews."""
        interview = Interview(
            position_id=sample_position.id,
            type=InterviewType.HR,
            place=InterviewPlace.VIDEO,
            scheduled_date=datetime(2024, 1, 20, 14, 0)
        )
        db_session.add(interview)
        db_session.commit()
        interview_id = interview.id
        
        # Delete the position
        db_session.delete(sample_position)
        db_session.commit()
        
        # Interview should be deleted too
        deleted_interview = db_session.query(Interview).filter(Interview.id == interview_id).first()
        assert deleted_interview is None
    
    def test_interview_repr(self, db_session, sample_position):
        """Test interview string representation."""
        interview = Interview(
            position_id=sample_position.id,
            type=InterviewType.FINAL,
            place=InterviewPlace.ONSITE,
            scheduled_date=datetime(2024, 1, 20, 14, 0),
            outcome=InterviewOutcome.PENDING
        )
        db_session.add(interview)
        db_session.commit()
        
        repr_str = repr(interview)
        assert "Interview" in repr_str
        assert interview.type.value in repr_str
        assert interview.place.value in repr_str
        assert interview.outcome.value in repr_str


class TestEnums:
    """Test cases for enum values."""
    
    def test_position_status_enum(self):
        """Test PositionStatus enum values."""
        assert PositionStatus.APPLIED == "applied"
        assert PositionStatus.SCREENING == "screening"
        assert PositionStatus.INTERVIEWING == "interviewing"
        assert PositionStatus.OFFER == "offer"
        assert PositionStatus.REJECTED == "rejected"
        assert PositionStatus.WITHDRAWN == "withdrawn"
    
    def test_interview_type_enum(self):
        """Test InterviewType enum values."""
        assert InterviewType.TECHNICAL == "technical"
        assert InterviewType.BEHAVIORAL == "behavioral"
        assert InterviewType.HR == "hr"
        assert InterviewType.FINAL == "final"
    
    def test_interview_place_enum(self):
        """Test InterviewPlace enum values."""
        assert InterviewPlace.PHONE == "phone"
        assert InterviewPlace.VIDEO == "video"
        assert InterviewPlace.ONSITE == "onsite"
    
    def test_interview_outcome_enum(self):
        """Test InterviewOutcome enum values."""
        assert InterviewOutcome.PENDING == "pending"
        assert InterviewOutcome.PASSED == "passed"
        assert InterviewOutcome.FAILED == "failed"
        assert InterviewOutcome.CANCELLED == "cancelled"