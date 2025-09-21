#!/bin/bash

# Frontend development server startup script for WSL
# Binds to all addresses so it can be accessed from Windows

echo "Starting Interview Position Tracker Frontend in development mode..."
echo "Frontend will be accessible from Windows at: http://localhost:3000"
echo "Make sure the backend API is running at: http://localhost:8000"
echo ""

# Load WSL-specific environment variables
if [ -f ".env.wsl" ]; then
    echo "Loading WSL environment configuration..."
    export $(cat .env.wsl | grep -v '^#' | xargs)
fi

# Set additional environment variables for WSL development
export HOST=0.0.0.0
export PORT=3000
export CHOKIDAR_USEPOLLING=true  # Better file watching in WSL
export FAST_REFRESH=true
export WDS_SOCKET_HOST=localhost  # WebSocket host for hot reload
export WDS_SOCKET_PORT=3000

echo "Environment configured for WSL development"
echo ""

# Start the React development server
npm run start

echo "Frontend server stopped."