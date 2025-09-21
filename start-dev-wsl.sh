#!/bin/bash

# Complete development environment startup script for WSL
# Starts both backend and frontend servers accessible from Windows

echo "=========================================="
echo "Interview Position Tracker - WSL Dev Setup"
echo "=========================================="
echo ""

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "⚠️  Port $port is already in use"
        return 1
    else
        echo "✅ Port $port is available"
        return 0
    fi
}

# Function to start backend
start_backend() {
    echo "🚀 Starting Backend API Server..."
    echo "   - Host: 0.0.0.0:8000"
    echo "   - Accessible from Windows: http://localhost:8000"
    echo "   - API Docs: http://localhost:8000/docs"
    echo ""
    
    # Check if virtual environment exists
    if [ ! -d "venv" ]; then
        echo "❌ Virtual environment not found. Please run:"
        echo "   python -m venv venv"
        echo "   source venv/bin/activate"
        echo "   pip install -r requirements.txt"
        return 1
    fi
    
    # Start backend in background
    ./scripts/start-dev.sh &
    BACKEND_PID=$!
    echo "Backend started with PID: $BACKEND_PID"
    
    # Wait a moment for backend to start
    sleep 3
    
    return 0
}

# Function to start frontend
start_frontend() {
    echo "🎨 Starting Frontend Development Server..."
    echo "   - Host: 0.0.0.0:3000"
    echo "   - Accessible from Windows: http://localhost:3000"
    echo ""
    
    cd frontend
    
    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        echo "📦 Installing frontend dependencies..."
        npm install
    fi
    
    # Start frontend in background
    ./start-dev.sh &
    FRONTEND_PID=$!
    echo "Frontend started with PID: $FRONTEND_PID"
    
    cd ..
    return 0
}

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down development servers..."
    
    if [ ! -z "$BACKEND_PID" ]; then
        echo "Stopping backend (PID: $BACKEND_PID)..."
        kill $BACKEND_PID 2>/dev/null
    fi
    
    if [ ! -z "$FRONTEND_PID" ]; then
        echo "Stopping frontend (PID: $FRONTEND_PID)..."
        kill $FRONTEND_PID 2>/dev/null
    fi
    
    # Kill any remaining processes on our ports
    pkill -f "uvicorn app.main:app" 2>/dev/null
    pkill -f "react-scripts start" 2>/dev/null
    
    echo "✅ Development servers stopped"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Check prerequisites
echo "🔍 Checking prerequisites..."

# Check if ports are available
check_port 8000 || exit 1
check_port 3000 || exit 1

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed"
    exit 1
fi

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    exit 1
fi

echo ""
echo "🎯 Starting development environment..."
echo ""

# Start backend
start_backend || exit 1

# Wait a bit for backend to fully start
echo "⏳ Waiting for backend to initialize..."
sleep 5

# Start frontend
start_frontend || exit 1

echo ""
echo "=========================================="
echo "🎉 Development Environment Ready!"
echo "=========================================="
echo ""
echo "📍 Access Points (from Windows):"
echo "   • Frontend:  http://localhost:3000"
echo "   • Backend:   http://localhost:8000"
echo "   • API Docs:  http://localhost:8000/docs"
echo ""
echo "🔧 Development Features:"
echo "   • Hot reload enabled for both frontend and backend"
echo "   • File watching optimized for WSL"
echo "   • CORS configured for cross-origin requests"
echo ""
echo "📝 Logs:"
echo "   • Backend logs will appear below"
echo "   • Frontend logs in separate terminal"
echo ""
echo "🛑 To stop: Press Ctrl+C"
echo ""

# Wait for processes to finish
wait