"""
Integration tests for authentication API endpoints.
"""
import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.main import app
from app.core.database import get_db
from app.core.config import settings
from app.models.base import Base


class TestAuthenticationIntegration:
    """Integration tests for authentication endpoints with real database."""
    
    @pytest.fixture(scope="function")
    def test_db(self):
        """Create a test database for each test."""
        # Create test engine with in-memory SQLite
        test_engine = create_engine(
            "sqlite:///:memory:",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        
        # Create test session factory
        TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)
        
        # Create all tables
        Base.metadata.create_all(bind=test_engine)
        
        def override_get_db():
            try:
                db = TestingSessionLocal()
                yield db
            finally:
                db.close()
        
        # Override the dependency
        app.dependency_overrides[get_db] = override_get_db
        
        yield TestingSessionLocal
        
        # Clean up
        app.dependency_overrides.clear()
        Base.metadata.drop_all(bind=test_engine)
    
    @pytest.fixture
    def client(self, test_db):
        """Create test client with database override."""
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
    
    def test_full_authentication_flow(self, client, test_user_data):
        """Test complete authentication flow: register -> login -> access protected endpoint."""
        # Set test secret key
        original_secret = settings.SECRET_KEY
        settings.SECRET_KEY = "test-secret-key-for-testing"
        
        try:
            # 1. Register user
            register_response = client.post("/api/v1/auth/register", json=test_user_data)
            assert register_response.status_code == 201
            
            register_data = register_response.json()
            assert register_data["email"] == test_user_data["email"]
            assert register_data["first_name"] == test_user_data["first_name"]
            assert "id" in register_data
            assert "password" not in register_data
            
            # 2. Login with registered user
            login_data = {
                "email": test_user_data["email"],
                "password": test_user_data["password"]
            }
            login_response = client.post("/api/v1/auth/login", json=login_data)
            assert login_response.status_code == 200
            
            login_result = login_response.json()
            assert "access_token" in login_result
            assert login_result["token_type"] == "bearer"
            
            # 3. Access protected endpoint with token
            token = login_result["access_token"]
            headers = {"Authorization": f"Bearer {token}"}
            
            me_response = client.get("/api/v1/auth/me", headers=headers)
            assert me_response.status_code == 200
            
            me_data = me_response.json()
            assert me_data["email"] == test_user_data["email"]
            assert me_data["id"] == register_data["id"]
            
            # 4. Refresh token
            refresh_response = client.post("/api/v1/auth/refresh", headers=headers)
            assert refresh_response.status_code == 200
            
            refresh_data = refresh_response.json()
            assert "access_token" in refresh_data
            assert refresh_data["token_type"] == "bearer"
            assert "expires_in" in refresh_data
            # Token should be valid (may be same if created within same second)
            assert len(refresh_data["access_token"]) > 0
            
        finally:
            settings.SECRET_KEY = original_secret
    
    def test_duplicate_email_registration(self, client, test_user_data):
        """Test that duplicate email registration is rejected."""
        original_secret = settings.SECRET_KEY
        settings.SECRET_KEY = "test-secret-key-for-testing"
        
        try:
            # Register user first time
            response1 = client.post("/api/v1/auth/register", json=test_user_data)
            assert response1.status_code == 201
            
            # Try to register same email again
            response2 = client.post("/api/v1/auth/register", json=test_user_data)
            assert response2.status_code == 409
            
            error_data = response2.json()
            assert "Email already registered" in error_data["detail"]
            
        finally:
            settings.SECRET_KEY = original_secret
    
    def test_invalid_login_credentials(self, client, test_user_data):
        """Test login with invalid credentials."""
        original_secret = settings.SECRET_KEY
        settings.SECRET_KEY = "test-secret-key-for-testing"
        
        try:
            # Register user
            client.post("/api/v1/auth/register", json=test_user_data)
            
            # Try login with wrong password
            wrong_login = {
                "email": test_user_data["email"],
                "password": "wrongpassword"
            }
            response = client.post("/api/v1/auth/login", json=wrong_login)
            assert response.status_code == 401
            
            error_data = response.json()
            assert "Incorrect email or password" in error_data["detail"]
            
        finally:
            settings.SECRET_KEY = original_secret
    
    def test_protected_endpoint_without_token(self, client):
        """Test accessing protected endpoint without authentication."""
        response = client.get("/api/v1/auth/me")
        assert response.status_code == 403
    
    def test_protected_endpoint_with_invalid_token(self, client):
        """Test accessing protected endpoint with invalid token."""
        headers = {"Authorization": "Bearer invalid-token"}
        response = client.get("/api/v1/auth/me", headers=headers)
        assert response.status_code == 401