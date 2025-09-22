# Interview Position Tracker API

A REST API backend for tracking job positions and interview progress, built with FastAPI and PostgreSQL.

## Setup

### Prerequisites
- Python 3.9+
- PostgreSQL database (local or cloud)

### Installation

1. Clone the repository and navigate to the project directory

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your database credentials and configuration
```

5. Run database migrations:
```bash
alembic upgrade head
```

6. Start the development server:
```bash
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`

## API Documentation

Once the server is running, you can access:
- Interactive API docs: `http://localhost:8000/docs`
- ReDoc documentation: `http://localhost:8000/redoc`

### Health Checks

The API provides comprehensive health check endpoints for monitoring system status and database connectivity. These endpoints are designed for both manual monitoring and container orchestration platforms like Kubernetes.

#### Health Check Endpoints

**Basic Health Check** - `GET /health`
- Lightweight endpoint that returns API status
- No external dependencies checked
- Always returns 200 OK if the API is running

```bash
curl "http://localhost:8000/health"
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T12:00:00.000000"
}
```

**Detailed Health Check** - `GET /health/detailed`
- Comprehensive system status including database connectivity
- Returns overall system health and component-specific status
- Includes database connection information and engine statistics

```bash
curl "http://localhost:8000/health/detailed"
```

**Response:**
```json
{
  "api": {
    "status": "healthy",
    "timestamp": "2024-01-01T12:00:00.000000"
  },
  "database": {
    "status": "healthy",
    "connected": true,
    "info": {
      "status": "connected",
      "url": "postgresql://***:***@localhost:5432/interview_tracker",
      "engine_info": {
        "pool_size": 10,
        "checked_out": 2,
        "overflow": 0,
        "checked_in": 8
      }
    },
    "timestamp": "2024-01-01T12:00:00.000000"
  },
  "overall_status": "healthy"
}
```

**Database Health Check** - `GET /health/database`
- Database-specific health check with detailed connectivity information
- Returns 503 Service Unavailable if database is not accessible
- Includes retry logic for transient connection issues

```bash
curl "http://localhost:8000/health/database"
```

**Readiness Check** - `GET /health/readiness`
- Container orchestration readiness check
- Returns 200 if service is ready to accept traffic, 503 otherwise
- Checks database connectivity before marking as ready

```bash
curl "http://localhost:8000/health/readiness"
```

**Liveness Check** - `GET /health/liveness`
- Container orchestration liveness check
- Returns 200 if the service is alive, regardless of external dependencies
- Used by orchestration platforms to determine if container should be restarted

```bash
curl "http://localhost:8000/health/liveness"
```

#### Health Check Features

- **Retry Logic**: Database connectivity checks include configurable retry logic with exponential backoff
- **Graceful Error Handling**: Connection failures are handled gracefully with appropriate HTTP status codes
- **Security**: Database URLs are masked in responses to prevent credential exposure
- **Performance Monitoring**: Engine statistics provide insights into connection pool usage
- **Container Ready**: Designed for use with Kubernetes readiness and liveness probes

#### Container Orchestration Integration

For Kubernetes deployments, configure probes as follows:

```yaml
livenessProbe:
  httpGet:
    path: /health/liveness
    port: 8000
  initialDelaySeconds: 30
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /health/readiness
    port: 8000
  initialDelaySeconds: 5
  periodSeconds: 5
```

### Authentication

All API endpoints (except health checks and authentication) require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### API Endpoints

#### Health Check Endpoints
- `GET /health` - Basic health check (lightweight, no external dependencies)
- `GET /health/detailed` - Comprehensive system status including database connectivity
- `GET /health/database` - Database-specific health check with detailed information
- `GET /health/readiness` - Container orchestration readiness check
- `GET /health/liveness` - Container orchestration liveness check

#### Authentication Endpoints
- `POST /api/v1/auth/register` - Register a new user
- `POST /api/v1/auth/login` - Login and get JWT token

#### Position Management Endpoints
- `POST /api/v1/positions/` - Create a new job position
- `GET /api/v1/positions/` - List all positions with filtering and pagination
- `GET /api/v1/positions/{id}` - Get a specific position
- `PUT /api/v1/positions/{id}` - Update a position
- `PUT /api/v1/positions/{id}/status` - Update only the position status
- `DELETE /api/v1/positions/{id}` - Delete a position

