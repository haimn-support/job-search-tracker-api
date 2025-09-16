"""
Database configuration and session management.
"""
import os
import time
import logging
from typing import Optional
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from sqlalchemy.exc import SQLAlchemyError, OperationalError
from app.models.base import Base

logger = logging.getLogger(__name__)

# Get database URL from environment variables
DATABASE_URL = os.getenv("DATABASE_URL")
TEST_DATABASE_URL = os.getenv("TEST_DATABASE_URL")

# Determine if we're in test mode
TESTING = os.getenv("TESTING", "false").lower() == "true"

# Use test database URL if in test mode
if TESTING and TEST_DATABASE_URL:
    database_url = TEST_DATABASE_URL
else:
    database_url = DATABASE_URL

if not database_url:
    # Use SQLite in-memory database for testing if no URL is provided
    database_url = "sqlite:///:memory:"

# Create engine with appropriate configuration
if database_url.startswith("sqlite"):
    # SQLite configuration for testing
    engine = create_engine(
        database_url,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
        echo=os.getenv("SQL_ECHO", "false").lower() == "true"
    )
else:
    # PostgreSQL configuration for production
    engine = create_engine(
        database_url,
        pool_pre_ping=True,
        pool_recycle=300,
        echo=os.getenv("SQL_ECHO", "false").lower() == "true"
    )

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    """
    Dependency function to get database session.
    Used with FastAPI's dependency injection system.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables():
    """Create all database tables."""
    Base.metadata.create_all(bind=engine)


def drop_tables():
    """Drop all database tables. Use with caution!"""
    Base.metadata.drop_all(bind=engine)


def check_database_connection(max_retries: int = 3, retry_delay: float = 1.0) -> bool:
    """
    Check database connectivity with retry logic.
    
    Args:
        max_retries: Maximum number of retry attempts
        retry_delay: Delay between retries in seconds
        
    Returns:
        bool: True if connection is successful, False otherwise
    """
    for attempt in range(max_retries + 1):
        try:
            with engine.connect() as connection:
                # Execute a simple query to test connectivity
                result = connection.execute(text("SELECT 1"))
                result.fetchone()
                logger.info("Database connection successful")
                return True
        except OperationalError as e:
            logger.warning(f"Database connection attempt {attempt + 1} failed: {str(e)}")
            if attempt < max_retries:
                time.sleep(retry_delay)
            else:
                logger.error(f"Database connection failed after {max_retries + 1} attempts")
                return False
        except Exception as e:
            logger.error(f"Unexpected error during database connection check: {str(e)}")
            return False
    
    return False


def get_database_info() -> dict:
    """
    Get database connection information and status.
    
    Returns:
        dict: Database information including status, URL (masked), and engine info
    """
    try:
        # Mask sensitive information in database URL
        masked_url = database_url
        if database_url and "://" in database_url:
            protocol, rest = database_url.split("://", 1)
            if "@" in rest:
                credentials, host_part = rest.split("@", 1)
                masked_url = f"{protocol}://***:***@{host_part}"
        
        return {
            "status": "connected" if check_database_connection(max_retries=1) else "disconnected",
            "url": masked_url,
            "engine_info": {
                "pool_size": getattr(engine.pool, 'size', None),
                "checked_out": getattr(engine.pool, 'checkedout', None),
                "overflow": getattr(engine.pool, 'overflow', None),
                "checked_in": getattr(engine.pool, 'checkedin', None),
            }
        }
    except Exception as e:
        logger.error(f"Error getting database info: {str(e)}")
        return {
            "status": "error",
            "error": str(e),
            "url": "unknown"
        }


def initialize_database_connection() -> bool:
    """
    Initialize database connection with retry logic on application startup.
    
    Returns:
        bool: True if initialization is successful, False otherwise
    """
    logger.info("Initializing database connection...")
    
    if not check_database_connection(max_retries=5, retry_delay=2.0):
        logger.error("Failed to establish database connection during initialization")
        return False
    
    try:
        # Create tables if they don't exist
        create_tables()
        logger.info("Database initialization completed successfully")
        return True
    except Exception as e:
        logger.error(f"Error during database initialization: {str(e)}")
        return False