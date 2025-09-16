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
from .api.auth import router as auth_router
from .api.positions import router as positions_router
from .api.interviews import router as interviews_router
from .api.statistics import router as statistics_router

app = FastAPI(
    title="Interview Position Tracker API",
    description="A REST API for tracking job positions and interview progress",
    version="1.0.0"
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
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(positions_router, prefix=settings.API_V1_STR)
app.include_router(interviews_router, prefix=settings.API_V1_STR)
app.include_router(statistics_router, prefix=settings.API_V1_STR)

@app.get("/")
async def root():
    return {"message": "Interview Position Tracker API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}