#### Interview Management Endpoints
- `POST /api/v1/positions/{position_id}/interviews` - Create a new interview for a position
- `GET /api/v1/positions/{position_id}/interviews` - List all interviews for a position
- `GET /api/v1/interviews/{id}` - Get a specific interview
- `PUT /api/v1/interviews/{id}` - Update an interview (all fields)
- `PUT /api/v1/interviews/{id}/schedule` - Update only the interview scheduled date
- `PUT /api/v1/interviews/{id}/notes` - Update only the interview notes
- `PUT /api/v1/interviews/{id}/outcome` - Update only the interview outcome
- `DELETE /api/v1/interviews/{id}` - Delete an interview

#### Statistics & Analytics Endpoints
- `GET /api/v1/statistics/overview` - Get overview statistics with conversion rates and breakdowns
- `GET /api/v1/statistics/timeline` - Get timeline-based statistics with monthly trends
- `GET /api/v1/statistics/companies` - Get company-based statistics and success rates

#### Position Status Values
The following status values are supported:
- `applied` - Application submitted
- `screening` - Initial screening phase
- `interviewing` - Interview process ongoing
- `offer` - Job offer received
- `rejected` - Application rejected
- `withdrawn` - Application withdrawn

#### Interview Types
- `technical` - Technical interview
- `behavioral` - Behavioral interview
- `hr` - HR screening interview
- `final` - Final interview

#### Interview Places/Formats
- `phone` - Phone interview
- `video` - Video call interview
- `onsite` - In-person interview

#### Interview Outcomes
- `pending` - Interview not yet completed
- `passed` - Interview passed successfully
- `failed` - Interview failed
- `cancelled` - Interview was cancelled

**Note**: When an interview outcome is set to `failed`, the associated position status is automatically updated to `rejected`.

#### Position Filtering & Pagination
The list positions endpoint supports comprehensive filtering and pagination:

**Filtering Parameters:**
- `status` - Filter by position status (applied, interviewing, rejected, etc.)
- `company` - Filter by company name (partial match, case-insensitive)
- `date_from` - Filter positions from this application date (YYYY-MM-DD)
- `date_to` - Filter positions up to this application date (YYYY-MM-DD)
- `search` - Full-text search across title, company, and description fields

**Sorting Parameters:**
- `sort_by` - Field to sort by: application_date, title, company (default: application_date)
- `sort_order` - Sort order: asc or desc (default: desc)

**Pagination Parameters:**
- `page` - Page number (1-based, default: 1)
- `per_page` - Number of items per page (1-100, default: 20)

**Response Format:**
```json
{
  "positions": [...],
  "total": 25,
  "page": 1,
  "per_page": 20,
  "has_next": true,
  "has_prev": false
}
```

#### Example API Usage

**Create a position:**
```bash
curl -X POST "http://localhost:8000/api/v1/positions/" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Senior Software Engineer",
    "company": "Tech Corp",
    "description": "Full-stack development role",
    "location": "San Francisco, CA",
    "salary_range": "$120k - $150k",
    "status": "applied",
    "application_date": "2024-01-15"
  }'
```

**Update position status:**
```bash
curl -X PUT "http://localhost:8000/api/v1/positions/{position_id}/status" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"status": "interviewing"}'
```

**List positions with filtering and pagination:**
```bash
# Filter by status and company with pagination
curl "http://localhost:8000/api/v1/positions/?status=interviewing&company=Tech&page=1&per_page=10" \
  -H "Authorization: Bearer <token>"

# Search with date range filtering
curl "http://localhost:8000/api/v1/positions/?search=Python&date_from=2024-01-01&date_to=2024-12-31&sort_by=title&sort_order=asc" \
  -H "Authorization: Bearer <token>"

# Combined filters
curl "http://localhost:8000/api/v1/positions/?status=applied&company=startup&search=engineer&page=2&per_page=5" \
  -H "Authorization: Bearer <token>"
```

**Create an interview for a position:**
```bash
curl -X POST "http://localhost:8000/api/v1/positions/{position_id}/interviews" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "technical",
    "place": "video",
    "scheduled_date": "2024-02-15T14:00:00",
    "duration_minutes": 60,
    "notes": "Technical interview with the engineering team",
    "outcome": "pending"
  }'
```

**Update interview scheduled date:**
```bash
curl -X PUT "http://localhost:8000/api/v1/interviews/{interview_id}/schedule" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"scheduled_date": "2024-02-16T15:00:00"}'
```

