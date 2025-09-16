"""
Tests for comprehensive error handling system.

This module tests custom exceptions, global exception handlers,
and error response formatting.
"""
import pytest
from uuid import uuid4
from fastapi import HTTPException
from fastapi.testclient import TestClient
from sqlalchemy.exc import IntegrityError
from pydantic import ValidationError

from app.core.exceptions import (
    BaseAPIException,
    ValidationException,
    ResourceNotFoundException,
    AuthenticationException,
    AuthorizationException,
    ConflictException,
    DatabaseException,
    BusinessLogicException,
    ExternalServiceException,
    RateLimitException
)
from app.core.exception_handlers import create_error_response
from app.main import app


class TestCustomExceptions:
    """Test custom exception classes."""
    
    def test_base_api_exception(self):
        """Test BaseAPIException with all parameters."""
        exc = BaseAPIException(
            status_code=400,
            detail="Test error",
            error_code="TEST_ERROR",
            context={"field": "value"}
        )
        
        assert exc.status_code == 400
        assert exc.detail == "Test error"
        assert exc.error_code == "TEST_ERROR"
        assert exc.context == {"field": "value"}
    
    def test_validation_exception(self):
        """Test ValidationException with field errors."""
        field_errors = {"email": "Invalid email format", "password": "Too short"}
        exc = ValidationException(
            detail="Validation failed",
            field_errors=field_errors
        )
        
        assert exc.status_code == 422
        assert exc.error_code == "VALIDATION_ERROR"
        assert exc.field_errors == field_errors
    
    def test_resource_not_found_exception(self):
        """Test ResourceNotFoundException with resource details."""
        resource_id = str(uuid4())
        exc = ResourceNotFoundException(
            resource_type="Position",
            resource_id=resource_id
        )
        
        assert exc.status_code == 404
        assert exc.error_code == "RESOURCE_NOT_FOUND"
        assert f"Position with ID '{resource_id}' not found" in exc.detail
        assert exc.context["resource_type"] == "Position"
        assert exc.context["resource_id"] == resource_id
    
    def test_authentication_exception(self):
        """Test AuthenticationException with custom headers."""
        exc = AuthenticationException(detail="Invalid token")
        
        assert exc.status_code == 401
        assert exc.error_code == "AUTHENTICATION_ERROR"
        assert exc.detail == "Invalid token"
        assert exc.headers["WWW-Authenticate"] == "Bearer"
    
    def test_authorization_exception(self):
        """Test AuthorizationException."""
        exc = AuthorizationException(
            detail="Access denied to resource",
            resource_type="Position"
        )
        
        assert exc.status_code == 403
        assert exc.error_code == "AUTHORIZATION_ERROR"
        assert exc.context["resource_type"] == "Position"
    
    def test_conflict_exception(self):
        """Test ConflictException."""
        exc = ConflictException(
            detail="Email already exists",
            resource_type="User"
        )
        
        assert exc.status_code == 409
        assert exc.error_code == "RESOURCE_CONFLICT"
        assert exc.context["resource_type"] == "User"
    
    def test_database_exception(self):
        """Test DatabaseException."""
        exc = DatabaseException(
            detail="Connection failed",
            operation="user_creation"
        )
        
        assert exc.status_code == 500
        assert exc.error_code == "DATABASE_ERROR"
        assert exc.context["operation"] == "user_creation"
    
    def test_business_logic_exception(self):
        """Test BusinessLogicException."""
        exc = BusinessLogicException(
            detail="Cannot delete position with active interviews",
            rule="position_deletion_rule"
        )
        
        assert exc.status_code == 400
        assert exc.error_code == "BUSINESS_LOGIC_ERROR"
        assert exc.context["rule"] == "position_deletion_rule"
    
    def test_external_service_exception(self):
        """Test ExternalServiceException."""
        exc = ExternalServiceException(
            detail="Email service unavailable",
            service_name="SendGrid"
        )
        
        assert exc.status_code == 503
        assert exc.error_code == "EXTERNAL_SERVICE_ERROR"
        assert exc.context["service_name"] == "SendGrid"
    
    def test_rate_limit_exception(self):
        """Test RateLimitException with retry after."""
        exc = RateLimitException(
            detail="Too many requests",
            retry_after=60
        )
        
        assert exc.status_code == 429
        assert exc.error_code == "RATE_LIMIT_ERROR"
        assert exc.headers["Retry-After"] == "60"
        assert exc.context["retry_after"] == 60


