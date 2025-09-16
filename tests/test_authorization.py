"""
Tests for authorization and data isolation functionality.
"""
import pytest
from uuid import uuid4, UUID
from unittest.mock import Mock, MagicMock
from sqlalchemy.orm import Session
from fastapi import Request

from app.core.authorization import (
    UserContext,
    get_user_context,
    get_user_context_with_user,
    verify_position_ownership,
    verify_interview_ownership,
    AuthorizationService,
    user_context_middleware,
    get_request_user_context
)
from app.core.exceptions import AuthorizationException
from app.models.user import User
from app.models.position import Position
from app.models.interview import Interview


class TestUserContext:
    """Test UserContext class."""
    
    def test_user_context_creation(self):
        """Test creating a UserContext object."""
        user_id = uuid4()
        context = UserContext(user_id=user_id)
        
        assert context.user_id == user_id
        assert context.user is None
    
    def test_user_context_with_user(self):
        """Test creating a UserContext object with user data."""
        user_id = uuid4()
        user = Mock(spec=User)
        user.id = user_id
        
        context = UserContext(user_id=user_id, user=user)
        
        assert context.user_id == user_id
        assert context.user == user
    
    def test_user_context_string_representation(self):
        """Test string representation of UserContext."""
        user_id = uuid4()
        context = UserContext(user_id=user_id)
        
        assert str(context) == f"UserContext(user_id={user_id})"
        assert repr(context) == f"UserContext(user_id={user_id})"


class TestVerificationFunctions:
    """Test ownership verification functions."""
    
    def test_verify_position_ownership_success(self):
        """Test successful position ownership verification."""
        user_id = uuid4()
        position = Mock(spec=Position)
        position.user_id = user_id
        context = UserContext(user_id=user_id)
        
        # Should not raise an exception
        verify_position_ownership(position, context)
    
    def test_verify_position_ownership_failure(self):
        """Test position ownership verification failure."""
        user_id = uuid4()
        other_user_id = uuid4()
        position = Mock(spec=Position)
        position.user_id = other_user_id
        context = UserContext(user_id=user_id)
        
        with pytest.raises(AuthorizationException) as exc_info:
            verify_position_ownership(position, context)
        
        assert exc_info.value.status_code == 403
        assert "Access denied to this position" in exc_info.value.detail
        assert exc_info.value.context["resource_type"] == "Position"
    
    def test_verify_interview_ownership_success(self):
        """Test successful interview ownership verification."""
        user_id = uuid4()
        position_id = uuid4()
        
        position = Mock(spec=Position)
        position.id = position_id
        position.user_id = user_id
        
        interview = Mock(spec=Interview)
        interview.position_id = position_id
        
        context = UserContext(user_id=user_id)
        
        # Should not raise an exception
        verify_interview_ownership(interview, position, context)
    
    def test_verify_interview_ownership_wrong_user(self):
        """Test interview ownership verification with wrong user."""
        user_id = uuid4()
        other_user_id = uuid4()
        position_id = uuid4()
        
        position = Mock(spec=Position)
        position.id = position_id
        position.user_id = other_user_id
        
        interview = Mock(spec=Interview)
        interview.position_id = position_id
        
        context = UserContext(user_id=user_id)
        
        with pytest.raises(AuthorizationException) as exc_info:
            verify_interview_ownership(interview, position, context)
        
        assert exc_info.value.status_code == 403
        assert "Access denied to this interview" in exc_info.value.detail
    
    def test_verify_interview_ownership_wrong_position(self):
        """Test interview ownership verification with wrong position."""
        user_id = uuid4()
        position_id = uuid4()
        other_position_id = uuid4()
        
        position = Mock(spec=Position)
        position.id = position_id
        position.user_id = user_id
        
        interview = Mock(spec=Interview)
        interview.position_id = other_position_id
        
        context = UserContext(user_id=user_id)
        
        with pytest.raises(AuthorizationException) as exc_info:
            verify_interview_ownership(interview, position, context)
        
        assert exc_info.value.status_code == 403
        assert "Interview does not belong to the specified position" in exc_info.value.detail


