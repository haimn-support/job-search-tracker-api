"""
Tests for database connection management and health checks.
"""
import pytest
from unittest.mock import patch, MagicMock
from sqlalchemy.exc import OperationalError, SQLAlchemyError

from app.core.database import (
    check_database_connection,
    get_database_info,
    initialize_database_connection
)


class TestDatabaseConnection:
    """Test database connection functionality."""
    
    def test_check_database_connection_success(self):
        """Test successful database connection check."""
        with patch('app.core.database.engine') as mock_engine:
            mock_connection = MagicMock()
            mock_result = MagicMock()
            mock_result.fetchone.return_value = (1,)
            mock_connection.execute.return_value = mock_result
            mock_engine.connect.return_value.__enter__.return_value = mock_connection
            
            result = check_database_connection()
            
            assert result is True
            mock_engine.connect.assert_called_once()
            mock_connection.execute.assert_called_once()
    
    def test_check_database_connection_operational_error_with_retry(self):
        """Test database connection check with operational error and retry logic."""
        with patch('app.core.database.engine') as mock_engine, \
             patch('time.sleep') as mock_sleep:
            
            # First two attempts fail, third succeeds
            mock_connection = MagicMock()
            mock_result = MagicMock()
            mock_result.fetchone.return_value = (1,)
            mock_connection.execute.return_value = mock_result
            
            mock_engine.connect.side_effect = [
                OperationalError("Connection failed", None, None),
                OperationalError("Connection failed", None, None),
                MagicMock(__enter__=lambda x: mock_connection, __exit__=lambda *args: None)
            ]
            
            result = check_database_connection(max_retries=2, retry_delay=0.1)
            
            assert result is True
            assert mock_engine.connect.call_count == 3
            assert mock_sleep.call_count == 2
    
    def test_check_database_connection_max_retries_exceeded(self):
        """Test database connection check when max retries are exceeded."""
        with patch('app.core.database.engine') as mock_engine, \
             patch('time.sleep') as mock_sleep:
            
            mock_engine.connect.side_effect = OperationalError("Connection failed", None, None)
            
            result = check_database_connection(max_retries=2, retry_delay=0.1)
            
            assert result is False
            assert mock_engine.connect.call_count == 3  # Initial attempt + 2 retries
            assert mock_sleep.call_count == 2
    
    def test_check_database_connection_unexpected_error(self):
        """Test database connection check with unexpected error."""
        with patch('app.core.database.engine') as mock_engine:
            mock_engine.connect.side_effect = Exception("Unexpected error")
            
            result = check_database_connection()
            
            assert result is False
            mock_engine.connect.assert_called_once()
    
    def test_get_database_info_success(self):
        """Test getting database information successfully."""
        with patch('app.core.database.check_database_connection') as mock_check, \
             patch('app.core.database.database_url', 'postgresql://user:pass@localhost:5432/db'), \
             patch('app.core.database.engine') as mock_engine:
            
            mock_check.return_value = True
            mock_engine.pool.size = 10
            mock_engine.pool.checkedout = 2
            mock_engine.pool.overflow = 0
            mock_engine.pool.checkedin = 8
            
            result = get_database_info()
            
            assert result["status"] == "connected"
            assert result["url"] == "postgresql://***:***@localhost:5432/db"
            assert result["engine_info"]["pool_size"] == 10
            assert result["engine_info"]["checked_out"] == 2
    
    def test_get_database_info_disconnected(self):
        """Test getting database information when disconnected."""
        with patch('app.core.database.check_database_connection') as mock_check, \
             patch('app.core.database.database_url', 'postgresql://user:pass@localhost:5432/db'):
            
            mock_check.return_value = False
            
            result = get_database_info()
            
            assert result["status"] == "disconnected"
            assert result["url"] == "postgresql://***:***@localhost:5432/db"
    
    def test_get_database_info_error(self):
        """Test getting database information with error."""
        with patch('app.core.database.check_database_connection') as mock_check:
            mock_check.side_effect = Exception("Database error")
            
            result = get_database_info()
            
            assert result["status"] == "error"
            assert "error" in result
            assert result["url"] == "unknown"
    
    def test_initialize_database_connection_success(self):
        """Test successful database initialization."""
        with patch('app.core.database.check_database_connection') as mock_check, \
             patch('app.core.database.create_tables') as mock_create:
            
            mock_check.return_value = True
            
            result = initialize_database_connection()
            
            assert result is True
            mock_check.assert_called_once_with(max_retries=5, retry_delay=2.0)
            mock_create.assert_called_once()
    
    def test_initialize_database_connection_connection_failure(self):
        """Test database initialization with connection failure."""
        with patch('app.core.database.check_database_connection') as mock_check:
            mock_check.return_value = False
            
            result = initialize_database_connection()
            
            assert result is False
            mock_check.assert_called_once_with(max_retries=5, retry_delay=2.0)
    
    def test_initialize_database_connection_table_creation_error(self):
        """Test database initialization with table creation error."""
        with patch('app.core.database.check_database_connection') as mock_check, \
             patch('app.core.database.create_tables') as mock_create:
            
            mock_check.return_value = True
            mock_create.side_effect = Exception("Table creation failed")
            
            result = initialize_database_connection()
            
            assert result is False
            mock_check.assert_called_once()
            mock_create.assert_called_once()