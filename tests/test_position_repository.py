"""
Unit tests for position repository filtering and pagination functionality.
"""
import pytest
from datetime import date
from uuid import uuid4
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.position import Position, PositionStatus
from app.repositories.position_repository import PositionRepository


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
def position_repo(db_session: Session):
    """Create a position repository instance."""
    return PositionRepository(db_session)


@pytest.fixture
def sample_positions(db_session: Session, test_user: User):
    """Create sample positions for testing."""
    positions = [
        Position(
            user_id=test_user.id,
            title="Senior Python Developer",
            company="Tech Corp",
            description="Backend development with Python and Django",
            location="San Francisco, CA",
            salary_range="$120k - $150k",
            status=PositionStatus.APPLIED,
            application_date=date(2024, 1, 10)
        ),
        Position(
            user_id=test_user.id,
            title="Frontend Engineer",
            company="StartupXYZ",
            description="React and TypeScript development",
            location="Remote",
            salary_range="$100k - $130k",
            status=PositionStatus.INTERVIEWING,
            application_date=date(2024, 1, 15)
        ),
        Position(
            user_id=test_user.id,
            title="Full Stack Developer",
            company="Tech Corp",
            description="Full stack development with modern technologies",
            location="New York, NY",
            salary_range="$110k - $140k",
            status=PositionStatus.REJECTED,
            application_date=date(2024, 1, 20)
        ),
        Position(
            user_id=test_user.id,
            title="DevOps Engineer",
            company="CloudCorp",
            description="Infrastructure and deployment automation",
            location="Austin, TX",
            salary_range="$130k - $160k",
            status=PositionStatus.OFFER,
            application_date=date(2024, 1, 25)
        ),
        Position(
            user_id=test_user.id,
            title="Data Scientist",
            company="DataTech",
            description="Machine learning and data analysis",
            location="Boston, MA",
            salary_range="$140k - $170k",
            status=PositionStatus.APPLIED,
            application_date=date(2024, 1, 30)
        )
    ]
    
    db_session.add_all(positions)
    db_session.commit()
    
    for position in positions:
        db_session.refresh(position)
    
    return positions


