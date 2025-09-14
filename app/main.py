"""
Main FastAPI application entry point.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .core.config import settings
from .api.auth import router as auth_router
from .api.positions import router as positions_router

app = FastAPI(
    title="Interview Position Tracker API",
    description="A REST API for tracking job positions and interview progress",
    version="1.0.0"
)

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

@app.get("/")
async def root():
    return {"message": "Interview Position Tracker API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}