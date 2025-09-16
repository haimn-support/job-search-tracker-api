"""
Health check endpoints for API and database status monitoring.
"""
import logging
from datetime import datetime
from typing import Dict, Any
from fastapi import APIRouter, HTTPException, status
from sqlalchemy.exc import SQLAlchemyError

from app.core.database import check_database_connection, get_database_info
from app.schemas.common import HealthCheckResponse

logger = logging.getLogger(__name__)

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthCheckResponse)
async def basic_health_check():
    """
    Basic health check endpoint that returns API status.
    This endpoint is lightweight and doesn't check external dependencies.
    """
    return HealthCheckResponse(
        status="healthy",
        timestamp=datetime.utcnow()
    )


@router.get("/health/detailed")
async def detailed_health_check():
    """
    Detailed health check that includes database connectivity and system status.
    Returns comprehensive information about all system components.
    """
    health_status = {
        "api": {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat()
        },
        "database": {},
        "overall_status": "healthy"
    }
    
    try:
        # Check database connectivity
        db_connected = check_database_connection(max_retries=2, retry_delay=0.5)
        db_info = get_database_info()
        
        health_status["database"] = {
            "status": "healthy" if db_connected else "unhealthy",
            "connected": db_connected,
            "info": db_info,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # Determine overall status
        if not db_connected:
            health_status["overall_status"] = "degraded"
            logger.warning("Health check detected database connectivity issues")
        
    except SQLAlchemyError as e:
        logger.error(f"Database error during health check: {str(e)}")
        health_status["database"] = {
            "status": "unhealthy",
            "connected": False,
            "error": "Database connection error",
            "timestamp": datetime.utcnow().isoformat()
        }
        health_status["overall_status"] = "unhealthy"
    
    except Exception as e:
        logger.error(f"Unexpected error during detailed health check: {str(e)}")
        health_status["database"] = {
            "status": "unknown",
            "connected": False,
            "error": "Unexpected error during health check",
            "timestamp": datetime.utcnow().isoformat()
        }
        health_status["overall_status"] = "unknown"
    
    return health_status


@router.get("/health/database")
async def database_health_check():
    """
    Database-specific health check endpoint.
    Returns detailed database connectivity and performance information.
    """
    try:
        # Perform database connectivity check with retry logic
        db_connected = check_database_connection(max_retries=3, retry_delay=1.0)
        db_info = get_database_info()
        
        if not db_connected:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database is not accessible"
            )
        
        return {
            "status": "healthy",
            "connected": True,
            "database_info": db_info,
            "timestamp": datetime.utcnow().isoformat()
        }
    
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    
    except SQLAlchemyError as e:
        logger.error(f"Database error during database health check: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Database error: {str(e)}"
        )
    
    except Exception as e:
        logger.error(f"Unexpected error during database health check: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error during health check"
        )


@router.get("/health/readiness")
async def readiness_check():
    """
    Readiness check endpoint for container orchestration.
    Returns 200 if the service is ready to accept traffic, 503 otherwise.
    """
    try:
        # Check if database is accessible
        db_connected = check_database_connection(max_retries=1, retry_delay=0.5)
        
        if not db_connected:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Service not ready - database unavailable"
            )
        
        return {
            "status": "ready",
            "timestamp": datetime.utcnow().isoformat()
        }
    
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    
    except Exception as e:
        logger.error(f"Error during readiness check: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Service not ready"
        )


@router.get("/health/liveness")
async def liveness_check():
    """
    Liveness check endpoint for container orchestration.
    Returns 200 if the service is alive, regardless of external dependencies.
    """
    return {
        "status": "alive",
        "timestamp": datetime.utcnow().isoformat()
    }