class TestAuthorizationService:
    """Test AuthorizationService class."""
    
    @pytest.fixture
    def mock_db(self):
        """Create a mock database session."""
        return Mock(spec=Session)
    
    @pytest.fixture
    def auth_service(self, mock_db):
        """Create an AuthorizationService instance."""
        return AuthorizationService(mock_db)
    
    def test_can_access_position_success(self, auth_service, mock_db):
        """Test successful position access check."""
        user_id = uuid4()
        position_id = uuid4()
        
        # Mock the query chain
        mock_query = Mock()
        mock_filter = Mock()
        mock_position = Mock(spec=Position)
        
        mock_db.query.return_value = mock_query
        mock_query.filter.return_value = mock_filter
        mock_filter.first.return_value = mock_position
        
        result = auth_service.can_access_position(position_id, user_id)
        
        assert result is True
        mock_db.query.assert_called_once_with(Position)
    
    def test_can_access_position_failure(self, auth_service, mock_db):
        """Test failed position access check."""
        user_id = uuid4()
        position_id = uuid4()
        
        # Mock the query chain to return None
        mock_query = Mock()
        mock_filter = Mock()
        
        mock_db.query.return_value = mock_query
        mock_query.filter.return_value = mock_filter
        mock_filter.first.return_value = None
        
        result = auth_service.can_access_position(position_id, user_id)
        
        assert result is False
    
    def test_can_access_interview_success(self, auth_service, mock_db):
        """Test successful interview access check."""
        user_id = uuid4()
        interview_id = uuid4()
        
        # Mock the query chain
        mock_query = Mock()
        mock_join = Mock()
        mock_filter = Mock()
        mock_interview = Mock(spec=Interview)
        
        mock_db.query.return_value = mock_query
        mock_query.join.return_value = mock_join
        mock_join.filter.return_value = mock_filter
        mock_filter.first.return_value = mock_interview
        
        result = auth_service.can_access_interview(interview_id, user_id)
        
        assert result is True
        mock_db.query.assert_called_once_with(Interview)
    
    def test_can_access_interview_failure(self, auth_service, mock_db):
        """Test failed interview access check."""
        user_id = uuid4()
        interview_id = uuid4()
        
        # Mock the query chain to return None
        mock_query = Mock()
        mock_join = Mock()
        mock_filter = Mock()
        
        mock_db.query.return_value = mock_query
        mock_query.join.return_value = mock_join
        mock_join.filter.return_value = mock_filter
        mock_filter.first.return_value = None
        
        result = auth_service.can_access_interview(interview_id, user_id)
        
        assert result is False
    
    def test_get_user_position_success(self, auth_service, mock_db):
        """Test successful user position retrieval."""
        user_id = uuid4()
        position_id = uuid4()
        
        # Mock the query chain
        mock_query = Mock()
        mock_filter = Mock()
        mock_position = Mock(spec=Position)
        
        mock_db.query.return_value = mock_query
        mock_query.filter.return_value = mock_filter
        mock_filter.first.return_value = mock_position
        
        result = auth_service.get_user_position(position_id, user_id)
        
        assert result == mock_position
    
    def test_get_user_position_not_found(self, auth_service, mock_db):
        """Test user position retrieval when not found."""
        user_id = uuid4()
        position_id = uuid4()
        
        # Mock the query chain to return None
        mock_query = Mock()
        mock_filter = Mock()
        
        mock_db.query.return_value = mock_query
        mock_query.filter.return_value = mock_filter
        mock_filter.first.return_value = None
        
        result = auth_service.get_user_position(position_id, user_id)
        
        assert result is None
    
    def test_get_user_interview_success(self, auth_service, mock_db):
        """Test successful user interview retrieval."""
        user_id = uuid4()
        interview_id = uuid4()
        
        # Mock the query chain
        mock_query = Mock()
        mock_join = Mock()
        mock_filter = Mock()
        mock_interview = Mock(spec=Interview)
        mock_position = Mock(spec=Position)
        
        mock_db.query.return_value = mock_query
        mock_query.join.return_value = mock_join
        mock_join.filter.return_value = mock_filter
        mock_filter.first.return_value = (mock_interview, mock_position)
        
        result = auth_service.get_user_interview(interview_id, user_id)
        
        assert result == (mock_interview, mock_position)
    
    def test_get_user_interview_not_found(self, auth_service, mock_db):
        """Test user interview retrieval when not found."""
        user_id = uuid4()
        interview_id = uuid4()
        
        # Mock the query chain to return None
        mock_query = Mock()
        mock_join = Mock()
        mock_filter = Mock()
        
        mock_db.query.return_value = mock_query
        mock_query.join.return_value = mock_join
        mock_join.filter.return_value = mock_filter
        mock_filter.first.return_value = None
        
        result = auth_service.get_user_interview(interview_id, user_id)
        
        assert result is None