class TestErrorResponseFormat:
    """Test error response formatting."""
    
    def test_create_error_response_basic(self):
        """Test basic error response creation."""
        response = create_error_response(
            error_code="TEST_ERROR",
            message="Test message",
            status_code=400
        )
        
        assert response.status_code == 400
        content = response.body.decode()
        assert "TEST_ERROR" in content
        assert "Test message" in content
        assert "timestamp" in content
    
    def test_create_error_response_with_details(self):
        """Test error response with additional details."""
        details = {"field": "value", "context": "test"}
        response = create_error_response(
            error_code="TEST_ERROR",
            message="Test message",
            status_code=400,
            details=details
        )
        
        content = response.body.decode()
        assert "field" in content
        assert "value" in content
        assert "context" in content
    
    def test_create_error_response_with_field_errors(self):
        """Test error response with field-specific errors."""
        field_errors = {"email": "Invalid format", "password": "Too short"}
        response = create_error_response(
            error_code="VALIDATION_ERROR",
            message="Validation failed",
            status_code=422,
            field_errors=field_errors
        )
        
        content = response.body.decode()
        assert "field_errors" in content
        assert "email" in content
        assert "Invalid format" in content
        assert "password" in content
        assert "Too short" in content


class TestGlobalExceptionHandlers:
    """Test global exception handlers through API calls."""
    
    def setup_method(self):
        """Set up test client."""
        self.client = TestClient(app)
    
    def test_validation_error_handling(self):
        """Test request validation error handling."""
        # Send invalid data to trigger validation error
        response = self.client.post(
            "/api/v1/auth/register",
            json={
                "email": "invalid-email",  # Invalid email format
                "password": "123",  # Too short
                "first_name": "",  # Empty string
                "last_name": "Test"
            }
        )
        
        assert response.status_code == 422
        data = response.json()
        assert data["error"]["code"] == "VALIDATION_ERROR"
        assert data["error"]["message"] == "Request validation failed"
        assert "field_errors" in data["error"]
        assert "timestamp" in data["error"]
    
    def test_authentication_error_handling(self):
        """Test authentication error handling."""
        # Try to access protected endpoint with invalid token
        response = self.client.get(
            "/api/v1/positions/",
            headers={"Authorization": "Bearer invalid-token"}
        )
        
        assert response.status_code == 401
        data = response.json()
        assert data["error"]["code"] == "AUTHENTICATION_ERROR"
        assert "timestamp" in data["error"]
    
    def test_resource_not_found_handling(self):
        """Test resource not found error handling."""
        # First register and login to get a token
        register_response = self.client.post(
            "/api/v1/auth/register",
            json={
                "email": "test@example.com",
                "password": "testpassword123",
                "first_name": "Test",
                "last_name": "User"
            }
        )
        assert register_response.status_code == 201
        
        login_response = self.client.post(
            "/api/v1/auth/login",
            json={
                "email": "test@example.com",
                "password": "testpassword123"
            }
        )
        assert login_response.status_code == 200
        token = login_response.json()["access_token"]
        
        # Try to get non-existent position
        fake_id = str(uuid4())
        response = self.client.get(
            f"/api/v1/positions/{fake_id}",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 404
        data = response.json()
        assert data["error"]["code"] == "RESOURCE_NOT_FOUND"
        assert fake_id in data["error"]["message"]
        assert "timestamp" in data["error"]
    
    def test_conflict_error_handling(self):
        """Test conflict error handling."""
        # Register a user
        user_data = {
            "email": "conflict@example.com",
            "password": "testpassword123",
            "first_name": "Test",
            "last_name": "User"
        }
        
        response1 = self.client.post("/api/v1/auth/register", json=user_data)
        assert response1.status_code == 201
        
        # Try to register the same user again
        response2 = self.client.post("/api/v1/auth/register", json=user_data)
        
        assert response2.status_code == 409
        data = response2.json()
        assert data["error"]["code"] == "RESOURCE_CONFLICT"
        assert "already registered" in data["error"]["message"].lower()
        assert "timestamp" in data["error"]
    
    def test_invalid_json_handling(self):
        """Test handling of invalid JSON in request body."""
        response = self.client.post(
            "/api/v1/auth/register",
            data="invalid json",
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 422
        data = response.json()
        assert data["error"]["code"] == "VALIDATION_ERROR"
        assert "timestamp" in data["error"]
    
    def test_method_not_allowed_handling(self):
        """Test handling of unsupported HTTP methods."""
        response = self.client.patch("/api/v1/auth/register")
        
        assert response.status_code == 405
        data = response.json()
        assert data["error"]["code"] == "METHOD_NOT_ALLOWED"
        assert "timestamp" in data["error"]


class TestErrorHandlingEdgeCases:
    """Test edge cases and error scenarios."""
    
    def setup_method(self):
        """Set up test client."""
        self.client = TestClient(app)
    
    def test_empty_request_body(self):
        """Test handling of empty request body."""
        response = self.client.post(
            "/api/v1/auth/register",
            json={}
        )
        
        assert response.status_code == 422
        data = response.json()
        assert data["error"]["code"] == "VALIDATION_ERROR"
        assert "field_errors" in data["error"]
    
    def test_missing_content_type(self):
        """Test handling of missing content type header."""
        response = self.client.post(
            "/api/v1/auth/register",
            data='{"email": "test@example.com"}'
        )
        
        # Should still be handled gracefully
        assert response.status_code in [400, 422]
        data = response.json()
        assert "error" in data
        assert "timestamp" in data["error"]
    
    def test_very_large_request_body(self):
        """Test handling of very large request body."""
        large_description = "x" * 10000  # Very long string
        
        # First get a valid token
        register_response = self.client.post(
            "/api/v1/auth/register",
            json={
                "email": "large@example.com",
                "password": "testpassword123",
                "first_name": "Test",
                "last_name": "User"
            }
        )
        assert register_response.status_code == 201
        
        login_response = self.client.post(
            "/api/v1/auth/login",
            json={
                "email": "large@example.com",
                "password": "testpassword123"
            }
        )
        token = login_response.json()["access_token"]
        
        # Try to create position with very large description
        response = self.client.post(
            "/api/v1/positions/",
            json={
                "title": "Test Position",
                "company": "Test Company",
                "description": large_description,
                "application_date": "2024-01-01"
            },
            headers={"Authorization": f"Bearer {token}"}
        )
        
        # Should be handled gracefully (either success or validation error)
        assert response.status_code in [201, 422, 400]
        if response.status_code != 201:
            data = response.json()
            assert "error" in data
            assert "timestamp" in data["error"]
    
    def test_invalid_uuid_format(self):
        """Test handling of invalid UUID format in path parameters."""
        # First get a valid token
        register_response = self.client.post(
            "/api/v1/auth/register",
            json={
                "email": "uuid@example.com",
                "password": "testpassword123",
                "first_name": "Test",
                "last_name": "User"
            }
        )
        assert register_response.status_code == 201
        
        login_response = self.client.post(
            "/api/v1/auth/login",
            json={
                "email": "uuid@example.com",
                "password": "testpassword123"
            }
        )
        token = login_response.json()["access_token"]
        
        # Try to get position with invalid UUID
        response = self.client.get(
            "/api/v1/positions/invalid-uuid",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 422
        data = response.json()
        assert data["error"]["code"] == "VALIDATION_ERROR"
        assert "timestamp" in data["error"]


class TestErrorMessageUserFriendliness:
    """Test that error messages are user-friendly and informative."""
    
    def setup_method(self):
        """Set up test client."""
        self.client = TestClient(app)
    
    def test_validation_error_messages(self):
        """Test that validation error messages are user-friendly."""
        response = self.client.post(
            "/api/v1/auth/register",
            json={
                "email": "not-an-email",
                "password": "123",
                "first_name": "",
                "last_name": "Test"
            }
        )
        
        assert response.status_code == 422
        data = response.json()
        field_errors = data["error"]["field_errors"]
        
        # Check that error messages are user-friendly
        assert any("email" in msg.lower() for msg in field_errors.values())
        assert any("required" in msg.lower() or "missing" in msg.lower() 
                  for msg in field_errors.values())
    
    def test_authentication_error_messages(self):
        """Test that authentication error messages are informative but secure."""
        response = self.client.post(
            "/api/v1/auth/login",
            json={
                "email": "nonexistent@example.com",
                "password": "wrongpassword"
            }
        )
        
        assert response.status_code == 401
        data = response.json()
        
        # Should not reveal whether email exists or not
        assert "email" not in data["error"]["message"].lower()
        assert "password" not in data["error"]["message"].lower()
        assert "incorrect" in data["error"]["message"].lower()
    
    def test_resource_not_found_messages(self):
        """Test that resource not found messages are clear."""
        # Get a valid token first
        register_response = self.client.post(
            "/api/v1/auth/register",
            json={
                "email": "notfound@example.com",
                "password": "testpassword123",
                "first_name": "Test",
                "last_name": "User"
            }
        )
        assert register_response.status_code == 201
        
        login_response = self.client.post(
            "/api/v1/auth/login",
            json={
                "email": "notfound@example.com",
                "password": "testpassword123"
            }
        )
        token = login_response.json()["access_token"]
        
        fake_id = str(uuid4())
        response = self.client.get(
            f"/api/v1/positions/{fake_id}",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 404
        data = response.json()
        
        # Should clearly indicate what was not found
        assert "Position" in data["error"]["message"]
        assert "not found" in data["error"]["message"]
        assert fake_id in data["error"]["message"]