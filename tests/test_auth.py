"""
Tests for authentication functionality.
"""
import pytest
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.main import app
from app.core.auth import (
    verify_password, 
    get_password_hash, 
    create_access_token, 
    verify_token,
    get_user_id_from_token
)
from app.core.config import settings
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin


class TestPasswordHashing:
    """Test password hashing and verification."""
    
    def test_password_hashing(self):
        """Test password hashing creates different hashes for same password."""
        password = "testpassword123"
        hash1 = get_password_hash(password)
        hash2 = get_password_hash(password)
        
        # Hashes should be different due to salt
        assert hash1 != hash2
        assert len(hash1) > 0
        assert len(hash2) > 0
    
    def test_password_verification_success(self):
        """Test successful password verification."""
        password = "testpassword123"
        hashed = get_password_hash(password)
        
        assert verify_password(password, hashed) is True
    
    def test_password_verification_failure(self):
        """Test failed password verification with wrong password."""
        password = "testpassword123"
        wrong_password = "wrongpassword"
        hashed = get_password_hash(password)
        
        assert verify_password(wrong_password, hashed) is False


class TestJWTTokens:
    """Test JWT token creation and verification."""
    
    def test_create_access_token(self):
        """Test JWT token creation."""
        # Set a test secret key
        original_secret = settings.SECRET_KEY
        settings.SECRET_KEY = "test-secret-key-for-testing"
        
        try:
            data = {"sub": "test-user-id"}
            token = create_access_token(data)
            
            assert isinstance(token, str)
            assert len(token) > 0
        finally:
            settings.SECRET_KEY = original_secret
    
    def test_create_access_token_with_expiration(self):
        """Test JWT token creation with custom expiration."""
        original_secret = settings.SECRET_KEY
        settings.SECRET_KEY = "test-secret-key-for-testing"
        
        try:
            data = {"sub": "test-user-id"}
            expires_delta = timedelta(minutes=60)
            token = create_access_token(data, expires_delta)
            
            assert isinstance(token, str)
            assert len(token) > 0
        finally:
            settings.SECRET_KEY = original_secret
    
    def test_verify_token_success(self):
        """Test successful token verification."""
        original_secret = settings.SECRET_KEY
        settings.SECRET_KEY = "test-secret-key-for-testing"
        
        try:
            data = {"sub": "test-user-id"}
            token = create_access_token(data)
            payload = verify_token(token)
            
            assert payload is not None
            assert payload["sub"] == "test-user-id"
            assert "exp" in payload
        finally:
            settings.SECRET_KEY = original_secret
    
    def test_verify_token_invalid(self):
        """Test token verification with invalid token."""
        original_secret = settings.SECRET_KEY
        settings.SECRET_KEY = "test-secret-key-for-testing"
        
        try:
            invalid_token = "invalid.jwt.token"
            payload = verify_token(invalid_token)
            
            assert payload is None
        finally:
            settings.SECRET_KEY = original_secret
    
    def test_get_user_id_from_token(self):
        """Test extracting user ID from token."""
        original_secret = settings.SECRET_KEY
        settings.SECRET_KEY = "test-secret-key-for-testing"
        
        try:
            user_id = "test-user-id-123"
            data = {"sub": user_id}
            token = create_access_token(data)
            
            extracted_id = get_user_id_from_token(token)
            assert extracted_id == user_id
        finally:
            settings.SECRET_KEY = original_secret
    
    def test_create_token_without_secret_key(self):
        """Test token creation fails without secret key."""
        original_secret = settings.SECRET_KEY
        settings.SECRET_KEY = None
        
        try:
            data = {"sub": "test-user-id"}
            with pytest.raises(ValueError, match="SECRET_KEY must be configured"):
                create_access_token(data)
        finally:
            settings.SECRET_KEY = original_secret