class TestPositionRepositoryFiltering:
    """Test cases for position repository filtering functionality."""
    
    def test_get_all_for_user_no_filters(self, position_repo: PositionRepository, test_user: User, sample_positions: list):
        """Test getting all positions without any filters."""
        positions, total = position_repo.get_all_for_user(test_user.id)
        
        assert total == 5
        assert len(positions) == 5
        # Should be sorted by application_date desc by default
        assert positions[0].application_date == date(2024, 1, 30)
        assert positions[-1].application_date == date(2024, 1, 10)
    
    def test_filter_by_status(self, position_repo: PositionRepository, test_user: User, sample_positions: list):
        """Test filtering positions by status."""
        # Filter by APPLIED status
        positions, total = position_repo.get_all_for_user(
            test_user.id,
            status=PositionStatus.APPLIED
        )
        
        assert total == 2
        assert len(positions) == 2
        assert all(pos.status == PositionStatus.APPLIED for pos in positions)
        
        # Filter by INTERVIEWING status
        positions, total = position_repo.get_all_for_user(
            test_user.id,
            status=PositionStatus.INTERVIEWING
        )
        
        assert total == 1
        assert len(positions) == 1
        assert positions[0].status == PositionStatus.INTERVIEWING
    
    def test_filter_by_company(self, position_repo: PositionRepository, test_user: User, sample_positions: list):
        """Test filtering positions by company name."""
        # Filter by exact company name
        positions, total = position_repo.get_all_for_user(
            test_user.id,
            company="Tech Corp"
        )
        
        assert total == 2
        assert len(positions) == 2
        assert all("Tech Corp" in pos.company for pos in positions)
        
        # Filter by partial company name
        positions, total = position_repo.get_all_for_user(
            test_user.id,
            company="Tech"
        )
        
        assert total == 3  # Tech Corp + DataTech
        assert len(positions) == 3
    
    def test_filter_by_date_range(self, position_repo: PositionRepository, test_user: User, sample_positions: list):
        """Test filtering positions by date range."""
        # Filter by date_from only
        positions, total = position_repo.get_all_for_user(
            test_user.id,
            date_from=date(2024, 1, 20)
        )
        
        assert total == 3  # Positions from 2024-01-20 onwards
        assert len(positions) == 3
        
        # Filter by date_to only
        positions, total = position_repo.get_all_for_user(
            test_user.id,
            date_to=date(2024, 1, 15)
        )
        
        assert total == 2  # Positions up to 2024-01-15
        assert len(positions) == 2
        
        # Filter by date range
        positions, total = position_repo.get_all_for_user(
            test_user.id,
            date_from=date(2024, 1, 15),
            date_to=date(2024, 1, 25)
        )
        
        assert total == 3  # Positions between 2024-01-15 and 2024-01-25
        assert len(positions) == 3
    
    def test_search_functionality(self, position_repo: PositionRepository, test_user: User, sample_positions: list):
        """Test search functionality across title, company, and description."""
        # Search in title
        positions, total = position_repo.get_all_for_user(
            test_user.id,
            search="Python"
        )
        
        assert total == 1
        assert len(positions) == 1
        assert "Python" in positions[0].title
        
        # Search in company
        positions, total = position_repo.get_all_for_user(
            test_user.id,
            search="StartupXYZ"
        )
        
        assert total == 1
        assert len(positions) == 1
        assert positions[0].company == "StartupXYZ"
        
        # Search in description
        positions, total = position_repo.get_all_for_user(
            test_user.id,
            search="React"
        )
        
        assert total == 1
        assert len(positions) == 1
        assert "React" in positions[0].description
        
        # Search with no matches
        positions, total = position_repo.get_all_for_user(
            test_user.id,
            search="NonExistentTerm"
        )
        
        assert total == 0
        assert len(positions) == 0
    
    def test_combined_filters(self, position_repo: PositionRepository, test_user: User, sample_positions: list):
        """Test combining multiple filters."""
        # Combine status and company filters
        positions, total = position_repo.get_all_for_user(
            test_user.id,
            status=PositionStatus.APPLIED,
            company="Tech Corp"
        )
        
        # Should find the Senior Python Developer at Tech Corp with APPLIED status
        assert total == 1
        assert len(positions) == 1
        assert positions[0].status == PositionStatus.APPLIED
        assert positions[0].company == "Tech Corp"
        
        # Combine date range and search
        positions, total = position_repo.get_all_for_user(
            test_user.id,
            date_from=date(2024, 1, 15),
            search="Engineer"
        )
        
        # Should find Frontend Engineer and DevOps Engineer
        assert total == 2
        assert len(positions) == 2
        assert all("Engineer" in pos.title for pos in positions)


class TestPositionRepositorySorting:
    """Test cases for position repository sorting functionality."""
    
    def test_sort_by_application_date(self, position_repo: PositionRepository, test_user: User, sample_positions: list):
        """Test sorting by application date."""
        # Sort by application_date ascending
        positions, total = position_repo.get_all_for_user(
            test_user.id,
            sort_by="application_date",
            sort_order="asc"
        )
        
        assert total == 5
        assert positions[0].application_date == date(2024, 1, 10)
        assert positions[-1].application_date == date(2024, 1, 30)
        
        # Sort by application_date descending (default)
        positions, total = position_repo.get_all_for_user(
            test_user.id,
            sort_by="application_date",
            sort_order="desc"
        )
        
        assert total == 5
        assert positions[0].application_date == date(2024, 1, 30)
        assert positions[-1].application_date == date(2024, 1, 10)
    
    def test_sort_by_title(self, position_repo: PositionRepository, test_user: User, sample_positions: list):
        """Test sorting by title."""
        # Sort by title ascending
        positions, total = position_repo.get_all_for_user(
            test_user.id,
            sort_by="title",
            sort_order="asc"
        )
        
        assert total == 5
        # Should be alphabetically sorted
        titles = [pos.title for pos in positions]
        assert titles == sorted(titles)
        
        # Sort by title descending
        positions, total = position_repo.get_all_for_user(
            test_user.id,
            sort_by="title",
            sort_order="desc"
        )
        
        assert total == 5
        titles = [pos.title for pos in positions]
        assert titles == sorted(titles, reverse=True)
    
    def test_sort_by_company(self, position_repo: PositionRepository, test_user: User, sample_positions: list):
        """Test sorting by company."""
        # Sort by company ascending
        positions, total = position_repo.get_all_for_user(
            test_user.id,
            sort_by="company",
            sort_order="asc"
        )
        
        assert total == 5
        companies = [pos.company for pos in positions]
        assert companies == sorted(companies)
    
    def test_invalid_sort_field_fallback(self, position_repo: PositionRepository, test_user: User, sample_positions: list):
        """Test that invalid sort field falls back to default."""
        # Use invalid sort field - should fallback to application_date
        positions, total = position_repo.get_all_for_user(
            test_user.id,
            sort_by="invalid_field",
            sort_order="desc"
        )
        
        assert total == 5
        # Should still be sorted by application_date desc (default behavior)
        assert positions[0].application_date >= positions[1].application_date


