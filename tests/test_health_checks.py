"""
Tests for health check endpoints.
"""
import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from sqlalchemy.exc import SQLAlchemyError

from app.main import app

client = TestClient(app)


class TestHealthCheckEndpoints:
    """Test health check endpoints."""
    
    def test_basic_health_check(self):
        """Test basic health check endpoint."""
        response = client.get("/health")
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "timestamp" in data
    
    def test_detailed_health_check_all_healthy(self):
        """Test detailed health check when all systems are healthy."""
        with patch('app.api.health.check_database_connection') as mock_check, \
             patch('app.api.health.get_database_info') as mock_info:
            
            mock_check.return_value = True
            mock_info.return_value = {
                "status": "connected",
                "url": "postgresql://***:***@localhost:5432/db",
                "engine_info": {"pool_size": 10}
            }
            
            response = client.get("/health/detailed")
            
            assert response.status_code == 200
            data = response.json()
            assert data["overall_status"] == "healthy"
            assert data["api"]["status"] == "healthy"
            assert data["database"]["status"] == "healthy"
            assert data["database"]["connected"] is True
    
    def test_detailed_health_check_database_unhealthy(self):
        """Test detailed health check when database is unhealthy."""
        with patch('app.api.health.check_database_connection') as mock_check, \
             patch('app.api.health.get_database_info') as mock_info:
            
            mock_check.return_value = False
            mock_info.return_value = {
                "status": "disconnected",
                "url": "postgresql://***:***@localhost:5432/db"
            }
            
            response = client.get("/health/detailed")
            
            assert response.status_code == 200
            data = response.json()
            assert data["overall_status"] == "degraded"
            assert data["api"]["status"] == "healthy"
            assert data["database"]["status"] == "unhealthy"
            assert data["database"]["connected"] is False
    
    def test_detailed_health_check_database_error(self):
        """Test detailed health check with database error."""
        with patch('app.api.health.check_database_connection') as mock_check:
            mock_check.side_effect = SQLAlchemyError("Database error")
            
            response = client.get("/health/detailed")
            
            assert response.status_code == 200
            data = response.json()
            assert data["overall_status"] == "unhealthy"
            assert data["database"]["status"] == "unhealthy"
            assert data["database"]["connected"] is False
            assert data["database"]["error"] == "Database connection error"
    
    def test_detailed_health_check_unexpected_error(self):
        """Test detailed health check with unexpected error."""
        with patch('app.api.health.check_database_connection') as mock_check:
            mock_check.side_effect = Exception("Unexpected error")
            
            response = client.get("/health/detailed")
            
            assert response.status_code == 200
            data = response.json()
            assert data["overall_status"] == "unknown"
            assert data["database"]["status"] == "unknown"
            assert data["database"]["connected"] is False
    
    def test_database_health_check_healthy(self):
        """Test database health check when database is healthy."""
        with patch('app.api.health.check_database_connection') as mock_check, \
             patch('app.api.health.get_database_info') as mock_info:
            
            mock_check.return_value = True
            mock_info.return_value = {
                "status": "connected",
                "url": "postgresql://***:***@localhost:5432/db",
                "engine_info": {"pool_size": 10}
            }
            
            response = client.get("/health/database")
            
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "healthy"
            assert data["connected"] is True
            assert "database_info" in data
            assert "timestamp" in data
    
    def test_database_health_check_unhealthy(self):
        """Test database health check when database is unhealthy."""
        with patch('app.api.health.check_database_connection') as mock_check:
            mock_check.return_value = False
            
            response = client.get("/health/database")
            
            assert response.status_code == 503
            data = response.json()
            assert data["error"]["message"] == "Database is not accessible"
    
    def test_database_health_check_sqlalchemy_error(self):
        """Test database health check with SQLAlchemy error."""
        with patch('app.api.health.check_database_connection') as mock_check:
            mock_check.side_effect = SQLAlchemyError("Database connection failed")
            
            response = client.get("/health/database")
            
            assert response.status_code == 503
            data = response.json()
            assert "Database error" in data["error"]["message"]
    
    def test_database_health_check_unexpected_error(self):
        """Test database health check with unexpected error."""
        with patch('app.api.health.check_database_connection') as mock_check:
            mock_check.side_effect = Exception("Unexpected error")
            
            response = client.get("/health/database")
            
            assert response.status_code == 500
            data = response.json()
            assert data["error"]["message"] == "Internal server error during health check"
    
    def test_readiness_check_ready(self):
        """Test readiness check when service is ready."""
        with patch('app.api.health.check_database_connection') as mock_check:
            mock_check.return_value = True
            
            response = client.get("/health/readiness")
            
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "ready"
            assert "timestamp" in data
    
    def test_readiness_check_not_ready(self):
        """Test readiness check when service is not ready."""
        with patch('app.api.health.check_database_connection') as mock_check:
            mock_check.return_value = False
            
            response = client.get("/health/readiness")
            
            assert response.status_code == 503
            data = response.json()
            assert data["error"]["message"] == "Service not ready - database unavailable"
    
    def test_readiness_check_error(self):
        """Test readiness check with error."""
        with patch('app.api.health.check_database_connection') as mock_check:
            mock_check.side_effect = Exception("Connection error")
            
            response = client.get("/health/readiness")
            
            assert response.status_code == 503
            data = response.json()
            assert data["error"]["message"] == "Service not ready"
    
    def test_liveness_check(self):
        """Test liveness check endpoint."""
        response = client.get("/health/liveness")
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "alive"
        assert "timestamp" in data


class TestHealthCheckIntegration:
    """Integration tests for health check functionality."""
    
    def test_health_check_endpoints_accessible(self):
        """Test that all health check endpoints are accessible."""
        endpoints = [
            "/health",
            "/health/detailed", 
            "/health/liveness"
        ]
        
        for endpoint in endpoints:
            response = client.get(endpoint)
            assert response.status_code == 200, f"Endpoint {endpoint} should be accessible"
    
    def test_health_check_response_format(self):
        """Test that health check responses have correct format."""
        response = client.get("/health")
        
        assert response.status_code == 200
        data = response.json()
        
        # Check required fields
        assert "status" in data
        assert "timestamp" in data
        
        # Check data types
        assert isinstance(data["status"], str)
        assert isinstance(data["timestamp"], str)
    
    def test_detailed_health_check_response_format(self):
        """Test that detailed health check response has correct format."""
        response = client.get("/health/detailed")
        
        assert response.status_code == 200
        data = response.json()
        
        # Check required top-level fields
        assert "api" in data
        assert "database" in data
        assert "overall_status" in data
        
        # Check API section
        assert "status" in data["api"]
        assert "timestamp" in data["api"]
        
        # Check database section
        assert "status" in data["database"]
        assert "connected" in data["database"]
        assert "timestamp" in data["database"]