"""
Tests for database configuration.
"""
import pytest
import os
from unittest.mock import patch
from sqlalchemy import create_engine
from app.core.database import get_db, create_tables, drop_tables
from app.core.config import Settings


class TestDatabaseConfig:
    """Test cases for database configuration."""
    
    def test_get_db_dependency(self):
        """Test that get_db returns a database session."""
        # Mock the database URL for testing
        with patch.dict(os.environ, {"DATABASE_URL": "sqlite:///:memory:"}):
            db_gen = get_db()
            db = next(db_gen)
            
            # Should be a SQLAlchemy session
            assert hasattr(db, 'query')
            assert hasattr(db, 'add')
            assert hasattr(db, 'commit')
            assert hasattr(db, 'close')
            
            # Clean up
            try:
                next(db_gen)
            except StopIteration:
                pass  # Expected behavior
    
    def test_create_and_drop_tables(self):
        """Test creating and dropping database tables."""
        # Use in-memory SQLite for testing
        with patch.dict(os.environ, {"DATABASE_URL": "sqlite:///:memory:"}):
            # This should not raise any exceptions
            create_tables()
            drop_tables()
    
    def test_settings_validation(self):
        """Test that settings are properly validated."""
        # Test with minimal required settings
        with patch.dict(os.environ, {
            "DATABASE_URL": "sqlite:///:memory:",
            "SECRET_KEY": "test-secret-key"
        }):
            settings = Settings()
            assert settings.DATABASE_URL == "sqlite:///:memory:"
            assert settings.SECRET_KEY == "test-secret-key"
            assert settings.ALGORITHM == "HS256"  # Default value
            assert settings.ACCESS_TOKEN_EXPIRE_MINUTES == 30  # Default value
    
    def test_cors_origins_default(self):
        """Test CORS origins default value."""
        with patch.dict(os.environ, {
            "DATABASE_URL": "sqlite:///:memory:",
            "SECRET_KEY": "test-secret-key"
        }):
            settings = Settings()
            assert settings.BACKEND_CORS_ORIGINS == []
    
    def test_testing_mode_default(self):
        """Test testing mode default configuration."""
        with patch.dict(os.environ, {
            "DATABASE_URL": "sqlite:///:memory:",
            "SECRET_KEY": "test-secret-key"
        }):
            settings = Settings()
            assert settings.TESTING == False