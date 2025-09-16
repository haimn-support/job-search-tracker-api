"""
Integration tests for middleware functionality.
"""
import pytest
from uuid import uuid4
from fastapi.testclient import TestClient
from unittest.mock import patch

from app.main import app
from app.core.auth import create_access_token
from app.core.config import settings


client = TestClient(app)


class TestUserContextMiddleware:
    """Test user context middleware integration."""
    
    def test_middleware_injects_user_context_on_valid_token(self):
        """Test that middleware properly injects user context with valid token."""
        # Ensure we have a secret key for testing
        original_secret = settings.SECRET_KEY
        try:
            settings.SECRET_KEY = "test-secret-key-for-middleware-testing"
            
            user_id = uuid4()
            token = create_access_token(data={"sub": str(user_id)})
            headers = {"Authorization": f"Bearer {token}"}
            
            # Make a request to any protected endpoint
            response = client.get("/api/v1/positions/", headers=headers)
            
            # Should get 200 (empty list) since user has no positions
            # This confirms the middleware worked and authentication passed
            assert response.status_code == 200
            data = response.json()
            assert data["total"] == 0
            assert data["positions"] == []
            
        finally:
            settings.SECRET_KEY = original_secret
    
    def test_middleware_handles_invalid_token_gracefully(self):
        """Test that middleware handles invalid tokens gracefully."""
        headers = {"Authorization": "Bearer invalid-token"}
        
        # Make a request with invalid token
        response = client.get("/api/v1/positions/", headers=headers)
        
        # Should get 401 Unauthorized
        assert response.status_code == 401
    
    def test_middleware_handles_no_token_gracefully(self):
        """Test that middleware handles requests without tokens gracefully."""
        # Make a request without any authorization header
        response = client.get("/api/v1/positions/")
        
        # Should get 403 Forbidden (no credentials provided)
        assert response.status_code == 403
    
    def test_middleware_handles_malformed_authorization_header(self):
        """Test that middleware handles malformed authorization headers."""
        headers = {"Authorization": "InvalidFormat"}
        
        # Make a request with malformed authorization header
        response = client.get("/api/v1/positions/", headers=headers)
        
        # Should get 403 Forbidden (no valid credentials)
        assert response.status_code == 403
    
    def test_middleware_preserves_request_flow(self):
        """Test that middleware doesn't interfere with normal request flow."""
        # Test a public endpoint (health check)
        response = client.get("/health")
        
        # Should work normally
        assert response.status_code == 200
        assert response.json() == {"status": "healthy"}
    
    def test_middleware_works_with_different_endpoints(self):
        """Test that middleware works consistently across different endpoints."""
        # Test multiple endpoints without authentication
        endpoints = [
            "/api/v1/positions/",
            "/api/v1/statistics/overview",
            "/api/v1/statistics/timeline"
        ]
        
        for endpoint in endpoints:
            response = client.get(endpoint)
            # All should return 403 (no credentials) since they require authentication
            assert response.status_code == 403, f"Endpoint {endpoint} should require authentication"