**Update interview notes:**
```bash
curl -X PUT "http://localhost:8000/api/v1/interviews/{interview_id}/notes" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"notes": "Great discussion about system architecture and scalability"}'
```

**Update interview outcome (with automatic position status update):**
```bash
curl -X PUT "http://localhost:8000/api/v1/interviews/{interview_id}/outcome" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"outcome": "passed"}'
```

**List interviews for a position:**
```bash
curl "http://localhost:8000/api/v1/positions/{position_id}/interviews" \
  -H "Authorization: Bearer <token>"
```

### Statistics & Analytics

The API provides comprehensive statistics and analytics endpoints to help track your job search progress and identify trends.

#### Statistics Filtering
All statistics endpoints support optional query parameters for filtering:
- `start_date` - Filter data from this date (YYYY-MM-DD)
- `end_date` - Filter data up to this date (YYYY-MM-DD)
- `company` - Filter by company name (partial match)
- `status` - Filter by position status

#### Overview Statistics
Get comprehensive metrics about your job applications:

```bash
curl "http://localhost:8000/api/v1/statistics/overview" \
  -H "Authorization: Bearer <token>"
```

**Response includes:**
- Total applications, companies, and interviews
- Response rate (% of applications that got responses)
- Interview rate (% of applications that led to interviews)
- Offer rate (% of applications that led to offers)
- Breakdowns by position status, interview type, and interview outcome

**Example response:**
```json
{
  "total_applications": 25,
  "total_companies": 18,
  "total_interviews": 12,
  "response_rate": 68.0,
  "interview_rate": 48.0,
  "offer_rate": 12.0,
  "status_breakdown": {
    "applied": 8,
    "screening": 3,
    "interviewing": 6,
    "offer": 3,
    "rejected": 4,
    "withdrawn": 1
  },
  "interview_type_breakdown": {
    "technical": 8,
    "behavioral": 6,
    "hr": 4,
    "final": 2
  },
  "interview_outcome_breakdown": {
    "pending": 3,
    "passed": 7,
    "failed": 2,
    "cancelled": 0
  }
}
```

#### Timeline Statistics
Get time-based analytics to track trends over time:

```bash
curl "http://localhost:8000/api/v1/statistics/timeline?start_date=2024-01-01&end_date=2024-12-31" \
  -H "Authorization: Bearer <token>"
```

**Response includes:**
- Applications and interviews per month
- Average response time from application to first interview
- Average time from interview to final decision

**Example response:**
```json
{
  "period_start": "2024-01-01",
  "period_end": "2024-12-31",
  "applications_per_month": [
    {"month": "2024-01", "count": 8},
    {"month": "2024-02", "count": 12},
    {"month": "2024-03", "count": 5}
  ],
  "interviews_per_month": [
    {"month": "2024-01", "count": 3},
    {"month": "2024-02", "count": 7},
    {"month": "2024-03", "count": 2}
  ],
  "average_response_time_days": 12.5,
  "average_interview_to_decision_days": 8.2
}
```

#### Company Statistics
Get detailed statistics broken down by company:

```bash
curl "http://localhost:8000/api/v1/statistics/companies" \
  -H "Authorization: Bearer <token>"
```

**Response includes:**
- Statistics for each company you've applied to
- Success rates and application counts per company
- Companies sorted by total applications (descending)

**Example response:**
```json
{
  "companies": [
    {
      "company_name": "TechCorp",
      "total_applications": 3,
      "total_interviews": 2,
      "latest_application_date": "2024-02-15",
      "status_breakdown": {
        "applied": 1,
        "interviewing": 1,
        "offer": 1,
        "rejected": 0,
        "screening": 0,
        "withdrawn": 0
      },
      "success_rate": 33.33
    },
    {
      "company_name": "StartupInc",
      "total_applications": 2,
      "total_interviews": 1,
      "latest_application_date": "2024-02-10",
      "status_breakdown": {
        "applied": 1,
        "rejected": 1,
        "interviewing": 0,
        "offer": 0,
        "screening": 0,
        "withdrawn": 0
      },
      "success_rate": 0.0
    }
  ],
  "total_companies": 2
}
```

#### Statistics with Filters
Apply filters to focus on specific time periods or companies:

```bash
# Get statistics for a specific time period
curl "http://localhost:8000/api/v1/statistics/overview?start_date=2024-01-01&end_date=2024-03-31" \
  -H "Authorization: Bearer <token>"

# Get statistics for specific companies
curl "http://localhost:8000/api/v1/statistics/companies?company=Tech" \
  -H "Authorization: Bearer <token>"

# Get timeline statistics for specific status
curl "http://localhost:8000/api/v1/statistics/timeline?status=interviewing" \
  -H "Authorization: Bearer <token>"
```

## Error Handling

The API implements comprehensive error handling with standardized error responses and user-friendly messages.

### Error Response Format

All errors follow a consistent JSON structure:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "timestamp": "2024-01-01T12:00:00Z",
    "details": {
      "additional": "context information"
    },
    "field_errors": {
      "field_name": "Field-specific error message"
    }
  }
}
```

### Error Types and HTTP Status Codes

#### 400 Bad Request - Business Logic Errors
```json
{
  "error": {
    "code": "BUSINESS_LOGIC_ERROR",
    "message": "Cannot delete position with active interviews",
    "timestamp": "2024-01-01T12:00:00Z"
  }
}
```

#### 401 Unauthorized - Authentication Errors
```json
{
  "error": {
    "code": "AUTHENTICATION_ERROR",
    "message": "Could not validate credentials",
    "timestamp": "2024-01-01T12:00:00Z"
  }
}
```

#### 403 Forbidden - Authorization Errors
```json
{
  "error": {
    "code": "AUTHORIZATION_ERROR",
    "message": "Access denied",
    "timestamp": "2024-01-01T12:00:00Z"
  }
}
```

#### 404 Not Found - Resource Not Found
```json
{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Position with ID '123e4567-e89b-12d3-a456-426614174000' not found",
    "timestamp": "2024-01-01T12:00:00Z",
    "details": {
      "resource_type": "Position",
      "resource_id": "123e4567-e89b-12d3-a456-426614174000"
    }
  }
}
```

#### 409 Conflict - Resource Conflicts
```json
{
  "error": {
    "code": "RESOURCE_CONFLICT",
    "message": "Email already registered",
    "timestamp": "2024-01-01T12:00:00Z",
    "details": {
      "resource_type": "User"
    }
  }
}
```

#### 422 Unprocessable Entity - Validation Errors
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "timestamp": "2024-01-01T12:00:00Z",
    "field_errors": {
      "email": "Must be a valid email address",
      "password": "Must be at least 8 characters",
      "first_name": "This field is required"
    }
  }
}
```

#### 429 Too Many Requests - Rate Limiting
```json
{
  "error": {
    "code": "RATE_LIMIT_ERROR",
    "message": "Rate limit exceeded",
    "timestamp": "2024-01-01T12:00:00Z",
    "details": {
      "retry_after": 60
    }
  }
}
```

#### 500 Internal Server Error - Database/System Errors
```json
{
  "error": {
    "code": "DATABASE_ERROR",
    "message": "A database error occurred",
    "timestamp": "2024-01-01T12:00:00Z"
  }
}
```

#### 503 Service Unavailable - External Service Errors
```json
{
  "error": {
    "code": "EXTERNAL_SERVICE_ERROR",
    "message": "External service unavailable",
    "timestamp": "2024-01-01T12:00:00Z",
    "details": {
      "service_name": "EmailService"
    }
  }
}
```

### Field Validation Examples

The API provides detailed field-level validation with user-friendly messages:

**Invalid email format:**
```bash
curl -X POST "http://localhost:8000/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "invalid-email",
    "password": "123",
    "first_name": "",
    "last_name": "Test"
  }'
```

**Response:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "timestamp": "2024-01-01T12:00:00Z",
    "field_errors": {
      "email": "Must be a valid email address",
      "password": "Must be at least 8 characters",
      "first_name": "This field is required"
    }
  }
}
```

**Invalid UUID in path parameter:**
```bash
curl "http://localhost:8000/api/v1/positions/invalid-uuid" \
  -H "Authorization: Bearer <token>"
```

**Response:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "timestamp": "2024-01-01T12:00:00Z",
    "field_errors": {
      "position_id": "Must be a valid UUID"
    }
  }
}
```

### Security Features

- **No Information Leakage**: Error messages are designed to be informative without exposing sensitive system details
- **Consistent Authentication Errors**: Authentication failures return generic messages to prevent user enumeration
- **Safe Database Error Handling**: Database errors are caught and returned as generic server errors
- **Request Validation**: All input is validated before processing to prevent injection attacks

## Authorization & Data Isolation

