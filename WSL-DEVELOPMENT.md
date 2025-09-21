# WSL Development Setup Guide

This guide explains how to run the Interview Position Tracker in WSL (Windows Subsystem for Linux) so you can access the servers from Windows.

## Quick Start

### Option 1: All-in-One Script (Recommended)
```bash
# Start both backend and frontend servers
./start-dev-wsl.sh
```

### Option 2: Manual Setup

**Terminal 1 - Backend:**
```bash
# Start the backend API server
./scripts/start-dev.sh
```

**Terminal 2 - Frontend:**
```bash
# Start the frontend development server
cd frontend
./start-dev.sh
```

## Access Points

Once both servers are running, you can access them from Windows:

- **Frontend Application**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **API Alternative Docs**: http://localhost:8000/redoc

## Configuration Details

### Backend Configuration
- **Host**: `0.0.0.0` (binds to all interfaces)
- **Port**: `8000`
- **Hot Reload**: Enabled with `--reload`
- **CORS**: Configured to allow frontend requests

### Frontend Configuration
- **Host**: `0.0.0.0` (binds to all interfaces)
- **Port**: `3000`
- **Hot Reload**: Enabled with optimized file watching for WSL
- **Proxy**: Configured to proxy API requests to backend

## WSL-Specific Optimizations

### File Watching
```bash
# Enabled in frontend/.env.wsl
CHOKIDAR_USEPOLLING=true
FAST_REFRESH=true
```

### WebSocket Configuration
```bash
# For hot reload to work from Windows
WDS_SOCKET_HOST=localhost
WDS_SOCKET_PORT=3000
```

### Network Binding
Both servers bind to `0.0.0.0` instead of `127.0.0.1` to be accessible from Windows.

## Troubleshooting

### Port Already in Use
```bash
# Check what's using the port
lsof -i :8000  # Backend
lsof -i :3000  # Frontend

# Kill processes if needed
pkill -f "uvicorn app.main:app"
pkill -f "react-scripts start"
```

### Hot Reload Not Working
1. Make sure `CHOKIDAR_USEPOLLING=true` is set
2. Try restarting the frontend server
3. Check that files are being saved in WSL filesystem (not Windows filesystem)

### CORS Issues
The backend is configured with CORS to allow requests from `http://localhost:3000`. If you're using a different port, update the CORS configuration in `app/main.py`.

### Cannot Access from Windows
1. Verify servers are binding to `0.0.0.0` not `127.0.0.1`
2. Check Windows Firewall settings
3. Ensure WSL2 is being used (not WSL1)

## Development Workflow

### Making Changes
1. **Backend Changes**: Saved automatically with hot reload
2. **Frontend Changes**: Saved automatically with hot reload and fast refresh
3. **Environment Changes**: Restart the respective server

### Database Changes
```bash
# Run migrations
alembic upgrade head

# Create new migration
alembic revision --autogenerate -m "Description"
```

### Testing
```bash
# Backend tests
pytest

# Frontend tests
cd frontend
npm test
```

## Environment Variables

### Backend (.env)
```bash
DATABASE_URL=postgresql://user:pass@localhost:5432/interview_tracker
SECRET_KEY=your-secret-key
BACKEND_CORS_ORIGINS=["http://localhost:3000"]
```

### Frontend (.env.development)
```bash
REACT_APP_API_BASE_URL=http://localhost:8000
```

### WSL-Specific (.env.wsl)
```bash
HOST=0.0.0.0
PORT=3000
CHOKIDAR_USEPOLLING=true
FAST_REFRESH=true
WDS_SOCKET_HOST=localhost
WDS_SOCKET_PORT=3000
```

## Performance Tips

1. **Use WSL2**: Much faster than WSL1
2. **Store Code in WSL**: Keep project files in WSL filesystem for better performance
3. **File Watching**: Polling is enabled for better file change detection
4. **Memory**: Allocate sufficient memory to WSL2 in `.wslconfig`

## WSL Configuration (.wslconfig)

Create `%USERPROFILE%\.wslconfig` on Windows:

```ini
[wsl2]
memory=4GB
processors=2
swap=2GB
```

## IDE Integration

### VS Code
1. Install "Remote - WSL" extension
2. Open project with `code .` from WSL terminal
3. Extensions will run in WSL context

### WebStorm/IntelliJ
1. Configure Node.js interpreter to use WSL
2. Set up run configurations for WSL environment

## Security Notes

- Servers bind to all interfaces for development convenience
- In production, use proper reverse proxy and security configurations
- Environment variables contain development values only
- CORS is configured for local development

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Verify WSL2 is installed and updated
3. Ensure all dependencies are installed in WSL
4. Check Windows Defender/Firewall settings