class TestAuthenticationAPI:
    """Test authentication API endpoints."""
    
    @pytest.fixture
    def client(self):
        """Create test client."""
        return TestClient(app)
    
    @pytest.fixture
    def test_user_data(self):
        """Test user registration data."""
        return {
            "email": "test@example.com",
            "password": "testpassword123",
            "first_name": "Test",
            "last_name": "User"
        }
    
    @pytest.fixture
    def test_login_data(self):
        """Test user login data."""
        return {
            "email": "test@example.com",
            "password": "testpassword123"
        }
    
    def test_register_user_success(self, client, test_user_data):
        """Test successful user registration."""
        # Set test secret key
        original_secret = settings.SECRET_KEY
        settings.SECRET_KEY = "test-secret-key-for-testing"
        
        try:
            response = client.post("/api/v1/auth/register", json=test_user_data)
            
            assert response.status_code == 201
            data = response.json()
            assert data["email"] == test_user_data["email"]
            assert data["first_name"] == test_user_data["first_name"]
            assert data["last_name"] == test_user_data["last_name"]
            assert "id" in data
            assert "created_at" in data
            assert "password" not in data  # Password should not be returned
        finally:
            settings.SECRET_KEY = original_secret
    
    def test_register_user_invalid_email(self, client):
        """Test user registration with invalid email."""
        original_secret = settings.SECRET_KEY
        settings.SECRET_KEY = "test-secret-key-for-testing"
        
        try:
            invalid_data = {
                "email": "invalid-email",
                "password": "testpassword123"
            }
            response = client.post("/api/v1/auth/register", json=invalid_data)
            
            assert response.status_code == 422  # Validation error
        finally:
            settings.SECRET_KEY = original_secret
    
    def test_register_user_short_password(self, client):
        """Test user registration with short password."""
        original_secret = settings.SECRET_KEY
        settings.SECRET_KEY = "test-secret-key-for-testing"
        
        try:
            invalid_data = {
                "email": "test@example.com",
                "password": "short"  # Less than 8 characters
            }
            response = client.post("/api/v1/auth/register", json=invalid_data)
            
            assert response.status_code == 422  # Validation error
        finally:
            settings.SECRET_KEY = original_secret
    
    def test_login_user_success(self, client, test_user_data, test_login_data):
        """Test successful user login."""
        original_secret = settings.SECRET_KEY
        settings.SECRET_KEY = "test-secret-key-for-testing"
        
        try:
            # First register the user
            client.post("/api/v1/auth/register", json=test_user_data)
            
            # Then login
            response = client.post("/api/v1/auth/login", json=test_login_data)
            
            assert response.status_code == 200
            data = response.json()
            assert "access_token" in data
            assert data["token_type"] == "bearer"
            assert "expires_in" in data
            assert isinstance(data["expires_in"], int)
        finally:
            settings.SECRET_KEY = original_secret
    
    def test_login_user_invalid_credentials(self, client):
        """Test login with invalid credentials."""
        original_secret = settings.SECRET_KEY
        settings.SECRET_KEY = "test-secret-key-for-testing"
        
        try:
            invalid_login = {
                "email": "nonexistent@example.com",
                "password": "wrongpassword"
            }
            response = client.post("/api/v1/auth/login", json=invalid_login)
            
            assert response.status_code == 401
            data = response.json()
            assert "detail" in data
        finally:
            settings.SECRET_KEY = original_secret
    
    def test_get_current_user_success(self, client, test_user_data, test_login_data):
        """Test getting current user info with valid token."""
        original_secret = settings.SECRET_KEY
        settings.SECRET_KEY = "test-secret-key-for-testing"
        
        try:
            # Register and login to get token
            client.post("/api/v1/auth/register", json=test_user_data)
            login_response = client.post("/api/v1/auth/login", json=test_login_data)
            token = login_response.json()["access_token"]
            
            # Get current user info
            headers = {"Authorization": f"Bearer {token}"}
            response = client.get("/api/v1/auth/me", headers=headers)
            
            assert response.status_code == 200
            data = response.json()
            assert data["email"] == test_user_data["email"]
            assert data["first_name"] == test_user_data["first_name"]
        finally:
            settings.SECRET_KEY = original_secret
    
    def test_get_current_user_no_token(self, client):
        """Test getting current user info without token."""
        response = client.get("/api/v1/auth/me")
        
        assert response.status_code == 403  # No credentials provided
    
    def test_get_current_user_invalid_token(self, client):
        """Test getting current user info with invalid token."""
        headers = {"Authorization": "Bearer invalid-token"}
        response = client.get("/api/v1/auth/me", headers=headers)
        
        assert response.status_code == 401
    
    def test_refresh_token_success(self, client, test_user_data, test_login_data):
        """Test token refresh with valid token."""
        original_secret = settings.SECRET_KEY
        settings.SECRET_KEY = "test-secret-key-for-testing"
        
        try:
            # Register and login to get token
            client.post("/api/v1/auth/register", json=test_user_data)
            login_response = client.post("/api/v1/auth/login", json=test_login_data)
            token = login_response.json()["access_token"]
            
            # Refresh token
            headers = {"Authorization": f"Bearer {token}"}
            response = client.post("/api/v1/auth/refresh", headers=headers)
            
            assert response.status_code == 200
            data = response.json()
            assert "access_token" in data
            assert data["token_type"] == "bearer"
            assert "expires_in" in data
            
            # New token should be different from original
            new_token = data["access_token"]
            assert new_token != token
        finally:
            settings.SECRET_KEY = original_secret