The API implements comprehensive authorization and data isolation to ensure users can only access their own data.

### User Context System

- **Automatic User Context Injection**: Middleware automatically extracts user information from JWT tokens and injects it into the request lifecycle
- **Centralized Authorization Service**: `AuthorizationService` provides consistent authorization checks across all endpoints
- **User Context Dependencies**: FastAPI dependencies automatically provide user context to endpoint handlers

### Data Isolation Features

#### User-Specific Data Filtering
- **Repository-Level Filtering**: All database queries automatically filter by user ID to ensure data isolation
- **Ownership Verification**: Every resource access is verified to ensure the user owns the requested resource
- **Cross-User Access Prevention**: Users cannot access positions, interviews, or statistics belonging to other users

#### Authorization Middleware
- **JWT Token Processing**: Middleware automatically processes JWT tokens and extracts user information
- **Request State Management**: User context is stored in request state for access throughout the request lifecycle
- **Graceful Error Handling**: Invalid or missing tokens are handled gracefully without breaking the application

#### Protected Endpoints
All API endpoints (except authentication and health check) require valid JWT authentication:

```bash
# All requests must include Authorization header
curl -H "Authorization: Bearer <your-jwt-token>" \
  "http://localhost:8000/api/v1/positions/"
```

#### Authorization Verification Examples

**Accessing another user's position (returns 404):**
```bash
curl "http://localhost:8000/api/v1/positions/other-user-position-id" \
  -H "Authorization: Bearer <your-token>"
# Response: 404 Not Found - Position not found
```

**Accessing without authentication (returns 403):**
```bash
curl "http://localhost:8000/api/v1/positions/"
# Response: 403 Forbidden - Not authenticated
```

**Invalid token (returns 401):**
```bash
curl "http://localhost:8000/api/v1/positions/" \
  -H "Authorization: Bearer invalid-token"
# Response: 401 Unauthorized - Could not validate credentials
```

### Authorization Components

#### UserContext Class
Holds user information throughout the request lifecycle:
```python
class UserContext:
    def __init__(self, user_id: UUID, user: Optional[User] = None):
        self.user_id = user_id
        self.user = user
```

#### Authorization Service
Provides centralized authorization logic:
- `can_access_position(position_id, user_id)` - Check if user can access a position
- `can_access_interview(interview_id, user_id)` - Check if user can access an interview
- `get_user_position(position_id, user_id)` - Get position if owned by user
- `get_user_interview(interview_id, user_id)` - Get interview if owned by user

#### Verification Functions
- `verify_position_ownership(position, user_context)` - Verify position belongs to user
- `verify_interview_ownership(interview, position, user_context)` - Verify interview belongs to user

### Data Isolation Testing

The system includes comprehensive tests to verify data isolation:

- **Cross-User Access Tests**: Verify users cannot access other users' data
- **Unauthorized Access Tests**: Verify proper rejection of unauthenticated requests
- **Edge Case Tests**: Test invalid tokens, malformed requests, and missing resources
- **Integration Tests**: End-to-end testing of authorization flows

### Security Best Practices

- **Principle of Least Privilege**: Users can only access their own resources
- **Defense in Depth**: Multiple layers of authorization checks (middleware, dependencies, repository)
- **Secure by Default**: All endpoints require authentication unless explicitly made public
- **Consistent Error Handling**: Authorization errors return consistent, non-revealing error messages
- **Token Validation**: JWT tokens are validated on every request with proper error handling

## Frontend Application

This project includes a modern React TypeScript frontend application that provides an intuitive interface for managing job applications and interviews. The frontend is located in the `frontend/` directory and offers a comprehensive set of features for job search management.

### 🔍 **Advanced Filtering & Search System**

The frontend includes a sophisticated filtering system that makes it easy to find and organize your job applications:

#### **Smart Filter Presets**
- **Default Presets**: "Active Applications", "In Progress", "Recent Applications", "Needs Follow-up"
- **Custom Presets**: Save your own filter combinations with custom names
- **Usage Tracking**: Presets are sorted by popularity and show usage counts
- **Preset Management**: Edit, delete, and share custom filter presets

#### **Enhanced Date Range Filtering**
- **Quick Select Options**: Last 7 days, 30 days, 3 months, 6 months, this year, last year
- **Custom Date Ranges**: Flexible date picker with validation
- **Smart Validation**: Prevents invalid date ranges and provides helpful warnings
- **Visual Feedback**: Clear date range display with easy clearing options

