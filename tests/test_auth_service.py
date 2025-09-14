"""
Tests for authentication service.
"""
import pytest
from uuid import uuid4
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException
from app.services.auth_service import AuthService
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin
from app.core.config import settings


class TestAuthService:
    """Test authentication service functionality."""
    
    @pytest.fixture
    def mock_db(self, mocker):
        """Create a mock database session."""
        return mocker.Mock(spec=Session)
    
    @pytest.fixture
    def auth_service(self, mock_db):
        """Create an AuthService instance with mock database."""
        return AuthService(mock_db)
    
    @pytest.fixture
    def user_create_data(self):
        """Test user creation data."""
        return UserCreate(
            email="test@example.com",
            password="testpassword123",
            first_name="Test",
            last_name="User"
        )
    
    @pytest.fixture
    def user_login_data(self):
        """Test user login data."""
        return UserLogin(
            email="test@example.com",
            password="testpassword123"
        )
    
    @pytest.fixture
    def mock_user(self):
        """Create a mock user."""
        return User(
            id=uuid4(),
            email="test@example.com",
            password_hash="$2b$12$hashed_password_here",
            first_name="Test",
            last_name="User"
        )
    
    def test_register_user_success(self, auth_service, mock_db, user_create_data):
        """Test successful user registration."""
        # Mock database queries
        mock_query = mock_db.query.return_value
        mock_filter = mock_query.filter.return_value
        mock_filter.first.return_value = None  # No existing user
        
        # Mock successful database operations
        mock_db.add.return_value = None
        mock_db.commit.return_value = None
        
        # Create a mock user to return after refresh
        created_user = User(
            id=uuid4(),
            email=user_create_data.email,
            password_hash="hashed_password",
            first_name=user_create_data.first_name,
            last_name=user_create_data.last_name
        )
        mock_db.refresh.return_value = None
        mock_db.refresh.side_effect = lambda user: setattr(user, 'id', created_user.id)
        
        result = auth_service.register_user(user_create_data)
        
        # Verify database operations
        mock_db.query.assert_called_once_with(User)
        mock_db.add.assert_called_once()
        mock_db.commit.assert_called_once()
        mock_db.refresh.assert_called_once()
        
        # Verify user data
        assert result.email == user_create_data.email
        assert result.first_name == user_create_data.first_name
        assert result.last_name == user_create_data.last_name
        assert result.password_hash != user_create_data.password  # Should be hashed
    
    def test_register_user_email_exists(self, auth_service, mock_db, user_create_data, mock_user):
        """Test user registration with existing email."""
        # Mock existing user found
        mock_query = mock_db.query.return_value
        mock_filter = mock_query.filter.return_value
        mock_filter.first.return_value = mock_user
        
        with pytest.raises(HTTPException) as exc_info:
            auth_service.register_user(user_create_data)
        
        assert exc_info.value.status_code == 409
        assert "Email already registered" in exc_info.value.detail
        
        # Should not attempt to add user to database
        mock_db.add.assert_not_called()
    
    def test_register_user_integrity_error(self, auth_service, mock_db, user_create_data):
        """Test user registration with database integrity error."""
        # Mock no existing user initially
        mock_query = mock_db.query.return_value
        mock_filter = mock_query.filter.return_value
        mock_filter.first.return_value = None
        
        # Mock integrity error on commit
        mock_db.commit.side_effect = IntegrityError("", "", "")
        
        with pytest.raises(HTTPException) as exc_info:
            auth_service.register_user(user_create_data)
        
        assert exc_info.value.status_code == 409
        assert "Email already registered" in exc_info.value.detail
        
        # Should rollback transaction
        mock_db.rollback.assert_called_once()
    
    def test_authenticate_user_success(self, auth_service, mock_db, user_login_data, mocker):
        """Test successful user authentication."""
        # Create a user with properly hashed password
        from app.core.auth import get_password_hash
        hashed_password = get_password_hash(user_login_data.password)
        
        mock_user = User(
            id=uuid4(),
            email=user_login_data.email,
            password_hash=hashed_password,
            first_name="Test",
            last_name="User"
        )
        
        # Mock database query
        mock_query = mock_db.query.return_value
        mock_filter = mock_query.filter.return_value
        mock_filter.first.return_value = mock_user
        
        result = auth_service.authenticate_user(user_login_data)
        
        assert result == mock_user
        mock_db.query.assert_called_once_with(User)
    
    def test_authenticate_user_not_found(self, auth_service, mock_db, user_login_data):
        """Test authentication with non-existent user."""
        # Mock user not found
        mock_query = mock_db.query.return_value
        mock_filter = mock_query.filter.return_value
        mock_filter.first.return_value = None
        
        result = auth_service.authenticate_user(user_login_data)
        
        assert result is None
    
    def test_authenticate_user_wrong_password(self, auth_service, mock_db, user_login_data):
        """Test authentication with wrong password."""
        from app.core.auth import get_password_hash
        
        # Create user with different password
        wrong_password_hash = get_password_hash("wrongpassword")
        mock_user = User(
            id=uuid4(),
            email=user_login_data.email,
            password_hash=wrong_password_hash,
            first_name="Test",
            last_name="User"
        )
        
        # Mock database query
        mock_query = mock_db.query.return_value
        mock_filter = mock_query.filter.return_value
        mock_filter.first.return_value = mock_user
        
        result = auth_service.authenticate_user(user_login_data)
        
        assert result is None
    
    def test_create_access_token_for_user(self, auth_service, mock_user):
        """Test access token creation for user."""
        original_secret = settings.SECRET_KEY
        settings.SECRET_KEY = "test-secret-key-for-testing"
        
        try:
            result = auth_service.create_access_token_for_user(mock_user)
            
            assert result.access_token is not None
            assert isinstance(result.access_token, str)
            assert len(result.access_token) > 0
            assert result.token_type == "bearer"
            assert result.expires_in == settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
        finally:
            settings.SECRET_KEY = original_secret
    
    def test_login_user_success(self, auth_service, mock_db, user_login_data, mocker):
        """Test successful user login."""
        original_secret = settings.SECRET_KEY
        settings.SECRET_KEY = "test-secret-key-for-testing"
        
        try:
            # Mock successful authentication
            mock_user = User(
                id=uuid4(),
                email=user_login_data.email,
                password_hash="hashed_password",
                first_name="Test",
                last_name="User"
            )
            
            mocker.patch.object(
                auth_service, 
                'authenticate_user', 
                return_value=mock_user
            )
            
            result = auth_service.login_user(user_login_data)
            
            assert result.access_token is not None
            assert result.token_type == "bearer"
            assert result.expires_in > 0
        finally:
            settings.SECRET_KEY = original_secret
    
    def test_login_user_invalid_credentials(self, auth_service, user_login_data, mocker):
        """Test login with invalid credentials."""
        # Mock failed authentication
        mocker.patch.object(
            auth_service, 
            'authenticate_user', 
            return_value=None
        )
        
        with pytest.raises(HTTPException) as exc_info:
            auth_service.login_user(user_login_data)
        
        assert exc_info.value.status_code == 401
        assert "Incorrect email or password" in exc_info.value.detail