"""
Test configuration and fixtures.
"""
import os
import pytest
from datetime import datetime, date, timedelta
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from passlib.context import CryptContext

from app.main import app
from app.models.base import Base
from app.models.user import User
from app.models.position import Position
from app.models.interview import Interview
from app.core.database import get_db
from app.core.config import settings
from app.core.auth import create_access_token
from app.schemas.enums import PositionStatus, InterviewType, InterviewPlace, InterviewOutcome


# Set test environment variables
os.environ["SECRET_KEY"] = "test-secret-key-for-jwt-tokens-in-testing-environment"
os.environ["TESTING"] = "true"

# Reload settings to pick up test environment variables
settings.SECRET_KEY = "test-secret-key-for-jwt-tokens-in-testing-environment"
settings.TESTING = True

# Create in-memory SQLite database for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def override_get_db():
    """Override database dependency for testing."""
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


@pytest.fixture(scope="function")
def db_session():
    """Create a fresh database session for each test."""
    # Create all tables
    Base.metadata.create_all(bind=engine)
    
    # Create session
    session = TestingSessionLocal()
    
    try:
        yield session
    finally:
        session.close()
        # Drop all tables after test
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db_session):
    """Create a test client with database dependency override."""
    app.dependency_overrides[get_db] = lambda: db_session
    
    with TestClient(app) as test_client:
        yield test_client
    
    # Clean up dependency overrides
    app.dependency_overrides.clear()


@pytest.fixture
def test_user(db_session):
    """Create a test user."""
    user = User(
        email="test@example.com",
        password_hash=pwd_context.hash("testpassword123"),
        first_name="Test",
        last_name="User"
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def test_user_2(db_session):
    """Create a second test user for authorization tests."""
    user = User(
        email="test2@example.com",
        password_hash=pwd_context.hash("testpassword123"),
        first_name="Test",
        last_name="User2"
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def auth_headers(test_user):
    """Create authentication headers for test user."""
    token = create_access_token(data={"sub": str(test_user.id)})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def auth_headers_user_2(test_user_2):
    """Create authentication headers for second test user."""
    token = create_access_token(data={"sub": str(test_user_2.id)})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def test_position(db_session, test_user):
    """Create a test position."""
    position = Position(
        user_id=test_user.id,
        title="Software Engineer",
        company="Tech Corp",
        description="Full-stack development role",
        location="San Francisco, CA",
        salary_range="$100k - $150k",
        status=PositionStatus.APPLIED,
        application_date=date.today()
    )
    db_session.add(position)
    db_session.commit()
    db_session.refresh(position)
    return position


@pytest.fixture
def test_positions(db_session, test_user):
    """Create multiple test positions with different statuses."""
    positions = []
    
    # Position 1 - Applied
    pos1 = Position(
        user_id=test_user.id,
        title="Frontend Developer",
        company="StartupCo",
        description="React development",
        location="Remote",
        salary_range="$80k - $120k",
        status=PositionStatus.APPLIED,
        application_date=date.today() - timedelta(days=10)
    )
    positions.append(pos1)
    
    # Position 2 - Interviewing
    pos2 = Position(
        user_id=test_user.id,
        title="Backend Engineer",
        company="BigTech",
        description="Python/Django development",
        location="New York, NY",
        salary_range="$120k - $180k",
        status=PositionStatus.INTERVIEWING,
        application_date=date.today() - timedelta(days=5)
    )
    positions.append(pos2)
    
    # Position 3 - Rejected
    pos3 = Position(
        user_id=test_user.id,
        title="DevOps Engineer",
        company="CloudCorp",
        description="AWS/Kubernetes",
        location="Seattle, WA",
        salary_range="$110k - $160k",
        status=PositionStatus.REJECTED,
        application_date=date.today() - timedelta(days=15)
    )
    positions.append(pos3)
    
    for pos in positions:
        db_session.add(pos)
    
    db_session.commit()
    
    for pos in positions:
        db_session.refresh(pos)
    
    return positions


@pytest.fixture
def test_interview(db_session, test_position):
    """Create a test interview."""
    interview = Interview(
        position_id=test_position.id,
        type=InterviewType.TECHNICAL,
        place=InterviewPlace.VIDEO,
        scheduled_date=datetime.now() + timedelta(days=1),
        duration_minutes=60,
        notes="Technical screening",
        outcome=InterviewOutcome.PENDING
    )
    db_session.add(interview)
    db_session.commit()
    db_session.refresh(interview)
    return interview


@pytest.fixture
def test_interviews(db_session, test_positions):
    """Create multiple test interviews for different positions."""
    interviews = []
    
    # Interview for position 1
    interview1 = Interview(
        position_id=test_positions[0].id,
        type=InterviewType.HR,
        place=InterviewPlace.PHONE,
        scheduled_date=datetime.now() - timedelta(days=2),
        duration_minutes=30,
        notes="Initial screening",
        outcome=InterviewOutcome.PASSED
    )
    interviews.append(interview1)
    
    # Interview for position 2
    interview2 = Interview(
        position_id=test_positions[1].id,
        type=InterviewType.TECHNICAL,
        place=InterviewPlace.VIDEO,
        scheduled_date=datetime.now() + timedelta(days=1),
        duration_minutes=90,
        notes="Technical assessment",
        outcome=InterviewOutcome.PENDING
    )
    interviews.append(interview2)
    
    for interview in interviews:
        db_session.add(interview)
    
    db_session.commit()
    
    for interview in interviews:
        db_session.refresh(interview)
    
    return interviews