#### **Intelligent Filter Validation**
- **Real-time Validation**: Instant feedback on filter combinations
- **Smart Suggestions**: Context-aware recommendations based on your data
- **Error Prevention**: Validates date ranges, search terms, and filter logic
- **Performance Tips**: Suggests optimizations for better search results

#### **Import/Export Capabilities**
- **Filter Export**: Save filter configurations as JSON files
- **Filter Import**: Load previously saved filter configurations
- **Shareable URLs**: Generate links to share specific filter combinations
- **QR Code Generation**: Create QR codes for mobile sharing of filters

#### **Advanced Search Features**
- **Multi-field Search**: Search across position titles, companies, and descriptions
- **Debounced Input**: Smooth, responsive search with optimized performance
- **Search Optimization**: Automatic trimming and validation of search terms
- **Filter Descriptions**: Human-readable descriptions of active filters

#### **User Experience Enhancements**
- **Filter Persistence**: Filters are saved in URL for bookmarking and sharing
- **Active Filter Display**: Clear indication of applied filters with counts
- **One-click Clear**: Easy removal of all filters or individual filter types
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices

### 🎯 **Position & Interview Management**
- Comprehensive CRUD operations for positions and interviews
- Inline editing capabilities for quick updates
- Status tracking and progress visualization
- Interview scheduling with conflict detection
- Quick actions for common operations

### 📊 **Analytics & Insights**
- Real-time statistics dashboard
- Success rate calculations and conversion funnels
- Company-wise performance analysis
- Timeline trends and progress tracking

### 🔐 **Security & Authentication**
- JWT-based authentication with automatic refresh
- Protected routes and session management
- User data isolation and privacy protection

### 📱 **Modern User Experience**
- Mobile-first responsive design
- Progressive Web App capabilities
- Offline support with data synchronization
- Accessibility compliance (WCAG 2.1 AA)

For detailed frontend documentation, see [`frontend/README.md`](frontend/README.md).

## Features

### Interview Stage Tracking
- **Complete CRUD Operations**: Create, read, update, and delete interviews for each position
- **Granular Updates**: Dedicated endpoints for updating specific fields (schedule, notes, outcome)
- **Automatic Status Management**: Failed interviews automatically update position status to "rejected"
- **Cascade Deletion**: Deleting a position removes all associated interviews
- **Comprehensive Validation**: Input validation for dates, durations, and enum values
- **Security**: All operations require authentication and verify user ownership

### Position Management
- **Filtering & Search**: Filter positions by status, company, date range, or search terms
- **Pagination**: Efficient pagination with configurable page sizes
- **Status Tracking**: Track application progress through various stages
- **Relationship Management**: Positions include associated interview data

### Statistics & Analytics
- **Overview Metrics**: Track total applications, response rates, interview rates, and offer rates
- **Conversion Analysis**: Calculate success rates and conversion funnels
- **Timeline Trends**: Monitor application and interview activity over time with monthly breakdowns
- **Company Insights**: Analyze performance and success rates by company
- **Flexible Filtering**: Apply date range, company, and status filters to all statistics
- **Performance Tracking**: Average response times and decision timelines

### Comprehensive Error Handling
- **Standardized Error Responses**: Consistent JSON error format across all endpoints
- **Custom Exception Classes**: Specific exceptions for different error types (validation, authentication, database, etc.)
- **User-Friendly Messages**: Clear, informative error messages without exposing sensitive information
- **Field-Specific Validation**: Detailed validation errors with field-level feedback
- **Global Exception Handling**: Centralized error handling with proper HTTP status codes
- **Security-Conscious**: Error messages designed to prevent information leakage

## Testing

The project includes a comprehensive test suite with unit tests, integration tests, and complete user workflow tests.

### Running Tests

**Run all tests:**
```bash
pytest
```

**Run with coverage report:**
```bash
pytest --cov=app --cov-report=html --cov-report=term-missing
```

**Run specific test categories:**
```bash
# Unit tests only
pytest -m unit

# Integration tests only
pytest -m integration

# User workflow tests
pytest tests/test_user_workflows.py
```

**Run comprehensive test suite:**
```bash
python scripts/run_tests.py
```

### Test Categories

#### Unit Tests
- **Model Tests**: Database model validation and relationships
- **Schema Tests**: Pydantic model validation and serialization
- **Service Tests**: Business logic and data transformations
- **Repository Tests**: Database operations with mocked connections
- **Utility Tests**: Helper functions and middleware

