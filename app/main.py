"""
Main FastAPI application entry point.
"""
from fastapi import FastAPI

app = FastAPI(
    title="Interview Position Tracker API",
    description="A REST API for tracking job positions and interview progress",
    version="1.0.0"
)

@app.get("/")
async def root():
    return {"message": "Interview Position Tracker API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}