"""
Main FastAPI application entry point.
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import SQLAlchemyError
from pydantic import ValidationError

from .core.config import settings
from .core.exceptions import BaseAPIException
from .core.exception_handlers import (
    base_api_exception_handler,
    http_exception_handler,
    validation_exception_handler,
    pydantic_validation_exception_handler,
    sqlalchemy_exception_handler,
    generic_exception_handler
)
from .core.authorization import user_context_middleware
from .core.database import initialize_database_connection
from .api.auth import router as auth_router
from .api.positions import router as positions_router
from .api.interviews import router as interviews_router
from .api.statistics import router as statistics_router
from .api.health import router as health_router

app = FastAPI(
    title="Interview Position Tracker API",
    description="""
    A comprehensive REST API for tracking job positions and interview progress.
    
    ## Features
    
    * **User Authentication**: Secure JWT-based authentication system
    * **Position Management**: Create, read, update, and delete job positions
    * **Interview Tracking**: Track multiple interview stages for each position
    * **Statistics & Analytics**: Get insights into your job search progress
    * **Data Filtering**: Filter positions by status, company, date range, and more
    * **Secure Access**: User-specific data isolation and authorization
    
    ## Authentication
    
    Most endpoints require authentication. To authenticate:
    
    1. Register a new account using `/api/v1/auth/register`
    2. Login using `/api/v1/auth/login` to get an access token
    3. Include the token in the Authorization header: `Bearer <your_token>`
    
    ## Workflow
    
    1. **Register/Login** to get authenticated
    2. **Create positions** for jobs you're applying to
    3. **Add interviews** as you progress through hiring processes
    4. **Update statuses** as your applications move forward
    5. **View statistics** to analyze your job search performance
    """,
    version="1.0.0",
    contact={
        "name": "Interview Position Tracker API",
        "url": "https://github.com/your-repo/interview-tracker",
    },
    license_info={
        "name": "MIT",
        "url": "https://opensource.org/licenses/MIT",
    },
    openapi_tags=[
        {
            "name": "Authentication",
            "description": "User registration, login, and token management"
        },
        {
            "name": "Positions",
            "description": "Job position management operations"
        },
        {
            "name": "Interviews",
            "description": "Interview stage tracking and management"
        },
        {
            "name": "Statistics",
            "description": "Job search analytics and insights"
        },
        {
            "name": "Health",
            "description": "API health checks and system status"
        }
    ]
)

# Register exception handlers
app.add_exception_handler(BaseAPIException, base_api_exception_handler)
app.add_exception_handler(HTTPException, http_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(ValidationError, pydantic_validation_exception_handler)
app.add_exception_handler(SQLAlchemyError, sqlalchemy_exception_handler)
app.add_exception_handler(Exception, generic_exception_handler)

# Add user context middleware
app.middleware("http")(user_context_middleware)


# Add CORS middleware
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Include routers
app.include_router(health_router)  # Health checks don't need API version prefix
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(positions_router, prefix=settings.API_V1_STR)
app.include_router(interviews_router, prefix=settings.API_V1_STR)
app.include_router(statistics_router, prefix=settings.API_V1_STR)

@app.on_event("startup")
async def startup_event():
    """Initialize database connection on application startup."""
    import logging
    logger = logging.getLogger(__name__)
    
    logger.info("Starting up Interview Position Tracker API...")
    
    # Initialize database connection with retry logic
    if not initialize_database_connection():
        logger.error("Failed to initialize database connection. Application may not function properly.")
    else:
        logger.info("Database connection initialized successfully")


@app.on_event("shutdown")
async def shutdown_event():
    """Clean up resources on application shutdown."""
    import logging
    logger = logging.getLogger(__name__)
    
    logger.info("Shutting down Interview Position Tracker API...")


@app.get("/")
async def root():
    return {"message": "Interview Position Tracker API"}