#### Integration Tests
- **API Endpoint Tests**: Complete request/response cycles
- **Database Integration**: Tests with real database connections
- **Authentication Flow**: JWT generation and validation
- **Error Handling**: Error scenarios and edge cases

#### User Workflow Tests
- **Complete Job Search Workflow**: End-to-end user journey from registration to statistics
- **Position Lifecycle**: Full position management from creation to deletion
- **Multi-User Data Isolation**: Verify users can only access their own data
- **Error Handling Workflow**: Comprehensive error scenario testing

### Test Configuration

The test suite uses:
- **In-Memory SQLite**: Fast, isolated database for each test
- **Test Fixtures**: Comprehensive fixtures for users, positions, and interviews
- **Authentication Helpers**: Pre-configured auth headers for testing
- **Database Cleanup**: Automatic cleanup after each test

### Test Coverage

The test suite provides comprehensive coverage of:
- All API endpoints and their variations
- Authentication and authorization flows
- Database operations and relationships
- Error handling and edge cases
- Business logic and data validation
- User workflows and integration scenarios

### Running Specific Tests

```bash
# Test a specific file
pytest tests/test_positions.py

# Test a specific class
pytest tests/test_user_workflows.py::TestCompleteUserWorkflows

# Test a specific method
pytest tests/test_user_workflows.py::TestCompleteUserWorkflows::test_complete_job_search_workflow

# Run tests with verbose output
pytest -v

# Run tests and stop on first failure
pytest -x
```

## API Documentation

### Interactive Documentation

Once the server is running, comprehensive API documentation is available:

- **Swagger UI**: `http://localhost:8000/docs` - Interactive API documentation with request/response examples
- **ReDoc**: `http://localhost:8000/redoc` - Alternative documentation interface

### Generated Documentation

The project includes scripts to generate static documentation:

```bash
# Generate OpenAPI schema and HTML documentation
python scripts/generate_docs.py
```

This creates:
- `docs/openapi.json` - Complete OpenAPI 3.0 schema
- `docs/index.html` - Interactive HTML documentation
- `docs/README.md` - Documentation overview and quick start guide

### Documentation Features

- **Complete API Reference**: All endpoints with detailed descriptions
- **Request/Response Examples**: Real examples for every endpoint
- **Authentication Guide**: Step-by-step authentication setup
- **Error Documentation**: Comprehensive error codes and responses
- **Schema Definitions**: Complete data model documentation
- **Workflow Examples**: Common usage patterns and workflows

## Docker Deployment

The application is fully containerized and ready for production deployment with Docker and Kubernetes.

### Docker Compose (Recommended for Development)

**Quick Start:**
```bash
# Copy environment configuration
cp .env.docker .env

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f api

# Stop services
docker-compose down
```

**Services included:**
- **API**: FastAPI application on port 8000
- **PostgreSQL**: Database on port 5432
- **Redis**: Cache/session store on port 6379 *(ready for future features like caching, rate limiting, and session management)*
- **Migration**: Automatic database migration on startup

### Docker Build

**Build the Docker image:**
```bash
# Using the build script (recommended)
./scripts/build-docker.sh

# Or manually
docker build -t interview-tracker-api:latest .
```

**Run standalone container:**
```bash
docker run -p 8000:8000 \
  -e DATABASE_URL="postgresql://user:pass@host:5432/db" \
  -e SECRET_KEY="your-secret-key" \
  interview-tracker-api:latest
```

### Production Docker Compose

For production deployment with nginx reverse proxy:

```bash
# Set production environment variables
export POSTGRES_PASSWORD="secure-password"
export SECRET_KEY="your-production-secret-key"
export BACKEND_CORS_ORIGINS='["https://your-frontend.com"]'

# Deploy with production overrides
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## Kubernetes Deployment

The application includes comprehensive Kubernetes manifests for production deployment.

### Prerequisites

- Kubernetes cluster (1.19+)
- kubectl configured
- Docker registry access
- Persistent storage support

### Quick Deployment

```bash
# Build and push image to your registry
docker build -t your-registry/interview-tracker-api:latest .
docker push your-registry/interview-tracker-api:latest

# Update image reference in k8s/api-deployment.yaml
# Then deploy
./scripts/deploy-k8s.sh
```

### Manual Kubernetes Deployment

```bash
# Create namespace and configuration
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secret.yaml

