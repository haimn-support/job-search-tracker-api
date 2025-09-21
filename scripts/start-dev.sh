#!/bin/bash

# Development server startup script for WSL
# Binds to all addresses so it can be accessed from Windows

echo "Starting Interview Position Tracker API in development mode..."
echo "Server will be accessible from Windows at: http://localhost:8000"
echo "API Documentation: http://localhost:8000/docs"
echo ""

# Activate virtual environment if it exists
if [ -d "venv" ]; then
    echo "Activating virtual environment..."
    source venv/bin/activate
fi

# Start the FastAPI server with host binding to all addresses
uvicorn app.main:app \
    --host 0.0.0.0 \
    --port 8000 \
    --reload \
    --reload-dir app \
    --log-level info

echo "Server stopped."