class TestPositionRepositoryPagination:
    """Test cases for position repository pagination functionality."""
    
    def test_basic_pagination(self, position_repo: PositionRepository, test_user: User, sample_positions: list):
        """Test basic pagination functionality."""
        # First page with 2 items per page
        positions, total = position_repo.get_all_for_user(
            test_user.id,
            skip=0,
            limit=2
        )
        
        assert total == 5
        assert len(positions) == 2
        
        # Second page with 2 items per page
        positions, total = position_repo.get_all_for_user(
            test_user.id,
            skip=2,
            limit=2
        )
        
        assert total == 5
        assert len(positions) == 2
        
        # Third page with 2 items per page (should have 1 item)
        positions, total = position_repo.get_all_for_user(
            test_user.id,
            skip=4,
            limit=2
        )
        
        assert total == 5
        assert len(positions) == 1
    
    def test_pagination_with_filters(self, position_repo: PositionRepository, test_user: User, sample_positions: list):
        """Test pagination combined with filters."""
        # Filter by company and paginate
        positions, total = position_repo.get_all_for_user(
            test_user.id,
            company="Tech",
            skip=0,
            limit=2
        )
        
        # Should find 3 positions with "Tech" in company name
        assert total == 3
        assert len(positions) == 2  # First page with 2 items
        
        # Second page
        positions, total = position_repo.get_all_for_user(
            test_user.id,
            company="Tech",
            skip=2,
            limit=2
        )
        
        assert total == 3
        assert len(positions) == 1  # Remaining item
    
    def test_pagination_beyond_available_data(self, position_repo: PositionRepository, test_user: User, sample_positions: list):
        """Test pagination when requesting beyond available data."""
        # Request page that doesn't exist
        positions, total = position_repo.get_all_for_user(
            test_user.id,
            skip=10,
            limit=2
        )
        
        assert total == 5
        assert len(positions) == 0  # No positions on this page
    
    def test_large_limit(self, position_repo: PositionRepository, test_user: User, sample_positions: list):
        """Test pagination with limit larger than available data."""
        positions, total = position_repo.get_all_for_user(
            test_user.id,
            skip=0,
            limit=100
        )
        
        assert total == 5
        assert len(positions) == 5  # All available positions


class TestPositionRepositoryUserIsolation:
    """Test cases for ensuring user data isolation."""
    
    def test_user_data_isolation(self, db_session: Session, position_repo: PositionRepository):
        """Test that users can only access their own positions."""
        # Create two users
        user1 = User(
            email="user1@example.com",
            password_hash="hashed_password",
            first_name="User",
            last_name="One"
        )
        user2 = User(
            email="user2@example.com",
            password_hash="hashed_password",
            first_name="User",
            last_name="Two"
        )
        db_session.add_all([user1, user2])
        db_session.commit()
        db_session.refresh(user1)
        db_session.refresh(user2)
        
        # Create positions for each user
        position1 = Position(
            user_id=user1.id,
            title="User 1 Position",
            company="Company 1",
            status=PositionStatus.APPLIED,
            application_date=date(2024, 1, 15)
        )
        position2 = Position(
            user_id=user2.id,
            title="User 2 Position",
            company="Company 2",
            status=PositionStatus.APPLIED,
            application_date=date(2024, 1, 16)
        )
        db_session.add_all([position1, position2])
        db_session.commit()
        
        # User 1 should only see their own position
        positions, total = position_repo.get_all_for_user(user1.id)
        assert total == 1
        assert len(positions) == 1
        assert positions[0].title == "User 1 Position"
        
        # User 2 should only see their own position
        positions, total = position_repo.get_all_for_user(user2.id)
        assert total == 1
        assert len(positions) == 1
        assert positions[0].title == "User 2 Position"