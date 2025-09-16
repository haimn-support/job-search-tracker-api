# Interview Position Tracker API Documentation


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
    

## API Documentation

- **Interactive Documentation**: Open `index.html` in your browser for interactive API documentation
- **OpenAPI Schema**: `openapi.json` contains the complete OpenAPI 3.0 schema
- **Live Documentation**: When running the API server, visit `/docs` for interactive documentation

## API Version

Version: 1.0.0

## Base URL

When running locally: `http://localhost:8000`

## Authentication

Most endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## Quick Start

1. Register a new account: `POST /api/v1/auth/register`
2. Login to get a token: `POST /api/v1/auth/login`
3. Create your first position: `POST /api/v1/positions`
4. Add interviews: `POST /api/v1/positions/{position_id}/interviews`
5. View your statistics: `GET /api/v1/statistics/overview`

## Endpoints Overview

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login and get token
- `GET /api/v1/auth/me` - Get current user info
- `POST /api/v1/auth/refresh` - Refresh access token

### Positions
- `GET /api/v1/positions` - List positions (with filtering)
- `POST /api/v1/positions` - Create new position
- `GET /api/v1/positions/{id}` - Get position details
- `PUT /api/v1/positions/{id}` - Update position
- `DELETE /api/v1/positions/{id}` - Delete position

### Interviews
- `GET /api/v1/positions/{id}/interviews` - List interviews for position
- `POST /api/v1/positions/{id}/interviews` - Add interview
- `PUT /api/v1/interviews/{id}` - Update interview
- `DELETE /api/v1/interviews/{id}` - Delete interview

### Statistics
- `GET /api/v1/statistics/overview` - General statistics
- `GET /api/v1/statistics/timeline` - Timeline analysis
- `GET /api/v1/statistics/companies` - Company breakdown

### Health
- `GET /health` - API health check
- `GET /health/db` - Database health check
