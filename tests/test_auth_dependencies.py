"""
Tests for authentication dependencies and middleware.
"""
import pytest
from uuid import uuid4
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.core.dependencies import get_current_user_id, get_current_user, get_current_user_optional
from app.core.auth import create_access_token
from app.core.config import settings
from app.models.user import User


class TestAuthenticationDependencies:
    """Test authentication dependency functions."""
    
    @pytest.fixture
    def mock_user(self):
        """Create a mock user for testing."""
        return User(
            id=uuid4(),
            email="test@example.com",
            password_hash="hashed_password",
            first_name="Test",
            last_name="User"
        )
    
    @pytest.fixture
    def valid_token(self, mock_user):
        """Create a valid JWT token for testing."""
        original_secret = settings.SECRET_KEY
        settings.SECRET_KEY = "test-secret-key-for-testing"
        
        try:
            token = create_access_token(data={"sub": str(mock_user.id)})
            return token
        finally:
            settings.SECRET_KEY = original_secret
    
    @pytest.fixture
    def invalid_token(self):
        """Create an invalid JWT token for testing."""
        return "invalid.jwt.token"
    
    @pytest.mark.asyncio
    async def test_get_current_user_id_success(self, valid_token):
        """Test successful user ID extraction from valid token."""
        original_secret = settings.SECRET_KEY
        settings.SECRET_KEY = "test-secret-key-for-testing"
        
        try:
            credentials = HTTPAuthorizationCredentials(
                scheme="Bearer",
                credentials=valid_token
            )
            
            user_id = await get_current_user_id(credentials)
            
            assert user_id is not None
            assert isinstance(user_id, type(uuid4()))
        finally:
            settings.SECRET_KEY = original_secret
    
    @pytest.mark.asyncio
    async def test_get_current_user_id_invalid_token(self, invalid_token):
        """Test user ID extraction with invalid token raises exception."""
        credentials = HTTPAuthorizationCredentials(
            scheme="Bearer",
            credentials=invalid_token
        )
        
        with pytest.raises(HTTPException) as exc_info:
            await get_current_user_id(credentials)
        
        assert exc_info.value.status_code == 401
        assert "Could not validate credentials" in exc_info.value.detail
    
    @pytest.mark.asyncio
    async def test_get_current_user_id_malformed_uuid(self):
        """Test user ID extraction with token containing invalid UUID."""
        original_secret = settings.SECRET_KEY
        settings.SECRET_KEY = "test-secret-key-for-testing"
        
        try:
            # Create token with invalid UUID
            token = create_access_token(data={"sub": "not-a-valid-uuid"})
            credentials = HTTPAuthorizationCredentials(
                scheme="Bearer",
                credentials=token
            )
            
            with pytest.raises(HTTPException) as exc_info:
                await get_current_user_id(credentials)
            
            assert exc_info.value.status_code == 401
        finally:
            settings.SECRET_KEY = original_secret
    
    @pytest.mark.asyncio
    async def test_get_current_user_success(self, mock_user, valid_token, mocker):
        """Test successful user retrieval from database."""
        original_secret = settings.SECRET_KEY
        settings.SECRET_KEY = "test-secret-key-for-testing"
        
        try:
            # Mock database session
            mock_db = mocker.Mock(spec=Session)
            mock_query = mock_db.query.return_value
            mock_filter = mock_query.filter.return_value
            mock_filter.first.return_value = mock_user
            
            # Mock get_current_user_id dependency
            mocker.patch(
                'app.core.dependencies.get_current_user_id',
                return_value=mock_user.id
            )
            
            user = await get_current_user(user_id=mock_user.id, db=mock_db)
            
            assert user == mock_user
            mock_db.query.assert_called_once_with(User)
        finally:
            settings.SECRET_KEY = original_secret
    
    @pytest.mark.asyncio
    async def test_get_current_user_not_found(self, mocker):
        """Test user retrieval when user not found in database."""
        user_id = uuid4()
        
        # Mock database session
        mock_db = mocker.Mock(spec=Session)
        mock_query = mock_db.query.return_value
        mock_filter = mock_query.filter.return_value
        mock_filter.first.return_value = None  # User not found
        
        with pytest.raises(HTTPException) as exc_info:
            await get_current_user(user_id=user_id, db=mock_db)
        
        assert exc_info.value.status_code == 401
        assert "User not found" in exc_info.value.detail
    
    @pytest.mark.asyncio
    async def test_get_current_user_optional_with_valid_token(self, mock_user, valid_token, mocker):
        """Test optional user retrieval with valid token."""
        original_secret = settings.SECRET_KEY
        settings.SECRET_KEY = "test-secret-key-for-testing"
        
        try:
            credentials = HTTPAuthorizationCredentials(
                scheme="Bearer",
                credentials=valid_token
            )
            
            # Mock database session
            mock_db = mocker.Mock(spec=Session)
            mock_query = mock_db.query.return_value
            mock_filter = mock_query.filter.return_value
            mock_filter.first.return_value = mock_user
            
            user = await get_current_user_optional(credentials=credentials, db=mock_db)
            
            assert user == mock_user
        finally:
            settings.SECRET_KEY = original_secret
    
    @pytest.mark.asyncio
    async def test_get_current_user_optional_no_credentials(self, mocker):
        """Test optional user retrieval with no credentials."""
        mock_db = mocker.Mock(spec=Session)
        
        user = await get_current_user_optional(credentials=None, db=mock_db)
        
        assert user is None
        # Database should not be queried
        mock_db.query.assert_not_called()
    
    @pytest.mark.asyncio
    async def test_get_current_user_optional_invalid_token(self, invalid_token, mocker):
        """Test optional user retrieval with invalid token."""
        credentials = HTTPAuthorizationCredentials(
            scheme="Bearer",
            credentials=invalid_token
        )
        
        mock_db = mocker.Mock(spec=Session)
        
        user = await get_current_user_optional(credentials=credentials, db=mock_db)
        
        assert user is None
    
    @pytest.mark.asyncio
    async def test_get_current_user_optional_user_not_found(self, valid_token, mocker):
        """Test optional user retrieval when user not found in database."""
        original_secret = settings.SECRET_KEY
        settings.SECRET_KEY = "test-secret-key-for-testing"
        
        try:
            credentials = HTTPAuthorizationCredentials(
                scheme="Bearer",
                credentials=valid_token
            )
            
            # Mock database session - user not found
            mock_db = mocker.Mock(spec=Session)
            mock_query = mock_db.query.return_value
            mock_filter = mock_query.filter.return_value
            mock_filter.first.return_value = None
            
            user = await get_current_user_optional(credentials=credentials, db=mock_db)
            
            assert user is None
        finally:
            settings.SECRET_KEY = original_secret