# Deploy database and cache
kubectl apply -f k8s/postgresql.yaml
kubectl apply -f k8s/redis.yaml

# Wait for database to be ready
kubectl wait --for=condition=available --timeout=300s deployment/postgresql -n interview-tracker

# Run database migration
kubectl apply -f k8s/migration-job.yaml
kubectl wait --for=condition=complete --timeout=300s job/interview-tracker-migration -n interview-tracker

# Deploy API
kubectl apply -f k8s/api-deployment.yaml
kubectl apply -f k8s/api-service.yaml

# Deploy autoscaling
kubectl apply -f k8s/hpa.yaml
```

### Kubernetes Features

- **High Availability**: 3 API replicas with rolling updates
- **Auto Scaling**: HPA based on CPU/memory usage (2-10 replicas)
- **Health Checks**: Comprehensive liveness, readiness, and startup probes
- **Security**: Non-root containers, security contexts, resource limits
- **Persistent Storage**: PostgreSQL and Redis data persistence
- **Ingress**: External access with rate limiting and CORS
- **Monitoring**: Ready for Prometheus metrics collection

### Kubernetes Configuration

**Update secrets (base64 encoded):**
```bash
# Encode your secrets
echo -n "your-secret-key" | base64
echo -n "your-db-password" | base64

# Update k8s/secret.yaml with encoded values
```

**Configure ingress:**
```bash
# Update k8s/api-service.yaml with your domain
# Configure TLS certificates if using HTTPS
```

### Deployment Management

```bash
# Check deployment status
./scripts/deploy-k8s.sh status

# View logs
./scripts/deploy-k8s.sh logs

# Scale deployment
kubectl scale deployment interview-tracker-api --replicas=5 -n interview-tracker

# Update deployment
kubectl set image deployment/interview-tracker-api api=your-registry/interview-tracker-api:v2.0.0 -n interview-tracker

# Cleanup
./scripts/deploy-k8s.sh cleanup
```

## Container Features

### Security
- **Non-root user**: Containers run as unprivileged user (UID 1000)
- **Minimal base image**: Python slim image with only required dependencies
- **Security scanning**: Trivy integration for vulnerability scanning
- **Read-only filesystem**: Configurable for enhanced security

### Performance
- **Multi-stage build**: Optimized image size and build caching
- **Health checks**: Built-in health endpoints for container orchestration
- **Resource limits**: Configured CPU and memory limits
- **Connection pooling**: Optimized database connections

### Monitoring & Observability
- **Health endpoints**: `/health`, `/health/readiness`, `/health/liveness`
- **Structured logging**: JSON logs for centralized logging
- **Metrics ready**: Prometheus metrics endpoints available
- **Distributed tracing**: OpenTelemetry compatible

## Project Structure

```
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI application entry point
│   ├── api/                 # API route handlers
│   ├── core/                # Core configuration and utilities
│   ├── models/              # SQLAlchemy database models
│   ├── repositories/        # Data access layer
│   ├── schemas/             # Pydantic models for validation
│   └── services/            # Business logic layer
├── alembic/                 # Database migration files
├── tests/                   # Test files
├── scripts/                 # Deployment and utility scripts
│   ├── build-docker.sh      # Docker build script
│   ├── deploy-k8s.sh        # Kubernetes deployment script
│   ├── run_tests.py         # Comprehensive test runner
│   └── generate_docs.py     # API documentation generator
├── k8s/                     # Kubernetes manifests
│   ├── namespace.yaml       # Namespace definition
│   ├── configmap.yaml       # Configuration
│   ├── secret.yaml          # Secrets
│   ├── postgresql.yaml      # Database deployment
│   ├── redis.yaml           # Cache deployment
│   ├── api-deployment.yaml  # API deployment
│   ├── api-service.yaml     # API service and ingress
│   ├── migration-job.yaml   # Database migration job
│   └── hpa.yaml            # Horizontal Pod Autoscaler
├── nginx/                   # Nginx configuration
│   └── nginx.conf          # Production reverse proxy config
├── docs/                    # Generated API documentation
├── Dockerfile              # Multi-stage container build
├── docker-compose.yml      # Development environment
├── docker-compose.prod.yml # Production overrides
├── .dockerignore           # Docker build exclusions
├── .env.docker            # Docker environment template
├── requirements.txt        # Python dependencies
├── .env.example           # Environment variables template
└── README.md              # This file
```