class TestUserContextMiddleware:
    """Test user context middleware."""
    
    @pytest.mark.asyncio
    async def test_middleware_with_valid_token(self, mocker):
        """Test middleware with valid authorization token."""
        user_id = uuid4()
        token = "valid-token"
        
        # Mock request
        request = Mock(spec=Request)
        request.headers = {"Authorization": f"Bearer {token}"}
        request.state = Mock()
        
        # Mock call_next as async function
        async def mock_call_next(req):
            return Mock()
        
        # Mock get_user_id_from_token
        mock_get_user_id = mocker.patch('app.core.auth.get_user_id_from_token')
        mock_get_user_id.return_value = str(user_id)
        
        # Call middleware
        response = await user_context_middleware(request, mock_call_next)
        
        # Verify
        assert isinstance(request.state.user_context, UserContext)
        assert request.state.user_context.user_id == user_id
    
    @pytest.mark.asyncio
    async def test_middleware_with_invalid_token(self, mocker):
        """Test middleware with invalid authorization token."""
        token = "invalid-token"
        
        # Mock request
        request = Mock(spec=Request)
        request.headers = {"Authorization": f"Bearer {token}"}
        request.state = Mock()
        
        # Mock call_next as async function
        async def mock_call_next(req):
            return Mock()
        
        # Mock get_user_id_from_token to return None
        mock_get_user_id = mocker.patch('app.core.auth.get_user_id_from_token')
        mock_get_user_id.return_value = None
        
        # Call middleware
        response = await user_context_middleware(request, mock_call_next)
        
        # Verify
        assert request.state.user_context is None
    
    @pytest.mark.asyncio
    async def test_middleware_with_no_authorization(self):
        """Test middleware with no authorization header."""
        # Mock request
        request = Mock(spec=Request)
        request.headers = {}
        request.state = Mock()
        
        # Mock call_next as async function
        async def mock_call_next(req):
            return Mock()
        
        # Call middleware
        response = await user_context_middleware(request, mock_call_next)
        
        # Verify
        assert request.state.user_context is None
    
    @pytest.mark.asyncio
    async def test_middleware_with_malformed_authorization(self):
        """Test middleware with malformed authorization header."""
        # Mock request
        request = Mock(spec=Request)
        request.headers = {"Authorization": "InvalidFormat"}
        request.state = Mock()
        
        # Mock call_next as async function
        async def mock_call_next(req):
            return Mock()
        
        # Call middleware
        response = await user_context_middleware(request, mock_call_next)
        
        # Verify
        assert request.state.user_context is None
    
    def test_get_request_user_context_success(self):
        """Test getting user context from request state."""
        user_id = uuid4()
        context = UserContext(user_id=user_id)
        
        request = Mock(spec=Request)
        request.state = Mock()
        request.state.user_context = context
        
        result = get_request_user_context(request)
        
        assert result == context
    
    def test_get_request_user_context_none(self):
        """Test getting user context when none exists."""
        request = Mock(spec=Request)
        request.state = Mock()
        request.state.user_context = None
        
        result = get_request_user_context(request)
        
        assert result is None
    
    def test_get_request_user_context_no_state(self):
        """Test getting user context when request has no state."""
        request = Mock(spec=Request)
        # Remove state attribute to simulate no state
        del request.state
        
        result = get_request_user_context(request)
        
        assert result is None